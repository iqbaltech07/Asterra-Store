import os
import re
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Request, Response, HTTPException, Query
from fastapi.responses import JSONResponse

from app.services.partner_service import PartnerService
from app.services.order_service import OrderService
from app.services.referral_service import ReferralService
from app.services.campaign_service import CampaignService
from app.core.auth import verify_admin_session_token

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
    return {
        "success": True,
        "message": "Mitra sales berhasil didaftarkan.",
        "data": res.get("partner"),
    }

@router.post("/admin/affiliates/payout", tags=["Admin Affiliates"])
async def process_admin_affiliate_payout(request: Request):
    payload = await request.json()
    partner_id = payload.get("partnerId") or payload.get("partner_id")
    if not partner_id:
        raise HTTPException(status_code=400, detail="partnerId wajib disertakan")
    amount = payload.get("amount")
    notes = payload.get("notes")
    res = PartnerService.process_payout(partner_id=partner_id, amount=amount, notes=notes)
    if not res.get("success"):
        return JSONResponse(status_code=400, content=res)
    return {
        "success": True,
        "message": res.get("message", "Pencairan komisi mitra sales berhasil disetujui dan dicatat."),
        "data": res,
    }

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
async def request_sales_payout(request: Request):
    payload = await request.json()
    res = PartnerService.submit_payout(payload)
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
        orders = OrderService.load_orders()
        clean_email = (email or "").strip().lower()
        clean_phone = re.sub(r"\D", "", phone or "")

        has_claimed = any(
            (
                (clean_email and str(o.get("customerEmail", "")).lower().strip() == clean_email)
                or (clean_phone and re.sub(r"\D", "", str(o.get("customerWhatsapp", ""))) == clean_phone)
            )
            and float(o.get("referralDiscount") or o.get("referral_discount") or 0) > 0
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
    res = PartnerService.register_partner(payload)
    if not res.get("success"):
        return JSONResponse(status_code=400, content=res)
    return {
        "success": True,
        "message": res.get("message"),
        "data": res.get("partner"),
    }

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
def get_admin_campaigns(status: Optional[str] = Query(None), response: Response = None):
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
        cache.invalidate("campaigns", "catalog")
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
    cache.invalidate("campaigns", "catalog")
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
    cache.invalidate("campaigns", "catalog")
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
    cache.invalidate("campaigns", "catalog")
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
