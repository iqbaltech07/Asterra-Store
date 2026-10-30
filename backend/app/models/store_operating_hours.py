from datetime import datetime
import json
from typing import Dict, Any, Optional
from sqlalchemy import Column, String, Boolean, DateTime, Text
from app.core.database import Base

DEFAULT_WEEKLY_SCHEDULE: Dict[str, Dict[str, Any]] = {
    "monday": {"is_open": True, "open_time": "09:00", "close_time": "21:00"},
    "tuesday": {"is_open": True, "open_time": "09:00", "close_time": "21:00"},
    "wednesday": {"is_open": True, "open_time": "09:00", "close_time": "21:00"},
    "thursday": {"is_open": True, "open_time": "09:00", "close_time": "21:00"},
    "friday": {"is_open": True, "open_time": "09:00", "close_time": "21:00"},
    "saturday": {"is_open": True, "open_time": "09:00", "close_time": "21:00"},
    "sunday": {"is_open": True, "open_time": "09:00", "close_time": "21:00"},
}

class StoreOperatingHours(Base):
    __tablename__ = "store_operating_hours"

    id = Column(String(50), primary_key=True, default="main")
    mode = Column(String(20), default="auto", nullable=False)  # 'auto' | 'manual_open' | 'manual_closed'
    weekly_schedule = Column(Text, nullable=False, default=lambda: json.dumps(DEFAULT_WEEKLY_SCHEDULE))
    manual_close_reason = Column(Text, nullable=True)
    reopen_estimate = Column(String(100), nullable=True)
    allow_preorder = Column(Boolean, default=True, nullable=False)
    timezone = Column(String(50), default="Asia/Jakarta", nullable=False)
    auto_close_time = Column(String(20), default="21:00", nullable=True)
    last_manual_opened_at = Column(DateTime, nullable=True)
    last_manual_closed_at = Column(DateTime, nullable=True)
    updated_by = Column(String(100), nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def get_schedule_dict(self) -> Dict[str, Any]:
        if not self.weekly_schedule:
            return DEFAULT_WEEKLY_SCHEDULE
        try:
            parsed = json.loads(self.weekly_schedule)
            if isinstance(parsed, dict):
                return {**DEFAULT_WEEKLY_SCHEDULE, **parsed}
        except Exception:
            pass
        return DEFAULT_WEEKLY_SCHEDULE

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "mode": self.mode,
            "weeklySchedule": self.get_schedule_dict(),
            "manualCloseReason": self.manual_close_reason,
            "reopenEstimate": self.reopen_estimate,
            "allowPreorder": self.allow_preorder if self.allow_preorder is not None else True,
            "timezone": self.timezone or "Asia/Jakarta",
            "autoCloseTime": self.auto_close_time or "21:00",
            "lastManualOpenedAt": self.last_manual_opened_at.isoformat() if self.last_manual_opened_at else None,
            "lastManualClosedAt": self.last_manual_closed_at.isoformat() if self.last_manual_closed_at else None,
            "updatedBy": self.updated_by,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }
