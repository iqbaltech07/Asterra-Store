import os
import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request, Response, HTTPException, Query
from fastapi.responses import JSONResponse

from app.services.partner_service import PartnerService
from app.services.order_service import OrderService
from app.services.referral_service import ReferralService
from app.services.campaign_service import CampaignService
from app.services.realtime_broadcaster import RealtimeBroadcaster
from app.core.auth import verify_admin_session_token
from app.core.cache import cache
from datetime import datetime

router = APIRouter()

# ------------------------------------------
# 1. Admin Affiliates Management
# ------------------------------------------
@router.get("/admin/affiliates", tags=["Admin Affiliates"])
def get_admin_affiliates():
    partners = PartnerService.get_all_partners()
    return {
        "success": True,
        "data": partners,
        "total": len(partners),
    }

@router.post("/admin/affiliates", tags=["Admin Affiliates"])
async def create_admin_affiliate(request: Request):
    payload = await request.json()
    res = PartnerService.register_partner(payload)
    if not res.get("success"):
        return JSONResponse(status_code=400, content=res)
    RealtimeBroadcaster.broadcast(
        "affiliate:updated",
        {"action": "created", "timestamp": datetime.utcnow().isoformat()},
        target_role="admin",
    )
    return {
        "success": True,
        "message": "Mitra sales berhasil didaftarkan.",
        "data": res.get("partner"),
    }

@router.get("/admin/affiliates/payout-requests", tags=["Admin Affiliates"])
def get_admin_payout_requests(status: Optional[str] = Query(None)):
    payouts = PartnerService.get_all_payout_requests(status=status)
    return {
        "success": True,
        "data": payouts,
        "total": len(payouts),
    }

@router.post("/admin/affiliates/payout", tags=["Admin Affiliates"])
async def process_admin_affiliate_payout(request: Request):
    payload = await request.json()
    payout_request_id = payload.get("payoutRequestId") or payload.get("id")
    action = payload.get("action", "approve")
    notes = payload.get("notes")

    if payout_request_id:
        res = PartnerService.process_payout_action(
            payout_id=payout_request_id,
            action=action,
            admin_name="Admin Asterra",
            notes=notes,
        )
        if not res.get("success"):
            return JSONResponse(status_code=400, content=res)

        RealtimeBroadcaster.broadcast(
            "affiliate:updated",
            {
                "action": "payout_processed",
                "id": payout_request_id,
                "status": res.get("data", {}).get("status"),
                "timestamp": datetime.utcnow().isoformat(),
            },
            target_role="admin",
        )
        return res

    partner_id = payload.get("partnerId")
    if partner_id:
        res = PartnerService.settle_legacy_partner_payout(partner_id)
        if not res.get("success"):
            return JSONResponse(status_code=400, content=res)

        RealtimeBroadcaster.broadcast(
            "affiliate:updated",
            {"action": "payout", "partnerId": partner_id, "timestamp": datetime.utcnow().isoformat()},
            target_role="admin",
        )
        return res

    return JSONResponse(
        status_code=400,
        content={"success": False, "message": "ID pengajuan penarikan komisi tidak disertakan."},
    )

# ------------------------------------------
# 2. Sales Partner Portal
# ------------------------------------------
@router.get("/sales/me", tags=["Sales"])
def get_sales_me(request: Request):
    token = request.cookies.get("asterra_admin_session")
    if not token:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:].strip()

    email_or_code = None
    if token:
        payload = verify_admin_session_token(token)
        if payload:
            email_or_code = payload.get("email")

    profile = PartnerService.get_profile(email_or_code)
    return {
        "success": True,
        "data": profile,
    }

@router.get("/sales/orders", tags=["Sales"])
def get_sales_orders(request: Request):
    token = request.cookies.get("asterra_admin_session")
    if not token:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:].strip()

    email_or_code = None
    if token:
        payload = verify_admin_session_token(token)
        if payload:
            email_or_code = payload.get("email")

    orders = PartnerService.get_orders_for_partner(email_or_code)
    return {
        "success": True,
        "data": orders,
        "total": len(orders),
    }

