import json
import pathlib
from datetime import datetime
from typing import Dict, Any, List

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
ORDERS_FILE = DATA_DIR / "supabase-orders.json"

class FinanceService:
    @classmethod
    def load_orders(cls) -> List[Dict[str, Any]]:
        if ORDERS_FILE.exists():
            try:
                data = json.loads(ORDERS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    return data
            except Exception as e:
                print(f"[FinanceService] Error loading orders: {e}")
        return []

    @classmethod
    def get_profit_distribution(cls) -> Dict[str, Any]:
        orders = cls.load_orders()

        total_orders = len(orders)
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

        for idx, o in enumerate(orders):
            selling_price = float(o.get("rawAmount") or o.get("totalAmount") or 50000)
            promo_disc = float(o.get("promoDiscount") or 0)
            ref_disc = float(o.get("referralDiscount") or 0)
            discount = promo_disc + ref_disc

            net_rev = max(0.0, selling_price - discount)

            # Upstream cost of goods (~65% of net revenue)
            cog = round(net_rev * 0.65)
            # Payment gateway fee (~0.7% for QRIS)
            fee = round(net_rev * 0.007)

            tx_profit = max(0.0, net_rev - cog - fee)

            # Referral commission (10% of profit if partner referral, otherwise 0)
            has_ref = bool(o.get("referralCode") or o.get("salesPartnerId"))
            sales_comm = round(tx_profit * 0.10) if has_ref else 0
            recruit_bonus = round(tx_profit * 0.02) if (has_ref and o.get("recruiterPartnerId")) else 0

            distributable = max(0.0, tx_profit - sales_comm - recruit_bonus)

            ceo_share = round(distributable * 0.50)
            coo_share = round(distributable * 0.40)
            reserve = distributable - ceo_share - coo_share

            st = str(o.get("status", "")).lower()
            entry_status = "available" if st in ["completed", "paid", "settlement"] else ("pending" if st == "processing" else "pending")

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

            if entry_status == "pending":
                pending_commission_total += sales_comm + recruit_bonus
            else:
                available_commission_total += sales_comm + recruit_bonus

            items = o.get("items") or []
            product_names = ", ".join([str(it.get("productName", "")) for it in items if it.get("productName")])
            if not product_names:
                product_names = "Produk Digital"
            first_product_id = str(items[0].get("productId", "")) if items else ""

            direct_cost = cog + fee

            entries.append({
                "id": f"ledg-{o.get('id', str(idx))}",
                "orderId": o.get("id"),
                "customerEmail": o.get("customerEmail") or "buyer@asterra.store",
                "customerName": o.get("customerName") or "Pelanggan",
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
                "salesId": o.get("salesPartnerId"),
                "referralCode": o.get("referralCode"),
                "recruiterSalesId": o.get("recruiterPartnerId"),
                "saleCommissionRate": 0.10 if has_ref else 0.0,
                "recruitmentBonusRate": 0.02 if (has_ref and o.get("recruiterPartnerId")) else 0.0,
                "salesCommission": sales_comm,
                "recruitmentBonus": recruit_bonus,
                "profitDistribution": distributable,
                "ceoShare": ceo_share,
                "cooShare": coo_share,
                "businessReserve": reserve,
                "status": entry_status,
                "holdingUntil": o.get("expiresAt") or o.get("createdAt") or datetime.utcnow().isoformat() + "Z",
                "createdAt": o.get("createdAt") or datetime.utcnow().isoformat() + "Z",
                "updatedAt": o.get("updatedAt") or o.get("createdAt") or datetime.utcnow().isoformat() + "Z",
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
