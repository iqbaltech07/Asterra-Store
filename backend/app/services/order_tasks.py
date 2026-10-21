import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

class OrderPostTasks:
    @staticmethod
    def execute(
        order_id: str,
        customer_name: str,
        customer_email: str,
        total_amount: float,
        subtotal_after_discounts: float,
        items: List[Dict[str, Any]],
        ref_code: Optional[str],
        ref_sess_id: Optional[str],
        promo_code: Optional[str],
        promo_discount: int,
        partner: Optional[Dict[str, Any]],
        matched_campaign: Optional[Dict[str, Any]],
        canonical_campaign_id: Optional[str],
        campaign_discount: int,
        catalog_products: Dict[str, Any],
        now: datetime,
        save_orders_func: Any,
    ):
        save_orders_func()

        if ref_code or ref_sess_id:
            try:
                from app.services.referral_service import ReferralService
                ReferralService.claim_session(
                    order_id=order_id,
                    ref_code=ref_code,
                    user_email=customer_email,
                    session_id=ref_sess_id,
                )
            except Exception as e:
                print(f"[OrderService] ReferralSession claim note: {e}")

        if promo_code and promo_discount > 0:
            try:
                from app.services.promo_service import PromoService
                PromoService.record_usage(promo_code)
            except Exception as e:
                print(f"[OrderService] Promo record_usage note: {e}")

        try:
            from app.services.referral_profit_service import ReferralProfitService
            ReferralProfitService.sync_order_commissions_and_ledger(order_id, "pending")
        except Exception as e:
            print(f"[OrderService] Commission and ledger sync note: {e}")

        if partner:
            try:
                from app.services.partner_service import PartnerService
                comm_rate = float(partner.get("rate", 10.0))
                camp_name = None
                target_camp_id = canonical_campaign_id

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

                cogs = sum(
                    int(catalog_products.get(str(it.get("product_id") or it.get("productId") or ""), {}).get("providerPrice") or 0) * int(it.get("quantity", 1))
                    for it in items
                )
                transaction_profit = max(0, subtotal_after_discounts - cogs)
                comm_amount = round(transaction_profit * (comm_rate / 100.0)) if transaction_profit > 0 else 0
                comm_item = {
                    "id": f"comm-{int(now.timestamp() * 1000)}-{random.randint(100, 999)}",
                    "orderId": order_id,
                    "orderTotal": total_amount,
                    "orderProfit": transaction_profit,
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

        if canonical_campaign_id:
            try:
                from app.services.campaign_service import CampaignService
                CampaignService.record_campaign_order(str(canonical_campaign_id), float(total_amount))
            except Exception:
                pass

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