@router.get("/sales/network", tags=["Sales"])
def get_sales_network(request: Request):
    token = request.cookies.get("asterra_admin_session")
    if not token:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:].strip()

    email_or_code = None
    if token:
        payload = verify_admin_session_token(token)
        if payload:
            email_or_code = payload.get("email")

    network = PartnerService.get_network_for_partner(email_or_code)
    return {
        "success": True,
        "data": network,
    }

@router.post("/sales/payout", tags=["Sales"])
@router.post("/partners/payout", tags=["Sales"])
async def request_sales_payout(request: Request):
    token = request.cookies.get("asterra_admin_session")
    if not token:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:].strip()

    authenticated_partner = None
    if token:
        token_payload = verify_admin_session_token(token)
        if token_payload:
            email_or_code = token_payload.get("email")
            role = token_payload.get("role", "sales")
            if role == "sales" or role == "partner":
                authenticated_partner = PartnerService.get_profile(email_or_code)
            elif role in ["admin", "superadmin", "owner", "finance"]:
                # Admin can submit payout for a partner if partnerId provided
                pass

    payload = await request.json()

    # If role is sales, ensure identity comes from verified session
    if not authenticated_partner and not token:
        # Check if running in development mode fallback
        dev_partner_id = payload.get("partnerId")
        if not dev_partner_id:
            return JSONResponse(
                status_code=401,
                content={"success": False, "message": "Autentikasi sales tidak valid. Silakan login kembali ke Portal Sales."},
            )

    res = PartnerService.submit_payout(payload, authenticated_partner=authenticated_partner)
    if not res.get("success"):
        return JSONResponse(status_code=400, content=res)

    try:
        req = res.get("request") or {}
        partner = res.get("partner") or {}
        partner_name = partner.get("name") or req.get("bankAccountName") or "Mitra Sales"
        amount = float(req.get("amount") or payload.get("amount") or 0)
        request_id = req.get("id") or f"payreq-{int(datetime.utcnow().timestamp())}"

        # 1. Real-time Toast & Sound SSE broadcast to Admin Console
        RealtimeBroadcaster.broadcast(
            event="payout:requested",
            data={
                "id": request_id,
                "request_id": request_id,
                "partner_id": partner.get("id") or payload.get("partnerId") or "",
                "partner_name": partner_name,
                "partner_code": partner.get("code") or "",
                "partner_email": partner.get("email") or "",
                "amount": amount,
                "bank_name": req.get("bankName") or partner.get("bankName") or "BCA",
                "bank_account": req.get("bankAccount") or partner.get("bankAccount") or "",
                "bank_account_name": req.get("bankAccountName") or partner_name,
                "status": "pending",
                "notes": req.get("notes") or "",
                "created_at": req.get("createdAt") or req.get("requestedAt") or (datetime.utcnow().isoformat() + "Z"),
            },
            target_role="admin",
        )

        # 2. Invalidate affiliate lists in admin
        RealtimeBroadcaster.broadcast(
            event="affiliate:updated",
            data={
                "action": "payout_requested",
                "id": request_id,
                "partnerId": partner.get("id"),
                "timestamp": datetime.utcnow().isoformat(),
            },
            target_role="admin",
        )
    except Exception as b_err:
        print(f"[SalesApi] Broadcast error on payout request: {b_err}")

    return res

