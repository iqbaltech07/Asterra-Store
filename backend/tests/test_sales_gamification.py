"""
Asterra Store - Sales Gamification Test Suite.
Validates all 12 Edge Cases specified in PRD Section 12 & Implementation Plan Phase 7:
1. Sales reaches Rp25.000 right before midnight (23:59:59 WIB).
2. Accumulation from multiple small transactions (Rp8.000 + Rp7.000 + Rp5.000 + Rp5.000).
3. Single large transaction (> Rp25.000).
4. Order refund/reversal clawback (demotes COMPLETED to IN_PROGRESS/FAILED, reverses bonus ledger).
5. Transaction validated after business date turnover.
6. Day with no transaction (marked FAILED after cutoff).
7. Sunday week completion (7/7 days) triggers 10% weekly bonus ledger creation.
8. System downtime recovery & idempotent reconciliation.
9. Idempotency: Duplicate transaction events never duplicate progress.
10. Admin alters daily target mid-period without corrupting existing completed days.
11. Recruitment bonus exclusion: Only direct sales commission is counted.
12. Prevention of duplicate weekly bonus ledger payouts via UNIQUE constraint.
"""

import sys
import uuid
from datetime import datetime, date, timedelta, timezone
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from app.core.database import SessionLocal
from app.models.partner import SalesPartner
from app.models.order import Order
from app.models.commission import Commission
from app.models.gamification import (
    SalesGamificationConfig,
    SalesDailyGamification,
    SalesWeeklyGamification,
    SalesGamificationBonusLedger,
    SalesGamificationOrderEvent,
)
from app.services.gamification_service import GamificationService, WIB


def setup_test_partner(db, code_prefix="TEST"):
    unique_suffix = uuid.uuid4().hex[:6]
    partner_id = f"partner-{code_prefix.lower()}-{unique_suffix}"
    partner = SalesPartner(
        id=partner_id,
        code=f"{code_prefix}-{unique_suffix}".upper(),
        name=f"Partner {unique_suffix}",
        email=f"partner_{unique_suffix}@asterra.store",
        whatsapp=f"0812{unique_suffix}",
        rate=30,
        status="active",
        created_at=datetime.utcnow(),
    )
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


def create_mock_order_and_commission(
    db,
    partner_id: str,
    commission_amount: int,
    bonus_amount: int = 0,
    status: str = "completed",
    created_at_utc: datetime = None,
):
    if created_at_utc is None:
        created_at_utc = datetime.utcnow()

    oid = f"AST-TEST-{uuid.uuid4().hex[:8].upper()}"
    order = Order(
        id=oid,
        customer_email="buyer@asterra.store",
        customer_name="Buyer Test",
        total_amount=100000,
        raw_amount=100000,
        status=status,
        payment_mode="manual",
        payment_method="qris",
        payment_status="paid" if status == "completed" else "pending",
        sales_partner_id=partner_id,
        is_dummy=False,
        created_at=created_at_utc,
    )
    db.add(order)
    db.flush()

    comm = Commission(
        id=f"comm-{oid}",
        order_id=oid,
        partner_id=partner_id,
        order_total=100000,
        net_revenue=100000,
        cost_of_goods=50000,
        transaction_profit=50000,
        commission_rate=30,
        commission_amount=commission_amount,
        bonus_rate=2 if bonus_amount > 0 else 0,
        bonus_amount=bonus_amount,
        status="final" if status == "completed" else "pending",
        holding_until=created_at_utc + timedelta(days=3),
        created_at=created_at_utc,
    )
    db.add(comm)
    db.commit()
    return order, comm


# =========================================================================
# EDGE CASE 1: Reach Rp25.000 right before midnight (23:59:59 WIB)
# =========================================================================
def test_edge_case_1_reach_target_right_before_midnight():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC1")
        # 23:59:50 WIB today -> convert to UTC: subtract 7 hours
        now_wib = GamificationService.get_wib_now()
        late_night_wib = now_wib.replace(hour=23, minute=59, second=50, microsecond=0)
        late_night_utc = late_night_wib.astimezone(timezone.utc).replace(tzinfo=None)

        order, _ = create_mock_order_and_commission(
            db, partner.id, commission_amount=25000, status="completed", created_at_utc=late_night_utc
        )

        res = GamificationService.sync_order_gamification(order.id, new_status="completed", db=db)
        assert res["success"] is True
        assert res["dailyStatus"] == "COMPLETED"
        assert res["accumulatedCommission"] == 25000

        overview = GamificationService.get_sales_overview(partner.id)
        assert overview["dailyMission"]["status"] == "COMPLETED"
        assert overview["dailyMission"]["progressPercentage"] == 100.0
        assert overview["dailyMission"]["remainingTarget"] == 0
    finally:
        db.close()


