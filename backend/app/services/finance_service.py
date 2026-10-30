import json
import pathlib
from datetime import datetime
from typing import Dict, Any, List

class FinanceService:
    @classmethod
    def load_orders(cls) -> List[Dict[str, Any]]:
        """Authoritative loader sourcing from OrderService (PostgreSQL + local sync)."""
        from app.services.order_service import OrderService
        return OrderService.load_orders()

    @classmethod
    def get_profit_distribution(cls) -> Dict[str, Any]:
        orders = cls.load_orders()

        catalog_products = {}
        try:
            from app.services.catalog_service import CatalogService
            catalog_products = {str(p.get("id")): p for p in CatalogService.load_products()}
        except Exception as e:
            print(f"[FinanceService] Note loading catalog products: {e}")

        db_ledgers = {}
        try:
            from app.core.database import SessionLocal
            from app.models.profit_ledger import ProfitLedger
            if SessionLocal:
                with SessionLocal() as db_sess:
                    for pl in db_sess.query(ProfitLedger).all():
                        db_ledgers[str(pl.order_id).strip().upper()] = pl
        except Exception as e:
            print(f"[FinanceService] Note loading profit ledgers: {e}")

        total_orders = sum(
            1 for o in orders 
            if str(o.get("status", "")).lower() in ["completed", "selesai", "done"]
            and str(o.get("id") or o.get("order_id") or "").strip().upper() != "AST-ORD-20261015-7615"
        )
        total_gross_revenue = 0.0
        total_discounts = 0.0
        total_net_revenue = 0.0
        total_cost_of_goods = 0.0
        total_payment_fees = 0.0
        total_transaction_profit = 0.0
        total_sales_commission = 0.0
        total_recruitment_bonus = 0.0
        total_profit_distribution = 0.0
        total_ceo_share = 0.0
        total_coo_share = 0.0
        total_business_reserve = 0.0
        pending_commission_total = 0.0
        available_commission_total = 0.0

        entries = []

        # Precompute unique successful orders per partner from authoritative orders list
        partner_success_counts = {}
        for o in orders:
            st = str(o.get("status", "")).lower()
            if st in ["completed", "selesai", "done"]:
                p_ref = str(o.get("referralCode") or o.get("referral_code") or "").strip().upper()
                p_id_str = str(o.get("salesPartnerId") or o.get("sales_partner_id") or "").strip().upper()
                oid = str(o.get("id") or o.get("order_id") or "").strip().upper()
                if oid and oid != "AST-ORD-20261015-7615":
                    if p_ref:
                        if p_ref not in partner_success_counts:
                            partner_success_counts[p_ref] = set()
                        partner_success_counts[p_ref].add(oid)
                    if p_id_str:
                        if p_id_str not in partner_success_counts:
                            partner_success_counts[p_id_str] = set()
                        partner_success_counts[p_id_str].add(oid)

        for idx, o in enumerate(orders):
            clean_oid = str(o.get("id") or o.get("order_id") or "").strip().upper()
            if clean_oid == "AST-ORD-20261015-7615":
                # User instruction: AST-ORD-20261015-7615 profit is corrupt (profit 0), do not include in finance calculations
                continue

            st = str(o.get("status", "")).lower()
            is_completed = st in ["completed", "selesai", "done"]
            is_cancelled = st in ["cancelled", "expired", "failed", "batal"]

            # STRICT RULE: Orders that are not yet completed (pending, processing) DO NOT enter keuangan!
            if not is_completed and not is_cancelled:
                continue

            raw_val = o.get("rawAmount") if o.get("rawAmount") is not None else o.get("raw_amount")
            tot_val = o.get("totalAmount") if o.get("totalAmount") is not None else o.get("total_amount")
            selling_price = float(raw_val if raw_val is not None else (tot_val or 0.0))

            promo_disc = float(o.get("promoDiscount") or o.get("promo_discount") or 0.0)
            ref_disc = float(o.get("referralDiscount") or o.get("referral_discount") or 0.0)
            camp_disc = float(o.get("campaignDiscount") or o.get("campaign_discount") or 0.0)
            discount = promo_disc + ref_disc + camp_disc

            net_rev = max(0.0, selling_price - discount)

            ledger_record = db_ledgers.get(clean_oid)

            # Upstream cost of goods (COGS): lookup authoritative ledger or providerPrice from catalog
            items = o.get("items") or []
            if ledger_record and getattr(ledger_record, "cost_of_goods", None) is not None:
                cog = float(ledger_record.cost_of_goods)
            else:
                cog = 0.0
                for it in items:
                    p_id = str(it.get("productId") or it.get("product_id") or "")
                    cat_p = catalog_products.get(p_id)
                    qty = max(1, int(it.get("quantity", 1)))
                    if cat_p and cat_p.get("providerPrice") is not None and float(cat_p.get("providerPrice")) > 0:
                        cog += float(cat_p["providerPrice"]) * qty
                    elif cat_p and cat_p.get("provider_price") is not None and float(cat_p.get("provider_price")) > 0:
                        cog += float(cat_p["provider_price"]) * qty
                    else:
                        it_price = float(it.get("price") or it.get("unit_price") or 0.0)
                        cog += round(it_price * qty * 0.65) if it_price > 0 else 0.0

                if not items and net_rev > 0:
                    cog = round(net_rev * 0.65)

            # Payment gateway fee: 0 for manual bank/e-wallet transfer, 0.7% for automated QRIS/payment gateway
            if ledger_record and getattr(ledger_record, "payment_fee", None) is not None:
                fee = float(ledger_record.payment_fee)
            else:
                pay_mode = str(o.get("paymentMode") or o.get("payment_mode") or "").lower()
                pay_method = str(o.get("paymentMethod") or o.get("payment_method") or "").lower()
                is_manual = (pay_mode == "manual") or pay_method.startswith("manual_")
                fee = 0.0 if is_manual else round(net_rev * 0.007)

            has_ref = bool(o.get("referralCode") or o.get("referral_code") or o.get("salesPartnerId") or o.get("sales_partner_id"))
            has_recruiter = bool(o.get("recruiterPartnerId") or o.get("recruiter_partner_id"))

            if is_cancelled:
                tx_profit = 0.0
                sales_comm = 0.0
                recruit_bonus = 0.0
                distributable = 0.0
                ceo_share = 0.0
                coo_share = 0.0
                reserve = 0.0
                entry_status = "reversed"
                comm_rate = 0.0
            elif ledger_record:
                tx_profit = float(ledger_record.transaction_profit)
                sales_comm = float(ledger_record.sales_commission or 0.0)
                comm_rate = float(ledger_record.sale_commission_rate or 0.0) * 100.0
                recruit_bonus = float(ledger_record.recruitment_bonus or 0.0)
                distributable = float(ledger_record.profit_distribution or 0.0)
                ceo_share = float(ledger_record.ceo_share or 0.0)
                coo_share = float(ledger_record.coo_share or 0.0)
                reserve = float(ledger_record.business_reserve or 0.0)
                entry_status = ledger_record.status or "available"
            else:
                tx_profit = max(0.0, net_rev - cog - fee)

                from app.services.referral_profit_service import ReferralProfitService

                p_ref = str(o.get("referralCode") or o.get("referral_code") or "").strip().upper()
                p_id_str = str(o.get("salesPartnerId") or o.get("sales_partner_id") or "").strip().upper()
                p_succ_orders = max(
                    len(partner_success_counts.get(p_ref, set())),
                    len(partner_success_counts.get(p_id_str, set()))
                )
                is_vip_partner = (p_succ_orders >= 50 or float(o.get("commissionRate") or 0) >= 20.0)

                campaign_override = float(o.get("campaignRate") or 0) if (o.get("campaignRate") or camp_disc > 0) else None

                alloc = ReferralProfitService.calculate_profit_allocation(
                    transaction_profit=tx_profit,
                    successful_orders_count=p_succ_orders,
                    is_vip=is_vip_partner,
                    has_sales_partner=has_ref,
                    has_recruiter=has_recruiter,
                    campaign_rate_override=campaign_override,
                )

                sales_comm = float(alloc["sales_commission"])
                comm_rate = float(alloc["sales_commission_rate"])
                recruit_bonus = float(alloc["recruitment_bonus"])
                distributable = float(alloc["profit_distribution"])
                ceo_share = float(alloc["ceo_share"])
                coo_share = float(alloc["coo_share"])
                reserve = float(alloc["business_reserve"])

                entry_status = "available"

            if is_completed:
                # Realized metrics ONLY accumulated for completed orders:
                total_gross_revenue += selling_price
                total_discounts += discount
                total_net_revenue += net_rev
                total_cost_of_goods += cog
                total_payment_fees += fee
                total_transaction_profit += tx_profit
                total_sales_commission += sales_comm
                total_recruitment_bonus += recruit_bonus
                total_profit_distribution += distributable
                total_ceo_share += ceo_share
                total_coo_share += coo_share
                total_business_reserve += reserve
                available_commission_total += sales_comm + recruit_bonus

            product_names = ", ".join([str(it.get("productName") or it.get("product_name") or "") for it in items if (it.get("productName") or it.get("product_name"))])
            if not product_names:
                product_names = "Produk Digital"
            first_product_id = str(items[0].get("productId") or items[0].get("product_id") or "") if items else ""

            direct_cost = cog + fee

            c_raw = o.get("customerName") or o.get("customer_name")
            entries.append({
                "id": f"ledg-{o.get('id', str(idx))}",
                "orderId": o.get("id"),
                "customerEmail": o.get("customerEmail") or o.get("customer_email") or "buyer@asterra.store",
                "customerName": c_raw or "Pelanggan",
                "productId": first_product_id,
                "productNames": product_names,
                "sellingPrice": selling_price,
                "customerReferralDiscount": discount,
                "netRevenue": net_rev,
                "costOfGoods": cog,
                "paymentFee": fee,
                "otherDirectCost": 0,
                "directTransactionCost": direct_cost,
                "transactionProfit": tx_profit,
                "salesId": o.get("salesPartnerId") or o.get("sales_partner_id"),
                "referralCode": o.get("referralCode") or o.get("referral_code"),
                "recruiterSalesId": o.get("recruiterPartnerId") or o.get("recruiter_partner_id"),
                "saleCommissionRate": (comm_rate / 100.0) if has_ref else 0.0,
                "recruitmentBonusRate": 0.02 if (has_ref and has_recruiter) else 0.0,
                "salesCommission": sales_comm,
                "recruitmentBonus": recruit_bonus,
                "profitDistribution": distributable,
                "ceoShare": ceo_share,
                "cooShare": coo_share,
                "businessReserve": reserve,
                "status": entry_status,
                "holdingUntil": o.get("expiresAt") or o.get("expires_at") or o.get("createdAt") or o.get("created_at") or (datetime.utcnow().isoformat() + "Z"),
                "createdAt": o.get("createdAt") or o.get("created_at") or (datetime.utcnow().isoformat() + "Z"),
                "updatedAt": o.get("updatedAt") or o.get("updated_at") or o.get("createdAt") or (datetime.utcnow().isoformat() + "Z"),
            })

        summary = {
            "totalOrders": total_orders,
            "totalGrossRevenue": total_gross_revenue,
            "totalDiscounts": total_discounts,
            "totalNetRevenue": total_net_revenue,
            "totalCostOfGoods": total_cost_of_goods,
            "totalPaymentFees": total_payment_fees,
            "totalTransactionProfit": total_transaction_profit,
            "totalSalesCommission": total_sales_commission,
            "totalRecruitmentBonus": total_recruitment_bonus,
            "totalProfitDistribution": total_profit_distribution,
            "totalCeoShare": total_ceo_share,
            "totalCooShare": total_coo_share,
            "totalBusinessReserve": total_business_reserve,
            "pendingCommissionTotal": pending_commission_total,
            "availableCommissionTotal": available_commission_total,
        }

        return {
            "summary": summary,
            "entries": entries,
        }
