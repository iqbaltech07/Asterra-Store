import json
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request, Response, HTTPException, Query, BackgroundTasks

from app.config import settings
from app.services.order_service import OrderService
from app.services.payment_config_service import PaymentConfigService
from app.services.promo_service import PromoService
from app.services.tripay_service import TripayService

router = APIRouter()

from app.core.cache import cache

def mask_order_for_public(order: dict, is_owner_or_admin: bool) -> dict:
    o = dict(order)
    phone = str(o.get("customerWhatsapp") or o.get("customer_whatsapp") or "")
    name = str(o.get("customerName") or o.get("customer_name") or "")
    email = str(o.get("customerEmail") or o.get("customer_email") or "")

    masked_phone = f"{phone[:3]}****{phone[-4:]}" if len(phone) > 6 else phone
    masked_name = f"{name[0]}***{name[-1]}" if len(name) > 2 else (name or "Pelanggan Asterra")
    masked_email = f"{email.split('@')[0][:2]}***@{email.split('@')[1]}" if ("@" in email and len(email.split('@')[0]) > 2) else email

    # Build customer_display
    # In public view, NEVER show full phone or full email; show clean masked name
    if masked_name and masked_name != "Pelanggan Asterra":
        customer_display = masked_name
    elif masked_email and "@" in masked_email:
        customer_display = masked_email
    else:
        customer_display = "Pelanggan Terverifikasi"

    # Status normalization
    st = str(o.get("order_status") or o.get("status") or "pending").lower()
    if st in ["completed", "done", "selesai"]:
        st = "completed"
    elif st in ["processing", "process", "paid", "settlement", "diproses"]:
        st = "processing"
    elif st in ["cancelled", "expired", "failed", "batal"]:
        st = "cancelled"
    else:
        st = "pending"

    raw_id = str(o.get("raw_id") or o.get("id") or o.get("orderId") or "")
    order_date = str(o.get("order_date") or o.get("createdAt") or o.get("created_at") or "")

    items = o.get("items") or []
    items_count = int(o.get("items_count") or (sum(int(item.get("quantity", 1)) for item in items) if items else 1))

    product_name = o.get("product_name") or o.get("productName")
    if not product_name:
        if items:
            first_name = items[0].get("productName") or items[0].get("product_name") or "Lisensi Digital"
            if len(items) > 1:
                product_name = f"{first_name} (+{len(items)-1} produk lain)"
            else:
                product_name = first_name
        else:
            product_name = "Lisensi Digital"

    items_summary = str(o.get("items_summary") or product_name or "")

    # STRICT PUBLIC PROJECTION: Prevent leakage of customer email, phone, notes, payment info, prices, tokens, or credentials
    if not is_owner_or_admin:
        return {
            "id": raw_id,
            "raw_id": raw_id,
            "product_name": product_name,
            "items_summary": items_summary,
            "items_count": items_count,
            "order_status": st,
            "status": st,
            "order_date": order_date,
            "created_at": order_date,
            "createdAt": order_date,
            "customer_display": customer_display,
            "process_estimate": "Estimasi 10-30 Menit" if st == "processing" else "Garansi Resmi",
            "warranty_info": "Garansi Resmi" if st == "completed" else None,
        }

    # For owner or admin, retain authorized operational fields
    o["raw_id"] = raw_id
    o["id"] = raw_id
    o["customer_display"] = customer_display
    o["customerWhatsapp"] = masked_phone
    o["customer_whatsapp"] = masked_phone
    o["customerName"] = masked_name
    o["customer_name"] = masked_name
    o["customerEmail"] = masked_email
    o["customer_email"] = masked_email
    o["order_status"] = st
    o["status"] = st
    o["order_date"] = order_date
    o["items_count"] = items_count
    o["product_name"] = product_name
    o["items_summary"] = items_summary
    return o

# ------------------------------------------
# 1. Payment Configuration Endpoints
# ------------------------------------------
@router.get("/payment-config", tags=["Payment"])
def get_payment_config(request: Request, response: Response):
    etag = cache.generate_etag("payment_config")
    if cache.is_not_modified(request, etag):
        return cache.not_modified_response(etag, max_age=120)

    config = cache.get("payment_config", "global")
    if not config:
        config = PaymentConfigService.get_config()
        cache.set("payment_config", "global", config, ttl=120)

    cache.apply_headers(response, etag=etag, max_age=120)
    return {
        "success": True,
        "data": config,
    }

@router.get("/admin/payment-config", tags=["Admin Payment"])
def get_admin_payment_config():
    config = PaymentConfigService.get_config()
    return {
        "success": True,
        "data": config,
    }

