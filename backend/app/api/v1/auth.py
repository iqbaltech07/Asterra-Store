import secrets
from datetime import datetime
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse

from app.config import settings
from app.core.security import verify_password
from app.core.auth import create_admin_session_token, verify_admin_session_token
from app.services.admin_user_service import AdminUserService
from app.services.partner_service import PartnerService
from app.services.order_service import OrderService

router = APIRouter()

# ------------------------------------------
# 1. Admin & Sales Portal Authentication
# ------------------------------------------
@router.post("/admin/auth/login", tags=["Admin Auth"])
async def admin_auth_login(request: Request):
    body = await request.json()
    email_or_user = (body.get("email") or body.get("username") or "").strip().lower()
    password = (body.get("password") or "").strip()

    if not email_or_user or not password:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Email/username dan kata sandi otorisasi wajib diisi.",
                },
            },
        )

    clean = email_or_user.lower()
    clean_stripped = clean.replace("-", "")

    # 1. Look up in AdminUserService by email or username
    admin_match = AdminUserService.find_by_email(clean)
    if not admin_match:
        admins = AdminUserService.load_admins()
        admin_match = next(
            (
                a for a in admins
                if str(a.get("username", "")).lower() == clean
                or str(a.get("username", "")).lower().replace("-", "") == clean_stripped
                or str(a.get("username", "")).lower() == f"sales-{clean_stripped}"
            ),
            None,
        )

    # 2. Check partner service if not directly found in admin
    partner_match = PartnerService.find_by_email(clean) or PartnerService.find_by_code(clean)
    if partner_match and not admin_match:
        p_email = str(partner_match.get("email", "")).lower()
        p_code = str(partner_match.get("code", "")).lower().replace("-", "")
        admins = AdminUserService.load_admins()
        admin_match = next(
            (
                a for a in admins
                if str(a.get("email", "")).lower() == p_email
                or str(a.get("username", "")).lower().replace("-", "") in [f"sales{p_code}", p_code]
            ),
            None,
        )
        if not admin_match:
            # Sync to AdminUser table on-the-fly
            PartnerService.sync_missing_sales_admins()
            admins = AdminUserService.load_admins(force_reload=True)
            admin_match = next(
                (
                    a for a in admins
                    if str(a.get("email", "")).lower() == p_email
                    or str(a.get("username", "")).lower().replace("-", "") in [f"sales{p_code}", p_code]
                ),
                None,
            )

    if not admin_match and not partner_match:
        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Email/username atau kata sandi tidak valid.",
                },
            },
        )

    # 3. Check account active status
    if admin_match and not admin_match.get("isActive", True):
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "error": {
                    "code": "ACCOUNT_DISABLED",
                    "message": "Akun ini telah dinonaktifkan oleh Administrator.",
                },
            },
        )

    if partner_match and partner_match.get("status") == "inactive":
        return JSONResponse(
            status_code=403,
            content={
                "success": False,
                "error": {
                    "code": "ACCOUNT_DISABLED",
                    "message": "Akun kemitraan sales ini sedang non-aktif.",
                },
            },
        )

    # 4. Password verification
    stored_hash = ""
    if admin_match:
        stored_hash = admin_match.get("passwordHash") or admin_match.get("password_hash") or ""
    elif partner_match:
        stored_hash = partner_match.get("passwordHash") or partner_match.get("password_hash") or ""

    is_valid = False
    if stored_hash:
        is_valid = verify_password(password, stored_hash)

    # Fallback to defaults only if hash not yet saved or matching root config
    if not is_valid:
        if admin_match and clean in ["admin", settings.ADMIN_EMAIL.lower()] and settings.ADMIN_PASSWORD:
            if password == settings.ADMIN_PASSWORD:
                is_valid = True
        elif not stored_hash and partner_match:
            partner_code = str(partner_match.get("code", "")).strip().upper()
            partner_wa = str(partner_match.get("whatsapp", "")).strip()
            if password in [partner_code, partner_wa, "AsterraSales#2026", settings.ADMIN_PASSWORD]:
                is_valid = True

    if not is_valid:
        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Email/username atau kata sandi tidak valid.",
                },
            },
        )

    # Determine role and identity
    role = "admin"
    if admin_match and admin_match.get("role"):
        role = admin_match.get("role", "admin")
    elif partner_match:
        role = "sales"

    user_id = (admin_match.get("id") if admin_match else None) or (partner_match.get("id") if partner_match else "adm-root")
    canonical_email = (admin_match.get("email") if admin_match else None) or (partner_match.get("email") if partner_match else clean)
    display_name = (admin_match.get("name") if admin_match else None) or (partner_match.get("name") if partner_match else "Pengguna")

    token = create_admin_session_token(
        id_val=user_id,
        email=canonical_email,
        role=role,
        name=display_name,
    )

    admin_profile = {
        "id": user_id,
        "username": canonical_email.split("@")[0],
        "email": canonical_email,
        "name": display_name,
        "role": role,
    }

    response = JSONResponse(content={
        "success": True,
        "message": f"Autentikasi {'Mitra Sales' if role == 'sales' else 'Administrator'} berhasil.",
        "token": token,
        "admin": admin_profile,
    })

    response.set_cookie(
        key="asterra_admin_session",
        value=token,
        max_age=8 * 3600,
        path="/",
        httponly=True,
        samesite="lax",
        secure=settings.ENVIRONMENT.lower() in ["production", "prod"],
    )
    return response

