import json
import pathlib
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.database import SessionLocal
from app.models.admin_user import AdminUser

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
ADMINS_FILE = DATA_DIR / "supabase-admins.json"

class AdminUserService:
    _admins: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def load_admins(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        Load admins directly from Supabase PostgreSQL database (admin_users table).
        Falls back to local clean JSON if database connection is unreachable.
        """
        if cls._admins is not None and not force_reload:
            return cls._admins

        # 1. Try querying Supabase PostgreSQL
        try:
            db = SessionLocal()
            try:
                db_admins = db.query(AdminUser).order_by(AdminUser.created_at.asc()).all()
                if db_admins:
                    admins_data = [a.to_dict(include_hash=True) for a in db_admins]
                    cls._admins = admins_data
                    # Sync to disk as local backup cache
                    cls.save_admins()
                    return admins_data
            finally:
                db.close()
        except Exception as e:
            print(f"[AdminUserService] Warning: Supabase query failed, using local cache: {e}")

        # 2. Fallback to local snapshot file
        if ADMINS_FILE.exists():
            try:
                data = json.loads(ADMINS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    cls._admins = data
                    return data
            except Exception as e:
                print(f"[AdminUserService] Error loading fallback admins: {e}")

        cls._admins = []
        return []

    @classmethod
    def save_admins(cls) -> bool:
        """Saves current memory state to local disk backup cache."""
        try:
            if cls._admins is not None:
                ADMINS_FILE.parent.mkdir(parents=True, exist_ok=True)
                ADMINS_FILE.write_text(json.dumps(cls._admins, indent=2, ensure_ascii=False), encoding="utf-8")
                return True
        except Exception as e:
            print(f"[AdminUserService] Error saving backup admins: {e}")
        return False

    @classmethod
    def get_clean_admins(cls) -> List[Dict[str, Any]]:
        admins = cls.load_admins(force_reload=True)
        clean = []
        for a in admins:
            clean.append({
                "id": a.get("id"),
                "username": a.get("username"),
                "name": a.get("name"),
                "email": a.get("email"),
                "role": a.get("role", "admin"),
                "isActive": bool(a.get("isActive", True)),
                "createdAt": a.get("createdAt") or "2026-09-30T04:28:20.125Z",
                "updatedAt": a.get("updatedAt") or "2026-09-30T12:12:50.509Z",
            })
        return clean

    @classmethod
    def find_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        clean_email = email.strip().lower()
        # Query DB directly for instant fresh authentication
        try:
            db = SessionLocal()
            try:
                admin_obj = db.query(AdminUser).filter(AdminUser.email.ilike(clean_email)).first()
                if admin_obj:
                    return admin_obj.to_dict(include_hash=True)
            finally:
                db.close()
        except Exception:
            pass

        admins = cls.load_admins()
        return next((a for a in admins if str(a.get("email", "")).lower() == clean_email), None)

    @classmethod
    def find_by_id(cls, admin_id: str) -> Optional[Dict[str, Any]]:
        try:
            db = SessionLocal()
            try:
                admin_obj = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
                if admin_obj:
                    return admin_obj.to_dict(include_hash=True)
            finally:
                db.close()
        except Exception:
            pass

        admins = cls.load_admins()
        return next((a for a in admins if str(a.get("id", "")) == str(admin_id)), None)

    @classmethod
    def create_admin(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        email = payload.get("email", "").strip().lower()
        username = payload.get("username", "").strip() or email.split("@")[0]
        name = payload.get("name") or username.capitalize()
        role = payload.get("role", "admin")
        is_active = bool(payload.get("isActive", True))
        password = payload.get("password", "")

        # Default hash or bcrypt if available
        password_hash = "$2b$10$kzfa/ronlVttUQVWrnH6Oe7A8TSS/hw.qCIB7Os9bpASvI6BnY1oO"
        try:
            import bcrypt
            password_hash = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        except Exception:
            pass

        now_dt = datetime.utcnow()
        new_id = f"adm-{int(now_dt.timestamp() * 1000)}"

        # 1. Persist directly to Supabase
        try:
            db = SessionLocal()
            try:
                # Check uniqueness in Supabase
                existing = db.query(AdminUser).filter(
                    (AdminUser.email.ilike(email)) | (AdminUser.username.ilike(username))
                ).first()
                if existing:
                    return {"success": False, "message": "Email atau username ini sudah terdaftar di Supabase."}

                new_record = AdminUser(
                    id=new_id,
                    username=username,
                    email=email,
                    name=name,
                    password_hash=password_hash,
                    is_active=is_active,
                    role=role,
                    created_at=now_dt,
                    updated_at=now_dt,
                )
                db.add(new_record)
                db.commit()
                db.refresh(new_record)
                clean_admin = new_record.to_dict(include_hash=False)
            finally:
                db.close()
        except Exception as e:
            print(f"[AdminUserService] Error saving to Supabase: {e}")
            # In case Supabase commit fails
            return {"success": False, "message": f"Gagal menyimpan ke database Supabase: {str(e)}"}

        # 2. Reload and sync cache
        cls.load_admins(force_reload=True)
        return {"success": True, "message": "Administrator berhasil ditambahkan ke Supabase", "admin": clean_admin}

    @classmethod
    def update_admin(cls, admin_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # 1. Update in Supabase
        updated_dict = None
        try:
            db = SessionLocal()
            try:
                admin_obj = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
                if admin_obj:
                    if "name" in payload and payload["name"] is not None:
                        admin_obj.name = payload["name"]
                    if "role" in payload and payload["role"] is not None:
                        admin_obj.role = payload["role"]
                    if "isActive" in payload and payload["isActive"] is not None:
                        admin_obj.is_active = bool(payload["isActive"])
                    if "password" in payload and payload["password"]:
                        try:
                            import bcrypt
                            admin_obj.password_hash = bcrypt.hashpw(payload["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                        except Exception:
                            pass
                    admin_obj.updated_at = datetime.utcnow()
                    db.commit()
                    db.refresh(admin_obj)
                    updated_dict = admin_obj.to_dict(include_hash=False)
            finally:
                db.close()
        except Exception as e:
            print(f"[AdminUserService] Error updating in Supabase: {e}")

        # 2. Refresh cache
        cls.load_admins(force_reload=True)
        return updated_dict

    @classmethod
    def delete_admin(cls, admin_id: str) -> bool:
        # 1. Delete in Supabase
        deleted = False
        try:
            db = SessionLocal()
            try:
                admin_obj = db.query(AdminUser).filter(AdminUser.id == admin_id).first()
                if admin_obj:
                    db.delete(admin_obj)
                    db.commit()
                    deleted = True
            finally:
                db.close()
        except Exception as e:
            print(f"[AdminUserService] Error deleting in Supabase: {e}")

        # 2. Refresh cache
        cls.load_admins(force_reload=True)
        return deleted
