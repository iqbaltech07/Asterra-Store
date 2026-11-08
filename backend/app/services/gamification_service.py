import uuid
import math
import random
from datetime import datetime, date, timedelta, timezone
from typing import Dict, Any, Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import SessionLocal
from app.models.order import Order
from app.models.partner import SalesPartner
from app.models.commission import Commission
from app.models.product import Product
from app.models.gamification import (
    SalesGamificationConfig,
    SalesDailyGamification,
    SalesWeeklyGamification,
    SalesGamificationBonusLedger,
    SalesGamificationOrderEvent,
)


# Timezone Constant: Asia/Jakarta (WIB = UTC+7)
WIB = timezone(timedelta(hours=7))

DAY_NAMES_ID = [
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
    "Minggu",
]


class GamificationService:
    """
    Asterra Store - Sales Gamification Engine.
    Handles Daily Missions (Rp25.000 target), Daily Streak, Weekly 7-Day Streak (+10% Bonus),
    Dynamic Product Suggestions, Idempotent Transaction Tracking, and Automated Cutoff Settlement.
    """

    # ---------------------------------------------------------
    # 1. Timezone & Calendar Helpers (Asia/Jakarta / WIB = UTC+7)
    # ---------------------------------------------------------
    @staticmethod
    def get_wib_now() -> datetime:
        return datetime.now(timezone.utc).astimezone(WIB)

    @staticmethod
    def to_wib_datetime(dt: Optional[datetime]) -> datetime:
        if not dt:
            return datetime.now(timezone.utc).astimezone(WIB)
        if dt.tzinfo is None:
            # Assume UTC if naive
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(WIB)

    @classmethod
    def to_wib_date(cls, dt: Optional[datetime] = None) -> date:
        return cls.to_wib_datetime(dt).date()

    @staticmethod
    def get_week_bounds(target_date: date) -> Tuple[date, date]:
        """
        Returns (week_start, week_end) for Monday 00:00 to Sunday 23:59 WIB.
        Monday weekday() == 0, Sunday weekday() == 6.
        """
        monday = target_date - timedelta(days=target_date.weekday())
        sunday = monday + timedelta(days=6)
        return monday, sunday

    @classmethod
    def seconds_until_midnight_wib(cls) -> int:
        now_wib = cls.get_wib_now()
        midnight_wib = (now_wib + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        diff = (midnight_wib - now_wib).total_seconds()
        return max(0, int(diff))

    # ---------------------------------------------------------
    # 2. Configuration Management
    # ---------------------------------------------------------
    @classmethod
    def get_config(cls, db: Optional[Session] = None) -> SalesGamificationConfig:
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True

        try:
            config = db.query(SalesGamificationConfig).filter(SalesGamificationConfig.id == "default").first()
            if not config:
                config = SalesGamificationConfig(
                    id="default",
                    is_enabled=True,
                    daily_target_amount=25000,
                    weekly_streak_days=7,
                    weekly_bonus_percentage=10.00,
                    timezone="Asia/Jakarta",
                    week_start_day="MONDAY",
                    product_suggestion_enabled=True,
                    auto_approve_weekly_bonus=True,
                )
                db.add(config)
                db.commit()
                db.refresh(config)
            return config
        finally:
            if close_db:
                db.close()

    @classmethod
    def update_config(cls, payload: Dict[str, Any], admin_username: Optional[str] = None) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            config = db.query(SalesGamificationConfig).filter(SalesGamificationConfig.id == "default").first()
            if not config:
                config = SalesGamificationConfig(id="default")
                db.add(config)

            if "isEnabled" in payload:
                config.is_enabled = bool(payload["isEnabled"])
            if "dailyTargetAmount" in payload:
                config.daily_target_amount = max(1000, int(payload["dailyTargetAmount"]))
            if "weeklyStreakDays" in payload:
                config.weekly_streak_days = max(1, min(7, int(payload["weeklyStreakDays"])))
            if "weeklyBonusPercentage" in payload:
                config.weekly_bonus_percentage = max(0.0, float(payload["weeklyBonusPercentage"]))
            if "productSuggestionEnabled" in payload:
                config.product_suggestion_enabled = bool(payload["productSuggestionEnabled"])
            if "autoApproveWeeklyBonus" in payload:
                config.auto_approve_weekly_bonus = bool(payload["autoApproveWeeklyBonus"])

            config.updated_by = admin_username or "admin"
            config.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(config)
            return {
                "success": True,
                "message": "Konfigurasi gamification berhasil diperbarui.",
                "data": config.to_dict(),
            }
        finally:
            db.close()

    # ---------------------------------------------------------
    # 3. Idempotent Order Gamification Sync & Streak Engine
    # ---------------------------------------------------------
    VALID_STATUSES = {"completed", "paid", "settlement", "selesai", "done"}
    REVERSED_STATUSES = {"cancelled", "refunded", "expired"}

    @classmethod
    def sync_order_gamification(
        cls,
        order_id: str,
        new_status: Optional[str] = None,
        db: Optional[Session] = None,
    ) -> Dict[str, Any]:
        """
        Synchronizes an order's status and direct commission into gamification tracking.
        Called automatically after ReferralProfitService.sync_order_commissions_and_ledger().
        Guarantees:
        - 100% idempotent (order events table with unique order_id).
        - Ignores dummy orders, non-affiliate orders, and zero commission.
        - Uses strictly direct commission (excluding recruitment bonus).
        - Handles status upgrades and reversal/clawbacks accurately.
        """
        clean_order_id = str(order_id).strip().upper()
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True

        try:
            config = cls.get_config(db)
            if not config.is_enabled:
                return {"success": True, "skipped": True, "reason": "Gamification disabled"}

            order = db.query(Order).filter(Order.id == clean_order_id).first()
            if not order or bool(order.is_dummy):
                return {"success": True, "skipped": True, "reason": "Order not found or dummy"}

            sales_id = order.sales_partner_id
            if not sales_id and order.referral_code:
                partner = db.query(SalesPartner).filter(SalesPartner.code.ilike(str(order.referral_code).strip())).first()
                if partner:
                    sales_id = partner.id

            if not sales_id:
                return {"success": True, "skipped": True, "reason": "No sales partner attached"}

            # Resolve direct commission from Commission record (SSOT)
            comm_record = db.query(Commission).filter(Commission.order_id == clean_order_id).first()
            direct_commission = int(comm_record.commission_amount) if comm_record else 0

            status_to_eval = (new_status or order.status or "pending").lower()
            is_valid = status_to_eval in cls.VALID_STATUSES
            is_reversed = status_to_eval in cls.REVERSED_STATUSES

            # Determine business date in WIB
            order_wib_date = cls.to_wib_date(order.created_at)
            today_wib = cls.to_wib_date()
            now_utc = datetime.utcnow()

            # 1. Upsert SalesGamificationOrderEvent
            event = db.query(SalesGamificationOrderEvent).filter(
                SalesGamificationOrderEvent.order_id == clean_order_id
            ).first()

            if not event:
                event_id = f"gamevt-{clean_order_id}"
                event = SalesGamificationOrderEvent(
                    id=event_id,
                    order_id=clean_order_id,
                    commission_id=comm_record.id if comm_record else None,
                    sales_id=sales_id,
                    wib_date=order_wib_date,
                    direct_commission_amount=direct_commission,
                    is_counted=is_valid,
                    order_status=status_to_eval,
                    validated_at=now_utc if is_valid else None,
                    reversed_at=now_utc if is_reversed else None,
                    created_at=now_utc,
                    updated_at=now_utc,
                )
                db.add(event)
            else:
                event.commission_id = comm_record.id if comm_record else event.commission_id
                event.sales_id = sales_id
                event.wib_date = order_wib_date
                event.direct_commission_amount = direct_commission
                event.order_status = status_to_eval
                event.is_counted = is_valid
                if is_valid and not event.validated_at:
                    event.validated_at = now_utc
                if is_reversed and not event.reversed_at:
                    event.reversed_at = now_utc
                event.updated_at = now_utc

            db.flush()

            # 2. Recompute and Upsert SalesDailyGamification for (sales_id, order_wib_date)
            daily = db.query(SalesDailyGamification).filter(
                SalesDailyGamification.sales_id == sales_id,
                SalesDailyGamification.date == order_wib_date,
            ).first()

            if not daily:
                daily_id = f"gamedaily-{sales_id[:16]}-{order_wib_date.isoformat()}"
                daily = SalesDailyGamification(
                    id=daily_id,
                    sales_id=sales_id,
                    date=order_wib_date,
                    target_amount=config.daily_target_amount,
                    accumulated_commission=0,
                    estimated_pending_commission=0,
                    eligible_orders_count=0,
                    status="NOT_STARTED",
                    created_at=now_utc,
                    updated_at=now_utc,
                )
                db.add(daily)
                db.flush()

            # Link daily id to event
            event.daily_gamification_id = daily.id

            # Calculate accumulated & pending commissions from events for this day
            events_today = db.query(SalesGamificationOrderEvent).filter(
                SalesGamificationOrderEvent.sales_id == sales_id,
                SalesGamificationOrderEvent.wib_date == order_wib_date,
            ).all()

            accumulated = sum(e.direct_commission_amount for e in events_today if e.is_counted)
            pending = sum(
                e.direct_commission_amount
                for e in events_today
                if not e.is_counted and e.order_status not in cls.REVERSED_STATUSES
            )
            eligible_count = sum(1 for e in events_today if e.is_counted)

            daily.accumulated_commission = accumulated
            daily.estimated_pending_commission = pending
            daily.eligible_orders_count = eligible_count
            target = daily.target_amount or config.daily_target_amount

            # Status determination for Daily Mission
            if accumulated >= target:
                daily.status = "COMPLETED"
                if not daily.completed_at:
                    daily.completed_at = now_utc
            else:
                # If target is no longer reached (e.g. refund/reversal clawback)
                daily.completed_at = None
                if order_wib_date < today_wib:
                    daily.status = "FAILED"
                else:
                    daily.status = "IN_PROGRESS" if accumulated > 0 else "NOT_STARTED"

            daily.updated_at = now_utc
            db.flush()

            # 3. Recompute SalesWeeklyGamification for the week of order_wib_date
            week_start, week_end = cls.get_week_bounds(order_wib_date)
            weekly = db.query(SalesWeeklyGamification).filter(
                SalesWeeklyGamification.sales_id == sales_id,
                SalesWeeklyGamification.week_start == week_start,
            ).first()

            if not weekly:
                weekly_id = f"gameweek-{sales_id[:16]}-{week_start.isoformat()}"
                weekly = SalesWeeklyGamification(
                    id=weekly_id,
                    sales_id=sales_id,
                    week_start=week_start,
                    week_end=week_end,
                    completed_days=0,
                    total_commission=0,
                    bonus_percentage=config.weekly_bonus_percentage,
                    bonus_amount=0,
                    status="IN_PROGRESS",
                    created_at=now_utc,
                    updated_at=now_utc,
                )
                db.add(weekly)
                db.flush()

            # Query all daily records for this week
            week_dailies = db.query(SalesDailyGamification).filter(
                SalesDailyGamification.sales_id == sales_id,
                SalesDailyGamification.date >= week_start,
                SalesDailyGamification.date <= week_end,
            ).all()

            completed_days = sum(1 for d in week_dailies if d.status == "COMPLETED")
            total_comm = sum(d.accumulated_commission for d in week_dailies)
            bonus_rate = float(weekly.bonus_percentage or config.weekly_bonus_percentage)

            weekly.completed_days = completed_days
            weekly.total_commission = total_comm
            bonus_calc = int(round(total_comm * (bonus_rate / 100.0))) if completed_days >= 7 else 0
            weekly.bonus_amount = bonus_calc

            # Evaluate weekly status
            # If week is already over:
            if week_end < today_wib:
                if completed_days >= 7:
                    if weekly.status not in ["BONUS_APPROVED", "BONUS_PAID"]:
                        weekly.status = "COMPLETED"
                else:
                    weekly.status = "FAILED"
            else:
                # Current week running
                # Check if any past day in the week has FAILED
                has_failed_past_day = any(d.status == "FAILED" for d in week_dailies if d.date < today_wib)
                if has_failed_past_day:
                    weekly.status = "FAILED"
                else:
                    weekly.status = "IN_PROGRESS"

            weekly.updated_at = now_utc
            db.flush()

            # 4. Handle Weekly Bonus Ledger & Clawback
            ledger = db.query(SalesGamificationBonusLedger).filter(
                SalesGamificationBonusLedger.weekly_gamification_id == weekly.id,
                SalesGamificationBonusLedger.bonus_type == "WEEKLY_STREAK",
            ).first()

            if completed_days >= 7:
                # 7/7 Streak achieved!
                week_has_ended = today_wib >= weekly.week_end
                status_ledger = "APPROVED" if (config.auto_approve_weekly_bonus and week_has_ended) else "PENDING"
                if not ledger:
                    ledger_id = f"bonusledg-{weekly.id}"
                    ledger = SalesGamificationBonusLedger(
                        id=ledger_id,
                        sales_id=sales_id,
                        weekly_gamification_id=weekly.id,
                        bonus_type="WEEKLY_STREAK",
                        base_commission=total_comm,
                        bonus_percentage=bonus_rate,
                        bonus_amount=bonus_calc,
                        status=status_ledger,
                        approved_by="system" if status_ledger == "APPROVED" else None,
                        approved_at=now_utc if status_ledger == "APPROVED" else None,
                        created_at=now_utc,
                    )
                    db.add(ledger)
                    if status_ledger == "APPROVED":
                        weekly.status = "BONUS_APPROVED"
                else:
                    # If already exists and was REVERSED, but now recovered:
                    if ledger.status == "REVERSED":
                        ledger.status = status_ledger
                        ledger.reversal_reason = None
                        ledger.approved_at = now_utc if ledger.status == "APPROVED" else None
                        weekly.status = "BONUS_APPROVED" if ledger.status == "APPROVED" else "COMPLETED"
                    ledger.base_commission = total_comm
                    ledger.bonus_amount = bonus_calc
            else:
                # Clawback / Reversal if streak dropped below 7 days
                if ledger and ledger.status in ["PENDING", "APPROVED"]:
                    ledger.status = "REVERSED"
                    ledger.reversal_reason = f"Transaksi order {clean_order_id} direfund/dibatalkan sehingga streak mingguan turun menjadi {completed_days}/7 hari."
                    weekly.status = "FAILED"

            db.commit()

            return {
                "success": True,
                "orderId": clean_order_id,
                "dailyStatus": daily.status,
                "accumulatedCommission": daily.accumulated_commission,
                "targetAmount": daily.target_amount,
                "completedDays": weekly.completed_days,
                "weeklyStatus": weekly.status,
                "weeklyBonusAmount": weekly.bonus_amount,
            }
        except Exception as e:
            db.rollback()
            print(f"[GamificationService] Error syncing order gamification {clean_order_id}: {e}")
            return {"success": False, "error": str(e)}
        finally:
            if close_db:
                db.close()

    # ---------------------------------------------------------
    # 4. Daily Cutoff & Weekly Bonus Settlement Worker
    # ---------------------------------------------------------
    @classmethod
    def run_daily_and_weekly_cutoff(cls, db: Optional[Session] = None) -> Dict[str, Any]:
        """
        Executed via cron / lifespan at 00:01 WIB and Monday 00:05 WIB:
        - Marks past days (< today_wib) that are NOT_STARTED or IN_PROGRESS as FAILED.
        - Settles previous week streak: if 7/7 COMPLETED, creates/approves bonus ledger.
        - Closes failed weeks where < 7 days were achieved.
        """
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True

        today_wib = cls.to_wib_date()
        now_utc = datetime.utcnow()
        finalized_days_count = 0
        settled_weeks_count = 0

        try:
            config = cls.get_config(db)
            if not config.is_enabled:
                return {"success": True, "message": "Gamification disabled"}

            # 1. Finalize past days that were not completed
            unfinished_dailies = db.query(SalesDailyGamification).filter(
                SalesDailyGamification.date < today_wib,
                SalesDailyGamification.status.in_(["NOT_STARTED", "IN_PROGRESS"]),
            ).all()

            for d in unfinished_dailies:
                d.status = "FAILED"
                d.updated_at = now_utc
                finalized_days_count += 1

            db.flush()

            # 2. Check all active partners for missing days in current/past weeks
            # If a partner had no activity on a past day in the current week,
            # we ensure an explicit FAILED record exists so streak calendar shows it accurately.
            partners = db.query(SalesPartner).filter(SalesPartner.status.in_(["active", "aktif"])).all()
            for p in partners:
                current_week_start, current_week_end = cls.get_week_bounds(today_wib)
                curr_date = current_week_start
                while curr_date < today_wib:
                    existing = db.query(SalesDailyGamification).filter(
                        SalesDailyGamification.sales_id == p.id,
                        SalesDailyGamification.date == curr_date,
                    ).first()
                    if not existing:
                        missing_id = f"gamedaily-{p.id[:16]}-{curr_date.isoformat()}"
                        new_failed = SalesDailyGamification(
                            id=missing_id,
                            sales_id=p.id,
                            date=curr_date,
                            target_amount=config.daily_target_amount,
                            accumulated_commission=0,
                            estimated_pending_commission=0,
                            eligible_orders_count=0,
                            status="FAILED",
                            created_at=now_utc,
                            updated_at=now_utc,
                        )
                        db.add(new_failed)
                        finalized_days_count += 1
                    curr_date += timedelta(days=1)

            db.flush()

            # 3. Settle previous weeks (< today_wib)
            # Find all weekly records whose week_end < today_wib and are still IN_PROGRESS or COMPLETED without ledger
            past_weekends = db.query(SalesWeeklyGamification).filter(
                SalesWeeklyGamification.week_end < today_wib,
                SalesWeeklyGamification.status.in_(["IN_PROGRESS", "COMPLETED"]),
            ).all()

            for w in past_weekends:
                # Recount completed days from dailies
                week_dailies = db.query(SalesDailyGamification).filter(
                    SalesDailyGamification.sales_id == w.sales_id,
                    SalesDailyGamification.date >= w.week_start,
                    SalesDailyGamification.date <= w.week_end,
                ).all()

                completed_count = sum(1 for d in week_dailies if d.status == "COMPLETED")
                total_comm = sum(d.accumulated_commission for d in week_dailies)
                w.completed_days = completed_count
                w.total_commission = total_comm

                bonus_rate = float(w.bonus_percentage or config.weekly_bonus_percentage)
                bonus_calc = int(round(total_comm * (bonus_rate / 100.0))) if completed_count >= 7 else 0
                w.bonus_amount = bonus_calc

                if completed_count >= 7:
                    ledger = db.query(SalesGamificationBonusLedger).filter(
                        SalesGamificationBonusLedger.weekly_gamification_id == w.id,
                        SalesGamificationBonusLedger.bonus_type == "WEEKLY_STREAK",
                    ).first()

                    status_ledger = "APPROVED" if config.auto_approve_weekly_bonus else "PENDING"
                    if not ledger:
                        ledger_id = f"bonusledg-{w.id}"
                        ledger = SalesGamificationBonusLedger(
                            id=ledger_id,
                            sales_id=w.sales_id,
                            weekly_gamification_id=w.id,
                            bonus_type="WEEKLY_STREAK",
                            base_commission=total_comm,
                            bonus_percentage=bonus_rate,
                            bonus_amount=bonus_calc,
                            status=status_ledger,
                            approved_by="system" if status_ledger == "APPROVED" else None,
                            approved_at=now_utc if status_ledger == "APPROVED" else None,
                            created_at=now_utc,
                        )
                        db.add(ledger)
                    elif ledger.status == "PENDING" and config.auto_approve_weekly_bonus:
                        ledger.status = "APPROVED"
                        ledger.approved_by = "system"
                        ledger.approved_at = now_utc

                    w.status = "BONUS_APPROVED" if status_ledger == "APPROVED" else "COMPLETED"
                    settled_weeks_count += 1
                else:
                    w.status = "FAILED"
                    settled_weeks_count += 1

                w.updated_at = now_utc

            db.commit()
            return {
                "success": True,
                "finalizedDaysCount": finalized_days_count,
                "settledWeeksCount": settled_weeks_count,
            }
        except Exception as e:
            db.rollback()
            print(f"[GamificationService] Cutoff worker error: {e}")
            return {"success": False, "error": str(e)}
        finally:
            if close_db:
                db.close()

    # ---------------------------------------------------------
    # 5. Sales Portal Overview Aggregator
    # ---------------------------------------------------------
    @classmethod
    def get_sales_overview(cls, sales_identifier: Optional[str] = None) -> Dict[str, Any]:
        """
        Aggregates full gamification data for a sales partner:
        - Daily Mission with live countdown to 23:59:59 WIB.
        - Weekly Streak Calendar (7 days breakdown).
        - Commission summary and bonus history.
        """
        db = SessionLocal()
        try:
            config = cls.get_config(db)
            today_wib = cls.to_wib_date()
            now_wib = cls.get_wib_now()
            seconds_remaining = cls.seconds_until_midnight_wib()

            # Resolve Partner
            partner = None
            if sales_identifier:
                clean = sales_identifier.strip().lower()
                clean_upper = clean.upper()
                partner = db.query(SalesPartner).filter(
                    (SalesPartner.email.ilike(clean))
                    | (SalesPartner.code.ilike(clean_upper))
                    | (SalesPartner.id == clean)
                ).first()

            if not partner:
                # Return empty template if partner not found
                return cls._empty_sales_overview(config, today_wib, seconds_remaining)

            sales_id = partner.id

            # 1. Daily Mission for Today
            daily = db.query(SalesDailyGamification).filter(
                SalesDailyGamification.sales_id == sales_id,
                SalesDailyGamification.date == today_wib,
            ).first()

            target_amount = daily.target_amount if daily else config.daily_target_amount
            accumulated = daily.accumulated_commission if daily else 0
            pending = daily.estimated_pending_commission if daily else 0
            eligible_count = daily.eligible_orders_count if daily else 0
            daily_status = daily.status if daily else "NOT_STARTED"
            completed_at = daily.completed_at.isoformat() + "Z" if (daily and daily.completed_at) else None

            progress_pct = round((accumulated / target_amount) * 100, 1) if target_amount > 0 else 0
            remaining_target = max(0, target_amount - accumulated)

            # Contributing transactions today
            today_events = db.query(SalesGamificationOrderEvent).filter(
                SalesGamificationOrderEvent.sales_id == sales_id,
                SalesGamificationOrderEvent.wib_date == today_wib,
            ).order_by(SalesGamificationOrderEvent.created_at.desc()).all()

            today_orders = [
                {
                    "orderId": e.order_id,
                    "commissionAmount": e.direct_commission_amount,
                    "isCounted": e.is_counted,
                    "orderStatus": e.order_status,
                    "time": e.created_at.strftime("%H:%M WIB") if e.created_at else "-",
                }
                for e in today_events
            ]

            # 2. Weekly Streak (Monday - Sunday)
            week_start, week_end = cls.get_week_bounds(today_wib)
            weekly = db.query(SalesWeeklyGamification).filter(
                SalesWeeklyGamification.sales_id == sales_id,
                SalesWeeklyGamification.week_start == week_start,
            ).first()

            # Pre-fetch all daily records for this 7-day week
            week_dailies = {
                d.date: d
                for d in db.query(SalesDailyGamification).filter(
                    SalesDailyGamification.sales_id == sales_id,
                    SalesDailyGamification.date >= week_start,
                    SalesDailyGamification.date <= week_end,
                ).all()
            }

            # Build 7-day calendar array
            calendar = []
            running_completed_count = 0
            running_total_comm = 0

            for i in range(7):
                day_date = week_start + timedelta(days=i)
                day_daily = week_dailies.get(day_date)

                is_today = (day_date == today_wib)
                is_past = (day_date < today_wib)
                is_future = (day_date > today_wib)

                d_status = "NOT_STARTED"
                d_accumulated = 0
                d_target = config.daily_target_amount

                if day_daily:
                    d_status = day_daily.status
                    d_accumulated = day_daily.accumulated_commission
                    d_target = day_daily.target_amount
                elif is_past:
                    d_status = "FAILED"
                elif is_today:
                    d_status = daily_status
                    d_accumulated = accumulated

                if d_status == "COMPLETED":
                    running_completed_count += 1
                running_total_comm += d_accumulated

                calendar.append({
                    "dayIndex": i,
                    "dayName": DAY_NAMES_ID[i],
                    "date": day_date.isoformat(),
                    "dateFormatted": day_date.strftime("%d %b"),
                    "isToday": is_today,
                    "isPast": is_past,
                    "isFuture": is_future,
                    "status": d_status,
                    "accumulatedCommission": d_accumulated,
                    "targetAmount": d_target,
                })

            weekly_status = weekly.status if weekly else "IN_PROGRESS"
            bonus_pct = float(weekly.bonus_percentage if weekly else config.weekly_bonus_percentage)
            est_bonus = int(round(running_total_comm * (bonus_pct / 100.0)))

            # 3. Commission Summary & Bonus History
            ledgers = db.query(SalesGamificationBonusLedger).filter(
                SalesGamificationBonusLedger.sales_id == sales_id
            ).order_by(SalesGamificationBonusLedger.created_at.desc()).all()

            approved_bonus_total = sum(l.bonus_amount for l in ledgers if l.status in ["APPROVED", "PAID"])
            pending_bonus_total = sum(l.bonus_amount for l in ledgers if l.status == "PENDING")

            bonus_history = [
                {
                    "id": l.id,
                    "bonusType": l.bonus_type,
                    "baseCommission": l.base_commission,
                    "bonusPercentage": float(l.bonus_percentage or 10.0),
                    "bonusAmount": l.bonus_amount,
                    "status": l.status,
                    "reversalReason": l.reversal_reason,
                    "approvedBy": l.approved_by,
                    "approvedAt": (l.approved_at.isoformat() + "Z") if l.approved_at else None,
                    "paidAt": (l.paid_at.isoformat() + "Z") if l.paid_at else None,
                    "createdAt": (l.created_at.isoformat() + "Z") if l.created_at else None,
                }
                for l in ledgers
            ]

            return {
                "success": True,
                "partner": {
                    "id": partner.id,
                    "name": partner.name,
                    "code": partner.code,
                },
                "dailyMission": {
                    "date": today_wib.isoformat(),
                    "targetAmount": target_amount,
                    "accumulatedCommission": accumulated,
                    "estimatedPendingCommission": pending,
                    "progressPercentage": min(100.0, progress_pct),
                    "rawPercentage": progress_pct,
                    "remainingTarget": remaining_target,
                    "status": daily_status,
                    "completedAt": completed_at,
                    "eligibleOrdersCount": eligible_count,
                    "secondsRemaining": seconds_remaining,
                    "todayOrders": today_orders,
                },
                "weeklyStreak": {
                    "weekStart": week_start.isoformat(),
                    "weekEnd": week_end.isoformat(),
                    "completedDays": running_completed_count,
                    "totalDays": 7,
                    "totalCommission": running_total_comm,
                    "bonusPercentage": bonus_pct,
                    "estimatedBonus": est_bonus,
                    "bonusAmount": weekly.bonus_amount if weekly else 0,
                    "status": weekly_status,
                    "isEligibleForBonus": running_completed_count >= 7,
                    "calendar": calendar,
                },
                "commissionSummary": {
                    "approvedWeeklyBonus": approved_bonus_total,
                    "pendingWeeklyBonus": pending_bonus_total,
                    "bonusHistory": bonus_history,
                },
            }
        finally:
            db.close()

    @staticmethod
    def _empty_sales_overview(
        config: SalesGamificationConfig,
        today_wib: date,
        seconds_remaining: int,
    ) -> Dict[str, Any]:
        week_start, week_end = GamificationService.get_week_bounds(today_wib)
        calendar = []
        for i in range(7):
            d = week_start + timedelta(days=i)
            calendar.append({
                "dayIndex": i,
                "dayName": DAY_NAMES_ID[i],
                "date": d.isoformat(),
                "dateFormatted": d.strftime("%d %b"),
                "isToday": d == today_wib,
                "isPast": d < today_wib,
                "isFuture": d > today_wib,
                "status": "NOT_STARTED",
                "accumulatedCommission": 0,
                "targetAmount": config.daily_target_amount,
            })

        return {
            "success": True,
            "partner": None,
            "dailyMission": {
                "date": today_wib.isoformat(),
                "targetAmount": config.daily_target_amount,
                "accumulatedCommission": 0,
                "estimatedPendingCommission": 0,
                "progressPercentage": 0,
                "rawPercentage": 0,
                "remainingTarget": config.daily_target_amount,
                "status": "NOT_STARTED",
                "completedAt": None,
                "eligibleOrdersCount": 0,
                "secondsRemaining": seconds_remaining,
                "todayOrders": [],
            },
            "weeklyStreak": {
                "weekStart": week_start.isoformat(),
                "weekEnd": week_end.isoformat(),
                "completedDays": 0,
                "totalDays": 7,
                "totalCommission": 0,
                "bonusPercentage": float(config.weekly_bonus_percentage or 10.0),
                "estimatedBonus": 0,
                "bonusAmount": 0,
                "status": "IN_PROGRESS",
                "isEligibleForBonus": False,
                "calendar": calendar,
            },
            "commissionSummary": {
                "approvedWeeklyBonus": 0,
                "pendingWeeklyBonus": 0,
                "bonusHistory": [],
            },
        }

    # ---------------------------------------------------------
    # 6. Dynamic Product Suggestion Engine
    # ---------------------------------------------------------
    @classmethod
    def get_product_suggestions(
        cls,
        sales_identifier: Optional[str] = None,
        exclude_ids: Optional[List[str]] = None,
        limit: int = 3,
    ) -> Dict[str, Any]:
        """
        Dynamically analyzes active products and computes commission efficiency
        to assist sales in closing their daily target (Rp25.000).
        Formula:
        Estimated Transactions Needed = Ceiling(Remaining Target / Estimated Commission per Order)
        Supports non-repetitive refresh via exclude_ids.
        """
        db = SessionLocal()
        try:
            config = cls.get_config(db)
            today_wib = cls.to_wib_date()

            # Determine remaining daily target
            daily_target = config.daily_target_amount
            today_accumulated = 0

            if sales_identifier:
                clean = sales_identifier.strip().lower()
                clean_upper = clean.upper()
                partner = db.query(SalesPartner).filter(
                    (SalesPartner.email.ilike(clean))
                    | (SalesPartner.code.ilike(clean_upper))
                    | (SalesPartner.id == clean)
                ).first()

                if partner:
                    daily = db.query(SalesDailyGamification).filter(
                        SalesDailyGamification.sales_id == partner.id,
                        SalesDailyGamification.date == today_wib,
                    ).first()
                    if daily:
                        today_accumulated = daily.accumulated_commission

            remaining_target = max(0, daily_target - today_accumulated)
            # If already achieved or zero, use daily_target (25000) for baseline simulation
            simulation_target = remaining_target if remaining_target > 0 else daily_target

            # Fetch active products
            products = db.query(Product).filter(
                Product.status == "active",
                Product.stock > 0,
            ).all()

            candidates = []
            for p in products:
                # Estimate cost of goods
                cog = p.provider_price or int(round(p.price * 0.65))
                # Payment fee ~0.7%
                fee = round(p.price * 0.007)
                tx_profit = max(0, p.price - (cog + fee))
                # Direct commission (Affiliate 30%)
                est_commission = int(round(tx_profit * 0.30))

                if est_commission <= 500:
                    # Skip products with negligible commission
                    continue

                orders_needed = math.ceil(simulation_target / est_commission)

                # Efficiency score: high commission & fewer orders needed
                # Lower orders_needed gives higher priority score
                efficiency_score = (est_commission * 2.0) / (orders_needed + 1)

                candidates.append({
                    "id": p.id,
                    "name": p.name,
                    "brand": p.brand or "Digital Service",
                    "price": p.price,
                    "estimatedCommission": est_commission,
                    "ordersNeeded": orders_needed,
                    "imageUrl": p.imageUrl,
                    "features": p.features or [],
                    "score": efficiency_score,
                })

            if not candidates:
                # Fallback candidates if DB has no custom items
                fallback_items = [
                    {
                        "id": "prod-gemini-pro",
                        "name": "Google Gemini Pro Anggota 1 Bulan",
                        "brand": "Google",
                        "price": 95700,
                        "estimatedCommission": 9570,
                        "ordersNeeded": math.ceil(simulation_target / 9570),
                        "imageUrl": "/images/gemini.png",
                        "features": ["Garansi Full", "Proses Cepat"],
                        "score": 100,
                    },
                    {
                        "id": "prod-capcut-pro",
                        "name": "CapCut Pro Private 7 Hari",
                        "brand": "CapCut",
                        "price": 41700,
                        "estimatedCommission": 4170,
                        "ordersNeeded": math.ceil(simulation_target / 4170),
                        "imageUrl": "/images/capcut.png",
                        "features": ["Akun Private", "Tanpa Iklan"],
                        "score": 80,
                    },
                    {
                        "id": "prod-youtube-prem",
                        "name": "YouTube Premium Family 1 Bulan",
                        "brand": "YouTube",
                        "price": 18800,
                        "estimatedCommission": 1880,
                        "ordersNeeded": math.ceil(simulation_target / 1880),
                        "imageUrl": "/images/youtube.png",
                        "features": ["No Ads", "Background Play"],
                        "score": 60,
                    },
                ]
                candidates = fallback_items

            # Filter out exclude_ids if enough products exist
            clean_exclude = [str(x).strip() for x in (exclude_ids or []) if str(x).strip()]
            filtered = [c for c in candidates if c["id"] not in clean_exclude]

            # If filtered list is too small, revert to all candidates
            pool = filtered if len(filtered) >= limit else candidates

            # Sort by score descending and take top batch
            pool.sort(key=lambda x: x["score"], reverse=True)
            top_candidates = pool[: max(15, limit * 3)]

            # Sample weighted randomly or pick top candidates for variation
            if len(top_candidates) > limit:
                selected = random.sample(top_candidates, limit)
                # Re-sort selected by commission descending
                selected.sort(key=lambda x: x["estimatedCommission"], reverse=True)
            else:
                selected = top_candidates[:limit]

            return {
                "success": True,
                "remainingTarget": simulation_target,
                "label": "Recommended for your daily target",
                "isMandatory": False,
                "disclaimer": "Rekomendasi ini bersifat opsional untuk membantu mencapai target harian lebih cepat. Anda bebas mempromosikan produk apa pun di katalog Asterra Store.",
                "suggestions": selected,
            }
        finally:
            db.close()

    # ---------------------------------------------------------
    # 7. Admin Monitoring & Audit Queries
    # ---------------------------------------------------------
    @classmethod
    def get_admin_gamification_overview(cls) -> Dict[str, Any]:
        """
        Returns macro analytics for Asterra Store Admin Console:
        - Daily Target Completion Rate
        - Weekly Streak Completion Rate
        - Total Weekly Bonus Paid & Pending
        - Cost Ratio vs Transaction Profit
        - Active Streaks List per Partner
        - Bonus Ledger Entries
        """
        db = SessionLocal()
        try:
            config = cls.get_config(db)
            today_wib = cls.to_wib_date()
            week_start, week_end = cls.get_week_bounds(today_wib)

            # 1. Partner Streak Statuses
            partners = db.query(SalesPartner).filter(SalesPartner.status.in_(["active", "aktif"])).all()

            # Pre-fetch today's daily records
            today_dailies = {
                d.sales_id: d
                for d in db.query(SalesDailyGamification).filter(
                    SalesDailyGamification.date == today_wib
                ).all()
            }

            # Pre-fetch current week weekly records
            curr_weeklies = {
                w.sales_id: w
                for w in db.query(SalesWeeklyGamification).filter(
                    SalesWeeklyGamification.week_start == week_start
                ).all()
            }

            # Pre-fetch week dailies for 7-day visual
            week_dailies_all = db.query(SalesDailyGamification).filter(
                SalesDailyGamification.date >= week_start,
                SalesDailyGamification.date <= week_end,
            ).all()

            week_dailies_by_partner = {}
            for wd in week_dailies_all:
                if wd.sales_id not in week_dailies_by_partner:
                    week_dailies_by_partner[wd.sales_id] = {}
                week_dailies_by_partner[wd.sales_id][wd.date] = wd

            partner_streaks = []
            today_completed_count = 0
            today_active_partners_count = len(partners)

            for p in partners:
                d = today_dailies.get(p.id)
                w = curr_weeklies.get(p.id)

                accumulated = d.accumulated_commission if d else 0
                target = d.target_amount if d else config.daily_target_amount
                status = d.status if d else "NOT_STARTED"
                if status == "COMPLETED":
                    today_completed_count += 1

                p_week_dailies = week_dailies_by_partner.get(p.id, {})
                mini_calendar = []
                for i in range(7):
                    day_d = week_start + timedelta(days=i)
                    day_rec = p_week_dailies.get(day_d)
                    day_st = day_rec.status if day_rec else ("FAILED" if day_d < today_wib else "NOT_STARTED")
                    mini_calendar.append({
                        "day": DAY_NAMES_ID[i][:3],
                        "status": day_st,
                    })

                partner_streaks.append({
                    "id": p.id,
                    "name": p.name,
                    "code": p.code,
                    "todayAccumulated": accumulated,
                    "todayTarget": target,
                    "todayStatus": status,
                    "completedDaysThisWeek": w.completed_days if w else 0,
                    "totalCommissionThisWeek": w.total_commission if w else 0,
                    "estimatedBonusThisWeek": int(
                        round((w.total_commission if w else 0) * (float(config.weekly_bonus_percentage or 10.0) / 100.0))
                    ),
                    "weeklyStatus": w.status if w else "IN_PROGRESS",
                    "streakCalendar": mini_calendar,
                })

            daily_completion_rate = (
                round((today_completed_count / today_active_partners_count) * 100, 1)
                if today_active_partners_count > 0
                else 0.0
            )

            # 2. Bonus Ledger Entries & Financial Impact
            ledgers = db.query(SalesGamificationBonusLedger).order_by(
                SalesGamificationBonusLedger.created_at.desc()
            ).all()

            total_bonus_paid = sum(l.bonus_amount for l in ledgers if l.status == "PAID")
            total_bonus_approved = sum(l.bonus_amount for l in ledgers if l.status == "APPROVED")
            total_bonus_pending = sum(l.bonus_amount for l in ledgers if l.status == "PENDING")
            total_bonus_reversed = sum(l.bonus_amount for l in ledgers if l.status == "REVERSED")

            # Calculate total direct commissions from all commissions
            total_direct_comm = db.query(func.sum(Commission.commission_amount)).scalar() or 0
            total_tx_profit = db.query(func.sum(Commission.transaction_profit)).scalar() or 0

            # Cost ratio: gamification bonus vs transaction profit
            total_gamification_cost = total_bonus_paid + total_bonus_approved
            gamification_cost_ratio = (
                round((total_gamification_cost / total_tx_profit) * 100, 2)
                if total_tx_profit > 0
                else 0.0
            )

            # Weekly streak completion rate: count completed weeks vs total finished weeks
            finished_weeks = db.query(SalesWeeklyGamification).filter(
                SalesWeeklyGamification.week_end < today_wib
            ).all()
            completed_weeks_count = sum(1 for w in finished_weeks if w.completed_days >= 7)
            weekly_completion_rate = (
                round((completed_weeks_count / len(finished_weeks)) * 100, 1)
                if finished_weeks
                else 0.0
            )

            ledger_items = [
                {
                    "id": l.id,
                    "salesId": l.sales_id,
                    "salesName": next((p.name for p in partners if p.id == l.sales_id), "Mitra Sales"),
                    "salesCode": next((p.code for p in partners if p.id == l.sales_id), "-"),
                    "bonusType": l.bonus_type,
                    "baseCommission": l.base_commission,
                    "bonusPercentage": float(l.bonus_percentage or 10.0),
                    "bonusAmount": l.bonus_amount,
                    "status": l.status,
                    "reversalReason": l.reversal_reason,
                    "approvedBy": l.approved_by,
                    "createdAt": (l.created_at.isoformat() + "Z") if l.created_at else None,
                    "approvedAt": (l.approved_at.isoformat() + "Z") if l.approved_at else None,
                    "paidAt": (l.paid_at.isoformat() + "Z") if l.paid_at else None,
                }
                for l in ledgers[:50]
            ]

            return {
                "success": True,
                "config": config.to_dict(),
                "metrics": {
                    "dailyCompletionRate": daily_completion_rate,
                    "todayCompletedCount": today_completed_count,
                    "todayActivePartners": today_active_partners_count,
                    "weeklyCompletionRate": weekly_completion_rate,
                    "totalBonusPaid": total_bonus_paid,
                    "totalBonusApproved": total_bonus_approved,
                    "totalBonusPending": total_bonus_pending,
                    "totalBonusReversed": total_bonus_reversed,
                    "totalGamificationCost": total_gamification_cost,
                    "gamificationCostRatio": gamification_cost_ratio,
                    "totalDirectCommission": int(total_direct_comm),
                    "totalTransactionProfit": int(total_tx_profit),
                },
                "partnerStreaks": partner_streaks,
                "bonusLedgers": ledger_items,
            }
        finally:
            db.close()

    @classmethod
    def get_sales_audit_detail(cls, sales_id: str) -> Dict[str, Any]:
        """
        Audit endpoint for Admin to inspect exact transactions and daily records
        constituting a partner's streak and gamification progress.
        """
        db = SessionLocal()
        try:
            partner = db.query(SalesPartner).filter(SalesPartner.id == sales_id).first()
            if not partner:
                return {"success": False, "message": "Mitra sales tidak ditemukan"}

            events = db.query(SalesGamificationOrderEvent).filter(
                SalesGamificationOrderEvent.sales_id == sales_id
            ).order_by(SalesGamificationOrderEvent.created_at.desc()).all()

            dailies = db.query(SalesDailyGamification).filter(
                SalesDailyGamification.sales_id == sales_id
            ).order_by(SalesDailyGamification.date.desc()).all()

            weeklies = db.query(SalesWeeklyGamification).filter(
                SalesWeeklyGamification.sales_id == sales_id
            ).order_by(SalesWeeklyGamification.week_start.desc()).all()

            ledgers = db.query(SalesGamificationBonusLedger).filter(
                SalesGamificationBonusLedger.sales_id == sales_id
            ).order_by(SalesGamificationBonusLedger.created_at.desc()).all()

            return {
                "success": True,
                "partner": {
                    "id": partner.id,
                    "name": partner.name,
                    "code": partner.code,
                    "email": partner.email,
                },
                "events": [e.to_dict() for e in events],
                "dailies": [d.to_dict() for d in dailies],
                "weeklies": [w.to_dict() for w in weeklies],
                "ledgers": [l.to_dict() for l in ledgers],
            }
        finally:
            db.close()

    @classmethod
    def process_bonus_action(cls, ledger_id: str, action: str, admin_name: str = "admin") -> Dict[str, Any]:
        """
        Allows Admin to manually Approve, Pay, or Reverse a weekly streak bonus.
        """
        db = SessionLocal()
        try:
            ledger = db.query(SalesGamificationBonusLedger).filter(
                SalesGamificationBonusLedger.id == ledger_id
            ).first()
            if not ledger:
                return {"success": False, "message": "Bonus ledger tidak ditemukan."}

            act = action.strip().lower()
            now_utc = datetime.utcnow()

            if act == "approve":
                ledger.status = "APPROVED"
                ledger.approved_by = admin_name
                ledger.approved_at = now_utc
            elif act == "pay":
                ledger.status = "PAID"
                ledger.paid_at = now_utc
                if ledger.weekly_gamification_id:
                    weekly = db.query(SalesWeeklyGamification).filter(
                        SalesWeeklyGamification.id == ledger.weekly_gamification_id
                    ).first()
                    if weekly:
                        weekly.status = "BONUS_PAID"
                        weekly.updated_at = now_utc
            elif act == "reverse":
                ledger.status = "REVERSED"
                ledger.reversal_reason = f"Dibatalkan secara manual oleh {admin_name}."
            else:
                return {"success": False, "message": f"Aksi '{action}' tidak valid."}

            db.commit()
            return {
                "success": True,
                "message": f"Bonus ledger berhasil diubah menjadi {ledger.status}.",
                "data": ledger.to_dict(),
            }
        finally:
            db.close()

