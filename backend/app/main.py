from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
from app.config import settings
from app.services.referral_profit_service import ReferralProfitService

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Core Backend API for Asterra Store (Storefront, Sales Portal, Admin Console)",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "ok",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "production" if settings.TRIPAY_IS_PRODUCTION else "development",
    }

# 1. Product Catalog Endpoints
@app.get("/v1/products", tags=["Catalog"])
def get_products(category: Optional[str] = None, search: Optional[str] = None):
    return {
        "success": True,
        "message": "Products retrieved successfully",
        "data": [],
        "total": 0,
    }

# 2. Orders Endpoints
@app.post("/v1/orders", tags=["Orders"])
def create_order(payload: Dict[str, Any]):
    return {
        "success": True,
        "message": "Order created successfully",
        "data": {"order_id": "AST-ORDER-SAMPLE"},
    }

# 3. Sales Partner Endpoints
@app.get("/v1/sales/me", tags=["Sales"])
def get_sales_profile(partner_code: Optional[str] = "AST-SALES"):
    return {
        "success": True,
        "data": {
            "code": partner_code,
            "rate": 10,
            "totalClicks": 0,
            "totalOrders": 0,
            "totalRevenue": 0,
            "unpaidCommission": 0,
            "pendingCommission": 0,
            "paidCommission": 0,
        }
    }

@app.post("/v1/sales/waterfall/calculate", tags=["Sales"])
def calculate_waterfall(
    order_id: str,
    total_amount: float,
    cost_of_goods: float,
    discount: float = 0.0,
    partner_code: Optional[str] = None,
    sponsor_code: Optional[str] = None,
):
    profit = ReferralProfitService.calculate_transaction_profit(total_amount, cost_of_goods, discount)
    allocation = ReferralProfitService.allocate_waterfall(
        order_id=order_id,
        transaction_profit=profit,
        direct_partner_code=partner_code,
        sponsor_partner_code=sponsor_code,
    )
    return {"success": True, "data": allocation}

# 4. Admin Ops Endpoints
@app.get("/v1/admin/orders", tags=["Admin"])
def get_admin_orders():
    return {
        "success": True,
        "data": [],
        "total": 0,
    }
