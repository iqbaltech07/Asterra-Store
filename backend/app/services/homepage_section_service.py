import json
import pathlib
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from app.core.database import SessionLocal, engine, Base
from app.models.homepage_section import HomepageProductSection
from app.models.order import Order, OrderItem
from app.services.catalog_service import CatalogService
from app.services.campaign_service import CampaignService
from app.services.realtime_broadcaster import RealtimeBroadcaster
from app.core.cache import cache

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
SECTIONS_FILE = DATA_DIR / "homepage-sections.json"

VALID_SECTIONS = ["promo", "terlaris", "terbaru"]

DEFAULT_CONFIG: Dict[str, Dict[str, Any]] = {
    "promo": {
        "sectionKey": "promo",
        "mode": "auto",
        "manualProductIds": [],
        "updatedBy": "system",
        "updatedAt": datetime.utcnow().isoformat(),
    },
    "terlaris": {
        "sectionKey": "terlaris",
        "mode": "auto",
        "manualProductIds": [],
        "updatedBy": "system",
        "updatedAt": datetime.utcnow().isoformat(),
    },
    "terbaru": {
        "sectionKey": "terbaru",
        "mode": "auto",
        "manualProductIds": [],
        "updatedBy": "system",
        "updatedAt": datetime.utcnow().isoformat(),
    },
}

