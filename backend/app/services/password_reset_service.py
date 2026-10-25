import time
import json
import pathlib
import secrets
from typing import Dict, Any, Optional
from datetime import datetime

from app.config import settings
from app.core.cache import SmartCache
from app.core.security import get_password_hash
from app.core.database import SessionLocal
from app.models.admin_user import AdminUser
from app.services.admin_user_service import AdminUserService
from app.services.partner_service import PartnerService
from app.services.email_service import EmailService

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
RESETS_FILE = DATA_DIR / "pending-password-resets.json"
TOKENS_FILE = DATA_DIR / "pending-password-reset-tokens.json"

class PasswordResetService:
    _pending_resets: Dict[str, Dict[str, Any]] = {}
    _pending_tokens: Dict[str, Dict[str, Any]] = {}
    _email_rate_limits: Dict[str, float] = {}

    @classmethod
    def _load_token_store(cls) -> Dict[str, Dict[str, Any]]:
        now = time.time()
        res = dict(cls._pending_tokens)
        if TOKENS_FILE.exists():
            try:
                file_data = json.loads(TOKENS_FILE.read_text(encoding="utf-8"))
                if isinstance(file_data, dict):
                    for k, v in file_data.items():
                        if isinstance(v, dict) and v.get("expiresAt", 0) > now and not v.get("used", False):
                            res[k] = v
            except Exception:
                pass
        # Clean expired or used
        res = {k: v for k, v in res.items() if v.get("expiresAt", 0) > now and not v.get("used", False)}
        cls._pending_tokens = res
        return res

    @classmethod
    def _save_token_store(cls, store: Dict[str, Dict[str, Any]]) -> None:
        cls._pending_tokens = store
        try:
            TOKENS_FILE.parent.mkdir(parents=True, exist_ok=True)
            TOKENS_FILE.write_text(json.dumps(store, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as e:
            print(f"[PasswordResetService] Warning: Failed to write tokens file: {e}")

    @classmethod
    def request_reset_link(cls, email: str, portal: str = "admin") -> Dict[str, Any]:
        """
        Processes a password reset link request for either 'admin' or 'sales' portal.
        Strictly enforces context separation, rate limiting, and anti-enumeration.
        """
        portal_clean = (portal or "admin").strip().lower()
        if portal_clean not in ("admin", "sales"):
            portal_clean = "admin"

        email_clean = str(email or "").strip().lower()
        if not email_clean or "@" not in email_clean or len(email_clean) < 5:
            return {
                "success": False,
                "message": "Silakan masukkan format alamat email yang valid.",
            }

        now = time.time()

        # Cooldown check: prevent requesting more than once per 60 seconds per email
        last_req = cls._email_rate_limits.get(f"{portal_clean}:{email_clean}", 0)
        elapsed = now - last_req
        if elapsed < 60:
            remaining = int(60 - elapsed)
            return {
                "success": False,
                "cooldown": True,
                "message": f"Harap tunggu {remaining} detik sebelum meminta tautan baru.",
                "cooldownSeconds": remaining,
            }

        # Anti-enumeration response template
        generic_success_msg = "Jika email tersebut terdaftar, kami akan mengirimkan instruksi untuk mengatur ulang kata sandi."

        # Verify account strictly matching portal role
        admin_match = None
        partner_match = None
        recipient_name = ""
        matched_role = ""

        if portal_clean == "admin":
            # Admin portal: MUST be an active administrator (admin or superadmin)
            admin_match = AdminUserService.find_by_email(email_clean)
            if not admin_match:
                try:
                    db = SessionLocal()
                    try:
                        rec = db.query(AdminUser).filter(AdminUser.email.ilike(email_clean)).first()
                        if rec and rec.is_active:
                            admin_match = rec.to_dict(include_hash=True)
                    finally:
                        db.close()
                except Exception:
                    pass

            if admin_match:
                role = str(admin_match.get("role", "")).lower()
                is_active = bool(admin_match.get("isActive", True))
                if role in ("admin", "superadmin") and is_active:
                    recipient_name = admin_match.get("name") or admin_match.get("username") or "Administrator"
                    matched_role = role
                else:
                    admin_match = None

        elif portal_clean == "sales":
            # Sales portal: MUST be an active sales partner
            partner_match = PartnerService.find_by_email(email_clean)
            admin_match = AdminUserService.find_by_email(email_clean)
            if not admin_match:
                try:
                    db = SessionLocal()
                    try:
                        rec = db.query(AdminUser).filter(AdminUser.email.ilike(email_clean)).first()
                        if rec and rec.is_active and str(rec.role).lower() == "sales":
                            admin_match = rec.to_dict(include_hash=True)
                    finally:
                        db.close()
                except Exception:
                    pass

            # Validate active sales status
            if partner_match and str(partner_match.get("status", "")).lower() in ("inactive", "non-aktif"):
                partner_match = None

            if admin_match and (str(admin_match.get("role", "")).lower() != "sales" or not admin_match.get("isActive", True)):
                admin_match = None

            if partner_match or admin_match:
                recipient_name = (
                    (partner_match.get("name") if partner_match else None)
                    or (admin_match.get("name") if admin_match else None)
                    or "Mitra Sales"
                )
                matched_role = "sales"

        # Update rate limit tracker regardless of match to avoid timing enumeration
        cls._email_rate_limits[f"{portal_clean}:{email_clean}"] = now

        # If no valid account exists for this portal, return generic message without sending email or exposing token
        if not matched_role:
            return {
                "success": True,
                "message": generic_success_msg,
                "cooldownSeconds": 60,
            }

        # Valid account found: generate high-entropy secure URL token
        token = secrets.token_urlsafe(32)
        token_data = {
            "token": token,
            "email": email_clean,
            "portal": portal_clean,
            "role": matched_role,
            "recipientName": recipient_name,
            "createdAt": now,
            "expiresAt": now + (15 * 60),  # 15 minutes
            "used": False,
        }

        store = cls._load_token_store()
        store[token] = token_data
        cls._save_token_store(store)
        SmartCache.set("pwd_reset_token", token, token_data, ttl=900)

        # Build trusted reset URL
        base_url = settings.ADMIN_URL if portal_clean == "admin" else settings.SALES_URL
        reset_url = f"{base_url.rstrip('/')}/{portal_clean}/reset-password?token={token}"

        # Dispatch email
        EmailService.send_password_reset_link_email(
            to_email=email_clean,
            recipient_name=recipient_name,
            reset_url=reset_url,
            portal=portal_clean,
            expires_minutes=15,
        )

        return {
            "success": True,
            "message": generic_success_msg,
            "cooldownSeconds": 60,
        }

    @classmethod
    def verify_reset_token(cls, token: str, portal: str = "admin") -> Dict[str, Any]:
        """
        Validates token existence, expiration, non-used state, and portal separation.
        """
        token_clean = str(token or "").strip()
        portal_clean = str(portal or "admin").strip().lower()

        if not token_clean:
            return {
                "success": False,
                "valid": False,
                "message": "Token reset kata sandi tidak ditemukan.",
            }

        store = cls._load_token_store()
        token_data = store.get(token_clean)
        if not token_data:
            cached = SmartCache.get("pwd_reset_token", token_clean)
            if cached and isinstance(cached, dict):
                token_data = cached

        if not token_data:
            return {
                "success": False,
                "valid": False,
                "message": "Tautan pemulihan kata sandi tidak valid atau telah kedaluwarsa.",
            }

        now = time.time()
        if token_data.get("used", False):
            return {
                "success": False,
                "valid": False,
                "message": "Tautan pemulihan kata sandi ini sudah pernah digunakan.",
            }

        if now > token_data.get("expiresAt", 0):
            return {
                "success": False,
                "valid": False,
                "message": "Tautan pemulihan kata sandi telah kedaluwarsa (batas waktu 15 menit).",
            }

        # Strict portal validation
        if str(token_data.get("portal", "")).lower() != portal_clean:
            return {
                "success": False,
                "valid": False,
                "message": "Tautan pemulihan ini tidak sesuai dengan portal autentikasi yang diakses.",
            }

        email = token_data.get("email", "")
        # Mask email for safe frontend display
        masked = email
        if "@" in email:
            user_part, domain_part = email.split("@", 1)
            if len(user_part) <= 2:
                masked = f"{user_part}***@{domain_part}"
            else:
                masked = f"{user_part[:2]}***{user_part[-1]}@{domain_part}"

        return {
            "success": True,
            "valid": True,
            "maskedEmail": masked,
            "portal": portal_clean,
        }

    @classmethod
    def reset_password_with_token(cls, token: str, portal: str, new_password: str) -> Dict[str, Any]:
        """
        Single-use execution of password change with full verification and database sync.
        """
        token_clean = str(token or "").strip()
        portal_clean = str(portal or "admin").strip().lower()
        new_pw = str(new_password or "").strip()

        if not new_pw or len(new_pw) < 6:
            return {
                "success": False,
                "message": "Kata sandi baru minimal harus terdiri dari 6 karakter.",
            }

        # 1. Verify token validity
        verify_res = cls.verify_reset_token(token_clean, portal_clean)
        if not verify_res.get("valid"):
            return verify_res

        store = cls._load_token_store()
        token_data = store.get(token_clean)
        if not token_data:
            cached = SmartCache.get("pwd_reset_token", token_clean)
            if cached and isinstance(cached, dict):
                token_data = cached

        if not token_data:
            return {
                "success": False,
                "message": "Sesi pemulihan kata sandi tidak valid.",
            }

        email_clean = token_data.get("email")
        recipient_name = token_data.get("recipientName") or "Pengguna Asterra"

        # 2. Invalidate token immediately (Single-use enforcement)
        token_data["used"] = True
        store.pop(token_clean, None)
        cls._save_token_store(store)
        SmartCache.set("pwd_reset_token", token_clean, None, ttl=1)

        # 3. Hash new password
        new_pw_hash = get_password_hash(new_pw)

        # 4. Update in database
        try:
            db = SessionLocal()
            try:
                if portal_clean == "admin":
                    admin_obj = db.query(AdminUser).filter(
                        AdminUser.email.ilike(email_clean),
                        AdminUser.role.in_(["admin", "superadmin"])
                    ).first()
                    if not admin_obj:
                        admin_obj = db.query(AdminUser).filter(AdminUser.email.ilike(email_clean)).first()

                    if admin_obj:
                        admin_obj.password_hash = new_pw_hash
                        admin_obj.updated_at = datetime.utcnow()
                        db.commit()
                        recipient_name = admin_obj.name or admin_obj.username or recipient_name
                elif portal_clean == "sales":
                    sales_admin = db.query(AdminUser).filter(
                        AdminUser.email.ilike(email_clean),
                        AdminUser.role == "sales"
                    ).first()

                    if sales_admin:
                        sales_admin.password_hash = new_pw_hash
                        sales_admin.updated_at = datetime.utcnow()
                        db.commit()
                        recipient_name = sales_admin.name or recipient_name
                    else:
                        partner = PartnerService.find_by_email(email_clean)
                        p_code = (partner.get("code") or "PARTNER") if partner else "SALES"
                        p_name = (partner.get("name") if partner else None) or recipient_name
                        username = f"sales-{p_code.lower().replace('-', '')}"
                        new_sales = AdminUser(
                            id=f"adm-sales-{int(time.time() * 1000)}",
                            username=username,
                            email=email_clean,
                            name=p_name,
                            password_hash=new_pw_hash,
                            role="sales",
                            is_active=True,
                            created_at=datetime.utcnow(),
                            updated_at=datetime.utcnow(),
                        )
                        db.add(new_sales)
                        db.commit()
                        recipient_name = p_name
            finally:
                db.close()
        except Exception as e:
            print(f"[PasswordResetService] Database error updating password: {e}")
            return {
                "success": False,
                "message": f"Gagal memperbarui kata sandi di database: {str(e)}",
            }

        # 5. Synchronize local AdminUserService cache
        AdminUserService.update_admin(email_clean, {"password": new_pw})
        AdminUserService.load_admins(force_reload=True)

        # 6. Send password changed alert email
        try:
            EmailService.send_password_changed_notification(
                to_email=email_clean,
                recipient_name=recipient_name,
            )
        except Exception as e:
            print(f"[PasswordResetService] Warning: Failed to send confirmation email: {e}")

        return {
            "success": True,
            "message": "Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru Anda.",
        }

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