# ------------------------------------------
# 3. Storefront Affiliate Referral Engine
# ------------------------------------------
@router.get("/affiliate/validate-referral", tags=["Affiliate"])
def validate_referral(
    code: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    phone: Optional[str] = Query(None),
):
    if not code or not code.strip():
        return {"success": False, "valid": False, "message": "Kode referral tidak disertakan."}

    partner = PartnerService.find_by_code(code.strip())
    if not partner:
        return {
            "success": True,
            "valid": False,
            "message": "Kode referral tidak ditemukan di sistem Asterra Store.",
        }

    discount_eligible = True
    discount_amount = 1000
    discount_reason = "Potongan referral resmi kemitraan sales"

    if email or phone:
        clean_email = (email or "").strip().lower()
        clean_phone = re.sub(r"\D", "", phone or "")
        has_claimed = False

        from app.core.database import SessionLocal
        from app.models.order import Order
        if SessionLocal is not None:
            try:
                db = SessionLocal()
                try:
                    from sqlalchemy import or_
                    clauses = []
                    if clean_email:
                        clauses.append(Order.customer_email.ilike(clean_email))
                    if clean_phone and len(clean_phone) >= 8:
                        clauses.append(Order.customer_whatsapp.like(f"%{clean_phone[-8:]}%"))
                    if clauses:
                        match_rec = (
                            db.query(Order.id)
                            .filter(
                                or_(*clauses),
                                Order.referral_discount > 0,
                                Order.status != "cancelled",
                            )
                            .first()
                        )
                        has_claimed = match_rec is not None
                finally:
                    db.close()
            except Exception as e:
                print(f"[SalesValidate] Direct DB verification error: {e}")
                orders = OrderService.load_orders()
                has_claimed = any(
                    (
                        (clean_email and str(o.get("customerEmail", "")).lower().strip() == clean_email)
                        or (clean_phone and re.sub(r"\D", "", str(o.get("customerWhatsapp", ""))) == clean_phone)
                    )
                    and float(o.get("referralDiscount") or o.get("referral_discount") or 0) > 0
                    and str(o.get("status", "")).lower() != "cancelled"
                    for o in orders
                )
        else:
            orders = OrderService.load_orders()
            has_claimed = any(
                (
                    (clean_email and str(o.get("customerEmail", "")).lower().strip() == clean_email)
                    or (clean_phone and re.sub(r"\D", "", str(o.get("customerWhatsapp", ""))) == clean_phone)
                )
                and float(o.get("referralDiscount") or o.get("referral_discount") or 0) > 0
                and str(o.get("status", "")).lower() != "cancelled"
                for o in orders
            )

        if has_claimed:
            discount_eligible = False
            discount_amount = 0
            discount_reason = "Diskon referral telah digunakan sebelumnya (hanya berlaku 1x seumur hidup)"

    return {
        "success": True,
        "valid": True,
        "data": {
            "code": partner["code"],
            "partnerName": partner["name"],
            "tier": partner.get("tier", "Standard (10%)"),
            "discountEligible": discount_eligible,
            "discountAmount": discount_amount,
            "discountReason": discount_reason,
        },
        "partner": {
            "code": partner["code"],
            "name": partner["name"],
            "rate": partner.get("rate", 10),
        },
        "message": (
            f"Kode referral valid! Diundang oleh mitra {partner['name']} ({partner['code']})"
            if discount_eligible
            else f"Kode referral valid dari mitra {partner['name']} ({partner['code']}). Diskon sudah pernah diklaim sebelumnya (1x seumur hidup), namun transaksi Anda tetap mendukung mitra."
        ),
    }

@router.post("/affiliate/register", tags=["Affiliate"])
async def register_sales_affiliate(request: Request):
    payload = await request.json()
    res = PartnerService.register_partner(payload, require_otp=True)
    if not res.get("success"):
        return JSONResponse(status_code=400, content=res)
    return {
        "success": True,
        "message": res.get("message"),
        "requireOtp": res.get("requireOtp", False),
        "email": res.get("email"),
        "data": res.get("partner"),
    }

@router.post("/affiliate/verify-otp", tags=["Affiliate"])
async def verify_sales_affiliate_otp(request: Request, response: Response):
    payload = await request.json()
    email = payload.get("email", "").strip()
    otp = payload.get("otp", "").strip()
    if not email or not otp:
        return JSONResponse(status_code=400, content={"success": False, "message": "Email dan kode OTP wajib diisi."})

    res = PartnerService.verify_partner_otp(email, otp)
    if not res.get("success"):
        return JSONResponse(status_code=400, content=res)

    token = res.get("token")
    if token:
        is_prod = os.getenv("NODE_ENV") == "production"
        response.set_cookie(
            key="asterra_admin_session",
            value=token,
            max_age=8 * 3600,
            httponly=True,
            samesite="lax",
            secure=is_prod,
            path="/"
        )
        response.set_cookie(
            key="better-auth.session_token",
            value=token,
            max_age=8 * 3600,
            httponly=True,
            samesite="lax",
            secure=is_prod,
            path="/"
        )

    return {
        "success": True,
        "message": res.get("message"),
        "data": res.get("partner"),
        "token": token,
    }