class HomepageSectionService:
    _table_ensured: bool = False

    @classmethod
    def ensure_table(cls, force: bool = False):
        if cls._table_ensured and not force:
            return
        cls._table_ensured = True
        try:
            if engine is not None:
                Base.metadata.create_all(bind=engine, tables=[HomepageProductSection.__table__])
                # Initialize default records if empty
                db = SessionLocal() if SessionLocal else None
                if db:
                    try:
                        for s_key in VALID_SECTIONS:
                            existing = db.query(HomepageProductSection).filter_by(section_key=s_key).first()
                            if not existing:
                                new_sec = HomepageProductSection(
                                    section_key=s_key,
                                    mode="auto",
                                    manual_product_ids="[]",
                                    updated_by="system",
                                )
                                db.add(new_sec)
                        db.commit()
                    finally:
                        db.close()
        except Exception as e:
            print(f"[HomepageSectionService] Table ensure note: {e}")

    @classmethod
    def get_sections_config(cls) -> Dict[str, Dict[str, Any]]:
        cls.ensure_table()
        configs = dict(DEFAULT_CONFIG)

        # 1. Try DB
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    records = db.query(HomepageProductSection).all()
                    for r in records:
                        configs[r.section_key] = r.to_dict()
                    return configs
                finally:
                    db.close()
        except Exception as e:
            print(f"[HomepageSectionService] DB load fallback to JSON: {e}")

        # 2. Try JSON file fallback
        if SECTIONS_FILE.exists():
            try:
                data = json.loads(SECTIONS_FILE.read_text(encoding="utf-8"))
                for k, v in data.items():
                    if k in VALID_SECTIONS:
                        configs[k] = v
                return configs
            except Exception as e:
                print(f"[HomepageSectionService] JSON load error: {e}")

        return configs

    @classmethod
    def update_section_config(
        cls,
        section_key: str,
        mode: str,
        manual_product_ids: List[str],
        updated_by: Optional[str] = "admin",
    ) -> Dict[str, Any]:
        cls.ensure_table()
        if section_key not in VALID_SECTIONS:
            raise ValueError(f"Section key '{section_key}' tidak valid. Harus salah satu dari: {VALID_SECTIONS}")
        if mode not in ["auto", "manual"]:
            raise ValueError(f"Mode '{mode}' tidak valid. Harus 'auto' atau 'manual'")

        # Deduplicate manual_product_ids preserving order
        deduped_ids = []
        seen = set()
        for pid in manual_product_ids:
            clean_id = str(pid).strip()
            if clean_id and clean_id not in seen:
                seen.add(clean_id)
                deduped_ids.append(clean_id)

        now = datetime.utcnow()
        result_dict = {
            "sectionKey": section_key,
            "mode": mode,
            "manualProductIds": deduped_ids,
            "updatedBy": updated_by,
            "updatedAt": now.isoformat(),
        }

        # 1. Save to DB
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    record = db.query(HomepageProductSection).filter_by(section_key=section_key).first()
                    if record:
                        record.mode = mode
                        record.manual_product_ids = json.dumps(deduped_ids)
                        record.updated_by = updated_by
                        record.updated_at = now
                    else:
                        record = HomepageProductSection(
                            section_key=section_key,
                            mode=mode,
                            manual_product_ids=json.dumps(deduped_ids),
                            updated_by=updated_by,
                            updated_at=now,
                        )
                        db.add(record)
                    db.commit()
                finally:
                    db.close()
        except Exception as e:
            print(f"[HomepageSectionService] DB save note: {e}")

        # 2. Save to local JSON backup
        try:
            current_json = {}
            if SECTIONS_FILE.exists():
                try:
                    current_json = json.loads(SECTIONS_FILE.read_text(encoding="utf-8"))
                except Exception:
                    pass
            current_json[section_key] = result_dict
            SECTIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
            SECTIONS_FILE.write_text(json.dumps(current_json, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as e:
            print(f"[HomepageSectionService] JSON backup write note: {e}")

        # 3. Invalidate caches and broadcast SSE event
        cache.invalidate("homepage_sections", "catalog")
        RealtimeBroadcaster.broadcast(
            "homepage:sections_updated",
            {
                "section": section_key,
                "mode": mode,
                "timestamp": now.isoformat(),
                "updatedBy": updated_by,
            },
            target_role="all",
        )

        return result_dict

    @classmethod
    def get_valid_sales_counts(cls) -> Dict[str, int]:
        """
        Calculates authoritative units sold per product from real completed transactions.
        Only completed/success/paid orders are counted.
        Cancelled and refunded orders are strictly excluded.
        """
        sales: Dict[str, int] = {}
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    # Query order items belonging to completed/success/paid orders
                    results = (
                        db.query(OrderItem.product_id, OrderItem.product_name, OrderItem.quantity)
                        .join(Order, OrderItem.order_id == Order.id)
                        .filter(Order.status.in_(["completed", "success", "paid"]))
                        .all()
                    )
                    for pid, pname, qty in results:
                        q = int(qty or 1)
                        if pid:
                            sales[str(pid).lower()] = sales.get(str(pid).lower(), 0) + q
                        if pname:
                            sales[str(pname).lower()] = sales.get(str(pname).lower(), 0) + q
                    return sales
                finally:
                    db.close()
        except Exception as e:
            print(f"[HomepageSectionService] DB sales count note: {e}")

        # Fallback using OrderService in-memory
        try:
            from app.services.order_service import OrderService
            orders = OrderService.load_orders()
            valid_orders = [o for o in orders if str(o.get("status", "")).lower() in ["completed", "success", "paid"]]
            for o in valid_orders:
                for it in o.get("items", []):
                    q = int(it.get("quantity") or 1)
                    pid = str(it.get("productId") or it.get("product_id") or "").lower()
                    pname = str(it.get("productName") or it.get("product_name") or "").lower()
                    if pid:
                        sales[pid] = sales.get(pid, 0) + q
                    if pname:
                        sales[pname] = sales.get(pname, 0) + q
        except Exception as e:
            print(f"[HomepageSectionService] OrderService fallback note: {e}")

        return sales

    @classmethod
    def compute_section_products(cls, section_key: str, limit: int = 8) -> Dict[str, Any]:
        """
        Computes the definitive list of up to 8 products for Promo, Terlaris, or Terbaru.
        Strictly observes:
        1. Max 8 products.
        2. Auto Mode follows real metrics (Campaigns, Sales, CreatedAt).
        3. Manual Mode applies admin priority order, filling remaining slots up to 8 via Auto logic.
        4. Inactive/archived products are excluded.
        5. Zero duplicate products within section.
        """
        configs = cls.get_sections_config()
        config = configs.get(section_key, DEFAULT_CONFIG.get(section_key, {}))
        mode = config.get("mode", "auto")
        manual_ids = config.get("manualProductIds", [])

        all_products = CatalogService.load_products(force_reload=False)
        # Only active products with positive price
        active_products = [
            p for p in all_products
            if p.get("status", "active") == "active"
            and (p.get("price") or 0) > 0
        ]

        sales_counts = cls.get_valid_sales_counts()
        active_campaigns = CampaignService.get_active_campaigns()

        # Helper to get sold units for a product
        def get_sold(p: Dict[str, Any]) -> int:
            pid = str(p.get("id") or "").lower()
            pname = str(p.get("name") or "").lower()
            return sales_counts.get(pid, 0) or sales_counts.get(pname, 0)

        # Helper to parse created_at timestamp
        def get_created_dt(p: Dict[str, Any]) -> datetime:
            val = p.get("createdAt") or p.get("created_at")
            if isinstance(val, datetime):
                return val
            if val:
                try:
                    s = str(val).replace("Z", "").split(".")[0]
                    if "T" in s:
                        return datetime.fromisoformat(s)
                    return datetime.strptime(s[:19], "%Y-%m-%d %H:%M:%S")
                except Exception:
                    pass
            return datetime(2020, 1, 1)

        # Helper to check if product matches an active campaign
        def is_in_active_campaign(p: Dict[str, Any]) -> bool:
            if not active_campaigns:
                return False
            pid = str(p.get("id") or "").lower()
            pname = str(p.get("name") or "").lower()
            cat_name = str(p.get("categoryName") or (p.get("category", {}).get("name") if isinstance(p.get("category"), dict) else "")).lower()

            for camp in active_campaigns:
                scope = camp.get("targetScope", "all")
                if scope == "all":
                    return True
                if scope == "category":
                    cats = [c.lower().strip() for c in (camp.get("targetCategories") or [camp.get("targetCategory", "")]) if c]
                    if any(c in cat_name for c in cats):
                        return True
                if scope == "specific_products":
                    prods = [prod.lower().strip() for prod in (camp.get("targetProducts") or []) if prod]
                    if any(prod == pid or prod in pname for prod in prods):
                        return True
            return False

        # --- AUTO RANKING FOR EACH SECTION ---
        auto_ranked: List[Dict[str, Any]] = []

        if section_key == "promo":
            # Only products in an active campaign
            promo_candidates = [p for p in active_products if is_in_active_campaign(p)]
            # Sort by sales DESC, then created_at DESC
            auto_ranked = sorted(
                promo_candidates,
                key=lambda p: (get_sold(p), get_created_dt(p).timestamp(), str(p.get("id", ""))),
                reverse=True,
            )

        elif section_key == "terlaris":
            # Sort by valid sold units count DESC, tie-breaker created_at DESC
            auto_ranked = sorted(
                active_products,
                key=lambda p: (get_sold(p), get_created_dt(p).timestamp(), str(p.get("id", ""))),
                reverse=True,
            )

        elif section_key == "terbaru":
            # Sort by created_at DESC, tie-breaker id DESC
            auto_ranked = sorted(
                active_products,
                key=lambda p: (get_created_dt(p).timestamp(), str(p.get("id", ""))),
                reverse=True,
            )

        # --- ASSEMBLE FINAL 8 PRODUCTS (AUTO vs MANUAL) ---
        final_products: List[Dict[str, Any]] = []
        selected_ids: set = set()

        if mode == "manual" and manual_ids:
            # Create a lookup map for active products
            active_lookup: Dict[str, Dict[str, Any]] = {}
            for p in active_products:
                pid = str(p.get("id") or "").lower()
                active_lookup[pid] = p
                pname = str(p.get("name") or "").lower()
                active_lookup[pname] = p

            for mid in manual_ids:
                clean_mid = str(mid).lower().strip()
                matched = active_lookup.get(clean_mid)
                # If section is promo, verify the product matches active campaign
                if matched and (section_key != "promo" or is_in_active_campaign(matched)):
                    real_id = str(matched.get("id"))
                    if real_id not in selected_ids:
                        selected_ids.add(real_id)
                        final_products.append(matched)
                        if len(final_products) >= limit:
                            break

        # Fill remaining slots up to limit (8) from auto_ranked
        for p in auto_ranked:
            real_id = str(p.get("id"))
            if real_id not in selected_ids:
                selected_ids.add(real_id)
                final_products.append(p)
                if len(final_products) >= limit:
                    break

        # Enrich products with computed fields for seamless frontend showcase integration
        enriched_products = []
        for p in final_products:
            p_copy = dict(p)
            name_u = str(p.get("name") or "").upper()
            cat_u = str(p.get("categoryName") or "").upper()
            if "AI" in name_u or "CHATGPT" in name_u or "GEMINI" in name_u or "CLAUDE" in name_u:
                tag = "ai"
            elif "CANVA" in name_u or "DESIGN" in name_u or "DESAINER" in name_u:
                tag = "design"
            elif "CAPCUT" in name_u or "VIDEO" in name_u or "ALIGHT" in name_u:
                tag = "video"
            elif "STREAMING" in cat_u or "NETFLIX" in name_u or "YOUTUBE" in name_u or "SPOTIFY" in name_u or "VIDIO" in name_u:
                tag = "streaming"
            else:
                tag = "other"

            p_copy["categoryTag"] = tag
            p_copy["minPrice"] = p.get("price") or 0
            p_copy["soldCount"] = get_sold(p)
            p_copy["rating"] = "5.0"
            p_copy["isPromo"] = is_in_active_campaign(p)
            p_copy["badgeLabel"] = "🔥 Promo" if section_key == "promo" else ("⭐ Terlaris" if section_key == "terlaris" else "✨ Baru")
            p_copy["slug"] = str(p.get("id") or "").lower()
            p_copy["items"] = [p]
            enriched_products.append(p_copy)

        return {
            "sectionKey": section_key,
            "mode": mode,
            "manualProductIds": manual_ids,
            "totalAvailable": len(auto_ranked),
            "count": len(enriched_products),
            "data": enriched_products,
            "limit": limit,
            "updatedAt": config.get("updatedAt"),
            "updatedBy": config.get("updatedBy"),
        }

    @classmethod
    def get_all_homepage_sections(cls, limit: int = 8) -> Dict[str, Any]:
        return {
            "success": True,
            "sections": {
                "promo": cls.compute_section_products("promo", limit=limit),
                "terlaris": cls.compute_section_products("terlaris", limit=limit),
                "terbaru": cls.compute_section_products("terbaru", limit=limit),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
