import uuid
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from sqlalchemy.orm import joinedload

from app.core.database import SessionLocal
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.partner import SalesPartner
from app.models.commission import Commission
from app.models.profit_ledger import ProfitLedger

class ReferralProfitService:
    """
    Asterra Store - Referral Profit Waterfall & Commission Allocation Engine.
    Implements 100% exact business logic from Asterra Store Constitution:
    - Direct Sales Commission: Follows partner rate (standard 10%) or Campaign Booster override
    - Sponsor Recruitment Bonus: 2% of Net Transaction Profit (1-level network only)
    - Holding Window: 3 Days (Warranty holding guarantee before payout release)
    - Complete Idempotent Persistence into PostgreSQL tables: `commissions` and `profit_ledgers`
    """

    DIRECT_RATE_DEFAULT = 10.0  # 10%
    SPONSOR_RATE_DEFAULT = 2.0  # 2% of transaction profit
    HOLDING_DAYS = 3            # 3 days warranty holding guarantee

    @staticmethod
    def calculate_transaction_profit(order_total: float, cost_of_goods: float, discount: float = 0.0) -> float:
        net_revenue = max(0.0, order_total - discount)
        profit = max(0.0, net_revenue - cost_of_goods)
        return profit

    @classmethod
    def allocate_waterfall(
        cls,
        order_id: str,
        transaction_profit: float,
        direct_partner_code: Optional[str] = None,
        direct_partner_rate: Optional[float] = None,
        sponsor_partner_code: Optional[str] = None,
        campaign_id: Optional[str] = None,
        campaign_booster_rate: Optional[float] = None,
    ) -> Dict[str, Any]:
        direct_rate = direct_partner_rate if direct_partner_rate is not None else cls.DIRECT_RATE_DEFAULT

        # Apply campaign booster override if provided or active
        if campaign_booster_rate is not None and campaign_booster_rate > direct_rate:
            direct_rate = campaign_booster_rate
        elif campaign_id:
            try:
                from app.services.campaign_service import CampaignService
                active_camps = CampaignService.get_active_campaigns()
                for c in active_camps:
                    if c.get("id") == campaign_id or c.get("slug") == campaign_id:
                        override = float(c.get("affiliateBonusPercent") or c.get("affiliateCommissionOverride") or 0)
                        if override > direct_rate:
                            direct_rate = override
                        break
            except Exception:
                pass

        sponsor_rate = cls.SPONSOR_RATE_DEFAULT

        direct_commission = 0.0
        sponsor_bonus = 0.0

        if direct_partner_code and transaction_profit > 0:
            direct_commission = round((transaction_profit * direct_rate) / 100.0)

        if sponsor_partner_code and transaction_profit > 0:
            sponsor_bonus = round((transaction_profit * sponsor_rate) / 100.0)

        company_retained_profit = max(0.0, transaction_profit - direct_commission - sponsor_bonus)
        holding_until = datetime.utcnow() + timedelta(days=cls.HOLDING_DAYS)

        return {
            "order_id": order_id,
            "transaction_profit": transaction_profit,
            "direct_partner_code": direct_partner_code,
            "direct_commission": direct_commission,
            "direct_rate_applied": direct_rate,
            "sponsor_partner_code": sponsor_partner_code,
            "sponsor_bonus": sponsor_bonus,
            "sponsor_rate_applied": sponsor_rate,
            "company_retained_profit": company_retained_profit,
            "holding_until": holding_until.isoformat(),
            "status": "pending",
        }

    @classmethod
    def sync_order_commissions_and_ledger(
        cls,
        order_id: str,
        new_status: Optional[str] = None,
    ) -> Optional[Dict[str, Any]]:
        """
        Idempotently computes, creates, or updates `commissions` and `profit_ledgers`
        records in the PostgreSQL database for the given order_id.
        Guarantees 1-level recruiter bonus at exactly 2% of transaction profit
        and ensures 3-day warranty status integrity.
        """
        clean_id = order_id.strip().upper()
        now = datetime.utcnow()

        try:
            db = SessionLocal()
            try:
                order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == clean_id).first()
                if not order:
                    return None

                status_to_eval = (new_status or order.status or "pending").lower()

                # 1. Resolve Direct Sales Partner
                partner = None
                if order.sales_partner_id:
                    partner = db.query(SalesPartner).filter(SalesPartner.id == order.sales_partner_id).first()
                if not partner and order.referral_code:
                    clean_code = str(order.referral_code).strip().upper()
                    partner = db.query(SalesPartner).filter(SalesPartner.code.ilike(clean_code)).first()
                    if partner and not order.sales_partner_id:
                        order.sales_partner_id = partner.id

                # 2. Resolve Recruiter Partner (Strict 1-level direct relation only)
                recruiter = None
                recruiter_id = None
                if partner and partner.referred_by_id:
                    recruiter = db.query(SalesPartner).filter(SalesPartner.id == partner.referred_by_id).first()
                    if recruiter:
                        recruiter_id = recruiter.id
                        if not order.recruiter_partner_id:
                            order.recruiter_partner_id = recruiter.id
                elif order.recruiter_partner_id:
                    recruiter = db.query(SalesPartner).filter(SalesPartner.id == order.recruiter_partner_id).first()
                    if recruiter:
                        recruiter_id = recruiter.id

                # 3. Determine Campaign Booster Rate or Partner Default Rate
                commission_rate = float(partner.rate if partner else cls.DIRECT_RATE_DEFAULT)
                is_campaign_sale = False
                camp_obj = None

                camp_id_val = order.campaign_id or ""
                if camp_id_val:
                    try:
                        from app.services.campaign_service import CampaignService
                        for c in CampaignService.get_all_campaigns():
                            c_id = str(c.get("id") or "").strip()
                            c_slug = str(c.get("slug") or "").strip().lower()
                            if c_id == camp_id_val or c_slug == camp_id_val.lower():
                                camp_obj = c
                                override = float(c.get("affiliateBonusPercent") or c.get("affiliateCommissionOverride") or 0)
                                if override > 0:
                                    commission_rate = override
                                is_campaign_sale = True
                                break
                    except Exception:
                        pass
                elif (order.campaign_discount or 0) > 0:
                    is_campaign_sale = True
                    commission_rate = max(commission_rate, 15.0)

                # 4. Compute Cost of Goods (COG) from actual product provider_price
                items = order.items or []
                total_cog = 0
                item_names = []
                first_product_id = "vip-service"

                for it in items:
                    it_qty = max(1, int(it.quantity or 1))
                    it_price = float(it.price or 0)
                    item_names.append(it.product_name or "Produk Digital")
                    if it.product_id:
                        first_product_id = it.product_id

                    prod_obj = db.query(Product).filter(Product.id == it.product_id).first()
                    provider_price = None
                    if prod_obj and prod_obj.provider_price and prod_obj.provider_price > 0:
                        provider_price = int(prod_obj.provider_price)
                    else:
                        try:
                            from app.services.catalog_service import CatalogService
                            for cat_p in CatalogService.load_products():
                                if str(cat_p.get("id")) == str(it.product_id):
                                    if cat_p.get("providerPrice"):
                                        provider_price = int(cat_p["providerPrice"])
                                    elif cat_p.get("provider_price"):
                                        provider_price = int(cat_p["provider_price"])
                                    break
                        except Exception:
                            pass

                    if provider_price is not None and provider_price > 0:
                        total_cog += provider_price * it_qty
                    else:
                        # Fallback standard COG ~65% of selling price
                        total_cog += round(it_price * it_qty * 0.65)

                product_summary = ", ".join(item_names) if item_names else "Layanan Digital"

                # 5. Financial Waterfall Calculation
                selling_price = int(order.raw_amount or order.total_amount or 0)
                promo_disc = int(order.promo_discount or 0)
                ref_disc = int(order.referral_discount or 0)
                camp_disc = int(order.campaign_discount or 0)
                total_discount = promo_disc + ref_disc + camp_disc

                net_revenue = max(0, selling_price - total_discount)
                payment_fee = 0 if (order.payment_mode or "").lower() == "manual" else round(net_revenue * 0.007)
                direct_transaction_cost = total_cog + payment_fee
                transaction_profit = max(0, net_revenue - direct_transaction_cost)

                # Sales Commission: percentage of transaction profit for partner (Strict Asterra Profit Model)
                sales_comm_amount = round(float(transaction_profit) * (commission_rate / 100.0)) if (partner and transaction_profit > 0) else 0

                # Sponsor Recruiter Bonus: strictly 2% of net transaction profit
                sponsor_rate = cls.SPONSOR_RATE_DEFAULT if recruiter_id else 0.0
                sponsor_bonus_amount = round((transaction_profit * 0.02)) if (recruiter_id and transaction_profit > 0) else 0

                # Profit Distribution for Store Reserves (40% CEO, 40% COO, 20% Reserve - 50:50 Founder Parity)
                distributable_profit = max(0, transaction_profit - sales_comm_amount - sponsor_bonus_amount)
                ceo_share = round(distributable_profit * 0.40)
                coo_share = round(distributable_profit * 0.40)
                business_reserve = distributable_profit - ceo_share - coo_share

                # 6. Status & Holding Warranty Window
                order_created_at = order.created_at or now

                # Pre-fetch existing records to preserve manual releases or finalized statuses
                comm_record = None
                if partner:
                    comm_record = db.query(Commission).filter(Commission.order_id == clean_id).first()
                ledger_record = db.query(ProfitLedger).filter(ProfitLedger.order_id == clean_id).first()

                # Preserve holding_until if already reached or manually released
                default_holding_until = order_created_at + timedelta(days=cls.HOLDING_DAYS)
                if comm_record and comm_record.holding_until and comm_record.holding_until <= now:
                    holding_until = comm_record.holding_until
                elif ledger_record and ledger_record.holding_until and ledger_record.holding_until <= now:
                    holding_until = ledger_record.holding_until
                else:
                    holding_until = default_holding_until

                # Check if commission was already finalized or manually released
                is_already_final = (comm_record and comm_record.status == "final") or (ledger_record and ledger_record.status in ["available", "withdrawn"])

                if status_to_eval in ["cancelled", "expired", "refunded"]:
                    comm_status = "reversed"
                    ledger_status = "reversed"
                elif is_already_final:
                    # NEVER demote an already final/available commission back to pending
                    comm_status = "final"
                    ledger_status = ledger_record.status if (ledger_record and ledger_record.status in ["available", "withdrawn"]) else "available"
                    holding_until = comm_record.holding_until if (comm_record and comm_record.holding_until) else now
                elif status_to_eval in ["completed", "paid", "settlement"]:
                    if cls.HOLDING_DAYS == 0 or now >= holding_until:
                        comm_status = "final"
                        ledger_status = "available"
                    else:
                        comm_status = "pending"
                        ledger_status = "pending"
                else:
                    comm_status = "pending"
                    ledger_status = "pending"

                # 7. Idempotent Upsert into `commissions` table
                if partner:
                    if not comm_record:
                        comm_record = db.query(Commission).filter(Commission.order_id == clean_id).first()
                    if comm_record:
                        comm_record.partner_id = partner.id
                        comm_record.recruiter_id = recruiter_id
                        comm_record.order_total = int(order.total_amount)
                        comm_record.net_revenue = int(net_revenue)
                        comm_record.cost_of_goods = int(total_cog)
                        comm_record.transaction_profit = int(transaction_profit)
                        comm_record.commission_rate = int(round(commission_rate))
                        comm_record.commission_amount = int(sales_comm_amount)
                        comm_record.bonus_rate = int(round(sponsor_rate))
                        comm_record.bonus_amount = int(sponsor_bonus_amount)
                        comm_record.status = comm_status
                        comm_record.holding_until = holding_until
                        if comm_status == "final" and not comm_record.released_at:
                            comm_record.released_at = now
                        comm_record.updated_at = now
                    else:
                        comm_id = f"comm-{int(now.timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"
                        comm_record = Commission(
                            id=comm_id,
                            order_id=clean_id,
                            partner_id=partner.id,
                            recruiter_id=recruiter_id,
                            order_total=int(order.total_amount),
                            net_revenue=int(net_revenue),
                            cost_of_goods=int(total_cog),
                            transaction_profit=int(transaction_profit),
                            commission_rate=int(round(commission_rate)),
                            commission_amount=int(sales_comm_amount),
                            bonus_rate=int(round(sponsor_rate)),
                            bonus_amount=int(sponsor_bonus_amount),
                            status=comm_status,
                            holding_until=holding_until,
                            released_at=now if comm_status == "final" else None,
                            created_at=order_created_at,
                            updated_at=now,
                        )
                        db.add(comm_record)

                # 8. Idempotent Upsert into `profit_ledgers` table
                ledger_record = db.query(ProfitLedger).filter(ProfitLedger.order_id == clean_id).first()
                if ledger_record:
                    ledger_record.customer_email = order.customer_email
                    ledger_record.customer_name = order.customer_name
                    ledger_record.product_id = first_product_id
                    ledger_record.product_names = product_summary
                    ledger_record.sales_id = partner.id if partner else None
                    ledger_record.sales_name = partner.name if partner else None
                    ledger_record.referral_code = order.referral_code
                    ledger_record.recruiter_sales_id = recruiter_id
                    ledger_record.recruiter_sales_name = recruiter.name if recruiter else None
                    ledger_record.sale_commission_rate = float(commission_rate / 100.0)
                    ledger_record.recruitment_bonus_rate = 0.02 if recruiter_id else 0.0
                    ledger_record.selling_price = int(selling_price)
                    ledger_record.customer_referral_discount = int(total_discount)
                    ledger_record.net_revenue = int(net_revenue)
                    ledger_record.cost_of_goods = int(total_cog)
                    ledger_record.payment_fee = int(payment_fee)
                    ledger_record.direct_transaction_cost = int(direct_transaction_cost)
                    ledger_record.transaction_profit = int(transaction_profit)
                    ledger_record.sales_commission = int(sales_comm_amount)
                    ledger_record.recruitment_bonus = int(sponsor_bonus_amount)
                    ledger_record.profit_distribution = int(distributable_profit)
                    ledger_record.ceo_share = int(ceo_share)
                    ledger_record.coo_share = int(coo_share)
                    ledger_record.business_reserve = int(business_reserve)
                    ledger_record.status = ledger_status
                    ledger_record.holding_until = holding_until
                    if ledger_status == "available" and not ledger_record.released_at:
                        ledger_record.released_at = now
                    ledger_record.updated_at = now
                else:
                    ledger_id = f"ledg-{int(now.timestamp() * 1000)}-{uuid.uuid4().hex[:6]}"
                    ledger_record = ProfitLedger(
                        id=ledger_id,
                        order_id=clean_id,
                        customer_email=order.customer_email,
                        customer_name=order.customer_name,
                        product_id=first_product_id,
                        product_names=product_summary,
                        sales_id=partner.id if partner else None,
                        sales_name=partner.name if partner else None,
                        referral_code=order.referral_code,
                        recruiter_sales_id=recruiter_id,
                        recruiter_sales_name=recruiter.name if recruiter else None,
                        sale_commission_rate=float(commission_rate / 100.0),
                        recruitment_bonus_rate=0.02 if recruiter_id else 0.0,
                        selling_price=int(selling_price),
                        customer_referral_discount=int(total_discount),
                        net_revenue=int(net_revenue),
                        cost_of_goods=int(total_cog),
                        payment_fee=int(payment_fee),
                        other_direct_cost=0,
                        direct_transaction_cost=int(direct_transaction_cost),
                        transaction_profit=int(transaction_profit),
                        sales_commission=int(sales_comm_amount),
                        recruitment_bonus=int(sponsor_bonus_amount),
                        profit_distribution=int(distributable_profit),
                        ceo_share=int(ceo_share),
                        coo_share=int(coo_share),
                        business_reserve=int(business_reserve),
                        status=ledger_status,
                        holding_until=holding_until,
                        released_at=now if ledger_status == "available" else None,
                        created_at=order_created_at,
                        updated_at=now,
                    )
                    db.add(ledger_record)

                db.commit()

                return {
                    "order_id": clean_id,
                    "commission_id": comm_record.id if comm_record else None,
                    "ledger_id": ledger_record.id if ledger_record else None,
                    "commission_amount": sales_comm_amount,
                    "recruitment_bonus": sponsor_bonus_amount,
                    "commission_rate": commission_rate,
                    "transaction_profit": transaction_profit,
                    "comm_status": comm_status,
                    "holding_until": holding_until.isoformat(),
                }
            finally:
                db.close()
        except Exception as e:
            print(f"[ReferralProfitService] Error syncing commissions and ledger for {clean_id}: {e}")
            return None
