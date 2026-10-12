import json
import pathlib
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import joinedload
from app.core.database import SessionLocal
from app.models.order import Order, OrderItem

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
ORDERS_FILE = DATA_DIR / "supabase-orders.json"
LEGACY_ORDERS_FILE = DATA_DIR / "orders.json"

class OrderService:
    _orders: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def _normalize_iso(cls, dt_str: Optional[str]) -> str:
        if not dt_str:
            return datetime.utcnow().isoformat() + "Z"
        s = str(dt_str).strip()
        if not s.endswith("Z") and "+" not in s:
            return s + "Z"
        return s

    @classmethod
    def _normalize_order(cls, order: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(order, dict):
            return order

        o = dict(order)

        # Amounts
        tot = o.get("total_amount") if o.get("total_amount") is not None else o.get("totalAmount", 0)
        tot_val = float(tot) if tot is not None else 0.0
        raw = o.get("raw_amount") if o.get("raw_amount") is not None else o.get("rawAmount", tot_val)
        raw_val = float(raw) if raw is not None else tot_val
        unique = o.get("unique_code") if o.get("unique_code") is not None else o.get("uniqueCode", 0)
        unique_val = int(unique) if unique is not None else 0

        o["totalAmount"] = tot_val
        o["total_amount"] = tot_val
        o["amount"] = tot_val
        o["rawAmount"] = raw_val
        o["raw_amount"] = raw_val
        o["uniqueCode"] = unique_val
        o["unique_code"] = unique_val

        # Campaign & Promo & Referral discounts
        promo_disc = int(o.get("promo_discount") if o.get("promo_discount") is not None else o.get("promoDiscount", 0))
        ref_disc = int(o.get("referral_discount") if o.get("referral_discount") is not None else o.get("referralDiscount", 0))
        camp_disc = int(o.get("campaign_discount") if o.get("campaign_discount") is not None else o.get("campaignDiscount", 0))

        o["promoDiscount"] = promo_disc
        o["promo_discount"] = promo_disc
        o["referralDiscount"] = ref_disc
        o["referral_discount"] = ref_disc
        o["campaignDiscount"] = camp_disc
        o["campaign_discount"] = camp_disc
        o["discountAmount"] = promo_disc + ref_disc + camp_disc
        o["discount_amount"] = promo_disc + ref_disc + camp_disc

        # Campaign and Referral attribution
        camp_id = o.get("campaign_id") or o.get("campaignId")
        o["campaignId"] = camp_id
        o["campaign_id"] = camp_id

        ref_code = o.get("referral_code") or o.get("referralCode")
        o["referralCode"] = ref_code
        o["referral_code"] = ref_code

        sales_p_id = o.get("sales_partner_id") or o.get("salesPartnerId")
        o["salesPartnerId"] = sales_p_id
        o["sales_partner_id"] = sales_p_id

        recruiter_p_id = o.get("recruiter_partner_id") or o.get("recruiterPartnerId")
        o["recruiterPartnerId"] = recruiter_p_id
        o["recruiter_partner_id"] = recruiter_p_id

        # Status & Dates (guaranteed UTC Z)
        status = str(o.get("status") or o.get("order_status") or "pending").lower()
        o["status"] = status
        o["order_status"] = status

        created = cls._normalize_iso(o.get("createdAt") or o.get("created_at") or o.get("order_date"))
        o["createdAt"] = created
        o["created_at"] = created
        o["order_date"] = created

        updated = cls._normalize_iso(o.get("updatedAt") or o.get("updated_at") or created)
        o["updatedAt"] = updated
        o["updated_at"] = updated

        expires_val = o.get("expiresAt") or o.get("expires_at")
        if not expires_val:
            try:
                dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                expires = cls._normalize_iso((dt + timedelta(hours=24)).isoformat())
            except Exception:
                expires = cls._normalize_iso((datetime.utcnow() + timedelta(hours=24)).isoformat())
        else:
            expires = cls._normalize_iso(expires_val)
        o["expiresAt"] = expires
        o["expires_at"] = expires

        if o.get("paidAt") or o.get("paid_at"):
            paid_val = cls._normalize_iso(o.get("paidAt") or o.get("paid_at"))
            o["paidAt"] = paid_val
            o["paid_at"] = paid_val

        # Contact info
        cust_email = o.get("customerEmail") or o.get("customer_email") or ""
        cust_name = o.get("customerName") or o.get("customer_name") or ""
        cust_phone = o.get("customerWhatsapp") or o.get("customer_whatsapp") or ""
        cust_notes = o.get("customerNotes") or o.get("customer_notes") or ""

        o["customerEmail"] = cust_email
        o["customer_email"] = cust_email
        o["customerName"] = cust_name
        o["customer_name"] = cust_name
        o["customerWhatsapp"] = cust_phone
        o["customer_whatsapp"] = cust_phone
        o["customerNotes"] = cust_notes
        o["customer_notes"] = cust_notes

        # Public Display Attributes
        if cust_name and len(cust_name) > 2:
            o["customer_display"] = f"{cust_name[0]}***{cust_name[-1]}"
        elif cust_email and "@" in cust_email:
            parts = cust_email.split("@")
            o["customer_display"] = f"{parts[0][:2]}***@{parts[1]}"
        else:
            o["customer_display"] = "Pelanggan Terverifikasi"

        o["raw_id"] = o.get("id", "")

        # Payment details
        pay_mode = o.get("paymentMode") or o.get("payment_mode") or "manual"
        pay_method = o.get("paymentMethod") or o.get("payment_method") or "manual_bca"
        pay_status = o.get("paymentStatus") or o.get("payment_status") or "pending"

        o["paymentMode"] = pay_mode
        o["payment_mode"] = pay_mode
        o["paymentMethod"] = pay_method
        o["payment_method"] = pay_method
        o["paymentStatus"] = pay_status
        o["payment_status"] = pay_status

        if not o.get("payment") or not isinstance(o.get("payment"), dict):
            o["payment"] = {
                "id": f"PAY-{o.get('id', '')}",
                "payment_method": pay_method,
                "transaction_id": o.get("paymentReference") or f"TRX-{o.get('id', '')}",
                "payment_status": pay_status,
                "amount": tot_val,
            }

        # Normalize items
        items = o.get("items", [])
        norm_items = []
        for it in items:
            it_dict = dict(it) if isinstance(it, dict) else {}
            p_id = it_dict.get("productId") or it_dict.get("product_id") or "item"
            p_name = it_dict.get("productName") or it_dict.get("product_name") or "Layanan Digital"
            price = it_dict.get("price") if it_dict.get("price") is not None else it_dict.get("unit_price", 0)
            price_val = float(price) if price is not None else 0.0
            qty = int(it_dict.get("quantity", 1))

            it_dict["productId"] = p_id
            it_dict["product_id"] = p_id
            it_dict["productName"] = p_name
            it_dict["product_name"] = p_name
            it_dict["price"] = price_val
            it_dict["unit_price"] = price_val
            it_dict["quantity"] = qty

            norm_items.append(it_dict)

        o["items"] = norm_items
        o["items_count"] = len(norm_items)
        first_prod = norm_items[0]["productName"] if len(norm_items) > 0 else "Layanan Digital"
        o["product_name"] = first_prod
        o["productName"] = first_prod
        o["items_summary"] = ", ".join(i.get("productName", "") for i in norm_items) or first_prod

        return o

    @classmethod
    def load_orders(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        Loads orders directly from Supabase PostgreSQL database.
        Falls back to local clean JSON files if Supabase is offline.
        """
        if cls._orders is not None and not force_reload:
            return cls._orders

        # 1. Try querying Supabase PostgreSQL
        try:
            db = SessionLocal()
            try:
                db_orders = db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc()).all()
                if db_orders:
                    normalized = [cls._normalize_order(o.to_dict()) for o in db_orders]
                    cls._orders = normalized
                    cls.save_orders()
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

        if status and status != "all":
            clean_status = status.lower().strip()
            filtered = [f for f in filtered if str(f.get("status", "")).lower() == clean_status]

        if email and email.strip():
            clean_email = email.lower().strip()
            filtered = [f for f in filtered if clean_email in str(f.get("customerEmail", "")).lower()]

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
                    return cls._normalize_order(order_obj.to_dict())
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
    def create_order(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.utcnow()
        today_str = now.strftime("%Y%m%d")
        rand_code = random.randint(1000, 9999)
        order_id = f"AST-ORD-{today_str}-{rand_code}"

        items = payload.get("items", [])
        raw_total = sum(
            int(item.get("unit_price") or item.get("price") or 0) * int(item.get("quantity", 1))
            for item in items
        )

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

        promo_discount = int(payload.get("promo_discount") or payload.get("promoDiscount") or 0)
        referral_discount = int(payload.get("referral_discount") or payload.get("referralDiscount") or 0)
        campaign_discount = int(payload.get("campaign_discount") or payload.get("campaignDiscount") or 0)
        
        raw_camp = (
            payload.get("campaign_id") or
            payload.get("campaignId") or
            payload.get("campaign_slug") or
            payload.get("campaignSlug") or
            payload.get("campaign") or
            payload.get("utm_campaign")
        )
        campaign_id = str(raw_camp).strip() if raw_camp else None
        matched_campaign = None
        canonical_campaign_id = campaign_id
        if campaign_id:
            try:
                from app.services.campaign_service import CampaignService
                all_camps = CampaignService.get_all_campaigns()
                for c in all_camps:
                    c_id = str(c.get("id") or "").strip()
                    c_slug = str(c.get("slug") or "").strip().lower()
                    if c_id == campaign_id or c_slug == campaign_id.lower():
                        matched_campaign = c
                        canonical_campaign_id = c_id
                        break
            except Exception as e:
                print(f"[OrderService] Campaign lookup note: {e}")

        ref_code = (payload.get("referral_code") or payload.get("referralCode") or "").strip().upper()

        # 2. Lifetime 1-Time Referral Discount Eligibility Enforcement
        if referral_discount > 0:
            import re
            clean_email = customer_email.lower().strip()
            clean_phone = re.sub(r"\D", "", customer_phone)
            all_past_orders = cls.load_orders()
            already_claimed = any(
                (str(o.get("customerEmail", "")).lower().strip() == clean_email or
                 (clean_phone and re.sub(r"\D", "", str(o.get("customerWhatsapp", ""))) == clean_phone))
                and (float(o.get("referralDiscount") or o.get("referral_discount") or 0) > 0)
                for o in all_past_orders
            )
            if already_claimed:
                referral_discount = 0

        # Calculate final payable amount (unique code is included only if enable_unique is True)
        subtotal_after_discounts = max(0, raw_total - promo_discount - referral_discount - campaign_discount)
        total_amount = subtotal_after_discounts + (unique_code if enable_unique else 0)

        # 3. Sales Partner Attribution & Recruiter Network
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
                    campaign_id=canonical_campaign_id or campaign_id,
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
                    sales_partner_id=sales_partner_id,
                    recruiter_partner_id=recruiter_partner_id,
                )
                db.add(order_record)

                for item in items:
                    item_id = f"item-{random.randint(10000, 99999)}"
                    order_item_rec = OrderItem(
                        id=item_id,
                        order_id=order_id,
                        product_id=item.get("product_id") or item.get("productId") or "vip-service",
                        product_name=item.get("product_name") or item.get("productName") or "Layanan Digital",
                        price=int(item.get("unit_price") or item.get("price") or 0),
                        quantity=int(item.get("quantity", 1)),
                        target_email=customer_email,
                        target_phone=customer_phone,
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

        # 5. Reload and sync cache
        cls.load_orders(force_reload=True)

        # 6. Allocate Waterfall Commission to Sales Partner
        if partner:
            try:
                from app.services.partner_service import PartnerService
                comm_rate = float(partner.get("rate", 10.0))
                camp_name = None
                target_camp_id = canonical_campaign_id or campaign_id

                if matched_campaign:
                    override = float(matched_campaign.get("affiliateBonusPercent") or matched_campaign.get("affiliateCommissionOverride") or 0)
                    if override > 0:
                        comm_rate = override
                    camp_name = matched_campaign.get("name")
                elif target_camp_id:
                    try:
                        from app.services.campaign_service import CampaignService
                        for c in CampaignService.get_all_campaigns():
                            c_id = str(c.get("id") or "").strip()
                            c_slug = str(c.get("slug") or "").strip().lower()
                            if c_id == str(target_camp_id) or c_slug == str(target_camp_id).lower():
                                override = float(c.get("affiliateBonusPercent") or c.get("affiliateCommissionOverride") or 0)
                                if override > 0:
                                    comm_rate = override
                                camp_name = c.get("name")
                                break
                    except Exception:
                        pass
                elif campaign_discount > 0:
                    comm_rate = 15.0
                    camp_name = "Promo Campaign Spesial"

                comm_amount = round(total_amount * (comm_rate / 100.0))
                comm_item = {
                    "id": f"comm-{int(now.timestamp() * 1000)}-{random.randint(100, 999)}",
                    "orderId": order_id,
                    "orderTotal": total_amount,
                    "commissionAmount": comm_amount,
                    "commissionRate": comm_rate,
                    "campaignId": target_camp_id,
                    "campaignName": camp_name,
                    "status": "pending",
                    "holdingUntil": (now + timedelta(days=3)).isoformat() + "Z",
                    "createdAt": now.isoformat() + "Z",
                }
                if "commissions" not in partner:
                    partner["commissions"] = []
                partner["commissions"].insert(0, comm_item)
                PartnerService.save_partners()
            except Exception as e:
                print(f"[OrderService] Commission allocation error: {e}")

        # 7. Telemetry tracking for campaign
        target_camp_id = canonical_campaign_id or campaign_id
        if target_camp_id:
            try:
                from app.services.campaign_service import CampaignService
                CampaignService.record_campaign_order(str(target_camp_id), float(total_amount))
            except Exception:
                pass
        # 8. Record Real Persistent Audit Log
        try:
            from app.services.audit_log_service import AuditLogService
            AuditLogService.record_log(
                order_id=order_id,
                actor="customer",
                action="order_created",
                previous_status=None,
                new_status="pending",
                notes=f"Pesanan {order_id} dibuat oleh {customer_name} ({customer_email}) dengan total Rp {total_amount:,.0f}".replace(",", "."),
                customer_name=customer_name,
                customer_email=customer_email,
            )
        except Exception as e:
            print(f"[OrderService] Audit log error: {e}")

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
                        order_obj.customer_notes = f"{curr_notes} | Admin: {notes}".strip(" | ")

                    db.commit()
                    db.refresh(order_obj)
                    normalized = cls._normalize_order(order_obj.to_dict())
            finally:
                db.close()
        except Exception as e:
            print(f"[OrderService] Error updating order status in Supabase: {e}")

        # 2. Reload and sync cache
        cls.load_orders(force_reload=True)

        # 3. Synchronize Partner Commissions Status
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

        return normalized
