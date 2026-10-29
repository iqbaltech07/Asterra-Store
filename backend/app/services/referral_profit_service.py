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

    DIRECT_RATE_DEFAULT = 15.0  # 15% (Sales Pemula baseline)
    DIRECT_RATE_VIP = 20.0      # 20% (Sales VIP / Milestone >= 50 orders)
    SPONSOR_RATE_DEFAULT = 2.0  # 2% of transaction profit (untouched)
    HOLDING_DAYS = 3            # 3 days warranty holding guarantee

    @staticmethod
    def calculate_transaction_profit(order_total: float, cost_of_goods: float, discount: float = 0.0) -> float:
        net_revenue = max(0.0, order_total - discount)
        profit = max(0.0, net_revenue - cost_of_goods)
        return profit

    @classmethod
    def calculate_profit_allocation(
        cls,
        transaction_profit: float,
        successful_orders_count: int = 0,
        is_vip: bool = False,
        has_sales_partner: bool = True,
        has_recruiter: bool = False,
        campaign_rate_override: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Canonical Asterra Profit Waterfall & Split Engine:
        | Penerima | Di bawah 50 transaksi sukses | Minimal 50 transaksi sukses |
        |---|---:|---:|
        | CEO | 35% | 32,5% |
        | COO | 35% | 32,5% |
        | Sales | 15% | 20% |
        | Reserve | 15% | 15% |
        | Total | 100% | 100% |

        Ketentuan:
        - Komisi dasar Sales: 15%.
        - Setelah mencapai minimal 50 transaksi sukses, komisi otomatis menjadi 20%.
        - Tambahan 5 poin persentase Sales berasal dari pengurangan CEO 2,5 poin dan COO 2,5 poin.
        - Reserve tetap 15% (jika ada recruiter 2%, sponsor mendapat 2% dan reserve menjadi 13%, total tetap 15%).
        - Total seluruh alokasi strictly 100% dari transaction_profit (zero leakage/loss).
        - Strict 50:50 parity antara CEO dan COO.
        """
        tx_profit = int(round(transaction_profit))
        if tx_profit <= 0:
            return {
                "sales_commission": 0,
                "sales_commission_rate": 0.0,
                "recruitment_bonus": 0,
                "recruitment_bonus_rate": 0.0,
                "ceo_share": 0,
                "ceo_share_rate": 0.0,
                "coo_share": 0,
                "coo_share_rate": 0.0,
                "business_reserve": 0,
                "business_reserve_rate": 0.0,
                "profit_distribution": 0,
                "is_vip": False,
                "total": 0,
            }

        is_vip_effective = is_vip or (successful_orders_count >= 50)

        if not has_sales_partner:
            reserve = int(round(tx_profit * 0.15))
            retained = tx_profit - reserve
            ceo = retained // 2
            coo = ceo
            reserve = tx_profit - (ceo + coo)
            return {
                "sales_commission": 0,
                "sales_commission_rate": 0.0,
                "recruitment_bonus": 0,
                "recruitment_bonus_rate": 0.0,
                "ceo_share": ceo,
                "ceo_share_rate": 42.5,
                "coo_share": coo,
                "coo_share_rate": 42.5,
                "business_reserve": reserve,
                "business_reserve_rate": 15.0,
                "profit_distribution": tx_profit,
                "is_vip": False,
                "total": ceo + coo + reserve,
            }

        # Sales Rate calculation
        if campaign_rate_override and campaign_rate_override > (cls.DIRECT_RATE_VIP if is_vip_effective else cls.DIRECT_RATE_DEFAULT):
            sales_rate = campaign_rate_override / 100.0
            founder_pool = max(0.0, 0.85 - sales_rate)
            ceo_rate = founder_pool / 2.0
            coo_rate = founder_pool / 2.0
        elif is_vip_effective:
            sales_rate = 0.20
            ceo_rate = 0.325
            coo_rate = 0.325
        else:
            sales_rate = 0.15
            ceo_rate = 0.35
            coo_rate = 0.35

        sales_comm = int(round(tx_profit * sales_rate))
        sponsor_bonus = int(round(tx_profit * 0.02)) if has_recruiter else 0
        ceo_share = int(round(tx_profit * ceo_rate))
        coo_share = int(round(tx_profit * coo_rate))
        # Reserve absorbs any integer rounding difference so sum is strictly 100% of tx_profit
        reserve = tx_profit - sales_comm - sponsor_bonus - ceo_share - coo_share
        distributable = max(0, tx_profit - sales_comm - sponsor_bonus)

        return {
            "sales_commission": sales_comm,
            "sales_commission_rate": round(sales_rate * 100.0, 1),
            "recruitment_bonus": sponsor_bonus,
            "recruitment_bonus_rate": 2.0 if has_recruiter else 0.0,
            "ceo_share": ceo_share,
            "ceo_share_rate": round(ceo_rate * 100.0, 1),
            "coo_share": coo_share,
            "coo_share_rate": round(coo_rate * 100.0, 1),
            "business_reserve": reserve,
            "business_reserve_rate": 15.0 if not has_recruiter else 13.0,
            "profit_distribution": distributable,
            "is_vip": is_vip_effective,
            "total": sales_comm + sponsor_bonus + ceo_share + coo_share + reserve,
            "total_allocated": sales_comm + sponsor_bonus + ceo_share + coo_share + reserve,
        }

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
        booster_rate = campaign_booster_rate
        if not booster_rate and campaign_id:
            try:
                from app.services.campaign_service import CampaignService
                active_camps = CampaignService.get_active_campaigns()
                for c in active_camps:
                    if c.get("id") == campaign_id or c.get("slug") == campaign_id:
                        override = float(c.get("affiliateBonusPercent") or c.get("affiliateCommissionOverride") or 0)
                        if override > 0:
                            booster_rate = override
                        break
            except Exception:
                pass

        is_vip = bool(direct_partner_rate is not None and direct_partner_rate >= cls.DIRECT_RATE_VIP)
        alloc = cls.calculate_profit_allocation(
            transaction_profit=transaction_profit,
            successful_orders_count=50 if is_vip else 0,
            is_vip=is_vip,
            has_sales_partner=bool(direct_partner_code),
            has_recruiter=bool(sponsor_partner_code),
            campaign_rate_override=booster_rate,
        )

        holding_until = datetime.utcnow() + timedelta(days=cls.HOLDING_DAYS)

        return {
            "order_id": order_id,
            "transaction_profit": transaction_profit,
            "direct_partner_code": direct_partner_code,
            "direct_commission": float(alloc["sales_commission"]),
            "direct_rate_applied": float(alloc["sales_commission_rate"]),
            "sponsor_partner_code": sponsor_partner_code,
            "sponsor_bonus": float(alloc["recruitment_bonus"]),
            "sponsor_rate_applied": float(alloc["recruitment_bonus_rate"]),
            "company_retained_profit": float(alloc["profit_distribution"]),
            "ceo_share": float(alloc["ceo_share"]),
            "coo_share": float(alloc["coo_share"]),
            "business_reserve": float(alloc["business_reserve"]),
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

                # 3. Determine Sales Commission Rate & VIP Status (Sales Pemula: 15%, Sales VIP >= 50 unique successful orders: 20%)
                successful_orders_count = 0
                is_vip_partner = False
                if partner:
                    try:
                        successful_orders_count = db.query(Order.id).filter(
                            Order.sales_partner_id == partner.id,
                            Order.status.in_(["completed", "paid", "settlement", "selesai", "done"])
                        ).distinct().count()
                    except Exception:
                        successful_orders_count = int(getattr(partner, "total_orders", 0) or 0)

                    partner_tier = str(getattr(partner, "tier", "") or "").lower()
                    is_vip_partner = (successful_orders_count >= 50 or "vip" in partner_tier or getattr(partner, "rate", 0) == 20)

                campaign_booster_rate = None
                camp_id_val = order.campaign_id or ""
                if camp_id_val:
                    try:
                        from app.services.campaign_service import CampaignService
                        for c in CampaignService.get_all_campaigns():
                            c_id = str(c.get("id") or "").strip()
                            c_slug = str(c.get("slug") or "").strip().lower()
                            if c_id == camp_id_val or c_slug == camp_id_val.lower():
                                override = float(c.get("affiliateBonusPercent") or c.get("affiliateCommissionOverride") or 0)
                                if override > 0:
                                    campaign_booster_rate = override
                                break
                    except Exception:
                        pass
                elif (order.campaign_discount or 0) > 0:
                    campaign_booster_rate = cls.DIRECT_RATE_VIP

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

                alloc = cls.calculate_profit_allocation(
                    transaction_profit=transaction_profit,
                    successful_orders_count=successful_orders_count,
                    is_vip=is_vip_partner,
                    has_sales_partner=bool(partner),
                    has_recruiter=bool(recruiter_id),
                    campaign_rate_override=campaign_booster_rate,
                )

                sales_comm_amount = alloc["sales_commission"]
                commission_rate = alloc["sales_commission_rate"]
                sponsor_rate = alloc["recruitment_bonus_rate"]
                sponsor_bonus_amount = alloc["recruitment_bonus"]
                distributable_profit = alloc["profit_distribution"]
                ceo_share = alloc["ceo_share"]
                coo_share = alloc["coo_share"]
                business_reserve = alloc["business_reserve"]

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

                # Preserve historical values for finalized records to protect audit integrity
                if is_already_final and ledger_record:
                    sales_comm_amount = comm_record.commission_amount if comm_record else ledger_record.sales_commission
                    commission_rate = float(comm_record.commission_rate) if comm_record else (ledger_record.sale_commission_rate * 100.0)
                    sponsor_bonus_amount = comm_record.bonus_amount if comm_record else ledger_record.recruitment_bonus
                    distributable_profit = ledger_record.profit_distribution
                    ceo_share = ledger_record.ceo_share
                    coo_share = ledger_record.coo_share
                    business_reserve = ledger_record.business_reserve

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
