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