# =========================================================================
# EDGE CASE 2: Accumulation from multiple small transactions
# =========================================================================
def test_edge_case_2_multiple_small_transactions_accumulation():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC2")
        now_utc = datetime.utcnow()

        # Step 1: Rp8.000 -> IN_PROGRESS (8.000/25.000)
        o1, _ = create_mock_order_and_commission(db, partner.id, 8000, status="completed", created_at_utc=now_utc)
        r1 = GamificationService.sync_order_gamification(o1.id, "completed", db=db)
        assert r1["dailyStatus"] == "IN_PROGRESS"
        assert r1["accumulatedCommission"] == 8000

        # Step 2: Rp7.000 -> IN_PROGRESS (15.000/25.000)
        o2, _ = create_mock_order_and_commission(db, partner.id, 7000, status="completed", created_at_utc=now_utc)
        r2 = GamificationService.sync_order_gamification(o2.id, "completed", db=db)
        assert r2["dailyStatus"] == "IN_PROGRESS"
        assert r2["accumulatedCommission"] == 15000

        # Step 3: Rp5.000 -> IN_PROGRESS (20.000/25.000)
        o3, _ = create_mock_order_and_commission(db, partner.id, 5000, status="completed", created_at_utc=now_utc)
        r3 = GamificationService.sync_order_gamification(o3.id, "completed", db=db)
        assert r3["dailyStatus"] == "IN_PROGRESS"
        assert r3["accumulatedCommission"] == 20000

        # Step 4: Rp5.000 -> COMPLETED (25.000/25.000)
        o4, _ = create_mock_order_and_commission(db, partner.id, 5000, status="completed", created_at_utc=now_utc)
        r4 = GamificationService.sync_order_gamification(o4.id, "completed", db=db)
        assert r4["dailyStatus"] == "COMPLETED"
        assert r4["accumulatedCommission"] == 25000
    finally:
        db.close()


# =========================================================================
# EDGE CASE 3: Single large transaction (> Rp25.000)
# =========================================================================
def test_edge_case_3_single_large_transaction():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC3")
        order, _ = create_mock_order_and_commission(db, partner.id, 35000, status="completed")

        res = GamificationService.sync_order_gamification(order.id, "completed", db=db)
        assert res["dailyStatus"] == "COMPLETED"
        assert res["accumulatedCommission"] == 35000

        overview = GamificationService.get_sales_overview(partner.id)
        assert overview["dailyMission"]["status"] == "COMPLETED"
        assert overview["dailyMission"]["rawPercentage"] == 140.0
        assert overview["dailyMission"]["remainingTarget"] == 0
    finally:
        db.close()


# =========================================================================
# EDGE CASE 4: Refund/reversal clawback
# =========================================================================
def test_edge_case_4_refund_reversal_clawback():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC4")
        now_utc = datetime.utcnow()

        # Two orders of Rp15.000 each = Rp30.000 -> COMPLETED
        o1, _ = create_mock_order_and_commission(db, partner.id, 15000, status="completed", created_at_utc=now_utc)
        o2, _ = create_mock_order_and_commission(db, partner.id, 15000, status="completed", created_at_utc=now_utc)

        GamificationService.sync_order_gamification(o1.id, "completed", db=db)
        res2 = GamificationService.sync_order_gamification(o2.id, "completed", db=db)
        assert res2["dailyStatus"] == "COMPLETED"
        assert res2["accumulatedCommission"] == 30000

        # Now o2 gets refunded
        res_refund = GamificationService.sync_order_gamification(o2.id, "refunded", db=db)
        assert res_refund["dailyStatus"] == "IN_PROGRESS"
        assert res_refund["accumulatedCommission"] == 15000
    finally:
        db.close()