@router.post("/admin/payment-config", tags=["Admin Payment"])
@router.put("/admin/payment-config", tags=["Admin Payment"])
async def update_admin_payment_config(request: Request):
    payload = await request.json()
    updated = PaymentConfigService.update_config(payload)
    cache.invalidate("payment_config")
    return {
        "success": True,
        "message": "Konfigurasi pembayaran berhasil diperbarui.",
        "data": updated,
    }

# ------------------------------------------
# 2. Promo Codes Endpoints
# ------------------------------------------
@router.post("/promos/validate", tags=["Promos"])
async def validate_promo(request: Request):
    payload = await request.json()
    code = payload.get("code", "")
    subtotal = float(payload.get("subtotal", 0))
    result = PromoService.validate_promo(code, subtotal)
    return {
        "success": result.get("valid", False),
        "data": result,
    }

@router.get("/admin/promos", tags=["Admin Promos"])
def get_admin_promos():
    res = PromoService.get_all_promos()
    return {
        "success": True,
        "data": res["promos"],
        "metrics": res["metrics"],
    }

@router.post("/admin/promos", tags=["Admin Promos"])
async def create_admin_promo(request: Request):
    payload = await request.json()
    new_promo = PromoService.create_promo(payload)
    cache.invalidate("promos")
    return {
        "success": True,
        "message": f"Kode promo '{new_promo.get('code')}' berhasil dibuat.",
        "data": new_promo,
    }

