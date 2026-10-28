from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request, HTTPException, Query
from fastapi.responses import JSONResponse

from app.services.finance_service import FinanceService
from app.services.analytics_service import AnalyticsService
from app.services.admin_user_service import AdminUserService
from app.services.audit_log_service import AuditLogService
from app.services.realtime_broadcaster import RealtimeBroadcaster

router = APIRouter()

# ------------------------------------------
# 1. Finance & Analytics Endpoints
# ------------------------------------------
@router.get("/admin/profit-distribution", tags=["Admin Finance"])
def get_profit_distribution():
    res = FinanceService.get_profit_distribution()
    return {
        "success": True,
        "data": res,
    }

@router.get("/admin/analytics/overview", tags=["Admin Analytics"])
def get_analytics_overview():
    return {
        "success": True,
        "data": AnalyticsService.get_dashboard_overview(),
    }

@router.get("/admin/analytics/suite", tags=["Admin Analytics"])
def get_analytics_suite(period: Optional[str] = Query("30d")):
    return {
        "success": True,
        "data": AnalyticsService.get_analytics_suite_data(period=period or "30d"),
    }

@router.get("/admin/finance/summary", tags=["Admin Finance"])
def get_finance_summary():
    return {
        "success": True,
        "data": AnalyticsService.get_finance_summary(),
    }

@router.get("/admin/customers", tags=["Admin Customers"])
def get_admin_customers():
    return {
        "success": True,
        "data": AnalyticsService.get_customers(),
    }

# ------------------------------------------
# 2. Administrator Users Management
# ------------------------------------------
@router.get("/admin/users", tags=["Admin Users"])
def get_admin_users():
    admins = AdminUserService.get_clean_admins()
    return {
        "success": True,
        "admins": admins,
        "data": admins,
    }

@router.post("/admin/users", tags=["Admin Users"])
async def create_admin_user(request: Request):
    payload = await request.json()
    res = AdminUserService.create_admin(payload)
    if not res.get("success"):
        return JSONResponse(status_code=400, content=res)
    RealtimeBroadcaster.broadcast(
        "admin_users:updated",
        {"action": "create", "admin": res.get("admin")},
        target_role="admin",
    )
    return res

@router.patch("/admin/users/{admin_id}", tags=["Admin Users"])
async def update_admin_user(admin_id: str, request: Request):
    payload = await request.json()
    updated = AdminUserService.update_admin(admin_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Administrator tidak ditemukan.")
    RealtimeBroadcaster.broadcast(
        "admin_users:updated",
        {"action": "update", "admin_id": admin_id},
        target_role="admin",
    )
    return {
        "success": True,
        "message": "Akun administrator berhasil diperbarui.",
        "admin": updated,
    }

@router.delete("/admin/users/{admin_id}", tags=["Admin Users"])
def delete_admin_user(admin_id: str):
    deleted = AdminUserService.delete_admin(admin_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Administrator tidak ditemukan.")
    RealtimeBroadcaster.broadcast(
        "admin_users:updated",
        {"action": "delete", "admin_id": admin_id},
        target_role="admin",
    )
    return {
        "success": True,
        "message": "Akun administrator berhasil dihapus.",
    }

# ------------------------------------------
# 3. Activity & Audit Logs
# ------------------------------------------
@router.get("/admin/logs", tags=["Admin Logs"])
def get_admin_logs(
    actor: Optional[str] = None,
    order_id: Optional[str] = None,
    since: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
):
    result = AuditLogService.get_logs(actor=actor, order_id=order_id, since=since, page=page, limit=limit)
    return {
        "success": True,
        "data": result["logs"],
        "pagination": {
            "total_items": result["total"],
            "current_page": result["page"],
            "total_pages": result["totalPages"],
            "items_per_page": result["limit"],
        },
    }