@router.get("/admin/auth/me", tags=["Admin Auth"])
async def admin_auth_me(request: Request):
    token = request.cookies.get("asterra_admin_session")
    if not token:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:].strip()

    payload = verify_admin_session_token(token) if token else None
    if not payload:
        return {
            "success": False,
            "authenticated": False,
            "admin": None,
        }

    return {
        "success": True,
        "authenticated": True,
        "admin": {
            "id": payload.get("id", "adm-1"),
            "email": payload.get("email"),
            "name": payload.get("name", "Admin"),
            "role": payload.get("role", "admin"),
        },
    }

@router.post("/admin/auth/logout", tags=["Admin Auth"])
async def admin_auth_logout():
    response = JSONResponse(content={"success": True, "message": "Logout berhasil."})
    for cookie_name in [
        "asterra_admin_session",
        "better-auth.session_token",
        "__Secure-better-auth.session_token",
        "asterra_session",
    ]:
        response.delete_cookie(key=cookie_name, path="/")
    return response

# ------------------------------------------
# 2. Customer Authentication (Storefront)
# ------------------------------------------
@router.post("/auth/login", tags=["Auth"])
async def auth_login(request: Request):
    body = await request.json()
    email = body.get("email", "user@asterra.store")
    user_id = f"usr-{secrets.token_hex(4)}"
    user_name = email.split("@")[0].capitalize()

    token = f"ast_jwt_{secrets.token_urlsafe(32)}"
    user_profile = {
        "id": user_id,
        "name": user_name,
        "email": email,
        "role": "customer",
    }

    response = JSONResponse(content={
        "success": True,
        "message": "Login berhasil.",
        "token": token,
        "user": user_profile,
    })
    response.set_cookie(
        key="asterra_token",
        value=token,
        max_age=30 * 86400,
        path="/",
        httponly=False,
        samesite="lax",
        secure=False,
    )
    return response

@router.post("/auth/register", tags=["Auth"])
async def auth_register(request: Request):
    body = await request.json()
    email = body.get("email", "user@asterra.store")
    name = body.get("name", "Pelanggan Baru")
    user_id = f"usr-{secrets.token_hex(4)}"
    token = f"ast_jwt_{secrets.token_urlsafe(32)}"

    user_profile = {
        "id": user_id,
        "name": name,
        "email": email,
        "role": "customer",
    }

    response = JSONResponse(content={
        "success": True,
        "message": "Registrasi berhasil.",
        "token": token,
        "user": user_profile,
    })
    response.set_cookie(
        key="asterra_token",
        value=token,
        max_age=30 * 86400,
        path="/",
        httponly=False,
        samesite="lax",
        secure=False,
    )
    return response

