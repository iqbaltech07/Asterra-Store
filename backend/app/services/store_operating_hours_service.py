import json
from datetime import datetime, timezone, timedelta, time
from typing import Dict, Any, Optional, Tuple, List
from sqlalchemy import text

from app.core.database import SessionLocal, engine, Base
from app.models.store_operating_hours import StoreOperatingHours, DEFAULT_WEEKLY_SCHEDULE
from app.core.cache import cache

WIB = timezone(timedelta(hours=7))

DAY_NAMES_EN = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
DAY_NAMES_ID = {
    "monday": "Senin",
    "tuesday": "Selasa",
    "wednesday": "Rabu",
    "thursday": "Kamis",
    "friday": "Jumat",
    "saturday": "Sabtu",
    "sunday": "Minggu",
}

class StoreOperatingHoursService:
    _table_ensured: bool = False

    @classmethod
    def ensure_table(cls, force: bool = False):
        if cls._table_ensured and not force:
            return
        cls._table_ensured = True
        try:
            if engine is not None:
                Base.metadata.create_all(bind=engine, tables=[StoreOperatingHours.__table__])
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT FALSE;"))
                    conn.execute(text("ALTER TABLE store_operating_hours ADD COLUMN IF NOT EXISTS auto_close_time VARCHAR(20) DEFAULT '21:00';"))
                    conn.execute(text("ALTER TABLE store_operating_hours ADD COLUMN IF NOT EXISTS last_manual_opened_at TIMESTAMP WITHOUT TIME ZONE;"))
                    conn.execute(text("ALTER TABLE store_operating_hours ADD COLUMN IF NOT EXISTS last_manual_closed_at TIMESTAMP WITHOUT TIME ZONE;"))
        except Exception as e:
            print(f"[StoreOperatingHoursService] Table init note: {e}")

        # Ensure default main record exists in database
        try:
            db = SessionLocal()
            try:
                row = db.query(StoreOperatingHours).filter_by(id="main").first()
                if not row:
                    default_row = StoreOperatingHours(
                        id="main",
                        mode="auto",
                        weekly_schedule=json.dumps(DEFAULT_WEEKLY_SCHEDULE),
                        allow_preorder=True,
                        timezone="Asia/Jakarta",
                        auto_close_time="21:00",
                    )
                    db.add(default_row)
                    db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[StoreOperatingHoursService] Row seed note: {e}")

    @classmethod
    def get_raw_config(cls) -> Dict[str, Any]:
        """Loads store operating hours configuration from database with fallback."""
        cls.ensure_table()
        try:
            db = SessionLocal()
            try:
                row = db.query(StoreOperatingHours).filter_by(id="main").first()
                if row:
                    return row.to_dict()
            finally:
                db.close()
        except Exception as e:
            print(f"[StoreOperatingHoursService] Warning: Failed to query store operating hours: {e}")

        return {
            "id": "main",
            "mode": "auto",
            "weeklySchedule": DEFAULT_WEEKLY_SCHEDULE,
            "manualCloseReason": None,
            "reopenEstimate": None,
            "allowPreorder": True,
            "timezone": "Asia/Jakarta",
            "autoCloseTime": "21:00",
            "lastManualOpenedAt": None,
            "lastManualClosedAt": None,
            "updatedBy": "system",
            "updatedAt": None,
        }

    @classmethod
    def update_config(cls, payload: Dict[str, Any], admin_actor: Optional[str] = None) -> Dict[str, Any]:
        """Updates store operating hours configuration in database and invalidates cache."""
        cls.ensure_table()
        mode = str(payload.get("mode", "auto")).lower()
        if mode not in ["auto", "manual_open", "manual_closed"]:
            mode = "auto"

        schedule = payload.get("weeklySchedule") or payload.get("weekly_schedule")
        if not isinstance(schedule, dict):
            schedule = DEFAULT_WEEKLY_SCHEDULE

        # Validate schedule day entries
        validated_schedule: Dict[str, Dict[str, Any]] = {}
        for day in DAY_NAMES_EN:
            raw_day = schedule.get(day) if isinstance(schedule.get(day), dict) else DEFAULT_WEEKLY_SCHEDULE[day]
            is_open = bool(raw_day.get("is_open") if "is_open" in raw_day else raw_day.get("isOpen", True))
            open_time = str(raw_day.get("open_time") or raw_day.get("openTime") or "09:00").strip()
            close_time = str(raw_day.get("close_time") or raw_day.get("closeTime") or "21:00").strip()
            validated_schedule[day] = {
                "is_open": is_open,
                "open_time": open_time if len(open_time) == 5 else "09:00",
                "close_time": close_time if len(close_time) == 5 else "21:00",
            }

        manual_reason = payload.get("manualCloseReason") or payload.get("manual_close_reason")
        reopen_est = payload.get("reopenEstimate") or payload.get("reopen_estimate")
        allow_preorder = bool(payload.get("allowPreorder", payload.get("allow_preorder", True)))
        auto_close_time = str(payload.get("autoCloseTime") or payload.get("auto_close_time") or "21:00").strip()
        action = str(payload.get("action") or "").lower()

        db = SessionLocal()
        try:
            row = db.query(StoreOperatingHours).filter_by(id="main").first()
            if not row:
                row = StoreOperatingHours(id="main")
                db.add(row)

            now_utc = datetime.utcnow()
            if mode == "manual_open" or action == "open" or payload.get("isOpen") is True or payload.get("is_open") is True:
                row.last_manual_opened_at = now_utc
                row.mode = "manual_open"
            elif mode == "manual_closed" or action == "close" or payload.get("isOpen") is False or payload.get("is_open") is False:
                row.last_manual_closed_at = now_utc
                row.mode = "manual_closed"
            else:
                row.mode = mode

            row.weekly_schedule = json.dumps(validated_schedule)
            row.manual_close_reason = str(manual_reason).strip() if manual_reason else None
            row.reopen_estimate = str(reopen_est).strip() if reopen_est else None
            row.allow_preorder = allow_preorder
            row.auto_close_time = auto_close_time if len(auto_close_time) == 5 else "21:00"
            row.updated_by = admin_actor or "admin"
            row.updated_at = now_utc
            db.commit()
            db.refresh(row)
            res = row.to_dict()
        finally:
            db.close()

        cache.invalidate("store", "store_operating_hours")
        return res

    @classmethod
    def open_store_manual(cls, admin_actor: Optional[str] = "admin") -> Dict[str, Any]:
        """Admin explicit manual action to open the store."""
        return cls.update_config({"mode": "manual_open", "action": "open"}, admin_actor=admin_actor)

    @classmethod
    def close_store_manual(cls, reason: Optional[str] = None, admin_actor: Optional[str] = "admin") -> Dict[str, Any]:
        """Admin explicit manual action to close the store."""
        return cls.update_config({"mode": "manual_closed", "action": "close", "manualCloseReason": reason}, admin_actor=admin_actor)

    @classmethod
    def get_current_status(cls, ref_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Determines current operational status of the store in Asia/Jakarta (WIB, UTC+7) timezone.
        Modes:
        - 'auto': Strictly follows weeklySchedule (open_time, close_time, is_open) and autoCloseTime in WIB.
        - 'manual_open': Explicitly forced open by Admin until closed.
        - 'manual_closed': Explicitly forced closed by Admin until reopened.
        """
        config = cls.get_raw_config()
        mode = str(config.get("mode") or "auto").lower()
        schedule: Dict[str, Any] = config.get("weeklySchedule") or DEFAULT_WEEKLY_SCHEDULE
        allow_preorder = bool(config.get("allowPreorder", True))
        manual_reason = config.get("manualCloseReason")
        reopen_est = config.get("reopenEstimate")
        auto_close_str = str(config.get("autoCloseTime") or "21:00")

        # Reference time in Asia/Jakarta (WIB, UTC+7)
        if ref_time is None:
            now_wib = datetime.now(WIB)
        else:
            if ref_time.tzinfo is not None:
                now_wib = ref_time.astimezone(WIB)
            else:
                now_wib = ref_time.replace(tzinfo=WIB)

        current_day_en = now_wib.strftime("%A").lower()
        today_idx = DAY_NAMES_EN.index(current_day_en) if current_day_en in DAY_NAMES_EN else 0

        # Retrieve today's schedule
        today_sched = schedule.get(current_day_en) if isinstance(schedule.get(current_day_en), dict) else DEFAULT_WEEKLY_SCHEDULE.get(current_day_en, {})
        today_is_open = bool(today_sched.get("is_open") if "is_open" in today_sched else today_sched.get("isOpen", True))
        open_time_str = str(today_sched.get("open_time") or today_sched.get("openTime") or "09:00").strip()
        close_time_str = str(today_sched.get("close_time") or today_sched.get("closeTime") or auto_close_str or "21:00").strip()

        try:
            oh, om = [int(x) for x in open_time_str.split(":")]
            open_t = time(oh, om)
        except Exception:
            open_t = time(9, 0)
            open_time_str = "09:00"

        try:
            ch, cm = [int(x) for x in close_time_str.split(":")]
            close_t = time(ch, cm)
        except Exception:
            close_t = time(21, 0)
            close_time_str = "21:00"

        # Helper to find next opening day and time
        def find_next_open_display() -> str:
            for offset in range(1, 8):
                next_day_idx = (today_idx + offset) % 7
                next_day_name = DAY_NAMES_EN[next_day_idx]
                next_day_sched = schedule.get(next_day_name) if isinstance(schedule.get(next_day_name), dict) else DEFAULT_WEEKLY_SCHEDULE.get(next_day_name, {})
                next_is_open = bool(next_day_sched.get("is_open") if "is_open" in next_day_sched else next_day_sched.get("isOpen", True))
                if next_is_open:
                    next_open_t = str(next_day_sched.get("open_time") or next_day_sched.get("openTime") or "09:00").strip()
                    if offset == 1:
                        return f"besok ({DAY_NAMES_ID.get(next_day_name, next_day_name)}) pukul {next_open_t} WIB"
                    return f"{DAY_NAMES_ID.get(next_day_name, next_day_name)} pukul {next_open_t} WIB"
            return "sesuai jadwal operasional"

        SLEEPING_ADMIN_NOTE = "Pemesanan akan diproses kembali ketika jam operasional toko aktif 😴."

        final_is_open = False
        status_label = "Tutup"
        final_next_close_dt = None
        final_next_close_display = None
        final_next_open_display = None
        banner_message = None

        if mode == "manual_closed":
            final_is_open = False
            status_label = "Tutup (Manual Admin)"
            final_next_open_display = reopen_est or "ketika Admin membuka toko kembali"
            banner_message = f"{SLEEPING_ADMIN_NOTE} Toko sedang ditutup sementara oleh Admin." if not manual_reason else f"{SLEEPING_ADMIN_NOTE} ({manual_reason})"

        elif mode == "manual_open":
            final_is_open = True
            status_label = "Buka (Manual Admin)"
            final_next_close_display = f"pukul {close_time_str} WIB"
            banner_message = None

        else:
            # Mode Otomatis (auto) based on WIB schedule
            curr_t = now_wib.time()
            if not today_is_open:
                final_is_open = False
                status_label = "Tutup (Hari Libur Toko)"
                final_next_open_display = find_next_open_display()
                banner_message = f"{SLEEPING_ADMIN_NOTE} Hari ini toko libur. Buka kembali {final_next_open_display}."
            elif curr_t < open_t:
                final_is_open = False
                status_label = f"Tutup (Buka {open_time_str} WIB)"
                final_next_open_display = f"hari ini pukul {open_time_str} WIB"
                banner_message = f"{SLEEPING_ADMIN_NOTE} Toko buka kembali hari ini pukul {open_time_str} WIB. Anda tetap dapat memesan via Pre-Order."
            elif curr_t >= close_t:
                final_is_open = False
                status_label = f"Tutup Otomatis ({close_time_str} WIB)"
                final_next_open_display = find_next_open_display()
                banner_message = f"{SLEEPING_ADMIN_NOTE} Toko telah tutup otomatis pukul {close_time_str} WIB. Buka kembali {final_next_open_display}. Anda tetap dapat memesan via Pre-Order."
            else:
                final_is_open = True
                status_label = "Buka"
                final_next_close_dt = now_wib.replace(hour=close_t.hour, minute=close_t.minute, second=0, microsecond=0)
                final_next_close_display = f"pukul {close_time_str} WIB"
                banner_message = None

        return {
            "status": "open" if final_is_open else "closed",
            "isOpen": final_is_open,
            "is_open": final_is_open,
            "mode": mode,
            "statusLabel": status_label,
            "currentTimeWIB": now_wib.isoformat(),
            "currentDay": current_day_en,
            "currentDayID": DAY_NAMES_ID.get(current_day_en, current_day_en),
            "autoCloseTime": auto_close_str,
            "nextCloseAt": final_next_close_dt.isoformat() if final_next_close_dt else None,
            "nextCloseDisplay": final_next_close_display,
            "nextOpenDisplay": final_next_open_display,
            "next_open_display": final_next_open_display,
            "bannerMessage": banner_message,
            "banner_message": banner_message,
            "sleepingAdminNote": SLEEPING_ADMIN_NOTE if not final_is_open else None,
            "allowPreorder": allow_preorder,
            "allow_preorder": allow_preorder,
            "weeklySchedule": schedule,
            "manualCloseReason": manual_reason,
            "reopenEstimate": reopen_est,
            "timezone": "Asia/Jakarta",
            "updatedAt": config.get("updatedAt"),
            "updatedBy": config.get("updatedBy"),
        }