@router.patch("/admin/promos/{promo_id}", tags=["Admin Promos"])
@router.put("/admin/promos/{promo_id}", tags=["Admin Promos"])
async def update_admin_promo(promo_id: str, request: Request):
    payload = await request.json()
    updated = PromoService.update_promo(promo_id, payload)
    if not updated:
        # Check toggle if payload empty
        updated = PromoService.toggle_promo(promo_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Kode promo tidak ditemukan.")
    cache.invalidate("promos")
    return {
        "success": True,
        "message": "Kode promo berhasil diperbarui.",
        "data": updated,
    }

@router.delete("/admin/promos/{promo_id}", tags=["Admin Promos"])
def delete_admin_promo(promo_id: str):
    deleted = PromoService.delete_promo(promo_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Kode promo tidak ditemukan.")
    cache.invalidate("promos")
    return {
        "success": True,
        "message": "Kode promo berhasil dihapus.",
    }

# ------------------------------------------
# 3. Orders Endpoints (Storefront & Admin)
# ------------------------------------------
@router.post("/orders", tags=["Orders"])
async def create_order(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    order = OrderService.create_order(payload, background_tasks=background_tasks)
    cache.invalidate("orders")
    return {
        "success": True,
        "message": "Pesanan berhasil dibuat.",
        "order": order,
        "data": order,
    }

@router.get("/orders", tags=["Orders"])
def get_orders(
    request: Request,
    email: Optional[str] = None,
    phone: Optional[str] = None,
    search: Optional[str] = None,
    status: Optional[str] = None,
    period: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    public: Optional[bool] = False,
    page: int = 1,
    limit: int = 20,
):
    admin_token = request.cookies.get("asterra_admin_session")
    is_admin = False
    if admin_token:
        from app.core.auth import verify_admin_session_token
        p = verify_admin_session_token(admin_token)
        is_admin = p and p.get("role") in ["admin", "superadmin"]

    is_public = bool(public) or request.query_params.get("public") == "true"

    # Security Guard: Anonymous callers without email/phone cannot scrape all database orders unless public list is requested
    if not is_admin and not is_public and not email and not phone and not search:
        return {
            "success": True,
            "data": [],
            "total": 0,
            "pagination": {
                "total_items": 0,
                "current_page": 1,
                "total_pages": 1,
                "items_per_page": limit,
            },
            "message": "Silakan cantumkan email atau nomor WhatsApp untuk melacak pesanan Anda.",
        }

    result = OrderService.get_orders(
        status=status,
        search=search or phone,
        email=email,
        period=period,
        start_date=start_date,
        end_date=end_date,
        page=page,
        limit=limit,
    )
    is_owner_or_admin = is_admin or (not is_public and bool(email or search or phone))
    orders = [mask_order_for_public(o, is_owner_or_admin) for o in result["orders"]]
    return {
        "success": True,
        "data": orders,
        "total": result["total"],
        "pagination": {
            "total_items": result["total"],
            "current_page": result["page"],
            "total_pages": result["totalPages"],
            "items_per_page": result["limit"],
        },
        "period": period or "all",
    }

@router.get("/orders/{order_id}", tags=["Orders"])
def get_order_by_id(order_id: str, request: Request):
    order = OrderService.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")

    admin_token = request.cookies.get("asterra_admin_session")
    is_admin = False
    if admin_token:
        from app.core.auth import verify_admin_session_token
        p = verify_admin_session_token(admin_token)
        is_admin = p and p.get("role") in ["admin", "superadmin"]

    return {
        "success": True,
        "data": mask_order_for_public(order, is_admin),
    }

@router.post("/orders/{order_id}/pay", tags=["Orders"])
async def pay_order(order_id: str, request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}

    order = OrderService.get_order_by_id(order_id)
    amount = order.get("totalAmount", 50000) if order else 50000
    method = body.get("payment_method", "manual_bca")

    payment_info = {
        "id": f"PAY-{order_id}",
        "order_id": order_id,
        "amount": amount,
        "payment_method": method,
        "transaction_id": f"TRX-{order_id}",
        "payment_status": "pending",
        "qr_url": "https://panduan.bersama.co.id/QRIS/images/Qris.png",
        "instructions": [
            {
                "title": "Instruksi Transfer Bank BCA",
                "steps": [
                    "Buka BCA Mobile, KlikBCA, atau ATM BCA",
                    "Pilih Transfer Antar Rekening BCA",
                    "Nomor Rekening: 8965123456 (a/n Asterra Store Official)",
                    f"Pastikan transfer dengan nominal tepat Rp {amount:,.0f}".replace(",", "."),
                    "Pembayaran akan diverifikasi secara otomatis dalam 1 - 5 menit.",
                ],
            }
        ],
    }

    return {
        "success": True,
        "message": "Instruksi pembayaran berhasil dibuat",
        "payment": payment_info,
    }

@router.post("/orders/{order_id}/cancel", tags=["Orders"])
def cancel_order(order_id: str):
    updated = OrderService.update_status(order_id, "cancelled", notes="Dibatalkan oleh pembeli")
    if not updated:
        return {"success": True, "message": "Pesanan tidak ditemukan atau telah dibatalkan"}
    return {
        "success": True,
        "message": "Pesanan berhasil dibatalkan",
        "data": updated,
    }

# ------------------------------------------
# 4. Payment Gateway Webhook (Tripay)
# ------------------------------------------
@router.post("/webhooks/tripay", tags=["Webhooks"])
async def tripay_webhook(request: Request):
    raw_body = await request.body()
    signature = request.headers.get("x-callback-signature", "")
    try:
        payload = json.loads(raw_body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    merchant_ref = payload.get("merchant_ref")
    if not merchant_ref:
        raise HTTPException(status_code=400, detail="merchant_ref is required")

    # Signature verification
    is_valid = TripayService.verify_callback_signature(raw_body, signature)
    if not is_valid and (settings.TRIPAY_IS_PRODUCTION or settings.TRIPAY_PRIVATE_KEY):
        raise HTTPException(status_code=401, detail="Invalid callback signature")

    status = payload.get("status", "")
    if status == "PAID":
        updated = OrderService.update_status(
            merchant_ref,
            "processing",
            notes=f"Pembayaran otomatis terverifikasi Tripay ({payload.get('payment_method')}) Ref: {payload.get('reference')}",
        )
        return {"success": True, "message": "Pembayaran berhasil diverifikasi", "order": updated}
    elif status in ["EXPIRED", "FAILED"]:
        updated = OrderService.update_status(
            merchant_ref,
            "cancelled",
            notes=f"Pembayaran Tripay {status.lower()}",
        )
        return {"success": True, "message": f"Pesanan {status.lower()}", "order": updated}

    return {"success": True, "message": f"Status webhook diterima: {status}"}

# ------------------------------------------
# 5. Admin Orders Management
# ------------------------------------------
@router.get("/admin/orders", tags=["Admin Orders"])
def get_admin_orders(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 20,
):
    result = OrderService.get_orders(status=status, search=search, page=page, limit=limit)
    return {
        "success": True,
        "data": result["orders"],
        "pagination": {
            "total_items": result["total"],
            "current_page": result["page"],
            "total_pages": result["totalPages"],
            "items_per_page": result["limit"],
        },
        "metrics": result["metrics"],
    }

@router.get("/admin/orders/{order_id}", tags=["Admin Orders"])
def get_admin_order_by_id(order_id: str):
    order = OrderService.get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    return {
        "success": True,
        "data": order,
    }

@router.patch("/admin/orders/{order_id}/status", tags=["Admin Orders"])
async def update_admin_order_status(order_id: str, request: Request):
    payload = await request.json()
    new_status = payload.get("status", "completed")
    notes = payload.get("notes")
    updated = OrderService.update_status(order_id, new_status, notes=notes)
    if not updated:
        raise HTTPException(status_code=404, detail="Pesanan tidak ditemukan")
    return {
        "success": True,
        "data": updated,
        "message": f"Status pesanan {order_id} berhasil diubah menjadi {new_status}.",
    }
