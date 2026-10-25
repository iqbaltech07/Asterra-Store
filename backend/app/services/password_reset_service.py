import time
import json
import pathlib
import secrets
from typing import Dict, Any, Optional
from datetime import datetime

from app.core.cache import SmartCache
from app.core.security import get_password_hash
from app.core.database import SessionLocal
from app.models.admin_user import AdminUser
from app.services.admin_user_service import AdminUserService
from app.services.partner_service import PartnerService
from app.services.email_service import EmailService

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
RESETS_FILE = DATA_DIR / "pending-password-resets.json"

class PasswordResetService:
    _pending_resets: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def _load_store(cls) -> Dict[str, Dict[str, Any]]:
        now = time.time()
        res = dict(cls._pending_resets)
        if RESETS_FILE.exists():
            try:
                file_data = json.loads(RESETS_FILE.read_text(encoding="utf-8"))
                if isinstance(file_data, dict):
                    for k, v in file_data.items():
                        if isinstance(v, dict) and v.get("expiresAt", 0) > now:
                            res[k] = v
            except Exception:
                pass
        # Clean expired
        res = {k: v for k, v in res.items() if v.get("expiresAt", 0) > now}
        cls._pending_resets = res
        return res

    @classmethod
    def _save_store(cls, store: Dict[str, Dict[str, Any]]) -> None:
        cls._pending_resets = store
        try:
            RESETS_FILE.parent.mkdir(parents=True, exist_ok=True)
            RESETS_FILE.write_text(json.dumps(store, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as e:
            print(f"[PasswordResetService] Warning: Failed to write resets file: {e}")

    @classmethod
    def request_reset_otp(cls, email: str) -> Dict[str, Any]:
        """
        Initiates a password reset request by verifying account existence,
        generating a secure 6-digit OTP, and dispatching an email.
        """
        email_clean = str(email or "").strip().lower()
        if not email_clean or "@" not in email_clean:
            return {
                "success": False,
                "message": "Format alamat email tidak valid.",
            }

        # 1. Verify that the account exists in AdminUserService or PartnerService
        admin_match = AdminUserService.find_by_email(email_clean)
        partner_match = None
        if not admin_match:
            partner_match = PartnerService.find_by_email(email_clean)

        if not admin_match and not partner_match:
            try:
                db = SessionLocal()
                try:
                    admin_rec = db.query(AdminUser).filter(AdminUser.email.ilike(email_clean)).first()
                    if admin_rec:
                        admin_match = admin_rec.to_dict(include_hash=True)
                finally:
                    db.close()
            except Exception:
                pass

        if not admin_match and not partner_match:
            return {
                "success": False,
                "message": f"Alamat email '{email_clean}' tidak terdaftar sebagai mitra sales atau admin toko.",
            }

        recipient_name = ""
        if admin_match:
            recipient_name = admin_match.get("name") or admin_match.get("username") or "Pengguna Asterra"
        elif partner_match:
            recipient_name = partner_match.get("name") or "Mitra Sales"

        now = time.time()
        store = cls._load_store()

        # 2. Check 60-second cooldown from previous request
        pending = store.get(email_clean)
        if not pending:
            cached = SmartCache.get("pwd_reset_otp", email_clean)
            if cached and isinstance(cached, dict):
                pending = cached

        if pending:
            elapsed = now - pending.get("lastResendAt", 0)
            if elapsed < 60:
                return {
                    "success": False,
                    "message": f"Harap tunggu {int(60 - elapsed)} detik sebelum meminta kode baru.",
                    "cooldownSeconds": int(60 - elapsed),
                }

        # 3. Generate secure 6-digit numeric OTP
        otp_code = f"{secrets.randbelow(900000) + 100000}"

        reset_data = {
            "email": email_clean,
            "name": recipient_name,
            "otp": otp_code,
            "attempts": 0,
            "createdAt": now,
            "expiresAt": now + 600,  # 10 minutes
            "lastResendAt": now,
        }

        # Store in local store, file backup, and SmartCache
        store[email_clean] = reset_data
        cls._save_store(store)
        SmartCache.set("pwd_reset_otp", email_clean, reset_data, ttl=600)

        # 4. Dispatch Email with branded template
        EmailService.send_password_reset_otp_email(
            to_email=email_clean,
            recipient_name=recipient_name,
            otp_code=otp_code,
        )

        return {
            "success": True,
            "email": email_clean,
            "expiresIn": 600,
            "message": f"Kode OTP verifikasi telah dikirim ke {email_clean}. Periksa kotak masuk atau spam email Anda.",
        }

    @classmethod
    def verify_reset_otp(cls, email: str, otp: str) -> Dict[str, Any]:
        """
        Validates whether the provided OTP code is correct and still active.
        """
        email_clean = str(email or "").strip().lower()
        otp_clean = str(otp or "").strip()

        if not email_clean or not otp_clean:
            return {"success": False, "message": "Email dan kode OTP wajib diisi."}

        store = cls._load_store()
        pending = store.get(email_clean)
        if not pending:
            cached = SmartCache.get("pwd_reset_otp", email_clean)
            if cached and isinstance(cached, dict):
                pending = cached

        if not pending:
            return {
                "success": False,
                "message": "Sesi reset kata sandi tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru.",
            }

        # Check expiration (10 minutes)
        if time.time() > pending.get("expiresAt", 0):
            return {
                "success": False,
                "message": "Kode OTP telah kedaluwarsa. Silakan klik 'Kirim Ulang OTP'.",
            }

        # Check maximum failed attempts
        if pending.get("attempts", 0) >= 5:
            return {
                "success": False,
                "message": "Terlalu banyak percobaan kode salah. Silakan minta kode OTP baru.",
            }

        # Compare OTP
        if str(pending.get("otp")) != otp_clean:
            pending["attempts"] = pending.get("attempts", 0) + 1
            store[email_clean] = pending
            cls._save_store(store)
            SmartCache.set("pwd_reset_otp", email_clean, pending, ttl=600)
            remaining = max(0, 5 - pending["attempts"])
            return {
                "success": False,
                "message": f"Kode OTP tidak cocok. Sisa kesempatan: {remaining} kali.",
            }

        return {
            "success": True,
            "email": email_clean,
            "message": "Kode OTP valid. Silakan masukkan kata sandi baru Anda.",
        }

    @classmethod
    def reset_password(cls, email: str, otp: str, new_password: str) -> Dict[str, Any]:
        """
        Verifies the OTP and updates the user's password hash in the database.
        """
        email_clean = str(email or "").strip().lower()
        otp_clean = str(otp or "").strip()
        new_pw = str(new_password or "").strip()

        if not new_pw or len(new_pw) < 6:
            return {
                "success": False,
                "message": "Kata sandi baru minimal harus terdiri dari 6 karakter.",
            }

        # 1. Verify OTP first
        verify_res = cls.verify_reset_otp(email_clean, otp_clean)
        if not verify_res.get("success"):
            return verify_res

        # 2. Update password in AdminUser table
        new_pw_hash = get_password_hash(new_pw)
        updated = False
        recipient_name = ""

        try:
            db = SessionLocal()
            try:
                admin_obj = db.query(AdminUser).filter(AdminUser.email.ilike(email_clean)).first()
                if admin_obj:
                    admin_obj.password_hash = new_pw_hash
                    admin_obj.updated_at = datetime.utcnow()
                    db.commit()
                    db.refresh(admin_obj)
                    recipient_name = admin_obj.name or admin_obj.username or ""
                    updated = True
                else:
                    partner_match = PartnerService.find_by_email(email_clean)
                    if partner_match:
                        code = partner_match.get("code", "")
                        username = f"sales-{code.lower().replace('-', '')}" if code else f"sales-{email_clean.split('@')[0]}"
                        recipient_name = partner_match.get("name", "")
                        new_admin = AdminUser(
                            id=f"adm-sales-{int(time.time() * 1000)}",
                            username=username,
                            email=email_clean,
                            name=recipient_name,
                            password_hash=new_pw_hash,
                            role="sales",
                            is_active=True,
                            created_at=datetime.utcnow(),
                            updated_at=datetime.utcnow(),
                        )
                        db.add(new_admin)
                        db.commit()
                        updated = True
            finally:
                db.close()
        except Exception as e:
            print(f"[PasswordResetService] Database error updating password: {e}")
            return {
                "success": False,
                "message": f"Gagal memperbarui kata sandi di database: {str(e)}",
            }

        # 3. Synchronize local AdminUserService cache
        AdminUserService.update_admin(email_clean, {"password": new_pw})
        AdminUserService.load_admins(force_reload=True)

        # 4. Clean up pending OTP session
        store = cls._load_store()
        store.pop(email_clean, None)
        cls._save_store(store)
        SmartCache.set("pwd_reset_otp", email_clean, None, ttl=1)

        # 5. Send confirmation notification email
        try:
            EmailService.send_password_changed_notification(
                to_email=email_clean,
                recipient_name=recipient_name,
            )
        except Exception as e:
            print(f"[PasswordResetService] Warning: Failed to send confirmation email: {e}")

        return {
            "success": True,
            "message": "Kata sandi akun Anda telah berhasil diperbarui. Silakan masuk dengan kata sandi baru.",
        }

    @classmethod
    def resend_reset_otp(cls, email: str) -> Dict[str, Any]:
        """
        Resends a fresh OTP code to the requested email with cooldown check.
        """
        return cls.request_reset_otp(email)
