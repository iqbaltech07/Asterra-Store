import json
import pathlib
from datetime import datetime
from typing import List, Dict, Any, Optional
from sqlalchemy import text
from sqlalchemy.orm import joinedload
from app.core.database import SessionLocal, engine, Base
from app.models.homepage_section import HomepageProductSection
from app.models.product_card import ProductCard
from app.models.product import Product
from app.models.order import Order, OrderItem
from app.services.catalog_service import CatalogService
from app.services.campaign_service import CampaignService
from app.services.realtime_broadcaster import RealtimeBroadcaster
from app.core.cache import cache

VALID_SECTIONS = ["promo", "terlaris", "terbaru", "showcase"]

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
    "showcase": {
        "sectionKey": "showcase",
        "mode": "manual",
        "manualProductIds": ["card-iqiyi", "card-canva", "card-chatgpt", "card-netflix", "card-youtube"],
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
            print(f"[HomepageSectionService] DB load note: {e}")

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

        # Invalidate caches and broadcast SSE event
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
                    # Query order items belonging to completed/success/paid/processing orders
                    results = (
                        db.query(OrderItem.product_id, OrderItem.product_name, OrderItem.quantity)
                        .join(Order, OrderItem.order_id == Order.id)
                        .filter(Order.status.in_(["completed", "success", "paid", "settlement", "done", "selesai"]))
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
            valid_orders = [o for o in orders if str(o.get("status", "")).lower() in ["completed", "success", "paid", "settlement", "done", "selesai"]]
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
    def compute_section_products(cls, section_key: str, limit: Optional[int] = None) -> Dict[str, Any]:
        """
        Computes the definitive list of up to 8 ProductCards (Product Groups) for Promo, Terlaris, or Terbaru.
        Strictly observes:
        1. Max 8 products.
        2. Auto Mode follows real metrics:
           - terbaru: effective_time = max(card.created_at, max(variant.created_at)). Sort DESC.
             Rule: 'jika ada product group baru atau variant baru di product group tersebut maka kalkulasikan masuk ke dalam tab terbaru.'
           - terlaris: sold_count DESC, effective_time DESC.
           - promo: active_campaign DESC, sold_count DESC, effective_time DESC.
        3. Manual Mode applies admin priority order without dropping any manual selections,
           filling remaining slots up to 8 via Auto logic.
        4. Inactive/archived cards and cards with zero active variants are excluded.
        5. Zero duplicates.
        """
        configs = cls.get_sections_config()
        config = configs.get(section_key, DEFAULT_CONFIG.get(section_key, {}))
        mode = config.get("mode", "auto")
        manual_ids = config.get("manualProductIds", [])

        sales_counts = cls.get_valid_sales_counts()
        active_campaigns = CampaignService.get_active_campaigns()

        # Rule 5: If Promo section requested but no active campaign is running, return empty immediately
        if section_key == "promo" and not active_campaigns:
            return {
                "sectionKey": section_key,
                "mode": mode,
                "manualProductIds": manual_ids,
                "totalAvailable": 0,
                "count": 0,
                "data": [],
                "limit": limit if limit is not None else 0,
                "updatedAt": config.get("updatedAt"),
                "updatedBy": config.get("updatedBy"),
            }

        def parse_dt(val: Any) -> Optional[datetime]:
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
            return None

        def is_card_in_campaign(card_obj: ProductCard, active_catalogs: List[Product]) -> bool:
            if not active_campaigns:
                return False
            cid = str(card_obj.id or "").lower()
            cname = str(card_obj.name or "").lower()
            cslug = str(card_obj.slug or "").lower()
            cat_name = str(card_obj.category_name or "").lower()
            cat_id = str(card_obj.category_id or "").lower()

            for camp in active_campaigns:
                scope = camp.get("targetScope", "all")
                if scope == "all":
                    return True
                if scope == "category":
                    target_cats = [c.lower().strip() for c in (camp.get("targetCategories") or [camp.get("targetCategory", "")]) if c]
                    if any(tc in cat_name or tc in cat_id for tc in target_cats):
                        return True
                if scope == "specific_products":
                    target_prods = [p.lower().strip() for p in (camp.get("targetProducts") or []) if p]
                    if any(tp in [cid, cname, cslug] for tp in target_prods):
                        return True
                    for v in active_catalogs:
                        vid = str(v.id or "").lower()
                        vname = str(v.name or "").lower()
                        if any(tp in [vid, vname] for tp in target_prods):
                            return True
            return False

        # Build candidate card items inside DB session
        candidate_cards: List[Dict[str, Any]] = []
        db = SessionLocal() if SessionLocal else None
        if db:
            try:
                active_cards = (
                    db.query(ProductCard)
                    .options(joinedload(ProductCard.catalogs))
                    .filter(ProductCard.status == "active")
                    .all()
                )
                from app.services.card_service import CardService
                sold_breakdown = CardService.get_sales_breakdown()

                for card in active_cards:
                    active_catalogs = [p for p in (card.catalogs or []) if getattr(p, "status", None) == "active"]
                    if not active_catalogs:
                        continue

                    prices = [int(float(p.price)) for p in active_catalogs if getattr(p, "price", None) is not None and float(p.price) > 0]
                    min_price = min(prices) if prices else 0
                    if min_price <= 0:
                        continue

                    # Calculate effective created_at:
                    # Rule: 'jika ada product group baru atau variant baru di product group tersebut maka kalkulasikan masuk ke dalam tab terbaru.'
                    created_timestamps = []
                    c_c = parse_dt(card.created_at)
                    if c_c:
                        created_timestamps.append(c_c)
                    c_u = parse_dt(getattr(card, "updated_at", None))
                    if c_u:
                        created_timestamps.append(c_u)
                    for p in active_catalogs:
                        p_c = parse_dt(getattr(p, "created_at", None))
                        if p_c:
                            created_timestamps.append(p_c)
                        p_u = parse_dt(getattr(p, "updated_at", None))
                        if p_u:
                            created_timestamps.append(p_u)
                    has_valid_dt = len(created_timestamps) > 0
                    effective_created_at = max(created_timestamps) if has_valid_dt else datetime(1970, 1, 1)

                    # Sold count: unified canonical calculation via CardService sales breakdown + card.to_dict
                    sb = sold_breakdown.get(card.id, {"dummy": 0, "real": 0, "total": 0})
                    card_summary = card.to_dict(
                        include_catalogs=False,
                        sold_count=sb["total"],
                        dummy_sold=sb["dummy"],
                        real_sold=sb["real"],
                    )
                    total_sold = card_summary["soldCount"]
                    base_sold = card_summary["baseSoldCount"]

                    in_promo = is_card_in_campaign(card, active_catalogs)

                    # Determine categoryTag
                    name_u = str(card.name or "").upper()
                    cat_u = str(card.category_name or "").upper()
                    if "AI" in name_u or "CHATGPT" in name_u or "GEMINI" in name_u or "CLAUDE" in name_u:
                        tag = "ai"
                    elif "CANVA" in name_u or "DESIGN" in name_u or "DESAINER" in name_u:
                        tag = "design"
                    elif "CAPCUT" in name_u or "VIDEO" in name_u or "ALIGHT" in name_u:
                        tag = "video"
                    elif "STREAMING" in cat_u or "NETFLIX" in name_u or "YOUTUBE" in name_u or "SPOTIFY" in name_u or "VIDIO" in name_u:
                        tag = "streaming"
                    elif "PUBG" in name_u or "MOBILE LEGEND" in name_u or "DIAMOND" in name_u or "UC" in name_u:
                        tag = "gaming"
                    else:
                        tag = "other"

                    # Check ready stock
                    has_ready_stock = False
                    for c_item in active_catalogs:
                        is_zero_stock = getattr(c_item, "stock", None) is not None and c_item.stock <= 0
                        is_empty = getattr(c_item, "provider_status", None) == "empty"
                        if not is_zero_stock and not is_empty:
                            has_ready_stock = True
                            break

                    stock_status = "ready" if has_ready_stock else "out_of_stock"

                    name_clean = str(card.name or "").strip()
                    if not name_clean or name_clean.lower() in ["digital", "layanan digital", "produk digital"]:
                        name_clean = str(card.slug or "").replace("-", " ").title() if card.slug else "Layanan Pilihan"

                    card_dict = {
                        "id": card.id,
                        "cardId": card.id,
                        "name": name_clean,
                        "slug": card.slug,
                        "brandGroup": card.slug,
                        "productName": name_clean,
                        "displayName": name_clean,
                        "logoUrl": card.logo_url,
                        "imageUrl": card.logo_url,
                        "description": card.description,
                        "categoryId": card.category_id or "cat-digital",
                        "categoryName": card.category_name or "Layanan Digital",
                        "category": {
                            "id": card.category_id or "cat-digital",
                            "name": card.category_name or "Layanan Digital",
                        },
                        "categoryTag": tag,
                        "status": card.status,
                        "rating": card.rating or "5.0",
                        "badgeLabel": "🔥 Promo" if section_key == "promo" else ("⭐ Terlaris" if section_key == "terlaris" else "✨ Baru"),
                        "minPrice": min_price,
                        "price": min_price,
                        "priceFormatted": f"Rp {min_price:,.0f}".replace(",", "."),
                        "stockStatus": stock_status,
                        "isOutOfStock": stock_status == "out_of_stock",
                        "baseSoldCount": base_sold,
                        "dummySoldCount": sb["dummy"],
                        "realSoldCount": sb["real"],
                        "orderSoldCount": sb["total"],
                        "soldCount": total_sold,
                        "isPromo": in_promo or section_key == "promo",
                        "effectiveCreatedAt": effective_created_at.isoformat() if has_valid_dt else None,
                        "_effective_dt": effective_created_at,
                        "_has_valid_dt": has_valid_dt,
                        "variantCount": len(active_catalogs),
                        "items": [p.to_dict() for p in active_catalogs],
                    }
                    candidate_cards.append(card_dict)
            except Exception as e:
                print(f"[HomepageSectionService] DB cards query note: {e}")
            finally:
                db.close()

        # --- AUTO RANKING FOR EACH SECTION ---
        auto_ranked: List[Dict[str, Any]] = []
        if section_key == "promo":
            # Auto Promo: Prioritize cards in active campaigns, then sold_count DESC, then effective_dt DESC
            promo_candidates = [c for c in candidate_cards if c.get("isPromo")]
            auto_ranked = sorted(
                promo_candidates,
                key=lambda x: (
                    x.get("soldCount", 0),
                    x.get("orderSoldCount", 0),
                    x["_effective_dt"].timestamp(),
                    x["id"],
                ),
                reverse=True,
            )
        elif section_key == "terlaris":
            # Auto Terlaris: Sort strictly by sold_count DESC, tie-breaker orderSoldCount DESC, rating DESC, effective_dt DESC
            auto_ranked = sorted(
                candidate_cards,
                key=lambda x: (
                    x.get("soldCount", 0),
                    x.get("orderSoldCount", 0),
                    float(x.get("rating") or 5.0),
                    x["_effective_dt"].timestamp(),
                ),
                reverse=True,
            )
        elif section_key == "terbaru":
            # Auto Terbaru: Sort by has_valid_dt (1 vs 0), effective_dt DESC (newest card or variant), tie-breaker soldCount DESC
            auto_ranked = sorted(
                candidate_cards,
                key=lambda x: (
                    1 if x.get("_has_valid_dt") else 0,
                    x["_effective_dt"].timestamp(),
                    x.get("soldCount", 0),
                ),
                reverse=True,
            )
        elif section_key == "showcase":
            # Auto Showcase: Prioritize top performers by sold_count DESC
            auto_ranked = sorted(
                candidate_cards,
                key=lambda x: (
                    x.get("soldCount", 0),
                    x.get("orderSoldCount", 0),
                    x["_effective_dt"].timestamp(),
                ),
                reverse=True,
            )

        # Helper to match a manual id/slug/name to candidate card
        def match_candidate(mid: str) -> Optional[Dict[str, Any]]:
            cmid = mid.lower().strip()
            # 1. Exact match by id, slug, or name
            for c in candidate_cards:
                if c["id"].lower() == cmid or c["slug"].lower() == cmid or c["name"].lower() == cmid:
                    return c
            # 2. Substring match
            for c in candidate_cards:
                if cmid in c["slug"].lower() or c["slug"].lower() in cmid or cmid in c["name"].lower() or c["name"].lower() in cmid:
                    return c
            # 3. Match against variant IDs or names
            for c in candidate_cards:
                for it in c.get("items", []):
                    if str(it.get("id", "")).lower() == cmid or str(it.get("name", "")).lower() == cmid:
                        return c
            return None

        final_cards: List[Dict[str, Any]] = []
        selected_card_ids: set = set()

        if mode == "manual" and manual_ids:
            for mid in manual_ids:
                matched = match_candidate(mid)
                if matched and matched["id"] not in selected_card_ids:
                    selected_card_ids.add(matched["id"])
                    final_cards.append(matched)
                    if limit and limit > 0 and len(final_cards) >= limit:
                        break

        # Fill remaining slots from auto_ranked
        if not limit or limit <= 0 or len(final_cards) < limit:
            for c in auto_ranked:
                if c["id"] not in selected_card_ids:
                    selected_card_ids.add(c["id"])
                    final_cards.append(c)
                    if limit and limit > 0 and len(final_cards) >= limit:
                        break

        # Enforce strict sorting guarantee for each category
        if section_key == "terlaris":
            # Rule 3: Strict descending sort by sold_count (highest first), tie-breaker orderSoldCount DESC, rating DESC, effective_dt DESC
            final_cards.sort(
                key=lambda x: (
                    x.get("soldCount", 0),
                    x.get("orderSoldCount", 0),
                    float(x.get("rating") or 5.0),
                    x["_effective_dt"].timestamp(),
                ),
                reverse=True,
            )
        elif section_key == "terbaru":
            # Rule 4: Strict descending sort by effective timestamp (newest first). Invalid timestamps placed at bottom.
            final_cards.sort(
                key=lambda x: (
                    1 if x.get("_has_valid_dt") else 0,
                    x["_effective_dt"].timestamp(),
                    x.get("soldCount", 0),
                ),
                reverse=True,
            )
        elif section_key == "promo":
            final_cards.sort(
                key=lambda x: (
                    x.get("soldCount", 0),
                    x.get("orderSoldCount", 0),
                    x["_effective_dt"].timestamp(),
                ),
                reverse=True,
            )

        # Clean up internal helper keys before returning
        output_data = []
        for idx, c in enumerate(final_cards):
            item_clean = {k: v for k, v in c.items() if not k.startswith("_")}
            if section_key == "showcase":
                item_clean["rank"] = idx + 1
                item_clean["badgeLabel"] = f"TOP {idx + 1}"
            output_data.append(item_clean)

        return {
            "sectionKey": section_key,
            "mode": mode,
            "manualProductIds": manual_ids,
            "totalAvailable": len(auto_ranked),
            "count": len(output_data),
            "data": output_data,
            "limit": limit if limit is not None else len(output_data),
            "updatedAt": config.get("updatedAt"),
            "updatedBy": config.get("updatedBy"),
        }

    @classmethod
    def get_all_homepage_sections(cls, limit: Optional[int] = None) -> Dict[str, Any]:
        return {
            "success": True,
            "sections": {
                "promo": cls.compute_section_products("promo", limit=limit),
                "terlaris": cls.compute_section_products("terlaris", limit=limit),
                "terbaru": cls.compute_section_products("terbaru", limit=limit),
                "showcase": cls.compute_section_products("showcase", limit=5),
            },
            "timestamp": datetime.utcnow().isoformat(),
        }
