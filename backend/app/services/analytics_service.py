import json
import pathlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from app.services.order_service import OrderService
from app.services.finance_service import FinanceService
from app.services.partner_service import PartnerService
from app.services.catalog_service import CatalogService

class AnalyticsService:
    @classmethod
    def get_dashboard_overview(cls) -> Dict[str, Any]:
        orders = OrderService.load_orders()
        profit_data = FinanceService.get_profit_distribution()
        profit_summary = profit_data.get("summary", {})
        partners = PartnerService.get_all_partners()

        # 1. Orders and Revenue KPIs
        total_orders = len(orders)
        completed_orders = 0
        pending_orders = 0
        processing_orders = 0
        cancelled_orders = 0
        total_revenue = 0.0

        customer_map = {}
        product_sales = {}
        daily_buckets = {f"{h:02d}:00": {"orders": 0, "revenue": 0.0} for h in [8, 11, 14, 17, 20, 23]}
        weekly_day_map = {0: "Senin", 1: "Selasa", 2: "Rabu", 3: "Kamis", 4: "Jumat", 5: "Sabtu", 6: "Minggu"}
        weekly_buckets = {name: {"orders": 0, "revenue": 0.0} for name in weekly_day_map.values()}
        monthly_buckets = {f"Minggu {w}": {"orders": 0, "revenue": 0.0} for w in range(1, 5)}

        from datetime import timezone
        WIB = timezone(timedelta(hours=7))
        now_wib = datetime.now(WIB)
        today_date = now_wib.date()

        for o in orders:
            status = str(o.get("status", "")).lower()
            amt = float(o.get("totalAmount") or o.get("rawAmount") or 0.0)

            # Customer tracking
            email = str(o.get("customerEmail") or o.get("customer_email") or "").lower().strip()
            name = o.get("customerName") or o.get("customer_name") or "Pelanggan"
            phone = o.get("customerWhatsapp") or o.get("customer_whatsapp") or ""
            created_str = o.get("createdAt") or o.get("created_at") or now_wib.isoformat()

            try:
                if "Z" in created_str:
                    created_dt = datetime.fromisoformat(created_str.replace("Z", "+00:00")).astimezone(WIB)
                elif "+" in created_str:
                    created_dt = datetime.fromisoformat(created_str).astimezone(WIB)
                else:
                    created_dt = datetime.fromisoformat(created_str).replace(tzinfo=timezone.utc).astimezone(WIB)
            except Exception:
                created_dt = now_wib

            if email:
                if email not in customer_map:
                    customer_map[email] = {
                        "name": name,
                        "email": email,
                        "phone": phone,
                        "orders": 0,
                        "spent": 0.0,
                        "firstOrder": created_dt,
                        "lastOrder": created_dt,
                    }
                cust = customer_map[email]
                cust["orders"] += 1
                cust["lastOrder"] = max(cust["lastOrder"], created_dt)

            pay_status = str(o.get("paymentStatus") or o.get("payment_status") or "").lower()
            is_cancelled = status in ["cancelled", "expired", "failed", "refunded"]
            is_settled_order = (status in ["completed", "paid", "settlement"]) or (
                pay_status in ["settlement", "paid"] and not is_cancelled
            )

            if status in ["completed", "paid", "settlement"]:
                completed_orders += 1
            elif status == "processing":
                processing_orders += 1
            elif is_cancelled:
                cancelled_orders += 1
            else:
                pending_orders += 1

            if is_settled_order:
                total_revenue += amt
                if email and email in customer_map:
                    customer_map[email]["spent"] += amt

                # Time-series grouping for charts
                # 1) Daily bucket (strictly for today's orders by closest 3-hour mark)
                if created_dt.date() == today_date:
                    hour = created_dt.hour
                    closest_h = min([8, 11, 14, 17, 20, 23], key=lambda x: abs(x - hour))
                    h_key = f"{closest_h:02d}:00"
                    if h_key in daily_buckets:
                        daily_buckets[h_key]["orders"] += 1
                        daily_buckets[h_key]["revenue"] += amt

                # 2) Weekly bucket (by day of week)
                day_name = weekly_day_map.get(created_dt.weekday(), "Senin")
                weekly_buckets[day_name]["orders"] += 1
                weekly_buckets[day_name]["revenue"] += amt

                # 3) Monthly bucket (by week of month 1-4)
                week_idx = min(4, max(1, (created_dt.day - 1) // 7 + 1))
                w_key = f"Minggu {week_idx}"
                if w_key in monthly_buckets:
                    monthly_buckets[w_key]["orders"] += 1
                    monthly_buckets[w_key]["revenue"] += amt

                # Product sales aggregation
                for it in o.get("items", []):
                    p_name = it.get("productName") or it.get("product_name") or "Layanan Digital"
                    qty = int(it.get("quantity", 1))
                    price = float(it.get("price") or it.get("unit_price") or 0.0)
                    if p_name not in product_sales:
                        product_sales[p_name] = {
                            "name": p_name,
                            "units": 0,
                            "revenue": 0.0,
                            "category": "Produk Digital",
                        }
                    product_sales[p_name]["units"] += qty
                    product_sales[p_name]["revenue"] += (price * qty) if price > 0 else amt

            elif status == "pending":
                pending_orders += 1
            elif status in ["cancelled", "expired", "failed"]:
                cancelled_orders += 1

        sales_chart_data = {
            "daily": [{"label": k, "orders": v["orders"], "revenue": v["revenue"]} for k, v in daily_buckets.items()],
            "weekly": [{"label": k, "orders": v["orders"], "revenue": v["revenue"]} for k, v in weekly_buckets.items()],
            "monthly": [{"label": k, "orders": v["orders"], "revenue": v["revenue"]} for k, v in monthly_buckets.items()],
        }

        # 2. Top Selling Products
        top_products_list = []
        for p_name, p_data in sorted(product_sales.items(), key=lambda x: x[1]["units"], reverse=True)[:5]:
            top_products_list.append({
                "name": p_name,
                "unitsSold": p_data["units"],
                "revenue": p_data["revenue"],
                "revenueFormatted": f"Rp {p_data['revenue']:,.0f}".replace(",", "."),
                "category": p_data["category"],
            })

        # 3. Customer metrics
        total_customers = len(customer_map)
        seven_days_ago = now_wib - timedelta(days=7)
        new_customers_count = sum(1 for c in customer_map.values() if c["firstOrder"] >= seven_days_ago)

        # 4. Gross Profit & Margins
        gross_profit = profit_summary.get("totalTransactionProfit", 0.0)
        profit_margin = round((gross_profit / total_revenue * 100), 1) if total_revenue > 0 else 0.0

        # 5. Recent real-time transactions
        recent_orders = sorted(
            orders,
            key=lambda x: x.get("createdAt") or x.get("created_at") or "",
            reverse=True
        )[:6]

        recent_txs = []
        for o in recent_orders:
            amt = float(o.get("totalAmount") or o.get("rawAmount") or 0.0)
            items = o.get("items") or []
            prod_name = items[0].get("productName") or items[0].get("product_name") if items else "Layanan Digital"
            created_str = o.get("createdAt") or o.get("created_at") or ""
            recent_txs.append({
                "id": o.get("id"),
                "orderId": o.get("id"),
                "customer": o.get("customerName") or o.get("customer_name") or "Pelanggan",
                "customerEmail": o.get("customerEmail") or o.get("customer_email") or "",
                "whatsapp": o.get("customerWhatsapp") or o.get("customer_whatsapp") or "",
                "product": prod_name,
                "amount": amt,
                "paymentMethod": o.get("paymentMethod") or o.get("payment_method") or "QRIS",
                "status": str(o.get("status", "pending")).lower(),
                "createdAt": created_str,
            })

        # 6. Affiliate Snapshot
        total_ref_revenue = sum(p.get("totalRevenue", 0) for p in partners)
        total_paid_comm = sum(p.get("paidCommission", 0) for p in partners)
        top_partner = sorted(partners, key=lambda x: x.get("totalRevenue", 0), reverse=True)[0] if partners else None

        return {
            "kpi": {
                "totalRevenue": total_revenue,
                "totalOrders": total_orders,
                "completedOrders": completed_orders,
                "pendingOrders": pending_orders,
                "processingOrders": processing_orders,
                "cancelledOrders": cancelled_orders,
                "totalCustomers": total_customers,
                "newCustomers": new_customers_count,
                "grossProfit": gross_profit,
                "profitMarginPercent": profit_margin,
            },
            "salesData": sales_chart_data,
            "topProducts": top_products_list,
            "recentTransactions": recent_txs,
            "affiliateSnapshot": {
                "totalPartners": len(partners),
                "totalReferralRevenue": total_ref_revenue,
                "totalPaidCommission": total_paid_comm,
                "topPartner": {
                    "name": top_partner.get("name"),
                    "code": top_partner.get("code"),
                    "totalRevenue": top_partner.get("totalRevenue", 0),
                    "totalOrders": top_partner.get("totalOrders", 0),
                } if top_partner else None,
            },
        }

    @classmethod
    def get_analytics_suite_data(cls) -> Dict[str, Any]:
        orders = OrderService.load_orders()
        profit_data = FinanceService.get_profit_distribution()
        profit_summary = profit_data.get("summary", {})
        partners = PartnerService.get_all_partners()
        managed_products = CatalogService.load_managed_products()

        # 1. Sales Time Series (Chronological daily sales from real orders)
        daily_records = {}
        for o in orders:
            status = str(o.get("status", "")).lower()
            pay_st = str(o.get("paymentStatus") or o.get("payment_status") or "").lower()
            is_settled = (status in ["completed", "paid", "settlement"]) or (pay_st in ["settlement", "paid"] and status not in ["cancelled", "expired", "failed", "refunded"])
            if is_settled:
                created_str = o.get("createdAt") or o.get("created_at") or ""
                amt = float(o.get("totalAmount") or o.get("rawAmount") or 0.0)
                try:
                    dt = datetime.fromisoformat(created_str.replace("Z", "+00:00"))
                    date_label = dt.strftime("%d %b")
                except Exception:
                    date_label = "01 Okt"

                if date_label not in daily_records:
                    daily_records[date_label] = {"date": date_label, "revenue": 0.0, "orders": 0}
                daily_records[date_label]["revenue"] += amt
                daily_records[date_label]["orders"] += 1

        sales_time_series = list(reversed(list(daily_records.values())))
        if not sales_time_series:
            sales_time_series = [{"date": "Hari Ini", "revenue": profit_summary.get("totalNetRevenue", 0.0), "orders": profit_summary.get("totalOrders", 0)}]

        # 2. Merchandise Performance Matrix
        # Group sales by product
        sold_by_prod = {}
        for o in orders:
            status = str(o.get("status", "")).lower()
            pay_st = str(o.get("paymentStatus") or o.get("payment_status") or "").lower()
            is_settled = (status in ["completed", "paid", "settlement"]) or (pay_st in ["settlement", "paid"] and status not in ["cancelled", "expired", "failed", "refunded"])
            if is_settled:
                for it in o.get("items", []):
                    p_name = it.get("productName") or it.get("product_name") or "Layanan Digital"
                    qty = int(it.get("quantity", 1))
                    price = float(it.get("price") or it.get("unit_price") or 0.0)
                    sold_by_prod[p_name] = sold_by_prod.get(p_name, {"units": 0, "rev": 0.0})
                    sold_by_prod[p_name]["units"] += qty
                    sold_by_prod[p_name]["rev"] += price * qty if price > 0 else float(o.get("totalAmount", 0))

        prod_matrix = []
        managed_map = {str(p.get("id")): p for p in managed_products}

        for idx, (p_name, s_data) in enumerate(sorted(sold_by_prod.items(), key=lambda x: x[1]["units"], reverse=True)):
            rev = s_data["rev"]
            units = s_data["units"]

            # Lookup providerPrice from catalog if available
            matched_p = next((p for p in managed_products if p.get("name") == p_name), None)
            if matched_p and matched_p.get("providerPrice"):
                cogs = float(matched_p["providerPrice"]) * units
                cat_name = matched_p.get("category", {}).get("name") if isinstance(matched_p.get("category"), dict) else str(matched_p.get("category") or "Katalog")
                provider = matched_p.get("provider", "VIP Reseller")
            else:
                cogs = round(rev * 0.65)
                cat_name = "AI Tools" if ("gemini" in p_name.lower() or "gpt" in p_name.lower()) else "Apps & Streaming"
                provider = "VIP Reseller"

            profit = max(0.0, rev - cogs)
            margin_pct = round((profit / rev) * 100, 1) if rev > 0 else 0.0

            prod_matrix.append({
                "id": f"perf-{idx + 1}",
                "name": p_name,
                "category": cat_name,
                "provider": provider,
                "unitsSold": units,
                "revenue": rev,
                "cogs": cogs,
                "profit": profit,
                "marginPercent": margin_pct,
                "refundRate": 0.0,
                "conversionRate": 100.0,
                "status": "active",
            })

        # Breakdown: Category Distribution from actual settled orders
        category_revenue = {}
        total_category_revenue = 0.0
        for o in orders:
            status = str(o.get("status", "")).lower()
            pay_st = str(o.get("paymentStatus") or o.get("payment_status") or "").lower()
            is_settled = (status in ["completed", "paid", "settlement"]) or (pay_st in ["settlement", "paid"] and status not in ["cancelled", "expired", "failed", "refunded"])
            if is_settled:
                for it in o.get("items", []):
                    p_name = it.get("productName") or it.get("product_name") or "Layanan Digital"
                    qty = int(it.get("quantity", 1))
                    price = float(it.get("price") or it.get("unit_price") or 0.0)
                    item_rev = (price * qty) if price > 0 else float(o.get("totalAmount") or 0.0)

                    matched_p = next((p for p in managed_products if p.get("name") == p_name), None)
                    if matched_p and isinstance(matched_p.get("category"), dict) and matched_p["category"].get("name"):
                        cat_label = matched_p["category"]["name"]
                    elif matched_p and matched_p.get("categoryName"):
                        cat_label = str(matched_p["categoryName"])
                    elif "gemini" in p_name.lower() or "gpt" in p_name.lower() or "ai" in p_name.lower():
                        cat_label = "AI Tools & Productivity"
                    elif "netflix" in p_name.lower() or "spotify" in p_name.lower() or "youtube" in p_name.lower():
                        cat_label = "Streaming & Hiburan"
                    elif "canva" in p_name.lower() or "capcut" in p_name.lower():
                        cat_label = "Desain & Grafis"
                    else:
                        cat_label = "Produk Digital"

                    category_revenue[cat_label] = category_revenue.get(cat_label, 0.0) + item_rev
                    total_category_revenue += item_rev

        category_dist = []
        for cat_name, c_rev in sorted(category_revenue.items(), key=lambda x: x[1], reverse=True):
            pct = round((c_rev / total_category_revenue * 100), 1) if total_category_revenue > 0 else 0.0
            category_dist.append({
                "name": cat_name,
                "revenue": c_rev,
                "percentage": pct,
                "formatted": f"{pct}% (Rp {c_rev:,.0f})".replace(",", "."),
            })

        # Breakdown: Payment Method Distribution from actual settled orders
        payment_method_counts = {}
        total_pay_orders = 0
        for o in orders:
            status = str(o.get("status", "")).lower()
            pay_st = str(o.get("paymentStatus") or o.get("payment_status") or "").lower()
            is_settled = (status in ["completed", "paid", "settlement"]) or (pay_st in ["settlement", "paid"] and status not in ["cancelled", "expired", "failed", "refunded"])
            if is_settled:
                pm = str(o.get("paymentMethod") or o.get("payment_method") or "QRIS").upper()
                if "QRIS" in pm:
                    pm_label = "QRIS Real-Time"
                elif "BCA" in pm:
                    pm_label = "BCA Virtual Account"
                elif "DANA" in pm:
                    pm_label = "DANA E-Wallet"
                elif "TRIPAY" in pm:
                    pm_label = "Payment Gateway"
                else:
                    pm_label = pm.replace("_", " ").title()
                payment_method_counts[pm_label] = payment_method_counts.get(pm_label, 0) + 1
                total_pay_orders += 1

        payment_dist = []
        for pm_label, count in sorted(payment_method_counts.items(), key=lambda x: x[1], reverse=True):
            pct = round((count / total_pay_orders * 100), 1) if total_pay_orders > 0 else 0.0
            payment_dist.append({
                "name": pm_label,
                "orders": count,
                "percentage": pct,
                "formatted": f"{pct}% ({count} Orders)",
            })

        # Breakdown: Channel Acquisition from actual settled orders
        direct_orders = 0
        affiliate_orders = 0
        campaign_orders = 0
        total_acq_orders = 0
        for o in orders:
            status = str(o.get("status", "")).lower()
            pay_st = str(o.get("paymentStatus") or o.get("payment_status") or "").lower()
            is_settled = (status in ["completed", "paid", "settlement"]) or (pay_st in ["settlement", "paid"] and status not in ["cancelled", "expired", "failed", "refunded"])
            if is_settled:
                total_acq_orders += 1
                if o.get("salesPartnerId") or o.get("sales_partner_id") or o.get("referralCode") or o.get("referral_code"):
                    affiliate_orders += 1
                elif o.get("campaignId") or o.get("campaign_id") or (o.get("campaignDiscount") or 0) > 0 or (o.get("promoDiscount") or 0) > 0:
                    campaign_orders += 1
                else:
                    direct_orders += 1

        channel_dist = [
            {
                "name": "Direct Toko / Search",
                "orders": direct_orders,
                "percentage": round((direct_orders / total_acq_orders * 100), 1) if total_acq_orders > 0 else 0.0,
            },
            {
                "name": "Mitra Afiliasi & Sales",
                "orders": affiliate_orders,
                "percentage": round((affiliate_orders / total_acq_orders * 100), 1) if total_acq_orders > 0 else 0.0,
            },
            {
                "name": "Campaign Promo / Kupon",
                "orders": campaign_orders,
                "percentage": round((campaign_orders / total_acq_orders * 100), 1) if total_acq_orders > 0 else 0.0,
            },
        ]

        # 3. Affiliate Telemetry Matrix
        aff_matrix = []
        for a in partners:
            clicks = int(a.get("totalClicks") or 0)
            orders_count = int(a.get("totalOrders", 0))
            conv_rate = round((orders_count / clicks * 100), 1) if clicks > 0 else 0.0
            rev = float(a.get("totalRevenue", 0))
            comm = float(a.get("paidCommission", 0) + a.get("unpaidCommission", 0))

            aff_matrix.append({
                "code": a.get("code"),
                "partnerName": a.get("name"),
                "clicks": clicks,
                "referralOrders": orders_count,
                "conversionRate": conv_rate,
                "generatedRevenue": rev,
                "commissionEarned": comm,
                "activeStatus": "Aktif" if a.get("status") == "active" else "Nonaktif",
            })

        # 4. Formal Income Statement (P&L)
        gross_rev = profit_summary.get("totalGrossRevenue", 0.0)
        discounts = profit_summary.get("totalDiscounts", 0.0)
        net_rev = profit_summary.get("totalNetRevenue", 0.0)
        cogs = profit_summary.get("totalCostOfGoods", 0.0)
        gross_profit = max(0.0, net_rev - cogs)
        pg_fees = profit_summary.get("totalPaymentFees", 0.0)
        commissions = profit_summary.get("totalSalesCommission", 0.0) + profit_summary.get("totalRecruitmentBonus", 0.0)
        transaction_profit = profit_summary.get("totalTransactionProfit", max(0.0, gross_profit - pg_fees))
        profit_distribution = profit_summary.get("totalProfitDistribution", max(0.0, transaction_profit - commissions))
        ceo_share = profit_summary.get("totalCeoShare", round(profit_distribution * 0.40))
        coo_share = profit_summary.get("totalCooShare", round(profit_distribution * 0.40))
        business_reserve = profit_summary.get("totalBusinessReserve", round(profit_distribution * 0.20))

        return {
            "salesTimeSeries": sales_time_series,
            "productPerformanceData": prod_matrix,
            "affiliatePerformanceData": aff_matrix,
            "breakdown": {
                "categoryDistribution": category_dist,
                "paymentMethodDistribution": payment_dist,
                "channelAcquisition": channel_dist,
            },
            "financialReport": {
                "period": f"01 {datetime.utcnow().strftime('%B %Y')} - {datetime.utcnow().strftime('%d %B %Y')}",
                "grossRevenue": gross_rev,
                "discounts": discounts,
                "netRevenue": net_rev,
                "cogs": cogs,
                "grossProfit": gross_profit,
                "pgFees": pg_fees,
                "commissions": commissions,
                "infraOpex": 0.0,
                "totalOpex": pg_fees + commissions,
                "netOperatingProfit": profit_distribution,
                "ceoShare": ceo_share,
                "cooShare": coo_share,
                "businessReserve": business_reserve,
            },
        }

    @classmethod
    def get_finance_summary(cls) -> Dict[str, Any]:
        orders = OrderService.load_orders()
        profit_data = FinanceService.get_profit_distribution()
        summary = profit_data.get("summary", {})
        ledger_entries = profit_data.get("entries", [])

        # 1. Wallets
        completed_orders = [o for o in orders if str(o.get("status")).lower() in ["completed", "paid", "settlement"]]
        tripay_settled = sum(
            float(o.get("totalAmount") or o.get("rawAmount") or 0.0)
            for o in completed_orders
            if "tripay" in str(o.get("paymentMode", "")).lower() or "qris" in str(o.get("paymentMethod", "")).lower()
        )
        vip_deposit = 0.0
        reserve_balance = summary.get("totalBusinessReserve", 0.0)

        # 2. Revenue Breakdown & Channels
        channel_counts = {}
        for o in completed_orders:
            method = str(o.get("paymentMethod") or o.get("payment_method") or "MANUAL_BCA").upper()
            amt = float(o.get("totalAmount") or o.get("rawAmount") or 0.0)
            channel_counts[method] = channel_counts.get(method, 0.0) + amt

        total_settled_rev = sum(channel_counts.values()) or 1.0
        payment_channels = []
        for m, amt in channel_counts.items():
            pct = round((amt / total_settled_rev) * 100, 1)
            payment_channels.append({
                "name": m,
                "amount": amt,
                "percentage": pct,
            })

        # 3. Real Expenses List
        cogs_total = summary.get("totalCostOfGoods", 0.0)
        pg_fees_total = summary.get("totalPaymentFees", 0.0)
        commissions_total = summary.get("totalSalesCommission", 0.0)

        expenses_list = [
            {
                "id": "exp-1",
                "category": "Modal Supplier VIP Reseller",
                "desc": "Pembelian lisensi & API auto-fulfillment transaksi lunas",
                "amount": cogs_total,
                "date": datetime.utcnow().strftime("%d %b %Y"),
                "ref": "INV-VIP-SSOT",
            },
            {
                "id": "exp-2",
                "category": "Payment Gateway Fee (Tripay / QRIS)",
                "desc": "Fee gateway 0.7% transaksi perbankan",
                "amount": pg_fees_total,
                "date": datetime.utcnow().strftime("%d %b %Y"),
                "ref": "TRIPAY-PG-07",
            },
            {
                "id": "exp-3",
                "category": "Komisi Mitra Affiliate",
                "desc": "Bagi hasil transaksi referral mitra aktif",
                "amount": commissions_total,
                "date": datetime.utcnow().strftime("%d %b %Y"),
                "ref": "AFF-COMM-10",
            },
        ]

        total_expense = sum(e["amount"] for e in expenses_list)

        # 4. Financial Transactions (Ledger Entries as Jurnal Kas Mutasi)
        journal_entries = []
        running_balance = summary.get("totalNetRevenue", 0.0)
        for idx, item in enumerate(ledger_entries[:30]):
            created_str = item.get("createdAt") or datetime.utcnow().isoformat()
            try:
                date_fmt = datetime.fromisoformat(created_str.replace("Z", "+00:00")).strftime("%d %b %Y, %H:%M")
            except Exception:
                date_fmt = datetime.utcnow().strftime("%d %b %Y, %H:%M")

            # Credit entry: Customer payment
            journal_entries.append({
                "id": f"TX-CR-{item.get('orderId', idx)}",
                "type": "Credit",
                "desc": f"Pembayaran Order {item.get('orderId')} ({item.get('productNames', 'Produk')})",
                "amount": item.get("netRevenue", 0.0),
                "balance": running_balance,
                "date": date_fmt,
            })

            # Debit entry: Supplier COGS deduction
            running_balance = max(0.0, running_balance - item.get("costOfGoods", 0.0))
            journal_entries.append({
                "id": f"TX-DB-{item.get('orderId', idx)}",
                "type": "Debit",
                "desc": f"Deduction Upstream Supplier Order {item.get('orderId')}",
                "amount": item.get("costOfGoods", 0.0),
                "balance": running_balance,
                "date": date_fmt,
            })

        # Accurate WIB time filtering for today and current month revenue
        from datetime import timezone
        WIB = timezone(timedelta(hours=7))
        now_wib = datetime.now(WIB)
        today_date = now_wib.date()
        current_year = now_wib.year
        current_month = now_wib.month

        today_rev = 0.0
        month_rev = 0.0

        for o in completed_orders:
            created_str = o.get("createdAt") or o.get("created_at") or ""
            try:
                if "Z" in created_str:
                    c_dt = datetime.fromisoformat(created_str.replace("Z", "+00:00")).astimezone(WIB)
                elif "+" in created_str:
                    c_dt = datetime.fromisoformat(created_str).astimezone(WIB)
                else:
                    c_dt = datetime.fromisoformat(created_str).replace(tzinfo=timezone.utc).astimezone(WIB)
            except Exception:
                c_dt = now_wib

            amt = float(o.get("totalAmount") or o.get("rawAmount") or 0.0)
            if c_dt.date() == today_date:
                today_rev += amt
            if c_dt.year == current_year and c_dt.month == current_month:
                month_rev += amt

        net_rev_total = summary.get("totalNetRevenue", 0.0)
        aov = round(net_rev_total / max(1, len(completed_orders))) if completed_orders else 0.0

        return {
            "wallets": {
                "tripayBalance": tripay_settled,
                "vipBalance": vip_deposit,
                "reserveBalance": reserve_balance,
            },
            "revenue": {
                "todayRevenue": today_rev,
                "monthRevenue": month_rev,
                "aov": aov,
                "completedOrders": len(completed_orders),
                "paymentChannels": payment_channels,
            },
            "expenses": expenses_list,
            "totalExpense": total_expense,
            "financialTransactions": journal_entries[:40],
        }

    @classmethod
    def get_customers(cls) -> List[Dict[str, Any]]:
        orders = OrderService.load_orders()
        customer_map = {}

        for o in orders:
            email = str(o.get("customerEmail") or o.get("customer_email") or "").lower().strip()
            if not email:
                continue

            name = o.get("customerName") or o.get("customer_name") or "Pelanggan"
            phone = o.get("customerWhatsapp") or o.get("customer_whatsapp") or ""
            amt = float(o.get("totalAmount") or o.get("rawAmount") or 0.0)
            st = str(o.get("status", "pending")).lower()
            date_str = o.get("createdAt") or o.get("created_at") or datetime.utcnow().isoformat()
            items = o.get("items") or []
            prod_name = items[0].get("productName") or items[0].get("product_name") if items else "Layanan Digital"

            if email not in customer_map:
                customer_map[email] = {
                    "id": f"cust-{abs(hash(email)) % 10000}",
                    "name": name,
                    "email": email,
                    "whatsapp": phone,
                    "totalOrders": 0,
                    "completedOrders": 0,
                    "totalSpent": 0.0,
                    "lastOrderDate": date_str,
                    "joinedAt": date_str,
                    "referralCode": o.get("referralCode"),
                    "purchasedProducts": set(),
                    "recentOrders": [],
                }

            c = customer_map[email]
            c["totalOrders"] += 1
            is_order_settled = (st in ["completed", "paid", "settlement"]) or (
                str(o.get("paymentStatus") or o.get("payment_status") or "").lower() in ["settlement", "paid"]
                and st not in ["cancelled", "expired", "failed", "refunded"]
            )
            if st in ["completed", "paid", "settlement"]:
                c["completedOrders"] = c.get("completedOrders", 0) + 1
            if is_order_settled:
                c["totalSpent"] += amt
            c["purchasedProducts"].add(prod_name)
            c["recentOrders"].append({
                "orderId": o.get("id"),
                "product": prod_name,
                "amount": amt,
                "date": date_str,
                "status": st,
            })

        customers_list = []
        for c in customer_map.values():
            spent = c["totalSpent"]
            if spent >= 500000:
                tier = "VIP Platinum"
            elif spent >= 200000:
                tier = "Gold Member"
            elif spent >= 50000:
                tier = "Silver"
            else:
                tier = "Reguler"

            customers_list.append({
                **c,
                "tier": tier,
                "purchasedProducts": list(c["purchasedProducts"]),
                "recentOrders": c["recentOrders"][:5],
            })

        return sorted(customers_list, key=lambda x: x["totalSpent"], reverse=True)
