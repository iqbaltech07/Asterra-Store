import os
import re
import json
import uuid
import pathlib
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

from sqlalchemy import text
from app.core.database import SessionLocal, engine, Base
from app.models.campaign import PromoCampaign

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
CAMPAIGNS_FILE = DATA_DIR / "supabase-campaigns.json"

WIB = timezone(timedelta(hours=7))


def parse_wib_datetime(val: Any, is_end: bool = False) -> datetime:
    """Parses date/datetime string into naive WIB datetime for consistent comparison."""
    if isinstance(val, datetime):
        if val.tzinfo is not None:
            return val.astimezone(WIB).replace(tzinfo=None)
        return val
    s = str(val).strip()
    if not s:
        return datetime.now(WIB).replace(tzinfo=None)
    try:
        if "T" in s:
            dt = datetime.fromisoformat(s.replace("Z", "+00:00"))
            if dt.tzinfo is not None:
                return dt.astimezone(WIB).replace(tzinfo=None)
            return dt
        else:
            d = datetime.strptime(s[:10], "%Y-%m-%d")
            if is_end:
                return d.replace(hour=23, minute=59, second=59)
            return d.replace(hour=0, minute=0, second=0)
    except Exception:
        return datetime.now(WIB).replace(tzinfo=None)


def get_campaign_sort_key(c: Dict[str, Any]):
    """
    Deterministic priority comparator:
    1. priority DESC (higher integer first)
    2. targetScope specificity: specific_products (3) > category (2) > all (1)
    3. startsAt ASC (earliest start time)
    4. id ASC (stable deterministic tie-break)
    """
    p = int(c.get("priority") or 0)
    scope = c.get("targetScope", "all")
    scope_rank = 3 if scope == "specific_products" else (2 if scope == "category" else 1)
    starts = str(c.get("startsAt") or c.get("startDate") or "")
    cid = str(c.get("id") or "")
    return (-p, -scope_rank, starts, cid)


