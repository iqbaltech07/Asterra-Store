import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import func

from app.core.database import SessionLocal, engine, Base
from app.models.category import Category
from app.models.product import Product

class CategoryService:
    _initialized = False

    @classmethod
    def ensure_table_and_defaults(cls):
        """Ensures the categories table exists in PostgreSQL and seeds defaults if empty."""
        try:
            Base.metadata.create_all(bind=engine, tables=[Category.__table__])
        except Exception as e:
            print(f"[CategoryService] Table creation check: {e}")

        try:
            db = SessionLocal()
            try:
                # 1. Normalize any typo product category IDs in database
                typo_prods = db.query(Product).filter(Product.category_id == "cat-apps-&-streaming").all()
                if typo_prods:
                    for p in typo_prods:
                        p.category_id = "cat-apps-streaming"
                        p.category_name = "Apps & Streaming"
                    db.commit()
                    print(f"[CategoryService] Normalized {len(typo_prods)} products from cat-apps-&-streaming to cat-apps-streaming")

                # 2. Check if categories already exist
                count = db.query(Category).count()
                if count == 0:
                    now = datetime.utcnow()
                    defaults = [
                        Category(
                            id="cat-ai-tools",
                            name="AI Tools",
                            slug="ai-tools",
                            display_order=1,
                            status="active",
                            icon="Bot",
                            created_at=now,
                            updated_at=now,
                        ),
                        Category(
                            id="cat-apps-streaming",
                            name="Apps & Streaming",
                            slug="apps-streaming",
                            display_order=2,
                            status="active",
                            icon="Tv",
                            created_at=now,
                            updated_at=now,
                        ),
                    ]
                    db.add_all(defaults)
                    db.commit()
                    print("[CategoryService] Seeded default categories: AI Tools, Apps & Streaming")
                cls._initialized = True
            finally:
                db.close()
        except Exception as e:
            print(f"[CategoryService] Error ensuring defaults: {e}")

    @classmethod
    def get_admin_categories(cls) -> List[Dict[str, Any]]:
        """Returns all categories with accurate real-time productCount and activeCount."""
        cls.ensure_table_and_defaults()

        db = SessionLocal()
        try:
            categories = db.query(Category).order_by(Category.display_order.asc(), Category.created_at.asc()).all()

            from sqlalchemy import case

            # Pre-compute product counts directly from Product table
            prod_counts = (
                db.query(
                    Product.category_id,
                    func.count(Product.id).label("total"),
                    func.sum(case((Product.status == "active", 1), else_=0)).label("active"),
                )
                .group_by(Product.category_id)
                .all()
            )
            count_map = {row[0]: {"total": int(row[1] or 0), "active": int(row[2] or 0)} for row in prod_counts}

            result = []
            for c in categories:
                c_counts = count_map.get(c.id, {"total": 0, "active": 0})
                result.append({
                    "id": c.id,
                    "name": c.name,
                    "slug": c.slug,
                    "displayOrder": c.display_order,
                    "display_order": c.display_order,
                    "status": c.status,
                    "icon": c.icon,
                    "productCount": int(c_counts["total"]),
                    "activeCount": int(c_counts["active"]),
                    "createdAt": c.created_at.isoformat() if c.created_at else None,
                    "updatedAt": c.updated_at.isoformat() if c.updated_at else None,
                })
            return result
        finally:
            db.close()

    @classmethod
    def get_public_categories(cls) -> List[Dict[str, Any]]:
        """Returns active categories for dropdowns and storefront with product counts."""
        cls.ensure_table_and_defaults()
        db = SessionLocal()
        try:
            from sqlalchemy import case

            categories = (
                db.query(Category)
                .filter(Category.status == "active")
                .order_by(Category.display_order.asc(), Category.created_at.asc())
                .all()
            )

            prod_counts = (
                db.query(
                    Product.category_id,
                    func.count(Product.id).label("total"),
                    func.sum(case((Product.status == "active", 1), else_=0)).label("active"),
                )
                .group_by(Product.category_id)
                .all()
            )
            count_map = {row[0]: {"total": int(row[1] or 0), "active": int(row[2] or 0)} for row in prod_counts}

            result = []
            for c in categories:
                c_counts = count_map.get(c.id, {"total": 0, "active": 0})
                cat_dict = c.to_dict()
                cat_dict["productCount"] = int(c_counts["total"])
                cat_dict["activeCount"] = int(c_counts["active"])
                result.append(cat_dict)
            return result
        finally:
            db.close()

    @classmethod
    def create_category(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new category and persists it in PostgreSQL."""
        cls.ensure_table_and_defaults()
        name = str(payload.get("name") or "").strip()
        if not name:
            raise ValueError("Nama kategori tidak boleh kosong.")

        raw_slug = payload.get("slug") or re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        slug = re.sub(r"[^a-z0-9]+", "-", str(raw_slug).lower()).strip("-")
        cat_id = payload.get("id") or f"cat-{slug}"

        db = SessionLocal()
        try:
            existing = db.query(Category).filter((Category.name.ilike(name)) | (Category.slug == slug) | (Category.id == cat_id)).first()
            if existing:
                raise ValueError(f"Kategori dengan nama atau slug '{name}' sudah ada.")

            max_order = db.query(func.max(Category.display_order)).scalar() or 0
            display_order = int(payload.get("displayOrder") or payload.get("display_order") or (max_order + 1))
            status = str(payload.get("status") or "active").lower()

            now = datetime.utcnow()
            new_cat = Category(
                id=cat_id,
                name=name,
                slug=slug,
                display_order=display_order,
                status=status,
                icon=payload.get("icon") or "Layers",
                created_at=now,
                updated_at=now,
            )
            db.add(new_cat)
            db.commit()
            db.refresh(new_cat)

            # Invalidate catalog cache so dropdowns update
            from app.services.catalog_service import CatalogService
            CatalogService.load_products(force_reload=True)

            res = new_cat.to_dict()
            res["productCount"] = 0
            res["activeCount"] = 0
            return res
        finally:
            db.close()

    @classmethod
    def update_category(cls, cat_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates category and cascades name changes to all products in that category."""
        cls.ensure_table_and_defaults()
        db = SessionLocal()
        try:
            cat = db.query(Category).filter(Category.id == cat_id).first()
            if not cat:
                return None

            old_name = cat.name
            now = datetime.utcnow()

            if "name" in payload and payload["name"]:
                new_name = str(payload["name"]).strip()
                cat.name = new_name
                # Cascade name update to all products in this category
                if new_name != old_name:
                    db.query(Product).filter(Product.category_id == cat_id).update(
                        {"category_name": new_name, "updated_at": now},
                        synchronize_session=False,
                    )

            if "slug" in payload and payload["slug"]:
                cat.slug = re.sub(r"[^a-z0-9]+", "-", str(payload["slug"]).lower()).strip("-")

            if "displayOrder" in payload or "display_order" in payload:
                cat.display_order = int(payload.get("displayOrder") or payload.get("display_order") or cat.display_order)

            if "status" in payload and payload["status"]:
                cat.status = str(payload["status"]).lower()

            if "icon" in payload and payload["icon"]:
                cat.icon = str(payload["icon"])

            cat.updated_at = now
            db.commit()
            db.refresh(cat)

            # Invalidate catalog cache
            from app.services.catalog_service import CatalogService
            CatalogService.load_products(force_reload=True)

            # Re-fetch live counts
            total = db.query(Product).filter(Product.category_id == cat.id).count()
            active = db.query(Product).filter(Product.category_id == cat.id, Product.status == "active").count()

            res = cat.to_dict()
            res["productCount"] = total
            res["activeCount"] = active
            return res
        finally:
            db.close()

    @classmethod
    def delete_category(cls, cat_id: str) -> Dict[str, Any]:
        """Deletes category if no products exist or reassigns them."""
        cls.ensure_table_and_defaults()
        db = SessionLocal()
        try:
            cat = db.query(Category).filter(Category.id == cat_id).first()
            if not cat:
                raise ValueError("Kategori tidak ditemukan.")

            product_count = db.query(Product).filter(Product.category_id == cat_id).count()
            if product_count > 0:
                raise ValueError(
                    f"Tidak dapat menghapus kategori '{cat.name}' karena masih memiliki {product_count} produk terdaftar. Pindahkan atau hapus produk terlebih dahulu."
                )

            db.delete(cat)
            db.commit()

            from app.services.catalog_service import CatalogService
            CatalogService.load_products(force_reload=True)

            return {"success": True, "message": f"Kategori '{cat.name}' berhasil dihapus."}
        finally:
            db.close()