# ------------------------------------------
# 3. Customer Profile & Security Masking
# ------------------------------------------
@router.get("/users/profile", tags=["Users"])
def get_user_profile(email: Optional[str] = None, request: Request = None):
    user_email = email
    if not user_email and request:
        user_email = request.query_params.get("email") or request.headers.get("x-user-email")

    clean_email = user_email.lower().strip() if user_email else ""
    orders = OrderService.load_orders()
    raw_user_orders = []
    if clean_email:
        raw_user_orders = [
            o for o in orders
            if clean_email in str(o.get("customerEmail") or o.get("customer_email") or "").lower()
            or any(clean_email in str(it.get("targetEmail") or it.get("target_email") or "").lower() for it in o.get("items", []))
        ]

    # Normalize orders for frontend compatibility
    user_orders = []
    for o in raw_user_orders:
        ord_copy = dict(o)
        raw_st = str(ord_copy.get("status") or ord_copy.get("order_status") or "pending").lower()
        if raw_st in ["completed", "done", "selesai"]:
            st = "completed"
        elif raw_st in ["processing", "process", "paid", "settlement", "diproses"]:
            st = "processing"
        elif raw_st in ["cancelled", "expired", "failed", "batal"]:
            st = "cancelled"
        else:
            st = "pending"

        ord_copy["status"] = st
        ord_copy["order_status"] = st

        tot = ord_copy.get("totalAmount") if ord_copy.get("totalAmount") is not None else ord_copy.get("total_amount", 0)
        ord_copy["totalAmount"] = tot
        ord_copy["total_amount"] = tot

        dt = ord_copy.get("createdAt") or ord_copy.get("created_at") or ord_copy.get("order_date") or ""
        ord_copy["createdAt"] = dt
        ord_copy["created_at"] = dt

        # Normalize items structure
        norm_items = []
        for it in ord_copy.get("items", []):
            it_dict = dict(it)
            p_name = it_dict.get("productName") or it_dict.get("product_name") or "Layanan Digital"
            it_dict["productName"] = p_name
            it_dict["product_name"] = p_name
            p_price = it_dict.get("price") if it_dict.get("price") is not None else it_dict.get("unit_price", 0)
            it_dict["price"] = p_price
            it_dict["unit_price"] = p_price
            norm_items.append(it_dict)
        ord_copy["items"] = norm_items

        user_orders.append(ord_copy)

    total_orders = len(user_orders)
    completed_orders = sum(
        1 for o in user_orders
        if o.get("status") == "completed"
    )
    pending_orders = sum(
        1 for o in user_orders
        if o.get("status") in ["pending", "processing"]
    )

    db_name = None
    db_phone = None
    if clean_email:
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            db = SessionLocal()
            try:
                row = db.execute(
                    text('SELECT name, email, phone FROM "user" WHERE LOWER(email) = LOWER(:email)'),
                    {"email": clean_email}
                ).mappings().first()
                if row:
                    db_name = row.get("name")
                    db_phone = row.get("phone")
            finally:
                db.close()
        except Exception as e:
            print(f"[get_user_profile] DB user lookup note: {e}")

    first_order = user_orders[0] if user_orders else {}
    name = db_name or first_order.get("customerName") or first_order.get("customer_name") or "Pelanggan Asterra"
    phone = db_phone or first_order.get("customerWhatsapp") or first_order.get("customer_whatsapp") or ""

    admin_token = request.cookies.get("asterra_admin_session") if request else None
    is_admin = False
    if admin_token:
        p = verify_admin_session_token(admin_token)
        is_admin = p and p.get("role") in ["admin", "superadmin"]

    has_customer_session = False
    if request:
        has_customer_session = any(
            bool(request.cookies.get(c))
            for c in [
                "better-auth.session_token",
                "__Secure-better-auth.session_token",
                "asterra_token",
                "asterra_session",
            ]
        ) or bool(request.headers.get("authorization"))

    is_owner = is_admin or has_customer_session or bool(clean_email)

    masked_phone = phone
    if phone and len(phone) > 6 and not is_owner:
        masked_phone = f"{phone[:3]}****{phone[-4:]}"

    masked_name = name
    if name and len(name) > 2 and not is_owner:
        masked_name = f"{name[0]}***{name[-1]}"

    return {
        "success": True,
        "data": {
            "id": f"usr-{clean_email or '1'}",
            "name": name if is_owner else masked_name,
            "email": clean_email or "customer@asterra.store",
            "phone": phone if is_owner else masked_phone,
            "role": "customer",
            "orders": user_orders if is_owner else [],
            "stats": {
                "totalOrders": total_orders,
                "completedOrders": completed_orders,
                "pendingOrders": pending_orders,
            },
        },
    }

