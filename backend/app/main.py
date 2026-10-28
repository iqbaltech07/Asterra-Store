import sys
import pathlib
from datetime import datetime

# Ensure backend root and app directory are always in sys.path for serverless runtimes (Vercel / Lambda)
_current_dir = pathlib.Path(__file__).resolve().parent
_parent_dir = _current_dir.parent
for _p in [str(_parent_dir), str(_current_dir)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse

from app.config import settings
from app.core.auth import (
    get_admin_auth_secret,
    create_admin_session_token,
    verify_admin_session_token,
    get_current_admin,
    get_current_sales_or_admin,
)
from contextlib import asynccontextmanager
from app.api.v1 import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Preload caches and ensure DB tables on boot
    try:
        from app.services.campaign_service import CampaignService
        CampaignService.ensure_table()
        CampaignService.load_campaigns()
    except Exception as e:
        print(f"[Lifespan] Campaign init note: {e}")

    try:
        from app.services.homepage_section_service import HomepageSectionService
        HomepageSectionService.ensure_table()
    except Exception as e:
        print(f"[Lifespan] HomepageSection init note: {e}")

    try:
        from app.services.store_operating_hours_service import StoreOperatingHoursService
        StoreOperatingHoursService.ensure_table()
    except Exception as e:
        print(f"[Lifespan] StoreOperatingHours init note: {e}")

    # Ensure database root superadmin and sales admin accounts on boot
    try:
        from app.services.admin_user_service import AdminUserService
        AdminUserService.ensure_root_admin()
    except Exception as e:
        print(f"[Lifespan] Admin init note: {e}")

    try:
        from app.services.partner_service import PartnerService
        PartnerService.sync_missing_sales_admins()
    except Exception as e:
        print(f"[Lifespan] Partner sales sync note: {e}")

    try:
        from app.services.catalog_service import CatalogService
        CatalogService.load_products()
    except Exception as e:
        print(f"[Lifespan] Catalog init note: {e}")

    try:
        from app.services.order_service import OrderService
        OrderService.load_orders()
    except Exception as e:
        print(f"[Lifespan] Orders init note: {e}")

    # Register running asyncio event loop for RealtimeBroadcaster
    try:
        import asyncio
        from app.services.realtime_broadcaster import RealtimeBroadcaster
        RealtimeBroadcaster.set_loop(asyncio.get_running_loop())
    except Exception as e:
        print(f"[Lifespan] RealtimeBroadcaster loop init note: {e}")

    # Launch autonomous background worker for periodic VIP stock & balance auto-sync
    async def periodic_vip_stock_sync_worker():
        """
        Background autonomous worker that periodically checks live VIP supplier stock and balance.
        Runs every 5 minutes (300 seconds) in background thread without blocking FastAPI request handling.
        Emits real-time SSE broadcasts to connected admin consoles upon completion.
        """
        import asyncio
        from datetime import datetime
        from app.services.vip_service import VipService
        from app.services.realtime_broadcaster import RealtimeBroadcaster
        from app.core.cache import cache

        # Initial delay on boot to allow server to settle
        await asyncio.sleep(25)

        while True:
            try:
                result = await asyncio.to_thread(VipService.check_stock)
                if result and result.get("success"):
                    cache.invalidate("catalog")
                    RealtimeBroadcaster.broadcast(
                        "catalog:updated",
                        {"timestamp": datetime.utcnow().isoformat(), "source": "periodic_background_sync"},
                        target_role="admin",
                    )
                    RealtimeBroadcaster.broadcast(
                        "vip:status_updated",
                        {"timestamp": datetime.utcnow().isoformat(), "checked": result.get("checked", 0)},
                        target_role="admin",
                    )
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[PeriodicVipWorker] Stock check note: {e}")

            try:
                await asyncio.sleep(300)  # Every 5 minutes
            except asyncio.CancelledError:
                break

    worker_task = asyncio.create_task(periodic_vip_stock_sync_worker())

    yield

    worker_task.cancel()
    try:
        await worker_task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Core Backend API for Asterra Store (Storefront, Sales Portal, Admin Console)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Setup for all frontend domains and localhost ports
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|([a-zA-Z0-9-]+\.)?asterrastore\.biz\.id|asterra[a-zA-Z0-9-]*\.vercel\.app)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------
# Root & Health Endpoints
# ------------------------------------------
@app.get("/", tags=["Health"])
def root_endpoint():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "api_v1_docs": "/api/v1/docs",
        "health": "/health",
    }