# =========================================================================
# EDGE CASE 5: Delayed validation after turnover
# =========================================================================
def test_edge_case_5_delayed_order_validation():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC5")
        yesterday_wib = GamificationService.to_wib_date() - timedelta(days=1)
        yesterday_utc = datetime.combine(yesterday_wib, datetime.min.time())

        # Order created yesterday as pending
        order, _ = create_mock_order_and_commission(
            db, partner.id, 25000, status="pending", created_at_utc=yesterday_utc
        )
        r_pending = GamificationService.sync_order_gamification(order.id, "pending", db=db)
        assert r_pending["dailyStatus"] == "FAILED"  # Past day with 0 validated commission

        # Order validated today
        r_valid = GamificationService.sync_order_gamification(order.id, "completed", db=db)
        assert r_valid["dailyStatus"] == "COMPLETED"
        assert r_valid["accumulatedCommission"] == 25000
    finally:
        db.close()


# =========================================================================
# EDGE CASE 6: Day without transaction marked FAILED after cutoff
# =========================================================================
def test_edge_case_6_no_activity_day_cutoff_failed():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC6")
        cutoff_res = GamificationService.run_daily_and_weekly_cutoff(db=db)
        assert cutoff_res["success"] is True

        today_wib = GamificationService.to_wib_date()
        week_start, _ = GamificationService.get_week_bounds(today_wib)
        if week_start < today_wib:
            past_day = week_start
            daily = db.query(SalesDailyGamification).filter(
                SalesDailyGamification.sales_id == partner.id,
                SalesDailyGamification.date == past_day,
            ).first()
            assert daily is not None
            assert daily.status == "FAILED"
    finally:
        db.close()


# =========================================================================
# EDGE CASE 7: 7/7 Days Sunday completion triggers 10% weekly bonus ledger
# =========================================================================
def test_edge_case_7_sunday_week_completion_triggers_weekly_bonus_ledger():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC7")
        today_wib = GamificationService.to_wib_date()
        week_start, week_end = GamificationService.get_week_bounds(today_wib)

        total_direct_comm = 0
        for i in range(7):
            day_d = week_start + timedelta(days=i)
            day_utc = datetime.combine(day_d, datetime.min.time()) + timedelta(hours=10)
            comm_val = 25000 + (i * 1000)
            total_direct_comm += comm_val
            order, _ = create_mock_order_and_commission(
                db, partner.id, comm_val, status="completed", created_at_utc=day_utc
            )
            GamificationService.sync_order_gamification(order.id, "completed", db=db)

        weekly = db.query(SalesWeeklyGamification).filter(
            SalesWeeklyGamification.sales_id == partner.id,
            SalesWeeklyGamification.week_start == week_start,
        ).first()

        assert weekly is not None
        assert weekly.completed_days == 7
        assert weekly.total_commission == total_direct_comm

        expected_bonus = int(round(total_direct_comm * 0.10))
        assert weekly.bonus_amount == expected_bonus

        ledger = db.query(SalesGamificationBonusLedger).filter(
            SalesGamificationBonusLedger.weekly_gamification_id == weekly.id,
            SalesGamificationBonusLedger.bonus_type == "WEEKLY_STREAK",
        ).first()

        assert ledger is not None
        assert ledger.bonus_amount == expected_bonus
        assert ledger.status in ["APPROVED", "PENDING"]
    finally:
        db.close()


# =========================================================================
# EDGE CASE 8: Downtime recovery & idempotent reconciliation
# =========================================================================
def test_edge_case_8_system_downtime_recovery_reconciliation():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC8")
        now_utc = datetime.utcnow()

        # Batch of 5 orders arrived while system was offline
        orders = []
        for i in range(5):
            o, _ = create_mock_order_and_commission(db, partner.id, 6000, status="completed", created_at_utc=now_utc)
            orders.append(o)

        # Replay batch
        for o in orders:
            GamificationService.sync_order_gamification(o.id, "completed", db=db)

        overview = GamificationService.get_sales_overview(partner.id)
        assert overview["dailyMission"]["accumulatedCommission"] == 30000
        assert overview["dailyMission"]["status"] == "COMPLETED"
        assert overview["dailyMission"]["eligibleOrdersCount"] == 5
    finally:
        db.close()


