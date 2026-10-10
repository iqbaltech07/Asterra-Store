import json
import pathlib
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.core.database import SessionLocal
from app.models.product import Product

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
CATALOG_PATH = DATA_DIR / "active-catalog.json"
MANAGED_PATH = DATA_DIR / "managed-catalog.json"

class CatalogService:
    _cached_products: Optional[List[Dict[str, Any]]] = None
    _cached_vip_services: Optional[List[Dict[str, Any]]] = None

    @staticmethod
    def _normalize_product(p: Dict[str, Any]) -> Dict[str, Any]:
        p = dict(p)
        cat = p.get("category")
        cat_id = ""
        cat_name = ""
        if isinstance(cat, dict):
            cat_id = cat.get("id", "")
            cat_name = cat.get("name", "")
        elif isinstance(cat, str):
            cat_name = cat
            cat_id = f"cat-{cat.lower().replace(' ', '-')}"
        else:
            cat_id = str(p.get("categoryId") or "")
            cat_name = str(p.get("categoryName") or "")

        name_upper = (p.get("name") or "").upper()
        code_upper = str(p.get("providerCode") or "").upper()
        brand_upper = str(p.get("brand") or "").upper()

        if (
            "CHATGPT" in code_upper
            or "GEMINI" in code_upper
            or "CHATGPT" in name_upper
            or "GEMINI" in name_upper
            or "GOOGLE AI" in name_upper
            or "GOOGLE PRO" in name_upper
            or "CLAUDE" in name_upper
            or "OPENAI" in name_upper
            or "OPENAI" in brand_upper
            or cat_id == "cat-ai-tools"
            or cat_name == "AI Tools"
        ):
            cat_id = "cat-ai-tools"
            cat_name = "AI Tools"
        elif (
            "NETFLIX" in brand_upper
            or "YOUTUBE" in brand_upper
            or "SPOTIFY" in brand_upper
            or "CANVA" in name_upper
            or "CAPCUT" in name_upper
            or "NETFLIX" in name_upper
            or "YOUTUBE" in name_upper
            or "SPOTIFY" in name_upper
            or "VIDIO" in name_upper
            or "VIU" in name_upper
            or "WETV" in name_upper
            or "BSTATION" in name_upper
            or "IQIYI" in name_upper
            or "ALIGHT" in name_upper
            or cat_id == "cat-apps-streaming"
            or cat_name == "Apps & Streaming"
        ):
            cat_id = "cat-apps-streaming"
            cat_name = "Apps & Streaming"
        elif (
            cat_id in ["digital", "cat-digital-services"]
            or cat_name == "Layanan Digital"
            or "LAYANAN DIGITAL" in name_upper
        ):
            cat_id = "cat-digital-services"
            cat_name = "Layanan Digital"

        p["category"] = {"id": cat_id, "name": cat_name}
        p["categoryId"] = cat_id
        p["categoryName"] = cat_name
        return p

    @classmethod
    def load_products(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        Loads products directly from Supabase PostgreSQL database.
        Falls back to local clean JSON files if Supabase is offline.
        """
        if cls._cached_products is not None and not force_reload:
            return cls._cached_products

        # 1. Try querying Supabase PostgreSQL
        try:
            db = SessionLocal()
            try:
                db_prods = db.query(Product).order_by(Product.created_at.desc()).all()
                if db_prods:
                    normalized = [cls._normalize_product(p.to_dict()) for p in db_prods]
                    cls._cached_products = normalized
                    cls.save_products()
                    return normalized
            finally:
                db.close()
        except Exception as e:
            print(f"[CatalogService] Warning: Supabase products query failed, using local fallback: {e}")

        # 2. Fallback to local files
        try:
            if CATALOG_PATH.exists():
                data = json.loads(CATALOG_PATH.read_text(encoding="utf-8"))
                normalized = [cls._normalize_product(p) for p in data]
                cls._cached_products = normalized
                return normalized
            elif MANAGED_PATH.exists():
                all_products = json.loads(MANAGED_PATH.read_text(encoding="utf-8"))
                active = [cls._normalize_product(p) for p in all_products if p.get("status") == "active"]
                cls._cached_products = active
                return active
        except Exception as e:
            print(f"[CatalogService] Error loading catalog fallback: {e}")

        cls._cached_products = []
        return []

    @classmethod
    def save_products(cls) -> bool:
        """Saves current products state to local backup cache."""
        try:
            if cls._cached_products is not None:
                CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
                CATALOG_PATH.write_text(json.dumps(cls._cached_products, indent=2, ensure_ascii=False), encoding="utf-8")
                return True
        except Exception as e:
            print(f"[CatalogService] Error saving backup catalog: {e}")
        return False

    @classmethod
    def load_vip_services(cls) -> List[Dict[str, Any]]:
        if cls._cached_vip_services is not None:
            return cls._cached_vip_services

        try:
            if MANAGED_PATH.exists():
                data = json.loads(MANAGED_PATH.read_text(encoding="utf-8"))
                cls._cached_vip_services = data
                return data
        except Exception as e:
            print(f"[CatalogService] Error loading managed catalog: {e}")

        cls._cached_vip_services = []
        return []

    @classmethod
    def get_products(cls, category: Optional[str] = None, search: Optional[str] = None) -> List[Dict[str, Any]]:
        products = cls.load_products()
        # Public storefront only shows active products
        filtered = [p for p in products if p.get("status", "active") == "active"]

        if category and category.lower() not in ["semua", "all", "cat-all"]:
            cat_clean = category.lower().strip()
            filtered = [
                p for p in filtered
                if (isinstance(p.get("category"), dict) and p["category"].get("name", "").lower() == cat_clean)
                or (isinstance(p.get("category"), dict) and p["category"].get("id", "").lower() == cat_clean)
                or str(p.get("categoryId", "")).lower() == cat_clean
                or str(p.get("categoryName", "")).lower() == cat_clean
            ]

        if search and search.strip():
            query = search.lower().strip()
            filtered = [
                p for p in filtered
                if query in p.get("name", "").lower()
                or query in p.get("description", "").lower()
                or query in str(p.get("providerCode", "")).lower()
                or query in str(p.get("brand", "")).lower()
                or any(query in str(f).lower() for f in p.get("features", []))
            ]

        return filtered

    @classmethod
    def get_product_by_id(cls, product_id: str) -> Optional[Dict[str, Any]]:
        # Check DB directly for freshest product state
        try:
            db = SessionLocal()
            try:
                prod = db.query(Product).filter((Product.id == product_id) | (Product.provider_code == product_id)).first()
                if prod:
                    return cls._normalize_product(prod.to_dict())
            finally:
                db.close()
        except Exception:
            pass

        products = cls.load_products()
        for p in products:
            if p.get("id") == product_id or str(p.get("providerCode")) == product_id:
                return p
        return None

    @classmethod
    def load_managed_products(cls) -> List[Dict[str, Any]]:
        return cls.load_products()

    @classmethod
    def get_admin_products(
        cls,
        status: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        products = cls.load_products(force_reload=True)

        # Compute accurate metrics across whole dataset
        total = len(products)
        total_active = sum(1 for p in products if p.get("status", "active") == "active")
        total_archived = sum(1 for p in products if p.get("status", "active") == "archived")
        total_warnings = sum(
            1 for p in products
            if p.get("status", "active") == "active"
            and (p.get("providerStatus") == "empty" or p.get("stock") == 0)
        )

        filtered = products

        if status and status != "all":
            if status == "active":
                filtered = [p for p in filtered if p.get("status", "active") == "active"]
            elif status == "archived":
                filtered = [p for p in filtered if p.get("status", "active") == "archived"]
            elif status == "warning":
                filtered = [
                    p for p in filtered
                    if p.get("status", "active") == "active"
                    and (p.get("providerStatus") == "empty" or p.get("stock") == 0)
                ]

        if category and category != "all" and category != "cat-all":
            cat_clean = category.lower().strip()
            filtered = [
                p for p in filtered
                if (isinstance(p.get("category"), dict) and p["category"].get("id", "").lower() == cat_clean)
                or (isinstance(p.get("category"), dict) and p["category"].get("name", "").lower() == cat_clean)
                or str(p.get("categoryId", "")).lower() == cat_clean
                or str(p.get("categoryName", "")).lower() == cat_clean
            ]

        if search and search.strip():
            query = search.lower().strip()
            filtered = [
                p for p in filtered
                if query in p.get("name", "").lower()
                or query in str(p.get("providerCode", "")).lower()
                or query in str(p.get("description", "")).lower()
                or query in str(p.get("brand", "")).lower()
                or any(query in str(f).lower() for f in p.get("features", []))
            ]

        return {
            "products": filtered,
            "total": total,
            "metrics": {
                "total": total,
                "totalActive": total_active,
                "totalArchived": total_archived,
                "totalWarnings": total_warnings,
            },
        }

    @classmethod
    def create_product(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        product_id = payload.get("id") or f"prod-{int(datetime.utcnow().timestamp() * 1000)}"
        price = int(payload.get("price", 0))
        provider_price = int(payload.get("providerPrice", 0))
        margin = price - provider_price if provider_price > 0 else 0
        pct = round((margin / provider_price) * 100) if provider_price > 0 else 0

        cat = payload.get("category") or {}
        cat_id = cat.get("id") or payload.get("categoryId") or "cat-ai-tools"
        cat_name = cat.get("name") or payload.get("categoryName") or "AI Tools"

        # 1. Save directly to Supabase
        try:
            db = SessionLocal()
            try:
                new_prod = Product(
                    id=product_id,
                    name=payload.get("name", ""),
                    category_id=cat_id,
                    category_name=cat_name,
                    brand=payload.get("brand", "Digital"),
                    price=price,
                    price_formatted=f"Rp {price:,.0f}".replace(",", "."),
                    description=payload.get("description", ""),
                    features=payload.get("features", []),
                    status=payload.get("status", "active"),
                    stock=int(payload.get("stock", 100)),
                    image_url=payload.get("imageUrl") or "/images/default-product-banner.png",
                    popular=bool(payload.get("popular", False)),
                    provider=payload.get("provider", "native"),
                    provider_code=payload.get("providerCode"),
                    provider_name=payload.get("providerName"),
                    provider_price=provider_price,
                    provider_status=payload.get("providerStatus", "available"),
                    profit_margin=margin,
                    profit_percentage=pct,
                    guarantee_title=payload.get("guaranteeTitle", "Garansi Penuh"),
                    guarantee_desc=payload.get("guaranteeDesc", "Jaminan ganti akun 100%"),
                    process_title=payload.get("processTitle", "Proses Instan"),
                    process_desc=payload.get("processDesc", "1 - 15 menit selesai"),
                    privacy_title=payload.get("privacyTitle", "Akun Private"),
                    privacy_desc=payload.get("privacyDesc", "Ruang kerja aman & personal"),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(new_prod)
                db.commit()
                db.refresh(new_prod)
                res_dict = cls._normalize_product(new_prod.to_dict())
            finally:
                db.close()
        except Exception as e:
            print(f"[CatalogService] Error creating product in Supabase: {e}")
            raise e

        # 2. Reload and sync cache
        cls.load_products(force_reload=True)
        return res_dict

    @classmethod
    def update_product(cls, product_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        # 1. Update in Supabase
        updated_dict = None
        try:
            db = SessionLocal()
            try:
                prod = db.query(Product).filter((Product.id == product_id) | (Product.provider_code == product_id)).first()
                if prod:
                    if "name" in payload and payload["name"] is not None:
                        prod.name = payload["name"]
                    if "price" in payload and payload["price"] is not None:
                        prod.price = int(payload["price"])
                        prod.price_formatted = f"Rp {prod.price:,.0f}".replace(",", ".")
                    if "providerPrice" in payload and payload["providerPrice"] is not None:
                        prod.provider_price = int(payload["providerPrice"])
                    if "stock" in payload and payload["stock"] is not None:
                        prod.stock = int(payload["stock"])
                    if "status" in payload and payload["status"] is not None:
                        prod.status = payload["status"]
                    if "description" in payload and payload["description"] is not None:
                        prod.description = payload["description"]
                    if "features" in payload and payload["features"] is not None:
                        prod.features = payload["features"]
                    if "imageUrl" in payload and payload["imageUrl"] is not None:
                        prod.image_url = payload["imageUrl"]
                    if "popular" in payload and payload["popular"] is not None:
                        prod.popular = bool(payload["popular"])
                    if "brand" in payload and payload["brand"] is not None:
                        prod.brand = payload["brand"]
                    if "categoryId" in payload and payload["categoryId"] is not None:
                        prod.category_id = payload["categoryId"]
                    if "categoryName" in payload and payload["categoryName"] is not None:
                        prod.category_name = payload["categoryName"]
                    if "guaranteeTitle" in payload and payload["guaranteeTitle"] is not None:
                        prod.guarantee_title = payload["guaranteeTitle"]
                    if "guaranteeDesc" in payload and payload["guaranteeDesc"] is not None:
                        prod.guarantee_desc = payload["guaranteeDesc"]
                    if "processTitle" in payload and payload["processTitle"] is not None:
                        prod.process_title = payload["processTitle"]
                    if "processDesc" in payload and payload["processDesc"] is not None:
                        prod.process_desc = payload["processDesc"]
                    if "privacyTitle" in payload and payload["privacyTitle"] is not None:
                        prod.privacy_title = payload["privacyTitle"]
                    if "privacyDesc" in payload and payload["privacyDesc"] is not None:
                        prod.privacy_desc = payload["privacyDesc"]

                    # Recalculate margins
                    if prod.provider_price and prod.provider_price > 0:
                        prod.profit_margin = prod.price - prod.provider_price
                        prod.profit_percentage = round((prod.profit_margin / prod.provider_price) * 100)

                    prod.updated_at = datetime.utcnow()
                    db.commit()
                    db.refresh(prod)
                    updated_dict = cls._normalize_product(prod.to_dict())
            finally:
                db.close()
        except Exception as e:
            print(f"[CatalogService] Error updating product in Supabase: {e}")

        # 2. Reload and sync cache
        cls.load_products(force_reload=True)
        return updated_dict

    @classmethod
    def delete_product(cls, product_id: str) -> bool:
        deleted = False
        try:
            db = SessionLocal()
            try:
                prod = db.query(Product).filter((Product.id == product_id) | (Product.provider_code == product_id)).first()
                if prod:
                    db.delete(prod)
                    db.commit()
                    deleted = True
            finally:
                db.close()
        except Exception as e:
            print(f"[CatalogService] Error deleting product from Supabase: {e}")

        cls.load_products(force_reload=True)
        return deleted

    @classmethod
    def toggle_status(cls, product_id: str) -> Optional[str]:
        new_status = None
        try:
            db = SessionLocal()
            try:
                prod = db.query(Product).filter((Product.id == product_id) | (Product.provider_code == product_id)).first()
                if prod:
                    new_status = "archived" if prod.status == "active" else "active"
                    prod.status = new_status
                    prod.updated_at = datetime.utcnow()
                    db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[CatalogService] Error toggling product status in Supabase: {e}")

        cls.load_products(force_reload=True)
        return new_status

    @classmethod
    def bulk_status(cls, ids: List[str], status: str) -> int:
        updated_count = 0
        try:
            db = SessionLocal()
            try:
                prods = db.query(Product).filter((Product.id.in_(ids)) | (Product.provider_code.in_(ids))).all()
                for p in prods:
                    p.status = status
                    p.updated_at = datetime.utcnow()
                    updated_count += 1
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[CatalogService] Error bulk updating products in Supabase: {e}")

        cls.load_products(force_reload=True)
        return updated_count

    @classmethod
    def bulk_delete(cls, ids: List[str]) -> int:
        deleted_count = 0
        try:
            db = SessionLocal()
            try:
                prods = db.query(Product).filter((Product.id.in_(ids)) | (Product.provider_code.in_(ids))).all()
                for p in prods:
                    db.delete(p)
                    deleted_count += 1
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[CatalogService] Error bulk deleting products from Supabase: {e}")

        cls.load_products(force_reload=True)
        return deleted_count

    @classmethod
    def search_vip_services(
        cls,
        search: Optional[str] = None,
        vip_type: Optional[str] = None,
        vip_status: Optional[str] = None,
        limit: int = 2500,
    ) -> Dict[str, Any]:
        vip_services = cls.load_vip_services()
        active_products = cls.load_products()

        # Build imported status lookup
        imported_active_codes = set()
        imported_archived_codes = set()
        imported_id_map = {}

        for p in active_products:
            p_id = str(p.get("id", "")).upper()
            code = str(p.get("providerCode", "")).upper()
            is_act = p.get("status", "active") == "active"

            if code:
                if is_act:
                    imported_active_codes.add(code)
                else:
                    imported_archived_codes.add(code)
                imported_id_map[code] = p.get("id")

            if is_act:
                imported_active_codes.add(p_id)
            else:
                imported_archived_codes.add(p_id)

        # Collect unique types and brands
        available_types = set()
        available_brands = set()

        for s in vip_services:
            if s.get("type"):
                available_types.add(s["type"])
            if s.get("brand"):
                available_brands.add(s["brand"])

        filtered = vip_services

        if vip_type and vip_type != "all":
            filtered = [s for s in filtered if s.get("type") == vip_type]

        if vip_status and vip_status != "all":
            filtered = [s for s in filtered if s.get("status") == vip_status]

        if search and search.strip():
            query = search.lower().strip()
            filtered = [
                s for s in filtered
                if query in str(s.get("name", "")).lower()
                or query in str(s.get("code", "")).lower()
                or query in str(s.get("brand", "")).lower()
                or query in str(s.get("category", "")).lower()
                or query in str(s.get("game", "")).lower()
            ]

        total = len(filtered)
        slice_items = filtered[:limit]

        # Annotate items with import status
        result_data = []
        for s in slice_items:
            code_upper = str(s.get("code", "")).upper()
            is_imported = code_upper in imported_active_codes
            is_archived = code_upper in imported_archived_codes
            db_status = "active" if is_imported else ("archived" if is_archived else "unimported")

            result_data.append({
                **s,
                "code": s.get("code") or s.get("providerCode"),
                "isImported": is_imported,
                "isArchived": is_archived,
                "dbStatus": db_status,
                "importedProductId": imported_id_map.get(code_upper),
            })

        return {
            "success": True,
            "total": total,
            "cached": True,
            "cacheAgeSeconds": 120,
            "availableTypes": sorted(list(available_types)),
            "availableBrands": sorted(list(available_brands)),
            "data": result_data,
        }

    @classmethod
    def import_vip_service(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        code = str(payload.get("code") or payload.get("providerCode") or "").strip()
        name = payload.get("name", "").strip()
        price = int(payload.get("price", 0))
        provider_price = int(payload.get("providerPrice", 0))
        stock = int(payload.get("stock", 100))
        category_name = payload.get("categoryName", "Digital Services")
        description = payload.get("description", "")
        status = payload.get("status", "active")
        image_url = payload.get("imageUrl") or "/images/default-product-banner.png"

        margin = price - provider_price if provider_price > 0 else 0
        pct = round((margin / provider_price) * 100) if provider_price > 0 else 0
        cat_id = f"cat-{category_name.lower().replace(' ', '-')}"

        prod_id = f"vip-{code.lower().replace(' ', '-')}"

        try:
            db = SessionLocal()
            try:
                existing = db.query(Product).filter((Product.provider_code.ilike(code)) | (Product.id == prod_id)).first()
                if existing:
                    existing.name = name or existing.name
                    existing.price = price or existing.price
                    existing.price_formatted = f"Rp {existing.price:,.0f}".replace(",", ".")
                    existing.provider_price = provider_price or existing.provider_price
                    existing.profit_margin = margin
                    existing.profit_percentage = pct
                    existing.stock = stock
                    existing.status = status
                    if image_url:
                        existing.image_url = image_url
                    existing.updated_at = datetime.utcnow()
                    db.commit()
                    db.refresh(existing)
                    res_dict = cls._normalize_product(existing.to_dict())
                else:
                    new_prod = Product(
                        id=prod_id,
                        name=name,
                        category_id=cat_id,
                        category_name=category_name,
                        brand="VIP Reseller",
                        price=price,
                        price_formatted=f"Rp {price:,.0f}".replace(",", "."),
                        provider_price=provider_price,
                        stock=stock,
                        status=status,
                        description=description,
                        features=[
                            f"Kode Layanan: {code}",
                            "Proses Instan Otomatis",
                            "Garansi Penuh 100%",
                        ],
                        image_url=image_url,
                        popular=False,
                        provider="vip-reseller",
                        provider_code=code,
                        provider_name=name,
                        provider_status="available",
                        profit_margin=margin,
                        profit_percentage=pct,
                        guarantee_title="Garansi Penuh",
                        guarantee_desc="Jaminan ganti akun 100%",
                        process_title="Proses Instan",
                        process_desc="1 - 15 menit selesai",
                        privacy_title="Akun Private",
                        privacy_desc="Ruang kerja aman & personal",
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    db.add(new_prod)
                    db.commit()
                    db.refresh(new_prod)
                    res_dict = cls._normalize_product(new_prod.to_dict())
            finally:
                db.close()
        except Exception as e:
            print(f"[CatalogService] Error importing VIP service to Supabase: {e}")
            raise e

        cls.load_products(force_reload=True)
        return res_dict

    @classmethod
    def find_product_by_id_or_name(
        cls,
        product_id: Optional[str] = None,
        product_name: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        products = cls.load_products()

        if product_id:
            pid_clean = str(product_id).strip().lower()
            for p in products:
                if (
                    str(p.get("id") or "").strip().lower() == pid_clean
                    or str(p.get("providerCode") or "").strip().lower() == pid_clean
                ):
                    return p

        if product_name:
            import re
            name_clean = re.sub(r'[^a-zA-Z0-9]', '', product_name).lower()
            tokens = set(re.findall(r'[a-zA-Z0-9]+', product_name.lower()))
            meaningful_tokens = {
                t for t in tokens
                if t not in ['dan', 'atau', 'the', 'and', 'or', '1', 'bulan', 'tahun', 'resmi', 'private', 'garansi']
            }

            best_match = None
            best_score = 0

            for p in products:
                p_name = str(p.get("name") or "")
                p_clean = re.sub(r'[^a-zA-Z0-9]', '', p_name).lower()
                if name_clean == p_clean:
                    return p
                if len(name_clean) >= 5 and (name_clean in p_clean or p_clean in name_clean):
                    return p

                p_tokens = set(re.findall(r'[a-zA-Z0-9]+', p_name.lower()))
                common = meaningful_tokens.intersection(p_tokens)
                if len(common) >= 2 and len(common) > best_score:
                    best_score = len(common)
                    best_match = p

            if best_match and best_score >= 2:
                return best_match

        return None