@router.patch("/users/profile", tags=["Users"])
async def update_user_profile(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}

    clean_email = str(
        body.get("email")
        or request.headers.get("x-user-email")
        or request.query_params.get("email")
        or ""
    ).strip()
    name = str(body.get("name") or "").strip()
    phone = str(body.get("phone") or "").strip()

    if not name:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": {"message": "Nama lengkap tidak boleh kosong."}}
        )

    if clean_email:
        try:
            from app.core.database import SessionLocal
            from sqlalchemy import text
            db = SessionLocal()
            try:
                # 1. Update or insert in "user" table
                existing_user = db.execute(
                    text('SELECT id FROM "user" WHERE LOWER(email) = LOWER(:email)'),
                    {"email": clean_email}
                ).mappings().first()

                if existing_user:
                    db.execute(
                        text('UPDATE "user" SET name = :name, phone = :phone, updated_at = :now WHERE LOWER(email) = LOWER(:email)'),
                        {"name": name, "phone": phone, "now": datetime.utcnow(), "email": clean_email}
                    )
                else:
                    import uuid
                    user_id = f"usr_{uuid.uuid4().hex[:16]}"
                    db.execute(
                        text("INSERT INTO \"user\" (id, name, email, email_verified, role, phone, created_at, updated_at) VALUES (:id, :name, :email, false, 'customer', :phone, :now, :now)"),
                        {"id": user_id, "name": name, "email": clean_email, "phone": phone, "now": datetime.utcnow()}
                    )

                # 2. Update customer_name & customer_whatsapp across orders
                db.execute(
                    text("UPDATE orders SET customer_name = :name, customer_whatsapp = :phone WHERE LOWER(customer_email) = LOWER(:email)"),
                    {"name": name, "phone": phone, "email": clean_email}
                )
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[update_user_profile] DB update error: {e}")

    # 3. Synchronize in-memory cached orders
    try:
        orders = OrderService.load_orders()
        for o in orders:
            if clean_email and str(o.get("customerEmail") or o.get("customer_email") or "").lower().strip() == clean_email.lower():
                o["customerName"] = name
                o["customer_name"] = name
                o["customerWhatsapp"] = phone
                o["customer_whatsapp"] = phone
    except Exception as e:
        print(f"[update_user_profile] Memory orders update note: {e}")

    return {
        "success": True,
        "message": "Profil berhasil diperbarui.",
        "data": {
            "name": name,
            "email": clean_email,
            "phone": phone,
        },
    }


# ------------------------------------------
# 6. Customer Member Welcome Email Notification
# ------------------------------------------
@router.post("/customer/welcome-notification", tags=["Customer Auth"])
async def send_customer_welcome_notification(request: Request):
    """
    Triggers the welcome email notification for a newly registered customer (e.g. via Google OAuth).
    """
    try:
        body = await request.json()
    except Exception:
        body = {}

    email = str(body.get("email") or "").strip().lower()
    name = str(body.get("name") or "").strip()

    if not email or "@" not in email:
        return JSONResponse(
            status_code=400,
            content={"success": False, "error": {"message": "Email customer valid wajib disertakan."}}
        )

    from app.services.email_service import EmailService
    delivered = EmailService.send_welcome_member_email(to_email=email, recipient_name=name)

    return {
        "success": True,
        "message": "Email sambutan member Asterra Store berhasil diproses.",
        "delivered": delivered,
    }

