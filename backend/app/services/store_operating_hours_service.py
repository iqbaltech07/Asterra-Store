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
                # Ensure is_preorder column exists on orders table safely
                with engine.begin() as conn:
                    conn.execute(text("ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT FALSE;"))
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
            close_time = str(raw_day.get("close_time") or raw_day.get("closeTime") or "23:00").strip()
            validated_schedule[day] = {
                "is_open": is_open,
                "open_time": open_time if len(open_time) == 5 else "09:00",
                "close_time": close_time if len(close_time) == 5 else "23:00",
            }

        manual_reason = payload.get("manualCloseReason") or payload.get("manual_close_reason")
        reopen_est = payload.get("reopenEstimate") or payload.get("reopen_estimate")
        allow_preorder = bool(payload.get("allowPreorder", payload.get("allow_preorder", True)))

        db = SessionLocal()
        try:
            row = db.query(StoreOperatingHours).filter_by(id="main").first()
            if not row:
                row = StoreOperatingHours(id="main")
                db.add(row)

            row.mode = mode
            row.weekly_schedule = json.dumps(validated_schedule)
            row.manual_close_reason = str(manual_reason).strip() if manual_reason else None
            row.reopen_estimate = str(reopen_est).strip() if reopen_est else None
            row.allow_preorder = allow_preorder
            row.updated_by = admin_actor or "admin"
            row.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(row)
            res = row.to_dict()
        finally:
            db.close()

        cache.invalidate("store", "store_operating_hours")
        return res

    @classmethod
    def get_current_status(cls, ref_time: Optional[datetime] = None) -> Dict[str, Any]:
        """
        Determines current operational status of the store in Asia/Jakarta timezone.
        Evaluates manual overrides and automatic weekly schedule (including midnight-crossing).
        Returns calculated operational status, next opening / closing times, and storefront message.
        """
        config = cls.get_raw_config()
        mode = config.get("mode", "auto")
        schedule: Dict[str, Any] = config.get("weeklySchedule") or DEFAULT_WEEKLY_SCHEDULE
        allow_preorder = bool(config.get("allowPreorder", True))
        manual_reason = config.get("manualCloseReason")
        reopen_est = config.get("reopenEstimate")

        # Reference time in Asia/Jakarta (WIB)
        if ref_time is None:
            now_wib = datetime.now(WIB)
        else:
            if ref_time.tzinfo is not None:
                now_wib = ref_time.astimezone(WIB)
            else:
                now_wib = ref_time.replace(tzinfo=WIB)

        current_time_str = now_wib.strftime("%H:%M")
        current_day_en = now_wib.strftime("%A").lower()
        now_time = now_wib.time()

        # Yesterday and Tomorrow day names
        yesterday_wib = now_wib - timedelta(days=1)
        yesterday_day_en = yesterday_wib.strftime("%A").lower()

        # Check schedule for yesterday (overnight spillover: e.g. 18:00 - 02:00)
        yest_sched = schedule.get(yesterday_day_en) or DEFAULT_WEEKLY_SCHEDULE.get(yesterday_day_en, {})
        yest_is_open = bool(yest_sched.get("is_open", True))
        yest_open_str = yest_sched.get("open_time", "09:00")
        yest_close_str = yest_sched.get("close_time", "23:00")

        # Today's schedule
        today_sched = schedule.get(current_day_en) or DEFAULT_WEEKLY_SCHEDULE.get(current_day_en, {})
        today_is_open = bool(today_sched.get("is_open", True))
        today_open_str = today_sched.get("open_time", "09:00")
        today_close_str = today_sched.get("close_time", "23:00")

        def parse_hm(s: str) -> time:
            try:
                parts = s.split(":")
                return time(int(parts[0]), int(parts[1]))
            except Exception:
                return time(0, 0)

        t_open = parse_hm(today_open_str)
        t_close = parse_hm(today_close_str)
        y_open = parse_hm(yest_open_str)
        y_close = parse_hm(yest_close_str)

        # ----------------------------------------------------
        # 1. Evaluate Schedule Status (Auto Mode Base)
        # ----------------------------------------------------
        sched_is_open = False
        sched_next_open_dt: Optional[datetime] = None
        sched_next_open_display: Optional[str] = None
        sched_next_close_dt: Optional[datetime] = None
        sched_next_close_display: Optional[str] = None

        # Check Case A: Overflow from yesterday's overnight shift
        is_yesterday_overnight = yest_is_open and (y_close <= y_open)
        if is_yesterday_overnight and now_time < y_close:
            sched_is_open = True
            sched_next_close_dt = now_wib.replace(hour=y_close.hour, minute=y_close.minute, second=0, microsecond=0)
            sched_next_close_display = f"{yest_close_str} WIB"

        # Check Case B: Today's active shift
        if not sched_is_open and today_is_open:
            if t_open < t_close:
                # Normal same-day interval (e.g. 09:00 - 23:00)
                if t_open <= now_time < t_close:
                    sched_is_open = True
                    sched_next_close_dt = now_wib.replace(hour=t_close.hour, minute=t_close.minute, second=0, microsecond=0)
                    sched_next_close_display = f"{today_close_str} WIB"
            else:
                # Overnight interval starting today (e.g. 18:00 - 02:00)
                if now_time >= t_open:
                    sched_is_open = True
                    # Close tomorrow at t_close
                    tomorrow_wib = now_wib + timedelta(days=1)
                    sched_next_close_dt = tomorrow_wib.replace(hour=t_close.hour, minute=t_close.minute, second=0, microsecond=0)
                    sched_next_close_display = f"besok {today_close_str} WIB"

        # If scheduled closed, calculate next scheduled opening time
        if not sched_is_open:
            # Check if today opens later today
            if today_is_open and now_time < t_open:
                sched_next_open_dt = now_wib.replace(hour=t_open.hour, minute=t_open.minute, second=0, microsecond=0)
                sched_next_open_display = f"{today_open_str} WIB"
            else:
                # Scan upcoming 7 days to find next active open day
                for day_offset in range(1, 8):
                    future_dt = now_wib + timedelta(days=day_offset)
                    f_day_en = future_dt.strftime("%A").lower()
                    f_sched = schedule.get(f_day_en) or DEFAULT_WEEKLY_SCHEDULE.get(f_day_en, {})
                    if f_sched.get("is_open", True):
                        f_open_str = f_sched.get("open_time", "09:00")
                        f_open_time = parse_hm(f_open_str)
                        sched_next_open_dt = future_dt.replace(hour=f_open_time.hour, minute=f_open_time.minute, second=0, microsecond=0)
                        f_day_id = DAY_NAMES_ID.get(f_day_en, f_day_en)
                        if day_offset == 1:
                            sched_next_open_display = f"besok pukul {f_open_str} WIB"
                        else:
                            sched_next_open_display = f"{f_day_id} pukul {f_open_str} WIB"
                        break

        # ----------------------------------------------------
        SLEEPING_ADMIN_NOTE = "Pemesanan akan diproses kembali ketika admin sudah bangun dari tidurnya 😴"

        # 2. Apply Mode Priority (Manual Override vs Auto)
        # ----------------------------------------------------
        if mode == "manual_open":
            final_is_open = True
            final_next_open_dt = None
            final_next_open_display = None
            final_next_close_dt = None
            final_next_close_display = None
            banner_message = None
            status_label = "Buka (Manual Override)"
        elif mode == "manual_closed":
            final_is_open = False
            final_next_open_dt = None
            final_next_close_dt = None
            final_next_close_display = None
            if reopen_est:
                final_next_open_display = reopen_est
                banner_message = f"{SLEEPING_ADMIN_NOTE} Pemesanan akan dibuka kembali pada {reopen_est}."
            elif sched_next_open_display:
                # Provide scheduled opening time as helpful reference
                final_next_open_display = sched_next_open_display
                banner_message = f"{SLEEPING_ADMIN_NOTE} Pemesanan akan dibuka kembali pada {sched_next_open_display}."
            else:
                final_next_open_display = None
                banner_message = f"{SLEEPING_ADMIN_NOTE} (Toko sedang tutup sementara oleh Admin)." if not manual_reason else f"{SLEEPING_ADMIN_NOTE} ({manual_reason})"
            status_label = "Tutup (Manual Override)"
        else:
            # Auto Mode
            final_is_open = sched_is_open
            final_next_open_dt = sched_next_open_dt
            final_next_open_display = sched_next_open_display
            final_next_close_dt = sched_next_close_dt
            final_next_close_display = sched_next_close_display
            status_label = "Buka" if final_is_open else "Tutup"
            if final_is_open:
                banner_message = None
            else:
                if final_next_open_display:
                    banner_message = f"{SLEEPING_ADMIN_NOTE} Pemesanan akan dibuka kembali pada {final_next_open_display}."
                else:
                    banner_message = f"{SLEEPING_ADMIN_NOTE} Pemesanan sedang di luar jam operasional toko."

        return {
            "status": "open" if final_is_open else "closed",
            "isOpen": final_is_open,
            "is_open": final_is_open,
            "mode": mode,
            "statusLabel": status_label,
            "currentTimeWIB": now_wib.isoformat(),
            "currentDay": current_day_en,
            "currentDayID": DAY_NAMES_ID.get(current_day_en, current_day_en),
            "nextOpenAt": final_next_open_dt.isoformat() if final_next_open_dt else None,
            "nextOpenDisplay": final_next_open_display,
            "next_open_display": final_next_open_display,
            "nextCloseAt": final_next_close_dt.isoformat() if final_next_close_dt else None,
            "nextCloseDisplay": final_next_close_display,
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

