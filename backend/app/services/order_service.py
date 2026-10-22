import json
import pathlib
import random
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import joinedload
from app.core.database import SessionLocal
from app.models.order import Order, OrderItem

from app.services.order_normalizer import OrderNormalizer
from app.services.order_tasks import OrderPostTasks

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
ORDERS_FILE = DATA_DIR / "supabase-orders.json"
LEGACY_ORDERS_FILE = DATA_DIR / "orders.json"

class OrderService:
    _orders: Optional[List[Dict[str, Any]]] = None
    _last_loaded: Optional[datetime] = None

    @classmethod
    def _normalize_iso(cls, dt_str: Optional[str]) -> str:
        return OrderNormalizer.normalize_iso(dt_str)

    @classmethod
    def _normalize_order(cls, order: Dict[str, Any]) -> Dict[str, Any]:
        return OrderNormalizer.normalize_order(order)

    @classmethod
    def load_orders(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        Loads orders directly from Supabase PostgreSQL database.
        Falls back to local clean JSON files if Supabase is offline.
        """
        now = datetime.utcnow()
        if (
            cls._orders is not None
            and not force_reload
            and cls._last_loaded is not None
            and (now - cls._last_loaded).total_seconds() < 5
        ):
            return cls._orders

        # 1. Try querying Supabase PostgreSQL
        try:
            db = SessionLocal()
            try:
                db_orders = db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc()).all()
                if db_orders:
                    normalized = [cls._normalize_order(o.to_dict()) for o in db_orders]
                    cls._orders = normalized
                    cls._last_loaded = datetime.utcnow()
                    return normalized
            finally:
                db.close()
        except Exception as e:
            print(f"[OrderService] Warning: Supabase orders query failed, using local fallback: {e}")

        # 2. Priority 1 Fallback: Supabase orders JSON
        if ORDERS_FILE.exists():
            try:
                data = json.loads(ORDERS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list) and len(data) > 0:
                    cls._orders = [cls._normalize_order(o) for o in data]
                    return cls._orders
            except Exception as e:
                print(f"[OrderService] Error loading supabase-orders.json: {e}")

        # Priority 2 Fallback: Legacy orders file
        if LEGACY_ORDERS_FILE.exists():
            try:
                data = json.loads(LEGACY_ORDERS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list) and len(data) > 0:
                    cls._orders = [cls._normalize_order(o) for o in data]
                    return cls._orders
            except Exception as e:
                print(f"[OrderService] Error loading orders.json: {e}")

        cls._orders = []
        return []

    @classmethod
    def save_orders(cls) -> bool:
        """Saves current orders state to local backup cache."""
        try:
            if cls._orders is not None:
                ORDERS_FILE.parent.mkdir(parents=True, exist_ok=True)
                ORDERS_FILE.write_text(json.dumps(cls._orders, indent=2, ensure_ascii=False), encoding="utf-8")
                LEGACY_ORDERS_FILE.write_text(json.dumps(cls._orders, indent=2, ensure_ascii=False), encoding="utf-8")
                return True
        except Exception as e:
            print(f"[OrderService] Error saving backup orders: {e}")
        return False

    @classmethod
    def get_orders(
        cls,
        status: Optional[str] = None,
        search: Optional[str] = None,
        email: Optional[str] = None,
        period: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        all_orders = cls.load_orders()

        # Compute summary metrics across all orders
        total_revenue = 0
        pending_count = 0
        processing_count = 0
        completed_count = 0
        cancelled_count = 0

        for o in all_orders:
            st = str(o.get("status", "")).lower()
            amt = float(o.get("totalAmount", 0))

            if st in ["completed", "paid", "settlement"]:
                completed_count += 1
                total_revenue += amt
            elif st == "processing":
                processing_count += 1
                total_revenue += amt
            elif st == "pending":
                pending_count += 1
            elif st in ["cancelled", "expired"]:
                cancelled_count += 1

        filtered = all_orders

        # Status filter
        if status and status != "all":
            clean_status = status.lower().strip()
            filtered = [f for f in filtered if str(f.get("status", "")).lower() == clean_status]

        # Email filter
        if email and email.strip():
            clean_email = email.lower().strip()
            filtered = [
                f for f in filtered 
                if clean_email in str(f.get("customerEmail") or f.get("customer_email") or "").lower()
                or any(clean_email in str(it.get("targetEmail") or it.get("target_email") or "").lower() for it in f.get("items", []))
            ]

        # Search query filter
        if search and search.strip():
            q = search.lower().strip()
            filtered = [
                f for f in filtered
                if q in str(f.get("id", "")).lower()
                or q in str(f.get("customerEmail", "")).lower()
                or q in str(f.get("customerName", "")).lower()
                or q in str(f.get("customerWhatsapp", "")).lower()
                or q in str(f.get("referralCode", "")).lower()
                or any(
                    q in str(item.get("productName", "")).lower() or q in str(item.get("product_name", "")).lower()
                    for item in f.get("items", [])
                )
            ]

        # Date & Period filter based on Asia/Jakarta (WIB = UTC+7)
        WIB = timezone(timedelta(hours=7))
        start_dt_utc = None
        end_dt_utc = None

        if period == "this_week":
            now_wib = datetime.now(WIB)
            # Week starts on Monday 00:00:00 WIB and ends Sunday 23:59:59.999999 WIB
            start_wib = (now_wib - timedelta(days=now_wib.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
            end_wib = (start_wib + timedelta(days=6)).replace(hour=23, minute=59, second=59, microsecond=999999)
            start_dt_utc = start_wib.astimezone(timezone.utc).replace(tzinfo=None)
            end_dt_utc = end_wib.astimezone(timezone.utc).replace(tzinfo=None)
        elif period == "this_month":
            import calendar
            now_wib = datetime.now(WIB)
            start_wib = now_wib.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            _, last_day = calendar.monthrange(now_wib.year, now_wib.month)
            end_wib = now_wib.replace(day=last_day, hour=23, minute=59, second=59, microsecond=999999)
            start_dt_utc = start_wib.astimezone(timezone.utc).replace(tzinfo=None)
            end_dt_utc = end_wib.astimezone(timezone.utc).replace(tzinfo=None)

        if start_date:
            try:
                s_str = str(start_date).strip()
                if "T" in s_str:
                    s_dt = datetime.fromisoformat(s_str.replace("Z", "+00:00"))
                else:
                    s_dt = datetime.strptime(s_str, "%Y-%m-%d").replace(tzinfo=WIB)
                start_dt_utc = s_dt.astimezone(timezone.utc).replace(tzinfo=None)
            except Exception as e:
                print(f"[OrderService] Warning parsing start_date: {e}")

        if end_date:
            try:
                e_str = str(end_date).strip()
                if "T" in e_str:
                    e_dt = datetime.fromisoformat(e_str.replace("Z", "+00:00"))
                else:
                    e_dt = datetime.strptime(e_str, "%Y-%m-%d").replace(hour=23, minute=59, second=59, microsecond=999999, tzinfo=WIB)
                end_dt_utc = e_dt.astimezone(timezone.utc).replace(tzinfo=None)
            except Exception as e:
                print(f"[OrderService] Warning parsing end_date: {e}")

        def _get_order_dt(o: Dict[str, Any]) -> Optional[datetime]:
            raw_dt = o.get("created_at") or o.get("createdAt") or o.get("order_date")
            if not raw_dt:
                return None
            try:
                clean_s = str(raw_dt).replace("Z", "+00:00")
                parsed = datetime.fromisoformat(clean_s)
                return parsed.astimezone(timezone.utc).replace(tzinfo=None)
            except Exception:
                return None

        if start_dt_utc or end_dt_utc:
            filtered_by_date = []
            for o in filtered:
                odt = _get_order_dt(o)
                if not odt:
                    continue
                if start_dt_utc and odt < start_dt_utc:
                    continue
                if end_dt_utc and odt > end_dt_utc:
                    continue
                filtered_by_date.append(o)
            filtered = filtered_by_date

        # Guarantee sorting by creation time: newest first
        filtered.sort(key=lambda o: _get_order_dt(o) or datetime.min, reverse=True)

        # Pagination calculations (bounded to prevent negative page or abusive limit)
        page = max(1, int(page))
        limit = max(1, min(100, int(limit)))
        total = len(filtered)
        total_pages = max(1, (total + limit - 1) // limit)
        start_idx = (page - 1) * limit
        paginated = filtered[start_idx : start_idx + limit]

        return {
            "orders": paginated,
            "total": total,
            "page": page,
            "totalPages": total_pages,
            "limit": limit,
            "metrics": {
                "total": len(all_orders),
                "totalRevenue": total_revenue,
                "completed": completed_count,
                "pending": pending_count,
                "processing": processing_count,
                "cancelled": cancelled_count,
            },
        }

    @classmethod
    def get_order_by_id(cls, order_id: str) -> Optional[Dict[str, Any]]:
        # Query Supabase directly for instant accuracy
        clean_id = order_id.strip().upper()
        try:
            db = SessionLocal()
            try:
                order_obj = db.query(Order).options(joinedload(Order.items)).filter(Order.id == clean_id).first()
                if order_obj:
                    return order_obj.to_dict()
            finally:
                db.close()
        except Exception:
            pass

        orders = cls.load_orders()
        for o in orders:
            if str(o.get("id", "")).upper() == clean_id:
                return o
        return None

    @classmethod
    def create_order(cls, payload: Dict[str, Any], background_tasks: Any = None) -> Dict[str, Any]:
        now = datetime.utcnow()
        today_str = now.strftime("%Y%m%d")
        rand_code = random.randint(1000, 9999)
        order_id = f"AST-ORD-{today_str}-{rand_code}"

        items = payload.get("items", [])
        
        # Load catalog products to ensure valid base pricing and prevent tampering
        from app.services.catalog_service import CatalogService
        catalog_products = {str(p.get("id")): p for p in CatalogService.load_products()}
        
        verified_raw_total = 0
        for item in items:
            p_id = str(item.get("product_id") or item.get("productId") or "")
            cat_prod = catalog_products.get(p_id)
            catalog_price = int(cat_prod.get("price")) if (cat_prod and cat_prod.get("price") is not None) else int(item.get("unit_price") or item.get("price") or 0)
            item["unit_price"] = catalog_price
            item["price"] = catalog_price
            qty = max(1, int(item.get("quantity", 1)))
            item["quantity"] = qty
            verified_raw_total += catalog_price * qty
        
        raw_total = verified_raw_total

        contact = payload.get("customer_contact", {})
        customer_email = (contact.get("email") or payload.get("customerEmail") or "buyer@asterra.store").strip()
        customer_phone = (contact.get("phone") or payload.get("customerWhatsapp") or "081234567890").strip()
        customer_name = (contact.get("name") or payload.get("customerName") or "Pelanggan Asterra").strip()

        # 1. Payment config settings (unique code toggle & order expiry)
        from app.services.payment_config_service import PaymentConfigService
        pay_cfg = PaymentConfigService.get_config()
        enable_unique = pay_cfg.get("enable_unique_code")
        if enable_unique is None:
            enable_unique = pay_cfg.get("enableUniqueCode", True)
        enable_unique = bool(enable_unique)
        unique_code = random.randint(100, 999) if enable_unique else 0
        expiry_hours = int(pay_cfg.get("order_expiry_hours") or pay_cfg.get("orderExpiryHours") or 24)

        # 2. Authoritative Campaign Re-Validation on Server (Time-window & Eligibility check)
        from app.services.campaign_service import CampaignService
        active_camps = CampaignService.get_active_campaigns()
        
        server_campaign_discount = 0
        canonical_campaign_id = None
        matched_campaign = None

        if active_camps and raw_total > 0:
            item_discounts = []
            matched_camp_map = {}
            for item in items:
                p_id = str(item.get("product_id") or item.get("productId") or "")
                cat_prod = catalog_products.get(p_id) or {}
                cat_name = cat_prod.get("categoryName") or (cat_prod.get("category", {}).get("name") if isinstance(cat_prod.get("category"), dict) else str(cat_prod.get("category") or ""))
                p_slug = cat_prod.get("slug")
                unit_p = int(item.get("unit_price") or 0)
                qty = int(item.get("quantity", 1))

                eval_res = CampaignService.evaluate_product_campaign(
                    product_id=p_id,
                    category_name=cat_name,
                    original_price=unit_p,
                    product_slug=p_slug,
                )
                if eval_res and eval_res.get("discountAmount", 0) > 0:
                    d_amt = int(eval_res["discountAmount"]) * qty
                    c_id = eval_res["campaignId"]
                    item_discounts.append((c_id, d_amt))
                    if c_id not in matched_camp_map:
                        matched_camp_map[c_id] = next((c for c in active_camps if c.get("id") == c_id), None)

            if item_discounts:
                top_camp_id = item_discounts[0][0]
                primary_camp = matched_camp_map.get(top_camp_id)
                canonical_campaign_id = top_camp_id
                matched_campaign = primary_camp

                tot_c_disc = sum(d for _, d in item_discounts)
                max_d = float(primary_camp.get("maxDiscountAmount") or 0) if primary_camp else 0
                if max_d > 0 and tot_c_disc > max_d:
                    tot_c_disc = int(max_d)

                server_campaign_discount = tot_c_disc

        # Resolve campaign reference from incoming checkout payload (e.g. from campaign promo link)
        incoming_camp = (
            payload.get("campaign_id")
            or payload.get("campaignId")
            or payload.get("campaign_slug")
            or payload.get("campaignSlug")
            or payload.get("utm_campaign")
            or payload.get("campaign")
            or ""
        ).strip()

        if not canonical_campaign_id and incoming_camp:
            for c in active_camps:
                c_id_str = str(c.get("id") or "").strip()
                c_slug_str = str(c.get("slug") or "").strip().lower()
                if c_id_str == incoming_camp or c_slug_str == incoming_camp.lower():
                    canonical_campaign_id = c.get("id")
                    matched_campaign = c
                    break
            if not canonical_campaign_id:
                canonical_campaign_id = incoming_camp

        campaign_discount = server_campaign_discount

        # 3. Voucher Promo Code Validation
        promo_discount = 0
        promo_code = (payload.get("promo_code") or payload.get("promoCode") or "").strip().upper()
        if promo_code:
            try:
                from app.services.promo_service import PromoService
                val_res = PromoService.validate_promo(promo_code, raw_total)
                if val_res.get("valid"):
                    promo_discount = int(val_res.get("discountAmount", 0))
            except Exception as e:
                print(f"[OrderService] Promo voucher validate note: {e}")

        # 4. Lifetime 1-Time Referral Discount Eligibility Enforcement
        ref_code = (payload.get("referral_code") or payload.get("referralCode") or "").strip().upper()
        ref_sess_id = (
            payload.get("referral_session_id")
            or payload.get("referralSessionId")
            or payload.get("sessionId")
            or ""
        ).strip() or None
        referral_discount = int(payload.get("referral_discount") or payload.get("referralDiscount") or 0)
        if referral_discount > 0:
            import re
            clean_email = customer_email.lower().strip()
            clean_phone = re.sub(r"\D", "", customer_phone)
            already_claimed = False
            if cls._orders is not None:
                already_claimed = any(
                    (str(o.get("customerEmail", "")).lower().strip() == clean_email or
                     (clean_phone and re.sub(r"\D", "", str(o.get("customerWhatsapp", ""))) == clean_phone))
                    and (float(o.get("referralDiscount") or o.get("referral_discount") or 0) > 0)
                    for o in cls._orders
                )
            else:
                try:
                    db_check = SessionLocal()
                    try:
                        from sqlalchemy import or_
                        clauses = []
                        if clean_email:
                            clauses.append(Order.customer_email.ilike(clean_email))
                        if clean_phone and len(clean_phone) >= 8:
                            clauses.append(Order.customer_whatsapp.like(f"%{clean_phone[-8:]}%"))
                        if clauses:
                            match_rec = db_check.query(Order.id).filter(
                                or_(*clauses),
                                Order.referral_discount > 0
                            ).first()
                            already_claimed = match_rec is not None
                    finally:
                        db_check.close()
                except Exception:
                    already_claimed = False

            if already_claimed:
                referral_discount = 0

        # Calculate final payable amount (unique code is included only if enable_unique is True)
        subtotal_after_discounts = max(0, raw_total - promo_discount - referral_discount - campaign_discount)
        total_amount = subtotal_after_discounts + (unique_code if enable_unique else 0)

        # 3. Sales Partner Attribution & Recruiter Network
        # Recover ref_code from active referral_session_id or customer_notes if not directly passed
        if not ref_code and ref_sess_id:
            try:
                from app.models.referral_session import ReferralSession
                db_sess = SessionLocal()
                try:
                    sess = db_sess.query(ReferralSession).filter(ReferralSession.id == ref_sess_id).first()
                    if sess and sess.ref_code:
                        ref_code = sess.ref_code.strip().upper()
                finally:
                    db_sess.close()
            except Exception as e:
                print(f"[OrderService] Note recovering ref_code from session: {e}")

        if not ref_code:
            notes_str = str(payload.get("customer_notes") or payload.get("customerNotes") or "")
            if "[SALES REF:" in notes_str:
                import re
                m = re.search(r"\[SALES REF:\s*([^\]]+)\]", notes_str)
                if m:
                    ref_code = m.group(1).strip().upper()

        sales_partner_id = None
        recruiter_partner_id = None
        partner = None
        if ref_code:
            try:
                from app.services.partner_service import PartnerService
                partner = PartnerService.find_by_code(ref_code)
                if partner:
                    sales_partner_id = partner.get("id")
                    recruiter_partner_id = partner.get("referredById")
            except Exception as e:
                print(f"[OrderService] Partner lookup error: {e}")

        # 4. Save directly into Supabase PostgreSQL
        try:
            db = SessionLocal()
            try:
                order_record = Order(
                    id=order_id,
                    customer_email=customer_email,
                    customer_whatsapp=customer_phone,
                    customer_name=customer_name,
                    customer_notes=payload.get("customer_notes") or payload.get("customerNotes") or "",
                    total_amount=total_amount,
                    raw_amount=raw_total,
                    promo_discount=promo_discount,
                    referral_discount=referral_discount,
                    campaign_id=canonical_campaign_id or None,
                    campaign_discount=campaign_discount,
                    unique_code=unique_code,
                    payment_mode=payload.get("payment_mode") or payload.get("paymentMode") or "manual",
                    payment_method=payload.get("payment_method") or payload.get("paymentMethod") or "manual_bca",
                    payment_reference=None,
                    payment_status="pending",
                    status="pending",
                    created_at=now,
                    updated_at=now,
                    expires_at=now + timedelta(hours=expiry_hours),
                    referral_code=ref_code or None,
                    referral_session_id=ref_sess_id,
                    sales_partner_id=sales_partner_id,
                    recruiter_partner_id=recruiter_partner_id,
                )
                db.add(order_record)

                for item in items:
                    item_id = f"item-{random.randint(10000, 99999)}"
                    raw_target_id = str(
                        item.get("target_id")
                        or item.get("targetId")
                        or item.get("target_no")
                        or item.get("targetNo")
                        or payload.get("target_id")
                        or payload.get("targetId")
                        or payload.get("target_no")
                        or payload.get("targetNo")
                        or ""
                    ).strip()
                    raw_target_zone = str(
                        item.get("target_zone")
                        or item.get("targetZone")
                        or payload.get("target_zone")
                        or payload.get("targetZone")
                        or ""
                    ).strip()
                    raw_target_email = str(
                        item.get("target_email")
                        or item.get("targetEmail")
                        or (raw_target_id if "@" in raw_target_id else "")
                        or customer_email
                    ).strip()
                    raw_target_phone = str(
                        item.get("target_phone")
                        or item.get("targetPhone")
                        or (raw_target_id if ("@" not in raw_target_id and raw_target_id) else "")
                        or customer_phone
                    ).strip()

                    order_item_rec = OrderItem(
                        id=item_id,
                        order_id=order_id,
                        product_id=item.get("product_id") or item.get("productId") or "vip-service",
                        product_name=item.get("product_name") or item.get("productName") or "Layanan Digital",
                        price=int(item.get("unit_price") or item.get("price") or 0),
                        quantity=int(item.get("quantity", 1)),
                        target_email=raw_target_email,
                        target_phone=raw_target_phone,
                        target_id=raw_target_id or None,
                        target_zone=raw_target_zone or None,
                    )
                    db.add(order_item_rec)

                db.commit()
                db.refresh(order_record)
                normalized = cls._normalize_order(order_record.to_dict())
            finally:
                db.close()
        except Exception as e:
            print(f"[OrderService] Error saving order to Supabase: {e}")
            raise e

        # 5. Instantly update in-memory cache (Append-only, 0ms, zero DB query)
        if cls._orders is not None:
            cls._orders.insert(0, normalized)
        else:
            cls._orders = [normalized]

        def _execute_post_order_tasks():
            OrderPostTasks.execute(
                order_id=order_id,
                customer_name=customer_name,
                customer_email=customer_email,
                total_amount=total_amount,
                subtotal_after_discounts=subtotal_after_discounts,
                items=items,
                ref_code=ref_code,
                ref_sess_id=ref_sess_id,
                promo_code=promo_code,
                promo_discount=promo_discount,
                partner=partner,
                matched_campaign=matched_campaign,
                canonical_campaign_id=canonical_campaign_id,
                campaign_discount=campaign_discount,
                catalog_products=catalog_products,
                now=now,
                save_orders_func=cls.save_orders,
            )

        if background_tasks is not None:
            background_tasks.add_task(_execute_post_order_tasks)
        else:
            _execute_post_order_tasks()

        return normalized

    @classmethod
    def update_status(cls, order_id: str, new_status: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        clean_id = order_id.strip().upper()
        now_dt = datetime.utcnow()
        normalized = None
        prev_st = "pending"
        order_cust_name = None
        order_cust_email = None

        # 1. Update in Supabase
        try:
            db = SessionLocal()
            try:
                order_obj = db.query(Order).options(joinedload(Order.items)).filter(Order.id == clean_id).first()
                if order_obj:
                    prev_st = order_obj.status or "pending"
                    order_cust_name = order_obj.customer_name
                    order_cust_email = order_obj.customer_email
                    order_obj.status = new_status
                    order_obj.updated_at = now_dt
                    if new_status in ["completed", "paid", "settlement"]:
                        order_obj.paid_at = now_dt
                        order_obj.payment_status = "settlement"
                    elif new_status in ["cancelled", "expired"]:
                        order_obj.payment_status = "cancelled"
                    if notes:
                        curr_notes = order_obj.customer_notes or ""
                        # Only append if not an automated admin status change log
                        if not notes.lower().startswith("status pesanan diubah"):
                            order_obj.customer_notes = f"{curr_notes} | Admin: {notes}".strip(" | ")

                    db.commit()
                    db.refresh(order_obj)
                    normalized = cls._normalize_order(order_obj.to_dict())
            finally:
                db.close()
        except Exception as e:
            print(f"[OrderService] Error updating order status in Supabase: {e}")

        # 2. Trigger automated VIP Reseller fulfillment if status transitioned to processing or paid
        if new_status in ["processing", "paid"] and normalized:
            try:
                from app.services.vip_service import VipService
                vip_res = VipService.fulfill_order_if_vip(clean_id)
                if vip_res.get("success") and vip_res.get("order"):
                    normalized = cls._normalize_order(vip_res["order"])
            except Exception as e:
                print(f"[OrderService] VIP fulfillment trigger error: {e}")

        # 3. Sync in-memory cache directly (zero full DB query)
        if cls._orders is not None and normalized:
            for idx, o in enumerate(cls._orders):
                if str(o.get("id", "")).upper() == clean_id:
                    cls._orders[idx] = normalized
                    break
        cls.save_orders()

        # 3. Synchronize Partner Commissions & Profit Ledger Status in PostgreSQL DB
        try:
            from app.services.referral_profit_service import ReferralProfitService
            ReferralProfitService.sync_order_commissions_and_ledger(clean_id, new_status)
        except Exception as e:
            print(f"[OrderService] Referral profit ledger sync error on status update: {e}")

        try:
            from app.services.partner_service import PartnerService
            partners = PartnerService.load_partners()
            has_partner_changes = False
            for p in partners:
                for comm in p.get("commissions", []):
                    if str(comm.get("orderId", "")).upper() == clean_id:
                        if new_status in ["completed", "paid", "settlement"]:
                            comm["status"] = "final"
                            has_partner_changes = True
                        elif new_status in ["cancelled", "expired"]:
                            comm["status"] = "reversed"
                            has_partner_changes = True
            if has_partner_changes:
                PartnerService.save_partners()
        except Exception as e:
            print(f"[OrderService] Partner commission update note: {e}")

        # 4. Record Real Persistent Audit Log
        try:
            from app.services.audit_log_service import AuditLogService
            action_name = (
                "payment_received"
                if new_status in ["completed", "paid", "settlement"]
                else ("cancelled" if new_status in ["cancelled", "expired"] else "status_updated")
            )
            AuditLogService.record_log(
                order_id=clean_id,
                actor="admin",
                action=action_name,
                previous_status=prev_st,
                new_status=new_status,
                notes=f"Status pesanan {clean_id} diubah ke '{new_status}'. {notes or ''}".strip(),
                customer_name=order_cust_name,
                customer_email=order_cust_email,
            )
        except Exception as e:
            print(f"[OrderService] Status audit log note: {e}")

        # 5. Dispatch Customer Automated Email Notifications (Completed with Credentials, or Cancelled)
        if normalized and (prev_st != normalized.get("status") or prev_st != new_status):
            current_final_status = (normalized.get("status") or new_status).lower()
            try:
                from app.services.email_service import EmailService
                if current_final_status in ["completed", "selesai"]:
                    EmailService.send_order_completed_email(normalized)
                elif current_final_status in ["cancelled", "batal", "expired"]:
                    EmailService.send_order_cancelled_email(normalized, reason=notes)
            except Exception as email_err:
                print(f"[OrderService] Customer email notification dispatch note: {email_err}")

        return normalized

    @classmethod
    def cancel_expired_orders(cls) -> Dict[str, Any]:
        """
        Scans for pending orders whose expires_at timestamp is in the past,
        and transitions them to 'cancelled' status. (Invoked via QStash Cron)
        """
        now = datetime.utcnow()
        cancelled_ids = []

        try:
            db = SessionLocal()
            try:
                expired_records = db.query(Order).filter(
                    Order.status == "pending",
                    Order.expires_at != None,
                    Order.expires_at < now,
                ).all()

                for rec in expired_records:
                    cancelled_ids.append(rec.id)
            finally:
                db.close()
        except Exception as e:
            print(f"[OrderService] DB scan expired orders error: {e}")

        # Update in-memory cache and record audit log for each cancelled order
        for oid in cancelled_ids:
            try:
                cls.update_status(
                    oid,
                    "cancelled",
                    notes="Dibatalkan otomatis karena batas waktu pembayaran habis (QStash Cron)"
                )
            except Exception as err:
                print(f"[OrderService] Error updating expired order {oid}: {err}")

        return {
            "success": True,
            "cancelled_count": len(cancelled_ids),
            "cancelled_ids": cancelled_ids,
            "timestamp": now.isoformat(),
        }