# =========================================================================
# EDGE CASE 9: Idempotency with duplicate events
# =========================================================================
def test_edge_case_9_idempotency_duplicate_events():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC9")
        order, _ = create_mock_order_and_commission(db, partner.id, 10000, status="completed")

        # Send same completed event 5 times
        for _ in range(5):
            res = GamificationService.sync_order_gamification(order.id, "completed", db=db)

        assert res["accumulatedCommission"] == 10000

        event_count = db.query(SalesGamificationOrderEvent).filter(
            SalesGamificationOrderEvent.order_id == order.id
        ).count()
        assert event_count == 1
    finally:
        db.close()


# =========================================================================
# EDGE CASE 10: Admin updates config mid-period
# =========================================================================
def test_edge_case_10_admin_updates_config_mid_period():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC10")
        order, _ = create_mock_order_and_commission(db, partner.id, 25000, status="completed")
        GamificationService.sync_order_gamification(order.id, "completed", db=db)

        daily = db.query(SalesDailyGamification).filter(
            SalesDailyGamification.sales_id == partner.id,
            SalesDailyGamification.date == GamificationService.to_wib_date(),
        ).first()
        assert daily.status == "COMPLETED"

        # Admin changes target to Rp30.000
        GamificationService.update_config({"dailyTargetAmount": 30000}, admin_username="superadmin")

        # Snapshot of already completed day remains COMPLETED
        db.refresh(daily)
        assert daily.status == "COMPLETED"

        # Restore default config
        GamificationService.update_config({"dailyTargetAmount": 25000}, admin_username="superadmin")
    finally:
        db.close()


# =========================================================================
# EDGE CASE 11: Recruitment bonus excluded from calculations
# =========================================================================
def test_edge_case_11_recruitment_bonus_exclusion():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC11")
        # Direct commission: Rp15.000, Recruitment bonus: Rp5.000
        order, _ = create_mock_order_and_commission(
            db, partner.id, commission_amount=15000, bonus_amount=5000, status="completed"
        )

        res = GamificationService.sync_order_gamification(order.id, "completed", db=db)
        # Should strictly be 15000, NOT 20000!
        assert res["accumulatedCommission"] == 15000
        assert res["dailyStatus"] == "IN_PROGRESS"
    finally:
        db.close()


# =========================================================================
# EDGE CASE 12: Unique bonus ledger prevents duplicate payout
# =========================================================================
def test_edge_case_12_unique_bonus_ledger_prevents_duplicate_payout():
    db = SessionLocal()
    try:
        partner = setup_test_partner(db, "EC12")
        today_wib = GamificationService.to_wib_date()
        week_start, week_end = GamificationService.get_week_bounds(today_wib)

        weekly = SalesWeeklyGamification(
            id=f"gameweek-{partner.id}-{week_start.isoformat()}",
            sales_id=partner.id,
            week_start=week_start,
            week_end=week_end,
            completed_days=7,
            total_commission=175000,
            bonus_percentage=10.0,
            bonus_amount=17500,
            status="BONUS_APPROVED",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
        db.add(weekly)
        db.commit()

        # First ledger
        ledger1 = SalesGamificationBonusLedger(
            id=f"bonusledg-1-{weekly.id}",
            sales_id=partner.id,
            weekly_gamification_id=weekly.id,
            bonus_type="WEEKLY_STREAK",
            base_commission=175000,
            bonus_percentage=10.0,
            bonus_amount=17500,
            status="APPROVED",
            created_at=datetime.utcnow(),
        )
        db.add(ledger1)
        db.commit()

        # Second duplicate ledger should raise IntegrityError due to UNIQUE(weekly_gamification_id, bonus_type)
        duplicate_raised = False
        try:
            ledger2 = SalesGamificationBonusLedger(
                id=f"bonusledg-2-{weekly.id}",
                sales_id=partner.id,
                weekly_gamification_id=weekly.id,
                bonus_type="WEEKLY_STREAK",
                base_commission=175000,
                bonus_percentage=10.0,
                bonus_amount=17500,
                status="APPROVED",
                created_at=datetime.utcnow(),
            )
            db.add(ledger2)
            db.commit()
        except Exception:
            db.rollback()
            duplicate_raised = True

        assert duplicate_raised is True, "Database must enforce UNIQUE constraint to prevent duplicate bonus ledger!"
    finally:
        db.close()
