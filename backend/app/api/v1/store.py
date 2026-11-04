from typing import Optional, Dict, Any
from fastapi import APIRouter, Request, HTTPException, Depends
from app.services.store_operating_hours_service import StoreOperatingHoursService
from app.core.auth import get_current_admin
from app.services.realtime_broadcaster import RealtimeBroadcaster
from app.core.cache import cache

router = APIRouter()

@router.get("/store/operating-hours", tags=["Store"])
def get_store_operating_hours():
    """
    Public endpoint: Returns live operating status of the store,
    including current day, open/closed state, next opening time,
    and storefront banner notice calculated in Asia/Jakarta timezone.
    """
    cached = cache.get("store", "operating_hours_status")
    if cached is not None:
        return {
            "success": True,
            "data": cached,
        }

    status = StoreOperatingHoursService.get_current_status()
    # Cache dynamically: maximum 15s, but cap at remaining seconds until next transition so status changes with exact-second accuracy
    target_iso = status.get("nextCloseAt") or status.get("nextOpenAt")
    ttl = 15
    if target_iso:
        try:
            from datetime import datetime
            from app.services.store_operating_hours_service import WIB
            target_dt = datetime.fromisoformat(target_iso)
            now_wib = datetime.now(WIB)
            diff = int((target_dt - now_wib).total_seconds())
            if diff > 0:
                ttl = max(1, min(15, diff))
            else:
                ttl = 1
        except Exception:
            pass

    cache.set("store", "operating_hours_status", status, ttl=ttl)

    return {
        "success": True,
        "data": status,
    }

@router.get("/admin/store/operating-hours", tags=["Admin Store"])
def get_admin_store_operating_hours(request: Request):
    """
    Admin endpoint: Returns detailed operating hours configuration
    and live status for administrative management.
    """
    admin = get_current_admin(request)
    raw_config = StoreOperatingHoursService.get_raw_config()
    current_status = StoreOperatingHoursService.get_current_status()

    return {
        "success": True,
        "data": {
            "config": raw_config,
            "status": current_status,
        },
    }

@router.put("/admin/store/operating-hours", tags=["Admin Store"])
@router.post("/admin/store/operating-hours", tags=["Admin Store"])
async def update_admin_store_operating_hours(request: Request):
    """
    Admin endpoint: Updates store operating hours, weekly schedule,
    and manual override status. Changes are saved directly to database
    and immediately synchronized with user-facing storefronts.
    """
    admin = get_current_admin(request)
    payload = await request.json()

    actor_email = admin.get("email") or "admin"
    updated_config = StoreOperatingHoursService.update_config(payload, admin_actor=actor_email)
    cache.invalidate("store")

    new_status = StoreOperatingHoursService.get_current_status()

    # Broadcast real-time SSE update to connected users and admins
    RealtimeBroadcaster.broadcast(
        "store_hours:updated",
        {
            "status": new_status,
            "updatedBy": actor_email,
        },
        target_role="all",
    )

    return {
        "success": True,
        "message": "Pengaturan jam operasional toko berhasil disimpan.",
        "data": {
            "config": updated_config,
            "status": new_status,
        },
    }
