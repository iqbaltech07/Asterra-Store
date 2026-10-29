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
                if status in ["completed", "selesai", "done"]:
                    cust["spent"] += amt

            if status in ["completed", "selesai", "done"]:
                completed_orders += 1
                total_revenue += amt

                # Time-series grouping for charts
                # 1) Daily bucket (strictly for today's orders by closest 3-hour mark)
                if created_dt.date() == today_date:
                    hour = created_dt.hour
                    closest_h = min([8, 11, 14, 17, 20, 23], key=lambda x: abs(x - hour))
                    h_key = f"{closest_h:02d}:00"
                    if h_key in daily_buckets:
                        daily_buckets[h_key]["orders"] += 1
                        daily_buckets[h_key]["revenue"] += amt

                # 2) Weekly bucket (strictly last 7 days)
                days_diff = (today_date - created_dt.date()).days
                if 0 <= days_diff < 7:
                    day_name = weekly_day_map.get(created_dt.weekday(), "Senin")
                    weekly_buckets[day_name]["orders"] += 1
                    weekly_buckets[day_name]["revenue"] += amt

                # 3) Monthly bucket (strictly current calendar month)
                if created_dt.year == today_date.year and created_dt.month == today_date.month:
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
            elif status in ["processing", "process", "diproses"]:
                processing_orders += 1
                # STRICT: Do not add to total_revenue until order status is completed/selesai!
            elif status in ["cancelled", "expired", "failed", "batal"]:
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
            from app.services.partner_service import mask_customer_name
            c_raw = o.get("customerName") or o.get("customer_name")
            c_display = mask_customer_name(c_raw) if c_raw else "Pelanggan"
            recent_txs.append({
                "id": o.get("id"),
                "orderId": o.get("id"),
                "customer": c_display,
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
    def get_analytics_suite_data(cls, period: str = "30d") -> Dict[str, Any]:
        orders = OrderService.load_orders()
        profit_data = FinanceService.get_profit_distribution()
        profit_summary = profit_data.get("summary", {})
        partners = PartnerService.get_all_partners()
        managed_products = CatalogService.load_managed_products()

        from datetime import timezone
        WIB = timezone(timedelta(hours=7))
        now_wib = datetime.now(WIB)
        today_date = now_wib.date()

        # Parse completed orders with timezone and units
        parsed_orders = []
        for o in orders:
            status = str(o.get("status", "")).lower()
            if status in ["completed", "selesai", "done"]:
                created_str = o.get("createdAt") or o.get("created_at") or now_wib.isoformat()
                try:
                    if "Z" in created_str:
                        dt = datetime.fromisoformat(created_str.replace("Z", "+00:00")).astimezone(WIB)
                    elif "+" in created_str:
                        dt = datetime.fromisoformat(created_str).astimezone(WIB)
                    else:
                        dt = datetime.fromisoformat(created_str).replace(tzinfo=timezone.utc).astimezone(WIB)
                except Exception:
                    dt = now_wib

                gross_amt = float(o.get("rawAmount") or o.get("totalAmount") or 0.0)
                net_amt = float(o.get("totalAmount") or o.get("rawAmount") or 0.0)
                items = o.get("items") or []
                units = sum(int(it.get("quantity", 1)) for it in items) or 1
                parsed_orders.append({
                    "order": o,
                    "dt": dt,
                    "gross_amt": gross_amt,
                    "net_amt": net_amt,
                    "units": units,
                    "items": items,
                })

        # Helper to compute breakdown stats for any subset of orders
        def compute_breakdowns(orders_subset):
            total_rev = sum(po["gross_amt"] for po in orders_subset)
            total_orders = len(orders_subset)
            aov = round(total_rev / total_orders) if total_orders > 0 else 0
            total_units = sum(po["units"] for po in orders_subset)

            # Category Breakdown
            cat_map = {}
            for po in orders_subset:
                items = po["items"]
                for it in items:
                    p_name = it.get("productName") or it.get("product_name") or ""
                    raw_cat = it.get("category") or "Katalog"
                    cat_name = raw_cat.get("name") if isinstance(raw_cat, dict) else str(raw_cat)

                    if any(k in p_name.lower() for k in ["gemini", "gpt", "ai", "claude"]):
                        cat_name = "AI Tools & Productivity"
                    elif any(k in p_name.lower() for k in ["netflix", "spotify", "youtube", "vidio", "disney"]):
                        cat_name = "Streaming & Hiburan"
                    elif any(k in p_name.lower() for k in ["canva", "capcut", "adobe", "figma"]):
                        cat_name = "Desain & Grafis"

                    price = float(it.get("price") or it.get("unit_price") or 0.0)
                    qty = int(it.get("quantity", 1))
                    item_rev = (price * qty) if price > 0 else po["gross_amt"]
                    cat_map[cat_name] = cat_map.get(cat_name, 0.0) + item_rev

            total_cat_rev = sum(cat_map.values()) or total_rev or 1.0
            category_distribution = []
            for c_name, c_rev in sorted(cat_map.items(), key=lambda x: x[1], reverse=True):
                category_distribution.append({
                    "name": c_name,
                    "revenue": c_rev,
                    "percentage": round((c_rev / total_cat_rev) * 100, 1),
                })
            if not category_distribution:
                category_distribution = [
                    {"name": "AI Tools & Productivity", "revenue": 0, "percentage": 0},
                    {"name": "Streaming & Hiburan", "revenue": 0, "percentage": 0},
                    {"name": "Desain & Grafis", "revenue": 0, "percentage": 0},
                ]

            # Payment Methods Breakdown
            method_map = {}
            for po in orders_subset:
                m = str(po["order"].get("paymentMethod") or po["order"].get("payment_method") or "QRIS").lower()
                if "qris" in m:
                    label = "QRIS Real-Time"
                elif "dana" in m:
                    label = "DANA / E-Wallet"
                elif "bca" in m:
                    label = "BCA Virtual Account"
                elif "mandiri" in m:
                    label = "Mandiri Virtual Account"
                elif "transfer" in m or "manual" in m:
                    label = "Bank Transfer Manual"
                else:
                    label = po["order"].get("paymentMethod") or "QRIS Real-Time"
                method_map[label] = method_map.get(label, 0) + 1

            total_method_orders = sum(method_map.values()) or total_orders or 1
            payment_methods = []
            for m_name, m_cnt in sorted(method_map.items(), key=lambda x: x[1], reverse=True):
                payment_methods.append({
                    "name": m_name,
                    "orders": m_cnt,
                    "percentage": round((m_cnt / total_method_orders) * 100, 1),
                })
            if not payment_methods:
                payment_methods = [
                    {"name": "QRIS Real-Time", "orders": 0, "percentage": 0},
                    {"name": "DANA / E-Wallet", "orders": 0, "percentage": 0},
                    {"name": "BCA Virtual Account", "orders": 0, "percentage": 0},
                ]

            # Channel Acquisition Breakdown
            channel_map = {"Mitra Afiliasi & Sales": 0, "Campaign Promo / Kupon": 0, "Direct Toko / Search": 0}
            for po in orders_subset:
                ord_data = po["order"]
                if ord_data.get("referralCode") or ord_data.get("salesPartnerId"):
                    channel_map["Mitra Afiliasi & Sales"] += 1
                elif float(ord_data.get("promoDiscount") or 0) > 0 or ord_data.get("campaignId"):
                    channel_map["Campaign Promo / Kupon"] += 1
                else:
                    channel_map["Direct Toko / Search"] += 1

            total_channel_orders = sum(channel_map.values()) or total_orders or 1
            channels = []
            for ch_name, ch_cnt in sorted(channel_map.items(), key=lambda x: x[1], reverse=True):
                channels.append({
                    "name": ch_name,
                    "orders": ch_cnt,
                    "percentage": round((ch_cnt / total_channel_orders) * 100, 1),
                })

            return {
                "kpi": {
                    "grossRevenue": total_rev,
                    "totalOrders": total_orders,
                    "averageOrderValue": aov,
                    "totalUnits": total_units,
                },
                "categoryDistribution": category_distribution,
                "paymentMethods": payment_methods,
                "channels": channels,
            }

        # 1. TODAY: Hourly 3-hour intervals
        today_orders = [po for po in parsed_orders if po["dt"].date() == today_date]
        today_breakdown = compute_breakdowns(today_orders)
        hour_intervals = [0, 3, 6, 9, 12, 15, 18, 21]
        today_series = [{"label": f"{h:02d}:00", "date": f"Hari ini {h:02d}:00", "revenue": 0.0, "orders": 0, "units": 0} for h in hour_intervals]
        for po in today_orders:
            h = po["dt"].hour
            closest_h = min(hour_intervals, key=lambda x: abs(x - h))
            idx = hour_intervals.index(closest_h)
            today_series[idx]["revenue"] += po["gross_amt"]
            today_series[idx]["orders"] += 1
            today_series[idx]["units"] += po["units"]

        # 2. 7 DAYS: Daily from 6 days ago up to today
        seven_days_ago = today_date - timedelta(days=6)
        seven_days_orders = [po for po in parsed_orders if po["dt"].date() >= seven_days_ago]
        seven_days_breakdown = compute_breakdowns(seven_days_orders)
        seven_days_series = []
        for i in range(6, -1, -1):
            d = today_date - timedelta(days=i)
            day_label = d.strftime("%d %b")
            day_orders = [po for po in seven_days_orders if po["dt"].date() == d]
            seven_days_series.append({
                "label": day_label,
                "date": day_label,
                "revenue": sum(po["gross_amt"] for po in day_orders),
                "orders": len(day_orders),
                "units": sum(po["units"] for po in day_orders),
            })

        # 3. 30 DAYS: Daily breakdown across 30 days
        thirty_days_ago = today_date - timedelta(days=29)
        thirty_days_orders = [po for po in parsed_orders if po["dt"].date() >= thirty_days_ago]
        thirty_days_breakdown = compute_breakdowns(thirty_days_orders)
        thirty_days_series = []
        for i in range(29, -1, -1):
            d = today_date - timedelta(days=i)
            day_label = d.strftime("%d %b")
            day_orders = [po for po in thirty_days_orders if po["dt"].date() == d]
            thirty_days_series.append({
                "label": day_label,
                "date": day_label,
                "revenue": sum(po["gross_amt"] for po in day_orders),
                "orders": len(day_orders),
                "units": sum(po["units"] for po in day_orders),
            })

        # 4. MONTH: 4 weekly buckets of current month
        first_of_month = today_date.replace(day=1)
        month_orders = [po for po in parsed_orders if po["dt"].date() >= first_of_month]
        month_breakdown = compute_breakdowns(month_orders)
        month_weeks = {}
        for w in range(1, 5):
            month_weeks[f"Minggu {w}"] = {"revenue": 0.0, "orders": 0, "units": 0, "date": f"Minggu {w} ({now_wib.strftime('%b %Y')})"}
        for po in month_orders:
            week_num = min(4, max(1, (po["dt"].day - 1) // 7 + 1))
            k = f"Minggu {week_num}"
            month_weeks[k]["revenue"] += po["gross_amt"]
            month_weeks[k]["orders"] += 1
            month_weeks[k]["units"] += po["units"]
        month_series = [{"label": k, "date": v["date"], "revenue": v["revenue"], "orders": v["orders"], "units": v["units"]} for k, v in month_weeks.items()]

        # 5. YEAR: 12 months
        year_orders = [po for po in parsed_orders if po["dt"].year == today_date.year]
        year_breakdown = compute_breakdowns(year_orders)
        month_names = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
        year_series = [{"label": m, "date": f"{m} {today_date.year}", "revenue": 0.0, "orders": 0, "units": 0} for m in month_names]
        for po in year_orders:
            m_idx = po["dt"].month - 1
            if 0 <= m_idx < 12:
                year_series[m_idx]["revenue"] += po["gross_amt"]
                year_series[m_idx]["orders"] += 1
                year_series[m_idx]["units"] += po["units"]

        all_periods = {
            "today": {
                "salesTimeSeries": today_series,
                "kpi": today_breakdown["kpi"],
                "categoryDistribution": today_breakdown["categoryDistribution"],
                "paymentMethods": today_breakdown["paymentMethods"],
                "channels": today_breakdown["channels"],
            },
            "7d": {
                "salesTimeSeries": seven_days_series,
                "kpi": seven_days_breakdown["kpi"],
                "categoryDistribution": seven_days_breakdown["categoryDistribution"],
                "paymentMethods": seven_days_breakdown["paymentMethods"],
                "channels": seven_days_breakdown["channels"],
            },
            "30d": {
                "salesTimeSeries": thirty_days_series,
                "kpi": thirty_days_breakdown["kpi"],
                "categoryDistribution": thirty_days_breakdown["categoryDistribution"],
                "paymentMethods": thirty_days_breakdown["paymentMethods"],
                "channels": thirty_days_breakdown["channels"],
            },
            "month": {
                "salesTimeSeries": month_series,
                "kpi": month_breakdown["kpi"],
                "categoryDistribution": month_breakdown["categoryDistribution"],
                "paymentMethods": month_breakdown["paymentMethods"],
                "channels": month_breakdown["channels"],
            },
            "year": {
                "salesTimeSeries": year_series,
                "kpi": year_breakdown["kpi"],
                "categoryDistribution": year_breakdown["categoryDistribution"],
                "paymentMethods": year_breakdown["paymentMethods"],
                "channels": year_breakdown["channels"],
            },
        }

        active_period = period if period in all_periods else "30d"
        selected_data = all_periods[active_period]

        # 2. Merchandise Performance Matrix
        sold_by_prod = {}
        for o in orders:
            if str(o.get("status", "")).lower() in ["completed", "paid", "settlement"]:
                for it in o.get("items", []):
                    p_name = it.get("productName") or it.get("product_name") or "Layanan Digital"
                    qty = int(it.get("quantity", 1))
                    price = float(it.get("price") or it.get("unit_price") or 0.0)
                    sold_by_prod[p_name] = sold_by_prod.get(p_name, {"units": 0, "rev": 0.0})
                    sold_by_prod[p_name]["units"] += qty
                    sold_by_prod[p_name]["rev"] += price * qty if price > 0 else float(o.get("totalAmount", 0))

        prod_matrix = []
        for idx, (p_name, s_data) in enumerate(sorted(sold_by_prod.items(), key=lambda x: x[1]["units"], reverse=True)):
            rev = s_data["rev"]
            units = s_data["units"]

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

        # 3. Affiliate Telemetry Matrix
        aff_matrix = []
        for a in partners:
            clicks = int(a.get("totalClicks") or 0)
            succ_orders = int(a.get("successfulOrders") if a.get("successfulOrders") is not None else a.get("totalOrders", 0))
            conv_rate = round((succ_orders / clicks * 100), 1) if clicks > 0 else 0.0
            rev = float(a.get("totalRevenue", 0))
            comm = float(a.get("paidCommission", 0) + a.get("unpaidCommission", 0))

            aff_matrix.append({
                "code": a.get("code"),
                "partnerName": a.get("name"),
                "clicks": clicks,
                "referralOrders": succ_orders,
                "conversionRate": conv_rate,
                "generatedRevenue": rev,
                "commissionEarned": comm,
                "activeStatus": a.get("tier", "Standard (15%)"),
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
        ceo_share = profit_summary.get("totalCeoShare", round(profit_distribution * 0.35))
        coo_share = profit_summary.get("totalCooShare", round(profit_distribution * 0.35))
        business_reserve = profit_summary.get("totalBusinessReserve", profit_distribution - ceo_share - coo_share)

        return {
            "period": active_period,
            "salesTimeSeries": selected_data["salesTimeSeries"],
            "periodKpi": selected_data["kpi"],
            "categoryDistribution": selected_data["categoryDistribution"],
            "paymentMethods": selected_data["paymentMethods"],
            "channels": selected_data["channels"],
            "periods": all_periods,
            "productPerformanceData": prod_matrix,
            "affiliatePerformanceData": aff_matrix,
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

        # 1. Wallets (Strictly completed/selesai orders, excluding corrupt zero-profit order AST-ORD-20261015-7615)
        completed_orders = [
            o for o in orders 
            if str(o.get("status")).lower() in ["completed", "selesai", "done"]
            and str(o.get("id") or o.get("order_id") or "").strip().upper() != "AST-ORD-20261015-7615"
        ]
        tripay_settled = sum(
            float(o.get("totalAmount") or o.get("rawAmount") or 0.0)
            for o in completed_orders
            if "tripay" in str(o.get("paymentMode", "")).lower() or "qris" in str(o.get("paymentMethod", "")).lower()
        )
        from app.services.vip_service import VipService
        vip_info = VipService.get_profile()
        vip_deposit = float(vip_info.get("balance") or 0.0) if vip_info.get("connected") else 0.0
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
                    "totalSpent": 0.0,
                    "lastOrderDate": date_str,
                    "joinedAt": date_str,
                    "referralCode": o.get("referralCode"),
                    "purchasedProducts": set(),
                    "recentOrders": [],
                }

            c = customer_map[email]
            c["totalOrders"] += 1
            if st in ["completed", "paid", "settlement"]:
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
