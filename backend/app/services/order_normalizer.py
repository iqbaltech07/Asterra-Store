from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class OrderNormalizer:
    @staticmethod
    def normalize_iso(dt_str: Optional[str]) -> str:
        if not dt_str:
            return datetime.utcnow().isoformat() + "Z"
        s = str(dt_str).strip()
        if not s.endswith("Z") and "+" not in s:
            return s + "Z"
        return s

    @classmethod
    def normalize_order(cls, order: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(order, dict):
            return order

        o = dict(order)

        # Preserve is_dummy flag
        is_dummy_val = bool(o.get("is_dummy") or o.get("isDummy") or False)
        o["is_dummy"] = is_dummy_val
        o["isDummy"] = is_dummy_val

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

        ref_sess_id = o.get("referral_session_id") or o.get("referralSessionId")
        o["referralSessionId"] = ref_sess_id
        o["referral_session_id"] = ref_sess_id

        sales_p_id = o.get("sales_partner_id") or o.get("salesPartnerId")
        o["salesPartnerId"] = sales_p_id
        o["sales_partner_id"] = sales_p_id

        recruiter_p_id = o.get("recruiter_partner_id") or o.get("recruiterPartnerId")
        o["recruiterPartnerId"] = recruiter_p_id
        o["recruiter_partner_id"] = recruiter_p_id

        # Provider (VIP Reseller integration)
        provider = o.get("provider")
        provider_trxid = o.get("provider_trxid") or o.get("providerTrxId")
        provider_status = o.get("provider_status") or o.get("providerStatus")
        provider_note = o.get("provider_note") or o.get("providerNote")

        o["provider"] = provider
        o["providerTrxId"] = provider_trxid
        o["provider_trxid"] = provider_trxid
        o["providerStatus"] = provider_status
        o["provider_status"] = provider_status
        o["providerNote"] = provider_note
        o["provider_note"] = provider_note

        # Status & Dates (guaranteed UTC Z)
        status = str(o.get("status") or o.get("order_status") or "pending").lower()
        o["status"] = status
        o["order_status"] = status

        created = cls.normalize_iso(o.get("createdAt") or o.get("created_at") or o.get("order_date"))
        o["createdAt"] = created
        o["created_at"] = created
        o["order_date"] = created

        updated = cls.normalize_iso(o.get("updatedAt") or o.get("updated_at") or created)
        o["updatedAt"] = updated
        o["updated_at"] = updated

        expires_val = o.get("expiresAt") or o.get("expires_at")
        if not expires_val:
            try:
                dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                expires = cls.normalize_iso((dt + timedelta(hours=24)).isoformat())
            except Exception:
                expires = cls.normalize_iso((datetime.utcnow() + timedelta(hours=24)).isoformat())
        else:
            expires = cls.normalize_iso(expires_val)
        o["expiresAt"] = expires
        o["expires_at"] = expires

        if o.get("paidAt") or o.get("paid_at"):
            paid_val = cls.normalize_iso(o.get("paidAt") or o.get("paid_at"))
            o["paidAt"] = paid_val
            o["paid_at"] = paid_val

        # Contact info
        cust_email = o.get("customerEmail") or o.get("customer_email") or ""
        cust_name = o.get("customerName") or o.get("customer_name") or ""
        cust_phone = o.get("customerWhatsapp") or o.get("customer_whatsapp") or ""
        cust_notes = o.get("customerNotes") or o.get("customer_notes") or ""
        is_pre = bool(o.get("is_preorder") or o.get("isPreorder") or False)

        o["customerEmail"] = cust_email
        o["customer_email"] = cust_email
        o["customerName"] = cust_name
        o["customer_name"] = cust_name
        o["customerWhatsapp"] = cust_phone
        o["customer_whatsapp"] = cust_phone
        o["customerNotes"] = cust_notes
        o["customer_notes"] = cust_notes
        o["is_preorder"] = is_pre
        o["isPreorder"] = is_pre

        # Public Display Attributes
        from app.services.partner_service import mask_customer_name
        masked_cname = mask_customer_name(cust_name)
        if masked_cname:
            o["customer_display"] = masked_cname
        elif cust_email and "@" in cust_email:
            parts = cust_email.split("@")
            o["customer_display"] = f"{parts[0][:2]}***@{parts[1]}"
        else:
            o["customer_display"] = "Pelanggan Terverifikasi"

        o["raw_id"] = o.get("id", "")

        # Payment details
        pay_mode = o.get("paymentMode") or o.get("payment_mode")
        pay_method = o.get("paymentMethod") or o.get("payment_method") or "qris"
        if not pay_mode:
            pay_mode = "manual" if (str(pay_method).startswith("manual_") or str(pay_method) in ["manual_qris", "qris_manual", "manual_bca", "manual_dana"]) else "gateway"
        pay_status = o.get("paymentStatus") or o.get("payment_status") or "pending"
        order_st = str(o.get("status") or o.get("order_status") or "").lower()
        if order_st in ["processing", "completed", "paid", "settlement"]:
            pay_status = "success"

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
                "created_at": created,
                "paid_at": o.get("paidAt"),
            }
        else:
            o["payment"]["payment_status"] = pay_status

        # Normalize items summary & items
        items = o.get("items") or []
        normalized_items = []
        if isinstance(items, list):
            for it in items:
                if isinstance(it, dict):
                    nit = dict(it)
                    p_name = nit.get("product_name") or nit.get("productName") or nit.get("name") or "Layanan Digital"
                    nit["product_name"] = p_name
                    nit["productName"] = p_name
                    u_price = float(nit.get("unit_price") or nit.get("unitPrice") or nit.get("price") or 0)
                    nit["unit_price"] = u_price
                    nit["unitPrice"] = u_price
                    nit["price"] = u_price
                    q = int(nit.get("quantity") or 1)
                    nit["quantity"] = q
                    nit["subtotal"] = float(nit.get("subtotal") or (u_price * q))

                    # Normalize target & fulfillment data (strictly preserve without fallback to login email)
                    t_email = nit.get("target_email") or nit.get("targetEmail") or None
                    t_phone = nit.get("target_phone") or nit.get("targetPhone") or None
                    t_id = nit.get("target_id") or nit.get("targetId") or None
                    t_zone = nit.get("target_zone") or nit.get("targetZone") or None
                    f_method = nit.get("fulfillment_method") or nit.get("fulfillmentMethod") or None
                    t_type = nit.get("target_type") or nit.get("targetType") or None
                    t_val = nit.get("target_value") or nit.get("targetValue") or t_id or t_email or t_phone or None
                    cfg_snap = nit.get("input_config_snapshot") or nit.get("inputConfigSnapshot") or None

                    nit["target_email"] = t_email
                    nit["targetEmail"] = t_email
                    nit["target_phone"] = t_phone
                    nit["targetPhone"] = t_phone
                    nit["target_id"] = t_id
                    nit["targetId"] = t_id
                    nit["target_zone"] = t_zone
                    nit["targetZone"] = t_zone
                    nit["fulfillment_method"] = f_method
                    nit["fulfillmentMethod"] = f_method
                    nit["target_type"] = t_type
                    nit["targetType"] = t_type
                    nit["target_value"] = t_val
                    nit["targetValue"] = t_val
                    nit["input_config_snapshot"] = cfg_snap
                    nit["inputConfigSnapshot"] = cfg_snap

                    # Construct or preserve purchased_details for legacy & Admin UI compatibility
                    p_details = nit.get("purchased_details") or nit.get("purchasedDetails")
                    p_details_merged = dict(p_details) if isinstance(p_details, dict) else {}
                    p_details_merged["target_email"] = t_email or p_details_merged.get("target_email")
                    p_details_merged["targetEmail"] = t_email or p_details_merged.get("targetEmail")
                    p_details_merged["target_phone"] = t_phone or p_details_merged.get("target_phone")
                    p_details_merged["targetPhone"] = t_phone or p_details_merged.get("targetPhone")
                    p_details_merged["target_id"] = t_id or p_details_merged.get("target_id")
                    p_details_merged["targetId"] = t_id or p_details_merged.get("targetId")
                    p_details_merged["target_zone"] = t_zone or p_details_merged.get("target_zone")
                    p_details_merged["targetZone"] = t_zone or p_details_merged.get("targetZone")
                    p_details_merged["fulfillment_method"] = f_method or p_details_merged.get("fulfillment_method")
                    p_details_merged["fulfillmentMethod"] = f_method or p_details_merged.get("fulfillmentMethod")
                    p_details_merged["target_type"] = t_type or p_details_merged.get("target_type")
                    p_details_merged["targetType"] = t_type or p_details_merged.get("targetType")
                    p_details_merged["target_value"] = t_val or p_details_merged.get("target_value")
                    p_details_merged["targetValue"] = t_val or p_details_merged.get("targetValue")
                    p_details_merged["duration"] = nit.get("duration") or p_details_merged.get("duration")

                    nit["purchased_details"] = p_details_merged
                    nit["purchasedDetails"] = p_details_merged

                    normalized_items.append(nit)

        o["items"] = normalized_items
        o["items_count"] = len(normalized_items)

        if not o.get("items_summary"):
            if normalized_items:
                first = normalized_items[0].get("product_name", "Layanan Digital")
                more = len(normalized_items) - 1
                o["items_summary"] = f"{first} (+{more} item lainnya)" if more > 0 else first
                o["product_name"] = first
            else:
                o["items_summary"] = "Pesanan Layanan Digital"
                o["product_name"] = "Layanan Digital"
        else:
            o["product_name"] = o.get("items_summary")

        return o