@router.post("/affiliate/resend-otp", tags=["Affiliate"])
async def resend_sales_affiliate_otp(request: Request):
    payload = await request.json()
    email = payload.get("email", "").strip()
    if not email:
        return JSONResponse(status_code=400, content={"success": False, "message": "Email wajib diisi."})

    res = PartnerService.resend_partner_otp(email)
    if not res.get("success"):
        return JSONResponse(status_code=400, content=res)
    return res

@router.post("/affiliate/track-click", tags=["Affiliate"])
async def track_affiliate_click(request: Request):
    try:
        payload = await request.json()
    except Exception:
        payload = {}

    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        client_ip = forwarded.split(",")[0].strip()
    else:
        client_ip = request.client.host if request.client else ""
    user_agent = request.headers.get("user-agent", "")

    result = ReferralService.track_click(payload, client_ip=client_ip, user_agent=user_agent)
    return result

@router.post("/affiliate/expire-sessions", tags=["Affiliate"])
def expire_affiliate_sessions():
    count = ReferralService.auto_expire_sessions()
    return {"success": True, "message": f"{count} sesi referral kedaluwarsa berhasil diperbarui", "expired_count": count}

from app.core.cache import cache

# ------------------------------------------
# 4. Campaigns Engine (Storefront, Sales, Admin)
# ------------------------------------------
@router.get("/campaigns/active", tags=["Campaigns"])
@router.get("/campaigns", tags=["Campaigns"])
def get_active_campaigns(request: Request, response: Response):
    campaigns = cache.get("campaigns", "active")
    if campaigns is None:
        campaigns = CampaignService.get_active_campaigns()
        cache.set("campaigns", "active", campaigns, ttl=60)

    etag = cache.generate_etag("campaigns", content=campaigns)
    if cache.is_not_modified(request, etag):
        return cache.not_modified_response(etag, max_age=0)

    cache.apply_headers(response, etag=etag, mode="revalidate")
    return {
        "success": True,
        "data": campaigns,
        "total": len(campaigns),
    }

@router.get("/campaigns/evaluate", tags=["Campaigns"])
def evaluate_product_campaign_price(
    product_id: str = Query(..., alias="productId"),
    category: Optional[str] = Query(None),
    price: float = Query(..., alias="price"),
    slug: Optional[str] = Query(None),
):
    evaluation = CampaignService.evaluate_product_campaign(
        product_id=product_id,
        category_name=category,
        original_price=price,
        product_slug=slug,
    )
    return {
        "success": True,
        "isCampaignActive": evaluation is not None,
        "data": evaluation,
    }

@router.get("/admin/campaigns", tags=["Admin Campaigns"])
def get_admin_campaigns(status: Optional[str] = Query(None), response: Optional[Response] = None):
    campaigns = CampaignService.get_all_campaigns(filter_status=status)
    if response:
        response.headers["Cache-Control"] = "no-cache, must-revalidate"
    return {
        "success": True,
        "data": campaigns,
        "total": len(campaigns),
    }

