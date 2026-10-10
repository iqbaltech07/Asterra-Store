import json
import pathlib
import os
from typing import List, Dict, Any, Optional

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
        if cls._cached_products is not None and not force_reload:
            return cls._cached_products

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
            print(f"[CatalogService] Error loading catalog: {e}")

        cls._cached_products = []
        return []

    @classmethod
    def save_products(cls) -> bool:
        try:
            if cls._cached_products is not None:
                CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
                CATALOG_PATH.write_text(json.dumps(cls._cached_products, indent=2, ensure_ascii=False), encoding="utf-8")
                return True
        except Exception as e:
            print(f"[CatalogService] Error saving catalog: {e}")
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
        products = cls.load_products()
        for p in products:
            if p.get("id") == product_id or str(p.get("providerCode")) == product_id:
                return p
        return None

    @classmethod
    def load_managed_products(cls) -> List[Dict[str, Any]]:
        try:
            if MANAGED_PATH.exists():
                all_products = json.loads(MANAGED_PATH.read_text(encoding="utf-8"))
                return [cls._normalize_product(p) for p in all_products]
        except Exception as e:
            print(f"[CatalogService] Error loading managed catalog: {e}")
        return cls.load_products()

    @classmethod
    def get_admin_products(
        cls,
        status: Optional[str] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Dict[str, Any]:
        products = cls.load_managed_products()

        # Compute accurate metrics across whole dataset
        total = len(products)
        total_active = sum(1 for p in products if p.get("status", "active") == "active")
        total_archived = sum(1 for p in products if p.get("status") == "archived")
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
                filtered = [p for p in filtered if p.get("status") == "archived"]
            elif status == "warning":
                filtered = [
                    p for p in filtered
                    if p.get("status", "active") == "active"
                    and (p.get("providerStatus") == "empty" or p.get("stock") == 0)
                ]

        if category and category.lower() not in ["semua", "all", "cat-all"]:
            cat_clean = category.lower().strip()
            filtered = [
                p for p in filtered
                if (isinstance(p.get("category"), dict) and p["category"].get("id", "").lower() == cat_clean)
                or (isinstance(p.get("category"), dict) and p["category"].get("name", "").lower() == cat_clean)
                or str(p.get("categoryId", "")).lower() == cat_clean
            ]

        if search and search.strip():
            query = search.lower().strip()
            filtered = [
                p for p in filtered
                if query in p.get("name", "").lower()
                or query in str(p.get("providerCode", "")).lower()
                or query in p.get("description", "").lower()
                or any(query in str(f).lower() for f in p.get("features", []))
            ]

        return {
            "products": filtered,
            "total": len(filtered),
            "metrics": {
                "total": total,
                "totalActive": total_active,
                "totalArchived": total_archived,
                "totalWarnings": total_warnings,
                "vipBalance": 1250000,
            },
        }

    @classmethod
    def create_product(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        products = cls.load_products()
        product_id = payload.get("id") or f"prod-{int(len(products) + 1)}-{payload.get('name', 'item')[:8].lower().replace(' ', '-')}"

        price = float(payload.get("price", 0))
        provider_price = float(payload.get("providerPrice", 0))
        margin = price - provider_price if provider_price > 0 else 0
        pct = round((margin / provider_price) * 100) if provider_price > 0 else 0

        new_product = {
            "id": product_id,
            "name": payload.get("name", ""),
            "category": payload.get("category") or {
                "id": "cat-ai-tools",
                "name": "AI Tools",
            },
            "price": price,
            "priceFormatted": f"Rp {price:,.0f}".replace(",", "."),
            "providerPrice": provider_price,
            "stock": int(payload.get("stock", 100)),
            "status": payload.get("status", "active"),
            "description": payload.get("description", ""),
            "features": payload.get("features", []),
            "imageUrl": payload.get("imageUrl") or "/images/default-product-banner.png",
            "popular": bool(payload.get("popular", False)),
            "provider": payload.get("provider", "native"),
            "providerCode": payload.get("providerCode"),
            "providerStatus": "available",
            "profitMargin": margin,
            "profitPercentage": pct,
            "guaranteeTitle": payload.get("guaranteeTitle", "Garansi Penuh"),
            "guaranteeDesc": payload.get("guaranteeDesc", "Jaminan ganti akun 100%"),
            "processTitle": payload.get("processTitle", "Proses Instan"),
            "processDesc": payload.get("processDesc", "1 - 15 menit selesai"),
            "privacyTitle": payload.get("privacyTitle", "Akun Private"),
            "privacyDesc": payload.get("privacyDesc", "Ruang kerja aman & personal"),
        }

        products.insert(0, new_product)
        cls.save_products()
        return new_product

    @classmethod
    def update_product(cls, product_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        products = cls.load_products()
        for idx, p in enumerate(products):
            if p.get("id") == product_id or str(p.get("providerCode")) == product_id:
                # Merge updates
                for key, val in payload.items():
                    if val is not None:
                        p[key] = val

                # Recalculate margins if price or providerPrice updated
                if "price" in payload or "providerPrice" in payload:
                    price = float(p.get("price", 0))
                    provider_price = float(p.get("providerPrice", 0))
                    if provider_price > 0:
                        p["profitMargin"] = price - provider_price
                        p["profitPercentage"] = round(((price - provider_price) / provider_price) * 100)
                    p["priceFormatted"] = f"Rp {price:,.0f}".replace(",", ".")

                products[idx] = p
                cls.save_products()
                return p
        return None

    @classmethod
    def delete_product(cls, product_id: str) -> bool:
        products = cls.load_products()
        initial_len = len(products)
        cls._cached_products = [p for p in products if p.get("id") != product_id and str(p.get("providerCode")) != product_id]
        if len(cls._cached_products) < initial_len:
            cls.save_products()
            return True
        return False

    @classmethod
    def toggle_status(cls, product_id: str) -> Optional[str]:
        products = cls.load_products()
        for idx, p in enumerate(products):
            if p.get("id") == product_id or str(p.get("providerCode")) == product_id:
                current = p.get("status", "active")
                new_status = "archived" if current == "active" else "active"
                p["status"] = new_status
                products[idx] = p
                cls.save_products()
                return new_status
        return None

    @classmethod
    def bulk_status(cls, ids: List[str], status: str) -> int:
        products = cls.load_products()
        id_set = set(ids)
        updated_count = 0
        for idx, p in enumerate(products):
            if p.get("id") in id_set or str(p.get("providerCode")) in id_set:
                p["status"] = status
                products[idx] = p
                updated_count += 1
        if updated_count > 0:
            cls.save_products()
        return updated_count

    @classmethod
    def bulk_delete(cls, ids: List[str]) -> int:
        products = cls.load_products()
        id_set = set(ids)
        initial_len = len(products)
        cls._cached_products = [
            p for p in products
            if p.get("id") not in id_set and str(p.get("providerCode")) not in id_set
        ]
        deleted_count = initial_len - len(cls._cached_products)
        if deleted_count > 0:
            cls.save_products()
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
        price = float(payload.get("price", 0))
        provider_price = float(payload.get("providerPrice", 0))
        stock = int(payload.get("stock", 100))
        category_name = payload.get("categoryName", "Digital Services")
        description = payload.get("description", "")
        status = payload.get("status", "active")
        image_url = payload.get("imageUrl") or "/images/default-product-banner.png"

        products = cls.load_products()
        existing = next((p for p in products if str(p.get("providerCode", "")).upper() == code.upper()), None)

        margin = price - provider_price if provider_price > 0 else 0
        pct = round((margin / provider_price) * 100) if provider_price > 0 else 0

        if existing:
            existing["name"] = name or existing.get("name")
            existing["price"] = price or existing.get("price")
            existing["priceFormatted"] = f"Rp {existing['price']:,.0f}".replace(",", ".")
            existing["providerPrice"] = provider_price or existing.get("providerPrice")
            existing["profitMargin"] = margin
            existing["profitPercentage"] = pct
            existing["stock"] = stock
            existing["status"] = status
            existing["imageUrl"] = image_url or existing.get("imageUrl")
            cls.save_products()
            return existing

        cat_id = f"cat-{category_name.lower().replace(' ', '-')}"
        new_product = {
            "id": f"vip-{code.lower().replace(' ', '-')}",
            "name": name,
            "category": {"id": cat_id, "name": category_name},
            "price": price,
            "priceFormatted": f"Rp {price:,.0f}".replace(",", "."),
            "providerPrice": provider_price,
            "stock": stock,
            "status": status,
            "description": description,
            "features": [
                f"Kode Layanan: {code}",
                "Proses Instan Otomatis",
                "Garansi Penuh 100%",
            ],
            "imageUrl": image_url,
            "popular": False,
            "provider": "vip-reseller",
            "providerCode": code,
            "providerName": name,
            "providerStatus": "available",
            "profitMargin": margin,
            "profitPercentage": pct,
            "guaranteeTitle": "Garansi Penuh",
            "guaranteeDesc": "Jaminan ganti akun 100%",
            "processTitle": "Proses Instan",
            "processDesc": "1 - 15 menit selesai",
            "privacyTitle": "Akun Private",
            "privacyDesc": "Ruang kerja aman & personal",
        }

        products.insert(0, new_product)
        cls.save_products()
        return new_product