class CampaignService:
    _campaigns: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def ensure_table(cls):
        """Ensures promo_campaigns table exists in database and has all required columns."""
        try:
            if engine is not None:
                Base.metadata.create_all(bind=engine, tables=[PromoCampaign.__table__])
                try:
                    with engine.connect() as conn:
                        conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS campaign_id VARCHAR;"))
                        conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS campaign_discount INTEGER DEFAULT 0;"))
                        conn.execute(text("ALTER TABLE promo_campaigns ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;"))
                        conn.commit()
                except Exception:
                    pass
        except Exception as e:
            print(f"[CampaignService] DB table verification note: {e}")

    @classmethod
    def load_campaigns(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        Loads campaigns from Supabase/PostgreSQL promo_campaigns table.
        Falls back to local JSON cache if DB is offline.
        """
        if cls._campaigns is not None and not force_reload:
            return cls._campaigns

        # 1. Query Database
        try:
            cls.ensure_table()
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    db_items = (
                        db.query(PromoCampaign)
                        .order_by(PromoCampaign.starts_at.desc())
                        .all()
                    )
                    data = [c.to_dict() for c in db_items]
                    cls._campaigns = data
                    cls.save_campaigns()
                    return cls._campaigns
                finally:
                    db.close()
        except Exception as e:
            print(f"[CampaignService] Database load note: {e}")

        # 2. Fallback to JSON cache
        if CAMPAIGNS_FILE.exists():
            try:
                raw = CAMPAIGNS_FILE.read_text(encoding="utf-8")
                cls._campaigns = json.loads(raw)
                return cls._campaigns
            except Exception as e:
                print(f"[CampaignService] Fallback read error: {e}")

        cls._campaigns = []
        return cls._campaigns

    @classmethod
    def save_campaigns(cls) -> bool:
        """Saves in-memory cache to local JSON file for instant offline fallback."""
        try:
            if cls._campaigns is not None:
                DATA_DIR.mkdir(parents=True, exist_ok=True)
                CAMPAIGNS_FILE.write_text(
                    json.dumps(cls._campaigns, indent=2, ensure_ascii=False),
                    encoding="utf-8",
                )
                return True
        except Exception as e:
            print(f"[CampaignService] Error saving campaigns cache: {e}")
        return False

    @classmethod
    def get_all_campaigns(cls, filter_status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Returns all campaigns with computed status and optional status filtering."""
        all_items = cls.load_campaigns()
        now_wib = datetime.now(WIB).replace(tzinfo=None)

        processed = []
        for c in all_items:
            # Recompute dynamic status against Asia/Jakarta (WIB) operational clock
            is_active = c.get("isActive", True)
            status = "draft" if not is_active else "running"

            starts_val = c.get("startsAt") or c.get("startDate")
            ends_val = c.get("endsAt") or c.get("endDate")

            if is_active and starts_val and ends_val:
                try:
                    s_dt = parse_wib_datetime(starts_val, is_end=False)
                    e_dt = parse_wib_datetime(ends_val, is_end=True)
                    if now_wib < s_dt:
                        status = "scheduled"
                    elif now_wib >= e_dt:
                        status = "ended"
                    else:
                        status = "running"
                except Exception:
                    pass

            c_copy = dict(c)
            c_copy["status"] = status
            if not filter_status or filter_status == "all" or status == filter_status:
                processed.append(c_copy)

        # Sort campaigns deterministically
        processed.sort(key=get_campaign_sort_key)
        return processed

    @classmethod
    def get_active_campaigns(cls) -> List[Dict[str, Any]]:
        """
        Returns only currently running, active campaigns (Time-Window Evaluation).
        Determines campaigns where now >= startAt and now < endAt in Asia/Jakarta.
        Sorted deterministically by priority, scope specificity, start time, and ID.
        """
        return cls.get_all_campaigns(filter_status="running")

    @classmethod
    def evaluate_product_campaign(
        cls,
        product_id: str,
        category_name: Optional[str] = None,
        original_price: float = 0.0,
        product_slug: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Pure function deterministic pricing evaluation.
        Evaluates a product against active campaigns using strict collision priority rules.
        Only ONE campaign is applied (no stacking of discounts).
        """
        active_campaigns = cls.get_active_campaigns()
        if not active_campaigns or original_price <= 0:
            return None

        clean_cat = (category_name or "").strip().lower()
        clean_pid = (product_id or "").strip().lower()
        clean_slug = (product_slug or "").strip().lower()

        # active_campaigns is already sorted by priority, specificity, startsAt, id
        for camp in active_campaigns:
            scope = camp.get("targetScope", "all")
            eligible = False

            if scope == "all":
                eligible = True
            elif scope == "category":
                target_cats = [str(c).lower().strip() for c in camp.get("targetCategories", []) if c]
                if clean_cat:
                    # Match exact, or slugified match (e.g. 'apps-streaming' vs 'Apps & Streaming')
                    clean_cat_slug = re.sub(r"[^a-z0-9]+", "-", clean_cat).strip("-")
                    for tc in target_cats:
                        tc_clean = tc.lower().strip()
                        tc_slug = re.sub(r"[^a-z0-9]+", "-", tc_clean).strip("-")
                        if (
                            clean_cat == tc_clean
                            or tc_clean in clean_cat
                            or clean_cat in tc_clean
                            or clean_cat_slug == tc_slug
                            or tc_slug in clean_cat_slug
                        ):
                            eligible = True
                            break
            elif scope == "specific_products":
                target_prods = [str(p).lower().strip() for p in camp.get("targetProducts", []) if p]
                if (clean_pid and clean_pid in target_prods) or (clean_slug and clean_slug in target_prods):
                    eligible = True

            if eligible:
                min_p = float(camp.get("minPurchase") or camp.get("minOrderAmount") or 0)
                if original_price < min_p:
                    continue

                dtype = camp.get("discountType", "percentage")
                dval = float(camp.get("discountValue") or 0)
                max_d = float(camp.get("maxDiscountAmount") or 0)

                discount_amount = 0.0
                if dtype == "percentage":
                    discount_amount = (original_price * dval) / 100.0
                    if max_d > 0 and discount_amount > max_d:
                        discount_amount = max_d
                else:  # fixed
                    discount_amount = min(dval, original_price)

                discount_amount = round(discount_amount)
                final_price = max(0.0, original_price - discount_amount)

                return {
                    "campaignId": camp.get("id"),
                    "campaignName": camp.get("name"),
                    "campaignSlug": camp.get("slug"),
                    "discountType": dtype,
                    "discountValue": dval,
                    "discountAmount": int(discount_amount),
                    "finalPrice": int(round(final_price)),
                    "originalPrice": int(round(original_price)),
                    "affiliateBonusPercent": camp.get("affiliateBonusPercent") or camp.get("affiliateCommissionOverride") or 10.0,
                    "startDate": camp.get("startDate"),
                    "endDate": camp.get("endDate"),
                    "startsAt": camp.get("startsAt"),
                    "endsAt": camp.get("endsAt"),
                }

        return None

    @classmethod
    def create_campaign(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new campaign, saves to DB and JSON cache."""
        name = (payload.get("name") or "").strip()
        if not name:
            raise ValueError("Nama campaign wajib diisi.")

        slug = payload.get("slug") or re.sub(r"[^a-zA-Z0-9]+", "-", name.lower()).strip("-")
        camp_id = f"camp_{uuid.uuid4().hex[:10]}"
        now_wib = datetime.now(WIB).replace(tzinfo=None)

        starts_at_str = payload.get("startDate") or payload.get("startsAt") or now_wib.strftime("%Y-%m-%d")
        ends_at_str = payload.get("endDate") or payload.get("endsAt") or now_wib.strftime("%Y-%m-%d")

        parsed_s = parse_wib_datetime(starts_at_str, is_end=False)
        parsed_e = parse_wib_datetime(ends_at_str, is_end=True)

        cats = payload.get("targetCategories") or []
        prods = payload.get("targetProducts") or []
        priority_val = int(payload.get("priority") or 0)

        s_iso = parsed_s.strftime("%Y-%m-%dT%H:%M:%S+07:00")
        e_iso = parsed_e.strftime("%Y-%m-%dT%H:%M:%S+07:00")

        campaign_dict = {
            "id": camp_id,
            "name": name,
            "slug": slug,
            "tagline": payload.get("tagline") or "",
            "bannerUrl": payload.get("bannerUrl") or "",
            "startDate": parsed_s.strftime("%Y-%m-%d"),
            "endDate": parsed_e.strftime("%Y-%m-%d"),
            "startsAt": s_iso,
            "endsAt": e_iso,
            "targetScope": payload.get("targetScope", "all"),
            "targetCategory": ", ".join(cats) if cats else "Semua Kategori",
            "targetCategories": cats,
            "targetProducts": prods,
            "priority": priority_val,
            "discountType": payload.get("discountType", "percentage"),
            "discountValue": float(payload.get("discountValue") or 15.0),
            "maxDiscountAmount": float(payload.get("maxDiscountAmount") or 50000.0),
            "minPurchase": float(payload.get("minPurchase") or payload.get("minOrderAmount") or 0.0),
            "minOrderAmount": float(payload.get("minPurchase") or payload.get("minOrderAmount") or 0.0),
            "affiliateBonusPercent": float(payload.get("affiliateBonusPercent") or payload.get("affiliateCommissionOverride") or 10.0),
            "affiliateCommissionOverride": float(payload.get("affiliateCommissionOverride") or payload.get("affiliateBonusPercent") or 10.0),
            "status": "running" if payload.get("isActive", True) and parsed_s <= now_wib < parsed_e else "scheduled",
            "isActive": payload.get("isActive", True),
            "totalOrders": 0,
            "revenue": 0.0,
            "conversionRate": 0.0,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
        }

        # 1. DB Save
        try:
            cls.ensure_table()
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    db_row = PromoCampaign(
                        id=camp_id,
                        name=name,
                        slug=slug,
                        tagline=campaign_dict["tagline"],
                        banner_url=campaign_dict["bannerUrl"],
                        discount_type=campaign_dict["discountType"],
                        discount_value=campaign_dict["discountValue"],
                        max_discount_amount=campaign_dict["maxDiscountAmount"],
                        min_order_amount=campaign_dict["minPurchase"],
                        target_scope=campaign_dict["targetScope"],
                        target_categories=json.dumps(cats),
                        target_products=json.dumps(prods),
                        priority=priority_val,
                        affiliate_commission_override=campaign_dict["affiliateBonusPercent"],
                        starts_at=parsed_s,
                        ends_at=parsed_e,
                        is_active=campaign_dict["isActive"],
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    db.add(db_row)
                    db.commit()
                finally:
                    db.close()
        except Exception as e:
            print(f"[CampaignService] DB insert note: {e}")

        # 2. Memory cache update
        if cls._campaigns is None:
            cls._campaigns = []
        cls._campaigns.insert(0, campaign_dict)
        cls.save_campaigns()

        return campaign_dict

    @classmethod
    def update_campaign(cls, campaign_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates an existing campaign in DB and cache."""
        items = cls.load_campaigns()
        target = next((c for c in items if c.get("id") == campaign_id), None)
        if not target:
            return None

        # Update allowed fields
        for field in [
            "name", "slug", "tagline", "bannerUrl", "discountType", "discountValue",
            "maxDiscountAmount", "minPurchase", "minOrderAmount", "targetScope",
            "targetCategories", "targetProducts", "priority", "affiliateBonusPercent",
            "affiliateCommissionOverride", "isActive"
        ]:
            if field in payload:
                target[field] = payload[field]

        if "startDate" in payload or "startsAt" in payload:
            s_val = payload.get("startsAt") or payload.get("startDate")
            parsed_s = parse_wib_datetime(s_val, is_end=False)
            target["startDate"] = parsed_s.strftime("%Y-%m-%d")
            target["startsAt"] = parsed_s.strftime("%Y-%m-%dT%H:%M:%S+07:00")

        if "endDate" in payload or "endsAt" in payload:
            e_val = payload.get("endsAt") or payload.get("endDate")
            parsed_e = parse_wib_datetime(e_val, is_end=True)
            target["endDate"] = parsed_e.strftime("%Y-%m-%d")
            target["endsAt"] = parsed_e.strftime("%Y-%m-%dT%H:%M:%S+07:00")

        target["updatedAt"] = datetime.utcnow().isoformat()

        # Update DB
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    db_row = db.query(PromoCampaign).filter(PromoCampaign.id == campaign_id).first()
                    if db_row:
                        if "name" in payload: db_row.name = payload["name"]
                        if "tagline" in payload: db_row.tagline = payload["tagline"]
                        if "bannerUrl" in payload: db_row.banner_url = payload["bannerUrl"]
                        if "discountType" in payload: db_row.discount_type = payload["discountType"]
                        if "discountValue" in payload: db_row.discount_value = float(payload["discountValue"])
                        if "maxDiscountAmount" in payload: db_row.max_discount_amount = float(payload["maxDiscountAmount"])
                        if "minPurchase" in payload: db_row.min_order_amount = float(payload["minPurchase"])
                        if "targetScope" in payload: db_row.target_scope = payload["targetScope"]
                        if "targetCategories" in payload: db_row.target_categories = json.dumps(payload["targetCategories"])
                        if "targetProducts" in payload: db_row.target_products = json.dumps(payload["targetProducts"])
                        if "priority" in payload: db_row.priority = int(payload["priority"])
                        if "affiliateBonusPercent" in payload: db_row.affiliate_commission_override = float(payload["affiliateBonusPercent"])
                        if "isActive" in payload: db_row.is_active = bool(payload["isActive"])
                        if "startDate" in payload or "startsAt" in payload:
                            db_row.starts_at = parse_wib_datetime(payload.get("startsAt") or payload.get("startDate"), is_end=False)
                        if "endDate" in payload or "endsAt" in payload:
                            db_row.ends_at = parse_wib_datetime(payload.get("endsAt") or payload.get("endDate"), is_end=True)
                        db_row.updated_at = datetime.utcnow()
                        db.commit()
                finally:
                    db.close()
        except Exception as e:
            print(f"[CampaignService] DB update note: {e}")

        cls.save_campaigns()
        return target

    @classmethod
    def toggle_active(cls, campaign_id: str, is_active: Optional[bool] = None) -> Optional[Dict[str, Any]]:
        """Quick toggle switch for enabling/disabling a campaign immediately (killswitch)."""
        items = cls.load_campaigns()
        target = next((c for c in items if c.get("id") == campaign_id), None)
        if not target:
            return None

        new_val = is_active if is_active is not None else not target.get("isActive", True)
        return cls.update_campaign(campaign_id, {"isActive": new_val})

    @classmethod
    def delete_campaign(cls, campaign_id: str) -> bool:
        """Deletes a campaign from DB and cache."""
        items = cls.load_campaigns()
        initial_len = len(items)
        cls._campaigns = [c for c in items if c.get("id") != campaign_id]

        if len(cls._campaigns) == initial_len:
            return False

        # DB Delete
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    db_row = db.query(PromoCampaign).filter(PromoCampaign.id == campaign_id).first()
                    if db_row:
                        db.delete(db_row)
                        db.commit()
                finally:
                    db.close()
        except Exception as e:
            print(f"[CampaignService] DB delete note: {e}")

        cls.save_campaigns()
        return True

    @classmethod
    def record_campaign_order(cls, campaign_id: str, order_amount: float) -> bool:
        """Increments campaign telemetry for orders and revenue."""
        items = cls.load_campaigns()
        target = next((c for c in items if c.get("id") == campaign_id), None)
        if not target:
            return False

        target["totalOrders"] = int(target.get("totalOrders", 0)) + 1
        target["revenue"] = float(target.get("revenue", 0.0)) + float(order_amount)

        # Update DB
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    db_row = db.query(PromoCampaign).filter(PromoCampaign.id == campaign_id).first()
                    if db_row:
                        db_row.total_orders_count = target["totalOrders"]
                        db_row.total_revenue_generated = target["revenue"]
                        db.commit()
                finally:
                    db.close()
        except Exception:
            pass

        cls.save_campaigns()
        return True

    @classmethod
    def get_campaign_by_slug_or_id(cls, identifier: str) -> Optional[Dict[str, Any]]:
        """Finds a campaign by exact id or slug."""
        if not identifier:
            return None
        clean_id = str(identifier).strip()
        clean_slug = clean_id.lower()
        for c in cls.get_all_campaigns():
            if str(c.get("id")) == clean_id or str(c.get("slug", "")).lower() == clean_slug:
                return c
        return None
