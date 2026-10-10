import json
import pathlib
from datetime import datetime
from typing import Dict, Any, List, Optional

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
ADMINS_FILE = DATA_DIR / "supabase-admins.json"

class AdminUserService:
    _admins: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def load_admins(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        if cls._admins is not None and not force_reload:
            return cls._admins

        if ADMINS_FILE.exists():
            try:
                data = json.loads(ADMINS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    cls._admins = data
                    return data
            except Exception as e:
                print(f"[AdminUserService] Error loading admins: {e}")

        cls._admins = []
        return []

    @classmethod
    def save_admins(cls) -> bool:
        try:
            if cls._admins is not None:
                ADMINS_FILE.parent.mkdir(parents=True, exist_ok=True)
                ADMINS_FILE.write_text(json.dumps(cls._admins, indent=2, ensure_ascii=False), encoding="utf-8")
                return True
        except Exception as e:
            print(f"[AdminUserService] Error saving admins: {e}")
        return False

    @classmethod
    def get_clean_admins(cls) -> List[Dict[str, Any]]:
        admins = cls.load_admins()
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
        admins = cls.load_admins()
        clean_email = email.strip().lower()
        return next((a for a in admins if str(a.get("email", "")).lower() == clean_email), None)

    @classmethod
    def find_by_id(cls, admin_id: str) -> Optional[Dict[str, Any]]:
        admins = cls.load_admins()
        return next((a for a in admins if str(a.get("id", "")) == str(admin_id)), None)

    @classmethod
    def create_admin(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        admins = cls.load_admins()
        email = payload.get("email", "").strip().lower()

        existing = next((a for a in admins if a.get("email", "").lower() == email), None)
        if existing:
            return {"success": False, "message": "Email administrator ini sudah terdaftar."}

        username = payload.get("username") or email.split("@")[0]
        now_iso = datetime.utcnow().isoformat() + "Z"

        new_admin = {
            "id": f"adm-{int(datetime.utcnow().timestamp() * 1000)}",
            "username": username,
            "name": payload.get("name") or username.capitalize(),
            "email": email,
            "role": payload.get("role", "admin"),
            "isActive": bool(payload.get("isActive", True)),
            "passwordHash": "$2b$10$kzfa/ronlVttUQVWrnH6Oe7A8TSS/hw.qCIB7Os9bpASvI6BnY1oO", # default hashed
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }

        admins.append(new_admin)
        cls.save_admins()

        clean = {k: v for k, v in new_admin.items() if k != "passwordHash"}
        return {"success": True, "message": "Administrator berhasil ditambahkan", "admin": clean}

    @classmethod
    def update_admin(cls, admin_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        admins = cls.load_admins()
        for idx, a in enumerate(admins):
            if a.get("id") == admin_id:
                for k, v in payload.items():
                    if v is not None and k != "passwordHash":
                        a[k] = v
                a["updatedAt"] = datetime.utcnow().isoformat() + "Z"
                admins[idx] = a
                cls.save_admins()
                return {k: v for k, v in a.items() if k != "passwordHash"}
        return None

    @classmethod
    def delete_admin(cls, admin_id: str) -> bool:
        admins = cls.load_admins()
        initial_len = len(admins)
        cls._admins = [a for a in admins if a.get("id") != admin_id]
        if len(cls._admins) < initial_len:
            cls.save_admins()
            return True
        return False
