from datetime import datetime
from sqlalchemy import Column, String, Integer, Numeric, Boolean, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class SalesGamificationConfig(Base):
    __tablename__ = "sales_gamification_configs"

    id = Column(String(50), primary_key=True, default="default")
    is_enabled = Column(Boolean, default=True, nullable=False)
    daily_target_amount = Column(Integer, default=25000, nullable=False)
    weekly_streak_days = Column(Integer, default=7, nullable=False)
    weekly_bonus_percentage = Column(Numeric(5, 2), default=10.00, nullable=False)
    timezone = Column(String(50), default="Asia/Jakarta", nullable=False)
    week_start_day = Column(String(20), default="MONDAY", nullable=False)
    product_suggestion_enabled = Column(Boolean, default=True, nullable=False)
    auto_approve_weekly_bonus = Column(Boolean, default=True, nullable=False)
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "isEnabled": self.is_enabled,
            "dailyTargetAmount": self.daily_target_amount,
            "weeklyStreakDays": self.weekly_streak_days,
            "weeklyBonusPercentage": float(self.weekly_bonus_percentage or 10.0),
            "timezone": self.timezone,
            "weekStartDay": self.week_start_day,
            "productSuggestionEnabled": self.product_suggestion_enabled,
            "autoApproveWeeklyBonus": self.auto_approve_weekly_bonus,
            "updatedBy": self.updated_by,
            "updatedAt": (self.updated_at.isoformat() + "Z") if self.updated_at else None,
        }


class SalesDailyGamification(Base):
    __tablename__ = "sales_daily_gamification"

    id = Column(String(100), primary_key=True)
    sales_id = Column(String(100), ForeignKey("sales_partners.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    target_amount = Column(Integer, default=25000, nullable=False)
    accumulated_commission = Column(Integer, default=0, nullable=False)
    estimated_pending_commission = Column(Integer, default=0, nullable=False)
    eligible_orders_count = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default="NOT_STARTED", nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "salesId": self.sales_id,
            "date": self.date.isoformat() if self.date else None,
            "targetAmount": self.target_amount,
            "accumulatedCommission": self.accumulated_commission,
            "estimatedPendingCommission": self.estimated_pending_commission,
            "eligibleOrdersCount": self.eligible_orders_count,
            "status": self.status,
            "completedAt": (self.completed_at.isoformat() + "Z") if self.completed_at else None,
            "createdAt": (self.created_at.isoformat() + "Z") if self.created_at else None,
            "updatedAt": (self.updated_at.isoformat() + "Z") if self.updated_at else None,
        }


class SalesWeeklyGamification(Base):
    __tablename__ = "sales_weekly_gamification"

    id = Column(String(100), primary_key=True)
    sales_id = Column(String(100), ForeignKey("sales_partners.id", ondelete="CASCADE"), nullable=False, index=True)
    week_start = Column(Date, nullable=False, index=True)
    week_end = Column(Date, nullable=False)
    completed_days = Column(Integer, default=0, nullable=False)
    total_commission = Column(Integer, default=0, nullable=False)
    bonus_percentage = Column(Numeric(5, 2), default=10.00, nullable=False)
    bonus_amount = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default="IN_PROGRESS", nullable=False, index=True)
    bonus_paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "salesId": self.sales_id,
            "weekStart": self.week_start.isoformat() if self.week_start else None,
            "weekEnd": self.week_end.isoformat() if self.week_end else None,
            "completedDays": self.completed_days,
            "totalCommission": self.total_commission,
            "bonusPercentage": float(self.bonus_percentage or 10.0),
            "bonusAmount": self.bonus_amount,
            "status": self.status,
            "bonusPaidAt": (self.bonus_paid_at.isoformat() + "Z") if self.bonus_paid_at else None,
            "createdAt": (self.created_at.isoformat() + "Z") if self.created_at else None,
            "updatedAt": (self.updated_at.isoformat() + "Z") if self.updated_at else None,
        }


class SalesGamificationBonusLedger(Base):
    __tablename__ = "sales_gamification_bonus_ledger"

    id = Column(String(100), primary_key=True)
    sales_id = Column(String(100), ForeignKey("sales_partners.id", ondelete="CASCADE"), nullable=False, index=True)
    weekly_gamification_id = Column(String(100), ForeignKey("sales_weekly_gamification.id", ondelete="CASCADE"), nullable=False)
    bonus_type = Column(String(50), default="WEEKLY_STREAK", nullable=False)
    base_commission = Column(Integer, default=0, nullable=False)
    bonus_percentage = Column(Numeric(5, 2), default=10.00, nullable=False)
    bonus_amount = Column(Integer, default=0, nullable=False)
    status = Column(String(30), default="PENDING", nullable=False, index=True)
    reversal_reason = Column(Text, nullable=True)
    approved_by = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    approved_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "salesId": self.sales_id,
            "weeklyGamificationId": self.weekly_gamification_id,
            "bonusType": self.bonus_type,
            "baseCommission": self.base_commission,
            "bonusPercentage": float(self.bonus_percentage or 10.0),
            "bonusAmount": self.bonus_amount,
            "status": self.status,
            "reversalReason": self.reversal_reason,
            "approvedBy": self.approved_by,
            "createdAt": (self.created_at.isoformat() + "Z") if self.created_at else None,
            "approvedAt": (self.approved_at.isoformat() + "Z") if self.approved_at else None,
            "paidAt": (self.paid_at.isoformat() + "Z") if self.paid_at else None,
        }


class SalesGamificationOrderEvent(Base):
    __tablename__ = "sales_gamification_order_events"

    id = Column(String(100), primary_key=True)
    order_id = Column(String(100), ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False)
    commission_id = Column(String(100), nullable=True)
    sales_id = Column(String(100), ForeignKey("sales_partners.id", ondelete="CASCADE"), nullable=False, index=True)
    daily_gamification_id = Column(String(100), ForeignKey("sales_daily_gamification.id", ondelete="SET NULL"), nullable=True, index=True)
    wib_date = Column(Date, nullable=False, index=True)
    direct_commission_amount = Column(Integer, default=0, nullable=False)
    is_counted = Column(Boolean, default=False, nullable=False, index=True)
    order_status = Column(String(50), default="pending", nullable=False)
    validated_at = Column(DateTime, nullable=True)
    reversed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "orderId": self.order_id,
            "commissionId": self.commission_id,
            "salesId": self.sales_id,
            "dailyGamificationId": self.daily_gamification_id,
            "wibDate": self.wib_date.isoformat() if self.wib_date else None,
            "directCommissionAmount": self.direct_commission_amount,
            "isCounted": self.is_counted,
            "orderStatus": self.order_status,
            "validatedAt": (self.validated_at.isoformat() + "Z") if self.validated_at else None,
            "reversedAt": (self.reversed_at.isoformat() + "Z") if self.reversed_at else None,
            "createdAt": (self.created_at.isoformat() + "Z") if self.created_at else None,
            "updatedAt": (self.updated_at.isoformat() + "Z") if self.updated_at else None,
        }