@app.get("/api/v1/docs", include_in_schema=False)
def api_v1_docs_redirect():
    return RedirectResponse(url="/docs")

@app.get("/api/v1/openapi.json", include_in_schema=False)
def api_v1_openapi_redirect():
    return RedirectResponse(url="/openapi.json")

@app.get("/api", include_in_schema=False)
@app.get("/api/index.py", include_in_schema=False)
def api_root_redirect():
    return root_endpoint()

@app.api_route("/health", methods=["GET", "POST", "HEAD"], tags=["Health"])
@app.api_route("/healthz", methods=["GET", "POST", "HEAD"], include_in_schema=False)
@app.api_route("/readyz", methods=["GET", "POST", "HEAD"], include_in_schema=False)
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "production" if settings.TRIPAY_IS_PRODUCTION else "development",
        "timestamp": datetime.utcnow().isoformat(),
    }

@app.post("/webhooks/vip-reseller", tags=["Webhooks"], include_in_schema=False)
async def root_vip_reseller_webhook(request: Request):
    from app.api.v1.checkout import vip_reseller_webhook
    return await vip_reseller_webhook(request)

@app.post("/webhooks/tripay", tags=["Webhooks"], include_in_schema=False)
async def root_tripay_webhook(request: Request):
    from app.api.v1.checkout import tripay_webhook
    return await tripay_webhook(request)

from app.core.security_middleware import security_and_rate_limit_middleware

# ------------------------------------------
# Global Security Headers & Rate Limiting Middleware
# ------------------------------------------
app.middleware("http")(security_and_rate_limit_middleware)

# ------------------------------------------
# Security Middleware: RBAC Isolation for Admin & Sales
# ------------------------------------------
@app.middleware("http")
async def admin_auth_middleware(request: Request, call_next):
    path = request.url.path
    is_admin_path = ("/admin/" in path or path.endswith("/admin")) and not ("/admin/auth" in path or "/admin/login" in path)
    is_sales_path = ("/sales/" in path or path.endswith("/sales")) and not ("/sales/login" in path or "/sales/auth" in path)

    if is_admin_path:
        token = request.cookies.get("asterra_admin_session")
        if not token:
            auth_hdr = request.headers.get("authorization", "")
            if auth_hdr.lower().startswith("bearer "):
                token = auth_hdr[7:].strip()

        if not token:
            return JSONResponse(
                status_code=401,
                content={"success": False, "error": "Unauthorized: Sesi administrator tidak ditemukan."},
            )

        payload = verify_admin_session_token(token)
        if not payload:
            return JSONResponse(
                status_code=401,
                content={"success": False, "error": "Unauthorized: Sesi administrator tidak valid atau telah berakhir."},
            )

        if payload.get("role") not in ["admin", "superadmin"]:
            return JSONResponse(
                status_code=403,
                content={"success": False, "error": "Forbidden: Operasi ini memerlukan hak akses administrator."},
            )
        request.state.admin_user = payload

    elif is_sales_path:
        token = request.cookies.get("asterra_admin_session")
        if not token:
            auth_hdr = request.headers.get("authorization", "")
            if auth_hdr.lower().startswith("bearer "):
                token = auth_hdr[7:].strip()

        if not token:
            return JSONResponse(
                status_code=401,
                content={"success": False, "error": "Unauthorized: Sesi otentikasi mitra sales tidak ditemukan."},
            )

        payload = verify_admin_session_token(token)
        if not payload:
            return JSONResponse(
                status_code=401,
                content={"success": False, "error": "Unauthorized: Sesi tidak valid atau telah berakhir."},
            )

        if payload.get("role") not in ["admin", "superadmin", "sales"]:
            return JSONResponse(
                status_code=403,
                content={"success": False, "error": "Forbidden: Memerlukan hak akses mitra sales atau administrator."},
            )
        request.state.sales_user = payload

    response = await call_next(request)
    return response

# ------------------------------------------
# Mount Unified API Router to /api/v1 and /v1
# ------------------------------------------
app.include_router(api_router, prefix="/api/v1")
app.include_router(api_router, prefix="/v1")
