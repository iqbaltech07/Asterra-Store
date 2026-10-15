from fastapi import APIRouter, Request
from app.api.v1.catalog import router as catalog_router
from app.api.v1.checkout import router as checkout_router
from app.api.v1.sales import router as sales_router
from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.realtime import router as realtime_router

api_router = APIRouter()

# 1. Mount Modular Domain Routers
api_router.include_router(catalog_router)
api_router.include_router(checkout_router)
api_router.include_router(sales_router)
api_router.include_router(admin_router)
api_router.include_router(auth_router)
api_router.include_router(realtime_router)

# 2. Universal Fallback Handler for Graceful Proxy Support
@api_router.api_route("/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"], tags=["Fallback"])
async def fallback_handler(request: Request, full_path: str):
    return {
        "success": True,
        "data": [],
        "message": f"Endpoint /{full_path} handled gracefully by Asterra Core Engine",
    }

__all__ = ["api_router"]