@router.post("/admin/campaigns", tags=["Admin Campaigns"])
async def create_admin_campaign(request: Request):
    payload = await request.json()
    try:
        created = CampaignService.create_campaign(payload)
        cache.invalidate("campaigns", "catalog", "homepage_sections")
        RealtimeBroadcaster.broadcast(
            "campaign:updated",
            {"action": "created", "id": created.get("id"), "timestamp": datetime.utcnow().isoformat()},
            target_role="all",
        )
        return {
            "success": True,
            "message": f"Campaign '{created.get('name')}' berhasil diluncurkan.",
            "data": created,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membuat campaign: {str(e)}")

@router.put("/admin/campaigns/{campaign_id}", tags=["Admin Campaigns"])
@router.patch("/admin/campaigns/{campaign_id}", tags=["Admin Campaigns"])
async def update_admin_campaign(campaign_id: str, request: Request):
    payload = await request.json()
    updated = CampaignService.update_campaign(campaign_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Campaign tidak ditemukan.")
    cache.invalidate("campaigns", "catalog", "homepage_sections")
    RealtimeBroadcaster.broadcast(
        "campaign:updated",
        {"action": "updated", "id": campaign_id, "timestamp": datetime.utcnow().isoformat()},
        target_role="all",
    )
    return {
        "success": True,
        "message": f"Campaign '{updated.get('name')}' berhasil diperbarui.",
        "data": updated,
    }

@router.patch("/admin/campaigns/{campaign_id}/toggle", tags=["Admin Campaigns"])
@router.post("/admin/campaigns/{campaign_id}/toggle", tags=["Admin Campaigns"])
def toggle_admin_campaign(campaign_id: str):
    updated = CampaignService.toggle_active(campaign_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Campaign tidak ditemukan.")
    label = "diaktifkan" if updated.get("isActive") else "dinonaktifkan"
    cache.invalidate("campaigns", "catalog", "homepage_sections")
    RealtimeBroadcaster.broadcast(
        "campaign:updated",
        {"action": "toggled", "id": campaign_id, "timestamp": datetime.utcnow().isoformat()},
        target_role="all",
    )
    return {
        "success": True,
        "message": f"Campaign '{updated.get('name')}' berhasil {label}.",
        "data": updated,
    }

@router.delete("/admin/campaigns/{campaign_id}", tags=["Admin Campaigns"])
def delete_admin_campaign(campaign_id: str):
    success = CampaignService.delete_campaign(campaign_id)
    if not success:
        raise HTTPException(status_code=404, detail="Campaign tidak ditemukan.")
    cache.invalidate("campaigns", "catalog", "homepage_sections")
    RealtimeBroadcaster.broadcast(
        "campaign:updated",
        {"action": "deleted", "id": campaign_id, "timestamp": datetime.utcnow().isoformat()},
        target_role="all",
    )
    return {
        "success": True,
        "message": "Campaign berhasil dihapus dari sistem.",
    }

@router.get("/sales/campaigns", tags=["Sales Campaigns"])
def get_sales_campaigns(request: Request):
    token = request.cookies.get("asterra_admin_session")
    if not token:
        auth_hdr = request.headers.get("authorization", "")
        if auth_hdr.lower().startswith("bearer "):
            token = auth_hdr[7:].strip()

    email_or_code = None
    if token:
        payload = verify_admin_session_token(token)
        if payload:
            email_or_code = payload.get("email")

    profile = PartnerService.get_profile(email_or_code)
    partner_code = profile.get("code") or "AST-FOUNDER"
    partner_rate = float(profile.get("rate") or 10.0)

    base_url = (os.getenv("STORE_URL") or os.getenv("FRONTEND_STORE_URL") or "https://asterrastore.biz.id").rstrip("/")
    active_camps = CampaignService.get_active_campaigns()

    enriched_campaigns = []
    for c in active_camps:
        slug = c.get("slug") or c.get("id")
        camp_name = c.get("name")
        discount_display = f"{c.get('discountValue')}%" if c.get("discountType") == "percentage" else f"Rp {int(c.get('discountValue', 0)):,}"
        booster_rate = float(c.get("affiliateBonusPercent") or c.get("affiliateCommissionOverride") or partner_rate)
        
        affiliate_link = f"{base_url}/?ref={partner_code}&campaign={slug}"
        
        wa_copy = (
            f"🔥 PROMO SPESIAL ASTERRA STORE: {camp_name}!\n\n"
            f"Dapatkan diskon instan {discount_display} untuk layanan langganan digital premium & AI Tools favorit kamu.\n\n"
            f"⚡ Langsung klaim promonya sebelum periode berakhir di:\n"
            f"{affiliate_link}\n\n"
            f"Garansi 100% resmi & aktif instan!"
        )

        c_copy = dict(c)
        c_copy["affiliateLink"] = affiliate_link
        c_copy["partnerCode"] = partner_code
        c_copy["partnerCommissionRate"] = partner_rate
        c_copy["boosterCommissionRate"] = booster_rate
        c_copy["isBoosterActive"] = booster_rate > partner_rate
        c_copy["whatsappShareText"] = wa_copy
        enriched_campaigns.append(c_copy)

    return {
        "success": True,
        "data": enriched_campaigns,
        "partnerCode": partner_code,
        "total": len(enriched_campaigns),
    }
