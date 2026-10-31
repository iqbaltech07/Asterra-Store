import json
import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import text, func
from sqlalchemy.orm import joinedload
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.product_card import ProductCard
from app.models.product_variant import ProductAttribute, ProductVariant
from app.models.order import Order, OrderItem
from app.core.cache import cache

class CardService:
    @classmethod
    def get_real_sold_counts(cls) -> Dict[str, int]:
        """
        Idempotent SQL aggregation computing actual units sold for each Card Produk
        and each individual Catalog Product from orders shown on /orders.
        Phase 5 & 6 Source of Truth:
        - Only orders with status IN ('completed', 'paid', 'settlement', 'processing')
        - Sum of OrderItem.quantity (consistent unit metric across all successful transactions)
        - Historical snapshot uses oi.card_id or falls back to p.card_id
        """
        card_sales: Dict[str, int] = {}
        catalog_sales: Dict[str, int] = {}

        try:
            db = SessionLocal()
            try:
                # 1. Sales aggregated by Card Produk
                card_query = text("""
                    SELECT 
                        COALESCE(oi.card_id, p.card_id) AS card_id,
                        COALESCE(SUM(oi.quantity), 0) AS total_units
                    FROM order_items oi
                    JOIN orders o ON oi.order_id = o.id
                    LEFT JOIN products p ON oi.product_id = p.id
                    WHERE LOWER(o.status) IN ('completed', 'paid', 'settlement', 'processing')
                      AND (o.is_dummy IS FALSE OR o.is_dummy IS NULL)
                      AND o.customer_email NOT LIKE '%@customer.id'
                      AND o.customer_email NOT LIKE 'buyer_%'
                      AND COALESCE(oi.card_id, p.card_id) IS NOT NULL
                    GROUP BY COALESCE(oi.card_id, p.card_id);
                """)
                rows = db.execute(card_query).fetchall()
                for r in rows:
                    if r[0]:
                        card_sales[str(r[0])] = int(r[1])

                # 2. Sales aggregated by Catalog ID
                cat_query = text("""
                    SELECT 
                        oi.product_id,
                        COALESCE(SUM(oi.quantity), 0) AS total_units
                    FROM order_items oi
                    JOIN orders o ON oi.order_id = o.id
                    WHERE LOWER(o.status) IN ('completed', 'paid', 'settlement', 'processing')
                      AND (o.is_dummy IS FALSE OR o.is_dummy IS NULL)
                      AND o.customer_email NOT LIKE '%@customer.id'
                      AND o.customer_email NOT LIKE 'buyer_%'
                    GROUP BY oi.product_id;
                """)
                cat_rows = db.execute(cat_query).fetchall()
                for cr in cat_rows:
                    if cr[0]:
                        catalog_sales[str(cr[0])] = int(cr[1])
            finally:
                db.close()
        except Exception as e:
            print(f"[CardService] Sales aggregation warning: {e}")

        return card_sales

    @classmethod
    def get_cards(
        cls,
        status: Optional[str] = None,
        section: Optional[str] = None,
        search: Optional[str] = None,
        category: Optional[str] = None,
        include_catalogs: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves Card Produk with real-time pricing from connected catalogs,
        real unit sold counts from /orders, and stock availability.
        """
        sold_counts = cls.get_real_sold_counts()
        db = SessionLocal()
        try:
            query = db.query(ProductCard).options(
                joinedload(ProductCard.catalogs),
                joinedload(ProductCard.attributes),
                joinedload(ProductCard.variants),
            ).order_by(ProductCard.display_order.asc(), ProductCard.created_at.asc())

            if status and status != "all":
                query = query.filter(ProductCard.status == status)

            cards = query.all()

            results = []
            for c in cards:
                card_sold = sold_counts.get(c.id, 0)
                cd = c.to_dict(include_catalogs=include_catalogs, sold_count=card_sold)

                # Filter by section e.g. 'promo' | 'terlaris' | 'terbaru'
                if section and section != "all":
                    if section not in cd.get("sections", []):
                        continue

                # Filter by category
                if category and category.lower() not in ["all", "semua", "cat-all"]:
                    cat_id = str(cd.get("categoryId") or "").lower()
                    cat_name = str(cd.get("categoryName") or "").lower()
                    target_cat = category.lower().strip()
                    if target_cat not in [cat_id, cat_name]:
                        continue

                # Filter by search query
                if search and search.strip():
                    q = search.lower().strip()
                    name_match = q in cd.get("name", "").lower()
                    desc_match = q in (cd.get("description") or "").lower()
                    cat_match = q in cd.get("categoryName", "").lower()
                    if not (name_match or desc_match or cat_match):
                        continue

                results.append(cd)

            return results
        finally:
            db.close()

    @classmethod
    def get_card_by_id_or_slug(cls, id_or_slug: str, include_catalogs: bool = True) -> Optional[Dict[str, Any]]:
        sold_counts = cls.get_real_sold_counts()
        db = SessionLocal()
        try:
            card = (
                db.query(ProductCard)
                .options(
                    joinedload(ProductCard.catalogs),
                    joinedload(ProductCard.attributes),
                    joinedload(ProductCard.variants),
                )
                .filter((ProductCard.id == id_or_slug) | (ProductCard.slug == id_or_slug))
                .first()
            )
            if not card:
                return None
            card_sold = sold_counts.get(card.id, 0)
            return card.to_dict(include_catalogs=include_catalogs, sold_count=card_sold)
        finally:
            db.close()

    @classmethod
    def create_card(cls, payload: Dict[str, Any], admin_actor: Optional[str] = "admin") -> Dict[str, Any]:
        name = str(payload.get("name") or "").strip()
        if not name:
            raise ValueError("Nama Card Produk wajib diisi.")

        raw_slug = str(payload.get("slug") or "").strip().lower()
        if not raw_slug:
            raw_slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
        clean_slug = re.sub(r"[^a-z0-9\-]+", "", raw_slug)

        card_id = str(payload.get("id") or f"card-{clean_slug}").strip()

        db = SessionLocal()
        try:
            # Check slug uniqueness
            existing = db.query(ProductCard).filter((ProductCard.slug == clean_slug) | (ProductCard.id == card_id)).first()
            if existing:
                clean_slug = f"{clean_slug}-{int(datetime.utcnow().timestamp())}"
                card_id = f"card-{clean_slug}"

            # Format sections JSON
            raw_sections = payload.get("sections", ["promo"])
            if isinstance(raw_sections, list):
                sections_json = json.dumps(raw_sections)
            else:
                sections_json = json.dumps([s.strip() for s in str(raw_sections).split(",") if s.strip()])

            base_sold = int(payload.get("baseSoldCount") or payload.get("base_sold_count") or 0)

            new_card = ProductCard(
                id=card_id,
                name=name,
                slug=clean_slug,
                logo_url=payload.get("logoUrl") or payload.get("logo_url") or payload.get("imageUrl"),
                description=payload.get("description"),
                category_id=payload.get("categoryId") or payload.get("category_id") or "cat-digital",
                category_name=payload.get("categoryName") or payload.get("category_name") or "Layanan Digital",
                status=payload.get("status", "active"),
                display_order=int(payload.get("displayOrder") or payload.get("display_order") or 0),
                is_featured=bool(payload.get("isFeatured", payload.get("is_featured", False))),
                sections=sections_json,
                rating=str(payload.get("rating", "5.0")),
                badge_label=payload.get("badgeLabel") or payload.get("badge_label"),
                base_sold_count=base_sold,
            )
            db.add(new_card)

            # Link selected catalogs if provided
            catalog_ids = payload.get("catalogIds") or payload.get("catalog_ids") or []
            if catalog_ids and isinstance(catalog_ids, list):
                prods = db.query(Product).filter(Product.id.in_(catalog_ids)).all()
                for p in prods:
                    p.card_id = card_id

            # Create default dynamic attributes if none exist
            default_attrs = [
                {"name": "Paket / Nominal", "order": 1, "req": True},
                {"name": "Tipe Akun", "order": 2, "req": True},
                {"name": "Durasi Masa Aktif", "order": 3, "req": True},
                {"name": "Proteksi Garansi", "order": 4, "req": False},
            ]
            for da in default_attrs:
                db.add(ProductAttribute(
                    id=f"attr-{card_id}-{da['order']}",
                    card_id=card_id,
                    name=da["name"],
                    display_order=da["order"],
                    is_required=da["req"],
                    is_active=True,
                    options=json.dumps([]),
                ))

            db.commit()
            db.refresh(new_card)
            cache.invalidate("catalog", "homepage_sections")
            return new_card.to_dict(include_catalogs=True)
        finally:
            db.close()

    @classmethod
    def update_card(cls, card_id: str, payload: Dict[str, Any], admin_actor: Optional[str] = "admin") -> Dict[str, Any]:
        db = SessionLocal()
        try:
            card = db.query(ProductCard).filter_by(id=card_id).first()
            if not card:
                raise ValueError(f"Card Produk dengan ID '{card_id}' tidak ditemukan.")

            if "name" in payload and payload["name"]:
                card.name = str(payload["name"]).strip()
            if "slug" in payload and payload["slug"]:
                clean_slug = re.sub(r"[^a-z0-9\-]+", "", str(payload["slug"]).strip().lower())
                # Check uniqueness if changed
                if clean_slug != card.slug:
                    exists = db.query(ProductCard).filter(ProductCard.slug == clean_slug, ProductCard.id != card_id).first()
                    if not exists:
                        card.slug = clean_slug
            if "logoUrl" in payload or "logo_url" in payload or "imageUrl" in payload:
                val = payload.get("logoUrl") if "logoUrl" in payload else (payload.get("logo_url") if "logo_url" in payload else payload.get("imageUrl"))
                card.logo_url = str(val).strip() if (val and str(val).strip()) else None
            if "description" in payload:
                card.description = payload["description"]
            if "categoryId" in payload or "category_id" in payload:
                card.category_id = payload.get("categoryId") or payload.get("category_id")
            if "categoryName" in payload or "category_name" in payload:
                card.category_name = payload.get("categoryName") or payload.get("category_name")
            if "status" in payload and payload["status"] in ["active", "archived", "inactive"]:
                card.status = payload["status"]
            if "displayOrder" in payload or "display_order" in payload:
                card.display_order = int(payload.get("displayOrder") or payload.get("display_order") or 0)
            if "isFeatured" in payload or "is_featured" in payload:
                card.is_featured = bool(payload.get("isFeatured", payload.get("is_featured", False)))
            if "sections" in payload:
                raw_sec = payload["sections"]
                if isinstance(raw_sec, list):
                    card.sections = json.dumps(raw_sec)
                else:
                    card.sections = json.dumps([s.strip() for s in str(raw_sec).split(",") if s.strip()])
            if "rating" in payload and payload["rating"] is not None:
                card.rating = str(payload["rating"])
            if "badgeLabel" in payload or "badge_label" in payload:
                card.badge_label = payload.get("badgeLabel") or payload.get("badge_label")
            if "baseSoldCount" in payload or "base_sold_count" in payload:
                card.base_sold_count = int(payload.get("baseSoldCount") or payload.get("base_sold_count") or 0)

            # Update catalog linkages if provided
            if "catalogIds" in payload or "catalog_ids" in payload:
                new_catalog_ids = set(payload.get("catalogIds") or payload.get("catalog_ids") or [])
                # Unlink catalogs removed
                curr_catalogs = db.query(Product).filter_by(card_id=card_id).all()
                for c in curr_catalogs:
                    if c.id not in new_catalog_ids:
                        c.card_id = None
                # Link newly selected catalogs
                if new_catalog_ids:
                    to_link = db.query(Product).filter(Product.id.in_(list(new_catalog_ids))).all()
                    for p in to_link:
                        p.card_id = card_id

            card.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(card)
            cache.invalidate("catalog", "homepage_sections")
            return card.to_dict(include_catalogs=True)
        finally:
            db.close()

    @classmethod
    def toggle_status(cls, card_id: str) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            card = db.query(ProductCard).filter_by(id=card_id).first()
            if not card:
                raise ValueError(f"Card Produk '{card_id}' tidak ditemukan.")
            card.status = "archived" if card.status == "active" else "active"
            card.updated_at = datetime.utcnow()
            db.commit()
            cache.invalidate("catalog", "homepage_sections")
            return {"id": card.id, "status": card.status}
        finally:
            db.close()

    @classmethod
    def delete_card(cls, card_id: str) -> Dict[str, Any]:
        """
        Safely deletes or archives Card Produk. Unlinks any connected catalogs
        so order history and catalog items remain completely intact without breaking FK integrity.
        """
        db = SessionLocal()
        try:
            card = db.query(ProductCard).filter_by(id=card_id).first()
            if not card:
                raise ValueError(f"Card Produk '{card_id}' tidak ditemukan.")

            # Unlink connected catalogs safely (card_id = None)
            db.query(Product).filter_by(card_id=card_id).update({"card_id": None})
            # Remove card record
            db.delete(card)
            db.commit()
            cache.invalidate("catalog", "homepage_sections")
            return {"success": True, "message": f"Card Produk '{card_id}' berhasil dihapus."}
        finally:
            db.close()

    @classmethod
    def link_catalog_to_card(cls, catalog_id: str, card_id: Optional[str]) -> Dict[str, Any]:
        """
        Links or unlinks a Catalog Product to a Card Produk parent.
        If card_id is None or 'none', the catalog becomes standalone.
        """
        db = SessionLocal()
        try:
            catalog = db.query(Product).filter_by(id=catalog_id).first()
            if not catalog:
                raise ValueError(f"Katalog '{catalog_id}' tidak ditemukan.")

            clean_card_id = None
            if card_id and card_id not in ["none", "null", ""]:
                card = db.query(ProductCard).filter_by(id=card_id).first()
                if not card:
                    raise ValueError(f"Card Produk '{card_id}' tidak ditemukan.")
                clean_card_id = card.id

            catalog.card_id = clean_card_id
            catalog.updated_at = datetime.utcnow()
            db.commit()
            cache.invalidate("catalog")
            return {
                "catalogId": catalog.id,
                "cardId": clean_card_id,
                "cardName": catalog.card.name if catalog.card else None,
            }
        finally:
            db.close()

    @classmethod
    def get_attributes(cls, card_id: str) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            attrs = db.query(ProductAttribute).filter_by(card_id=card_id).order_by(ProductAttribute.display_order.asc()).all()
            return [a.to_dict() for a in attrs]
        finally:
            db.close()

    @classmethod
    def save_attribute(cls, card_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            attr_id = payload.get("id")
            name = str(payload.get("name") or "").strip()
            if not name:
                raise ValueError("Nama atribut wajib diisi.")

            opts = payload.get("options", [])
            opts_json = json.dumps(opts) if isinstance(opts, list) else json.dumps([o.strip() for o in str(opts).split(",") if o.strip()])

            attr = None
            if attr_id:
                attr = db.query(ProductAttribute).filter_by(id=attr_id).first()

            if not attr:
                attr_id = attr_id or f"attr-{card_id}-{int(datetime.utcnow().timestamp()*1000)}"
                attr = ProductAttribute(
                    id=attr_id,
                    card_id=card_id,
                    name=name,
                    display_order=int(payload.get("displayOrder") or payload.get("display_order") or 0),
                    is_required=bool(payload.get("isRequired", payload.get("is_required", True))),
                    is_active=bool(payload.get("isActive", payload.get("is_active", True))),
                    options=opts_json,
                )
                db.add(attr)
            else:
                attr.name = name
                attr.display_order = int(payload.get("displayOrder") or payload.get("display_order") or attr.display_order)
                attr.is_required = bool(payload.get("isRequired", payload.get("is_required", attr.is_required)))
                attr.is_active = bool(payload.get("isActive", payload.get("is_active", attr.is_active)))
                attr.options = opts_json
                attr.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(attr)
            cache.invalidate("catalog")
            return attr.to_dict()
        finally:
            db.close()

    @classmethod
    def delete_attribute(cls, attr_id: str) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            attr = db.query(ProductAttribute).filter_by(id=attr_id).first()
            if not attr:
                raise ValueError(f"Atribut '{attr_id}' tidak ditemukan.")
            db.delete(attr)
            db.commit()
            cache.invalidate("catalog")
            return {"success": True, "message": f"Atribut '{attr_id}' berhasil dihapus."}
        finally:
            db.close()

    @classmethod
    def get_variants(cls, card_id: str) -> List[Dict[str, Any]]:
        db = SessionLocal()
        try:
            variants = db.query(ProductVariant).filter_by(card_id=card_id).all()
            return [v.to_dict() for v in variants]
        finally:
            db.close()

    @classmethod
    def save_variant(cls, card_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            var_id = payload.get("id")
            catalog_id = payload.get("catalogId") or payload.get("catalog_id")
            price = int(payload.get("price") or 0)
            stock = int(payload.get("stock") if payload.get("stock") is not None else 100)
            status = payload.get("status", "active")
            sku = payload.get("sku")

            combo = payload.get("combination") or {}
            combo_json = json.dumps(combo) if isinstance(combo, dict) else str(combo)

            variant = None
            if var_id:
                variant = db.query(ProductVariant).filter_by(id=var_id).first()

            if not variant:
                var_id = var_id or f"var-{card_id}-{int(datetime.utcnow().timestamp()*1000)}"
                variant = ProductVariant(
                    id=var_id,
                    card_id=card_id,
                    catalog_id=catalog_id,
                    sku=sku,
                    combination=combo_json,
                    price=price,
                    price_formatted=f"Rp {price:,.0f}".replace(",", "."),
                    stock=stock,
                    status=status,
                )
                db.add(variant)
            else:
                if catalog_id:
                    variant.catalog_id = catalog_id
                if sku:
                    variant.sku = sku
                variant.combination = combo_json
                variant.price = price
                variant.price_formatted = f"Rp {price:,.0f}".replace(",", ".")
                variant.stock = stock
                variant.status = status
                variant.updated_at = datetime.utcnow()

            db.commit()
            db.refresh(variant)
            cache.invalidate("catalog")
            return variant.to_dict()
        finally:
            db.close()

    @classmethod
    def delete_variant(cls, variant_id: str) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            variant = db.query(ProductVariant).filter_by(id=variant_id).first()
            if not variant:
                raise ValueError(f"Varian '{variant_id}' tidak ditemukan.")
            db.delete(variant)
            db.commit()
            cache.invalidate("catalog")
            return {"success": True, "message": f"Varian '{variant_id}' berhasil dihapus."}
        finally:
            db.close()
