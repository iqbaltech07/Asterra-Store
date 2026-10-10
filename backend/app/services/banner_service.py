import os
import re
import json
import uuid
import pathlib
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional

import httpx
from app.config import settings
from app.core.database import SessionLocal, engine, Base
from app.models.banner import PromoBanner

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
BANNERS_FILE = DATA_DIR / "supabase-banners.json"
ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "image/avif",
]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


class BannerService:
    _banners: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def ensure_table(cls):
        """Ensures the promo_banners table exists if connected to relational database."""
        try:
            if engine is not None:
                Base.metadata.create_all(bind=engine, tables=[PromoBanner.__table__])
        except Exception as e:
            print(f"[BannerService] DB table verification note: {e}")

    @classmethod
    def check_and_deactivate_expired(cls) -> bool:
        """
        Auto-non-aktif jika sudah kadaluarsa:
        Checks all banners and automatically marks them inactive if expires_at has passed.
        """
        now = datetime.utcnow()
        changed = False

        # 1. Update in-memory / JSON cache
        if cls._banners:
            for b in cls._banners:
                if b.get("isActive", True):
                    exp_str = b.get("expiresAt") or b.get("scheduledUntil")
                    if exp_str:
                        try:
                            if "T" in exp_str:
                                exp_dt = datetime.fromisoformat(exp_str.replace("Z", "+00:00")).replace(tzinfo=None)
                            else:
                                exp_dt = datetime.strptime(exp_str[:10], "%Y-%m-%d")
                            if exp_dt < now:
                                b["isActive"] = False
                                b["status"] = "inactive"
                                changed = True
                        except Exception:
                            pass
            if changed:
                cls.save_banners()

        # 2. Update Database if connected
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    expired_rows = (
                        db.query(PromoBanner)
                        .filter(PromoBanner.is_active == True, PromoBanner.expires_at != None, PromoBanner.expires_at < now)
                        .all()
                    )
                    if expired_rows:
                        for row in expired_rows:
                            row.is_active = False
                            row.updated_at = datetime.utcnow()
                        db.commit()
                        changed = True
                finally:
                    db.close()
        except Exception as e:
            print(f"[BannerService] DB auto-deactivation note: {e}")

        return changed

    @classmethod
    def load_banners(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        Loads banners from Supabase/Postgres promo_banners table.
        Falls back to local clean JSON if DB is offline.
        """
        if cls._banners is not None and not force_reload:
            cls.check_and_deactivate_expired()
            return cls._banners

        # 1. Query Database
        try:
            cls.ensure_table()
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    db_banners = (
                        db.query(PromoBanner)
                        .order_by(PromoBanner.display_order.asc(), PromoBanner.created_at.desc())
                        .all()
                    )
                    if db_banners:
                        data = [b.to_dict() for b in db_banners]
                        cls._banners = data
                        cls.check_and_deactivate_expired()
                        cls.save_banners()
                        return cls._banners
                finally:
                    db.close()
        except Exception as e:
            print(f"[BannerService] Warning: Database banner query failed: {e}")

        # 2. Fallback to JSON file
        if BANNERS_FILE.exists():
            try:
                data = json.loads(BANNERS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    cls._banners = data
                    cls.check_and_deactivate_expired()
                    return cls._banners
            except Exception as e:
                print(f"[BannerService] Error loading banners JSON fallback: {e}")

        cls._banners = []
        return []

    @classmethod
    def save_banners(cls) -> bool:
        """Persists banner cache to local backup JSON file."""
        try:
            if cls._banners is not None:
                BANNERS_FILE.parent.mkdir(parents=True, exist_ok=True)
                BANNERS_FILE.write_text(
                    json.dumps(cls._banners, indent=2, ensure_ascii=False),
                    encoding="utf-8",
                )
                return True
        except Exception as e:
            print(f"[BannerService] Error saving banners fallback: {e}")
        return False

    @classmethod
    def get_banners(
        cls,
        active_only: bool = False,
        target_page: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Retrieve list of promo banners with auto-expiration check and filtering."""
        banners = cls.load_banners()
        cls.check_and_deactivate_expired()

        filtered = banners
        if active_only:
            filtered = [b for b in filtered if b.get("isActive", True)]

        if target_page and target_page.lower() != "all":
            t_page = target_page.lower()
            filtered = [
                b for b in filtered
                if (b.get("targetPage") or "home").lower() in [t_page, "all"]
            ]

        # Sort: displayOrder ascending, then createdAt descending
        return sorted(
            filtered,
            key=lambda x: (
                x.get("displayOrder", 0) if isinstance(x.get("displayOrder"), int) else 0,
                x.get("createdAt") or "",
            ),
        )

    @classmethod
    def get_banner_by_id(cls, banner_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve single banner by unique identifier."""
        banners = cls.load_banners()
        cls.check_and_deactivate_expired()
        return next((b for b in banners if b.get("id") == banner_id), None)

    @classmethod
    def toggle_status(cls, banner_id: str, new_status: Optional[bool] = None) -> Optional[Dict[str, Any]]:
        """Toggles or sets the active/inactive status of a promo banner."""
        banners = cls.load_banners()
        target = next((b for b in banners if b.get("id") == banner_id), None)
        if not target:
            return None

        current = target.get("isActive", True)
        updated_status = not current if new_status is None else bool(new_status)
        now_iso = datetime.utcnow().isoformat()

        target["isActive"] = updated_status
        target["status"] = "active" if updated_status else "inactive"
        target["updatedAt"] = now_iso

        # Update in DB
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    db_banner = db.query(PromoBanner).filter(PromoBanner.id == banner_id).first()
                    if db_banner:
                        db_banner.is_active = updated_status
                        db_banner.updated_at = datetime.utcnow()
                        db.commit()
                finally:
                    db.close()
        except Exception as e:
            print(f"[BannerService] Warning updating banner status in DB: {e}")

        cls.save_banners()
        return target

    @classmethod
    async def upload_banner(
        cls,
        content: bytes,
        filename: str,
        content_type: str,
        title: str,
        description: str = "",
        cta_text: str = "Beli Sekarang",
        banner_type: str = "hero",
        link_url: Optional[str] = None,
        target_page: str = "home",
        display_order: int = 0,
        is_active: bool = True,
        expires_at: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Uploads and registers a promo banner with Vercel Blob deduplication,
        auto-expiration support, and redundancy protection.
        """
        clean_title = (title or "").strip()
        if not clean_title:
            raise ValueError("Judul banner promo wajib diisi.")

        if content_type not in ALLOWED_MIME_TYPES:
            raise ValueError(
                f"Format file '{content_type}' tidak didukung. Harap unggah format JPG, PNG, WEBP, GIF, SVG, atau AVIF."
            )

        if len(content) > MAX_FILE_SIZE:
            raise ValueError("Ukuran banner melebihi batas maksimal 5MB.")

        # 1. Deterministic naming & Content-Hash (SHA-256)
        raw_filename = filename or "banner.webp"
        ext = raw_filename.split(".")[-1].lower() if "." in raw_filename else "webp"
        if ext not in ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"]:
            ext = "webp"

        slug = re.sub(r"[^a-zA-Z0-9]+", "-", clean_title.lower()).strip("-")
        if not slug:
            slug = "promo"
        slug = slug[:40]

        content_hash = hashlib.sha256(content).hexdigest()[:12]
        pathname = f"banners/promo-{slug}-{content_hash}.{ext}"

        # 2. Check for identical banner content in existing registry (database & local)
        existing_banners = cls.load_banners()
        exact_duplicate = next(
            (b for b in existing_banners if b.get("contentHash") == content_hash and b.get("title") == clean_title),
            None,
        )

        token = settings.BLOB_READ_WRITE_TOKEN or os.getenv("BLOB_READ_WRITE_TOKEN", "")
        blob_url = None
        deduplicated = False

        if exact_duplicate:
            blob_url = exact_duplicate.get("blobUrl")
            pathname = exact_duplicate.get("pathname") or pathname
            deduplicated = True
        elif token:
            parts = token.split("_")
            store_id = parts[3] if len(parts) >= 4 else None

            # Check-Before-Upload via HEAD request to prevent redundant cloud writes
            if store_id:
                try:
                    async with httpx.AsyncClient(timeout=10.0) as check_client:
                        check_res = await check_client.head(
                            f"https://{store_id}.private.blob.vercel-storage.com/{pathname}",
                            headers={"Authorization": f"Bearer {token}"},
                        )
                        if check_res.status_code == 200:
                            blob_url = f"https://{store_id}.private.blob.vercel-storage.com/{pathname}"
                            deduplicated = True
                except Exception as e:
                    print(f"[BannerService] Check-before-upload error (ignorable): {e}")

            # Deterministic PUT with overwrite prevention and fixed suffix
            if not blob_url:
                put_url = f"https://blob.vercel-storage.com/?pathname={pathname}"
                put_headers = {
                    "authorization": f"Bearer {token}",
                    "x-api-version": "12",
                    "x-vercel-blob-access": "private",
                    "x-content-type": content_type,
                    "x-allow-overwrite": "1",
                    "x-add-random-suffix": "0",
                }
                try:
                    async with httpx.AsyncClient(timeout=30.0) as upload_client:
                        upload_res = await upload_client.put(
                            put_url, content=content, headers=put_headers
                        )
                        if upload_res.status_code == 200:
                            res_json = upload_res.json()
                            blob_url = res_json.get("url")
                        else:
                            print(f"[BannerService] Vercel Blob PUT error ({upload_res.status_code}): {upload_res.text}")
                except Exception as upload_err:
                    print(f"[BannerService] Exception uploading to Vercel Blob: {upload_err}")

        # Local storage fallback if token is unset or cloud storage is offline
        if not blob_url:
            public_dir = pathlib.Path(__file__).resolve().parent.parent.parent / "public" / "banners"
            public_dir.mkdir(parents=True, exist_ok=True)
            file_path = public_dir / f"promo-{slug}-{content_hash}.{ext}"
            file_path.write_bytes(content)
            blob_url = f"/api/v1/media/{pathname}"

        view_url = f"/api/v1/media/{pathname}"
        banner_id = f"banner_{uuid.uuid4().hex[:12]}"
        now_iso = datetime.utcnow().isoformat()

        # Parse expires_at if provided
        parsed_exp: Optional[datetime] = None
        if expires_at and expires_at.strip():
            clean_exp = expires_at.strip()
            try:
                if "T" in clean_exp:
                    parsed_exp = datetime.fromisoformat(clean_exp.replace("Z", "+00:00")).replace(tzinfo=None)
                else:
                    parsed_exp = datetime.strptime(clean_exp[:10], "%Y-%m-%d")
            except Exception:
                parsed_exp = None

        # Check if already expired at time of upload
        effective_active = bool(is_active)
        if parsed_exp and parsed_exp < datetime.utcnow():
            effective_active = False

        banner_dict = {
            "id": banner_id,
            "title": clean_title,
            "description": description or "",
            "ctaText": cta_text or "Beli Sekarang",
            "bannerType": banner_type or "hero",
            "type": banner_type or "hero",
            "imageUrl": view_url,
            "blobUrl": blob_url,
            "pathname": pathname,
            "contentHash": content_hash,
            "linkUrl": link_url.strip() if link_url else "/#katalog",
            "destinationUrl": link_url.strip() if link_url else "/#katalog",
            "targetPage": target_page or "home",
            "displayOrder": int(display_order or 0),
            "isActive": effective_active,
            "status": "active" if effective_active else "inactive",
            "expiresAt": parsed_exp.isoformat() if parsed_exp else None,
            "scheduledUntil": parsed_exp.strftime("%Y-%m-%d") if parsed_exp else None,
            "createdAt": now_iso,
            "updatedAt": now_iso,
        }

        # 3. Persist to Database if active
        try:
            cls.ensure_table()
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    db_banner = PromoBanner(
                        id=banner_id,
                        title=clean_title,
                        description=description or "",
                        cta_text=cta_text or "Beli Sekarang",
                        banner_type=banner_type or "hero",
                        image_url=view_url,
                        blob_url=blob_url,
                        pathname=pathname,
                        content_hash=content_hash,
                        link_url=link_url.strip() if link_url else "/#katalog",
                        target_page=target_page or "home",
                        display_order=int(display_order or 0),
                        is_active=effective_active,
                        expires_at=parsed_exp,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    db.add(db_banner)
                    db.commit()
                finally:
                    db.close()
        except Exception as e:
            print(f"[BannerService] Warning: Failed to persist banner to database: {e}")

        # 4. Update in-memory and local JSON cache
        if cls._banners is None:
            cls._banners = []
        cls._banners.insert(0, banner_dict)
        cls.save_banners()

        message = (
            "Banner promo sudah ada di storage (deduplicated). Data berhasil diperbarui."
            if deduplicated
            else "Banner promo berhasil diunggah dan disimpan ke storage."
        )

        return {
            "success": True,
            "data": banner_dict,
            "deduplicated": deduplicated,
            "message": message,
        }

    @classmethod
    async def delete_banner(cls, banner_id: str) -> bool:
        """
        Deletes a promo banner and purges Vercel Blob asset ONLY if no other banner shares the same file.
        """
        banners = cls.load_banners()
        target_banner = next((b for b in banners if b.get("id") == banner_id), None)
        if not target_banner:
            return False

        blob_url_to_purge = target_banner.get("blobUrl")
        pathname_to_purge = target_banner.get("pathname")

        # 1. Delete from Database
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    db_banner = db.query(PromoBanner).filter(PromoBanner.id == banner_id).first()
                    if db_banner:
                        db.delete(db_banner)
                        db.commit()
                finally:
                    db.close()
        except Exception as e:
            print(f"[BannerService] Warning: Failed to delete banner from DB: {e}")

        # 2. Remove from local list and update JSON backup
        cls._banners = [b for b in banners if b.get("id") != banner_id]
        cls.save_banners()

        # 3. Safe Garbage Collection: Check if other banners still share the same blob
        other_sharing = any(
            b.get("blobUrl") == blob_url_to_purge or b.get("pathname") == pathname_to_purge
            for b in cls._banners
        )

        if not other_sharing and blob_url_to_purge:
            token = settings.BLOB_READ_WRITE_TOKEN or os.getenv("BLOB_READ_WRITE_TOKEN", "")
            # If stored on Vercel Blob
            if token and "blob.vercel-storage.com" in blob_url_to_purge:
                try:
                    async with httpx.AsyncClient(timeout=15.0) as client:
                        del_res = await client.post(
                            "https://blob.vercel-storage.com/delete",
                            headers={
                                "authorization": f"Bearer {token}",
                                "content-type": "application/json",
                            },
                            json={"urls": [blob_url_to_purge]},
                        )
                        if del_res.status_code not in [200, 204]:
                            print(f"[BannerService] Vercel Blob purge note ({del_res.status_code}): {del_res.text}")
                except Exception as del_err:
                    print(f"[BannerService] Warning purging Vercel Blob: {del_err}")

            # If stored locally
            if pathname_to_purge:
                local_file = pathlib.Path(__file__).resolve().parent.parent.parent / "public" / pathname_to_purge
                if local_file.exists():
                    try:
                        local_file.unlink()
                    except Exception as unlink_err:
                        print(f"[BannerService] Warning unlinking local banner file: {unlink_err}")

        return True
