import os
import pathlib
import re
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any

import httpx
from fastapi import APIRouter, Request, Response, HTTPException, Query, UploadFile, File, Form

from app.config import settings
from app.services.catalog_service import CatalogService
from app.services.banner_service import BannerService
from app.services.category_service import CategoryService

router = APIRouter()

ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/svg+xml",
    "image/avif",
]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB

from app.core.cache import cache
from app.services.realtime_broadcaster import RealtimeBroadcaster

# ------------------------------------------
# 1. Product Catalog Endpoints (Storefront & Admin)
# ------------------------------------------
SENSITIVE_INTERNAL_FIELDS = {
    "providerPrice",
    "profitMargin",
    "profitPercentage",
    "provider",
    "providerCode",
    "providerName",
    "providerStatus",
    "lastProviderCheck",
}

def sanitize_public_product(product: Dict[str, Any]) -> Dict[str, Any]:
    """Strips internal provider pricing, margins, and supplier codes from public responses."""
    if not isinstance(product, dict):
        return product
    return {k: v for k, v in product.items() if k not in SENSITIVE_INTERNAL_FIELDS}

@router.get("/products", tags=["Catalog"])
def get_products(
    request: Request,
    response: Response,
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    cache_key = f"cat_{category or 'all'}_s_{search or 'none'}"
    etag = cache.generate_etag("catalog", cache_key)
    if cache.is_not_modified(request, etag):
        return cache.not_modified_response(etag, max_age=0)

    cached_data = cache.get("catalog", cache_key)
    if cached_data is None:
        # On cache miss (e.g. after admin mutation bumped version), query PostgreSQL freshly
        products = CatalogService.get_products(category=category, search=search, force_reload=True)
        sanitized_products = [sanitize_public_product(p) for p in products]
        cached_data = {
            "success": True,
            "message": "Products retrieved successfully",
            "data": sanitized_products,
            "total": len(sanitized_products),
            "timestamp": datetime.utcnow().isoformat(),
        }
        cache.set("catalog", cache_key, cached_data, ttl=120)

    cache.apply_headers(response, etag=etag, mode="revalidate")
    return cached_data

@router.get("/products/{product_id}", tags=["Catalog"])
def get_product_by_id(product_id: str, request: Request, response: Response):
    cache_key = f"prod_{product_id}"
    etag = cache.generate_etag("catalog", cache_key)
    if cache.is_not_modified(request, etag):
        return cache.not_modified_response(etag, max_age=0)

    cached_prod = cache.get("catalog", cache_key)
    if cached_prod is None:
        product = CatalogService.get_product_by_id(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
        cached_prod = sanitize_public_product(product)
        cache.set("catalog", cache_key, cached_prod, ttl=120)

    cache.apply_headers(response, etag=etag, mode="revalidate")
    return {
        "success": True,
        "data": cached_prod,
    }

@router.get("/admin/products", tags=["Admin Products"])
def get_admin_products(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    result = CatalogService.get_admin_products(status=status, category=category, search=search)
    return {
        "success": True,
        "data": result["products"],
        "total": result["total"],
        "metrics": result["metrics"],
    }

@router.post("/admin/products", tags=["Admin Products"])
async def create_admin_product(request: Request):
    payload = await request.json()
    new_product = CatalogService.create_product(payload)
    cache.invalidate("catalog", "categories", "homepage_sections")
    RealtimeBroadcaster.broadcast(
        "catalog:updated",
        {"action": "created", "id": new_product.get("id"), "name": new_product.get("name")},
        target_role="all",
    )
    RealtimeBroadcaster.broadcast(
        "category:updated",
        {"action": "sync"},
        target_role="all",
    )
    return {
        "success": True,
        "message": f"Produk '{new_product.get('name')}' berhasil ditambahkan ke katalog.",
        "data": new_product,
    }

@router.patch("/admin/products/{product_id}", tags=["Admin Products"])
async def update_admin_product(product_id: str, request: Request):
    payload = await request.json()
    updated = CatalogService.update_product(product_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan untuk diperbarui.")
    cache.invalidate("catalog", "categories", "homepage_sections")
    RealtimeBroadcaster.broadcast(
        "catalog:updated",
        {"action": "updated", "id": product_id, "name": updated.get("name")},
        target_role="all",
    )
    RealtimeBroadcaster.broadcast(
        "category:updated",
        {"action": "sync"},
        target_role="all",
    )
    return {
        "success": True,
        "message": f"Produk '{updated.get('name')}' berhasil diperbarui.",
        "data": updated,
    }

@router.delete("/admin/products/{product_id}", tags=["Admin Products"])
def delete_admin_product(product_id: str):
    deleted = CatalogService.delete_product(product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan untuk dihapus.")
    cache.invalidate("catalog", "categories", "homepage_sections")
    RealtimeBroadcaster.broadcast(
        "catalog:updated",
        {"action": "deleted", "id": product_id},
        target_role="all",
    )
    RealtimeBroadcaster.broadcast(
        "category:updated",
        {"action": "sync"},
        target_role="all",
    )
    return {
        "success": True,
        "message": "Produk berhasil dihapus dari katalog.",
    }

@router.post("/admin/products/{product_id}/toggle-status", tags=["Admin Products"])
def toggle_admin_product_status(product_id: str):
    new_status = CatalogService.toggle_status(product_id)
    if not new_status:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan.")
    label = "diaktifkan" if new_status == "active" else "diarsipkan"
    cache.invalidate("catalog")
    RealtimeBroadcaster.broadcast(
        "catalog:updated",
        {"action": "toggled", "id": product_id, "status": new_status},
        target_role="admin",
    )
    return {
        "success": True,
        "message": f"Status produk berhasil {label}.",
        "status": new_status,
    }

@router.post("/admin/products/bulk-status", tags=["Admin Products"])
async def bulk_status_products(request: Request):
    payload = await request.json()
    ids = payload.get("ids", [])
    status = payload.get("status", "active")
    count = CatalogService.bulk_status(ids, status)
    label = "diaktifkan" if status == "active" else "diarsipkan"
    cache.invalidate("catalog")
    RealtimeBroadcaster.broadcast(
        "catalog:updated",
        {"action": "bulk_status", "status": status, "count": count},
        target_role="admin",
    )
    return {
        "success": True,
        "message": f"{count} produk massal berhasil {label}.",
        "updatedCount": count,
    }

@router.post("/admin/products/bulk-delete", tags=["Admin Products"])
async def bulk_delete_products(request: Request):
    payload = await request.json()
    ids = payload.get("ids", [])
    count = CatalogService.bulk_delete(ids)
    cache.invalidate("catalog")
    RealtimeBroadcaster.broadcast(
        "catalog:updated",
        {"action": "bulk_delete", "count": count},
        target_role="admin",
    )
    return {
        "success": True,
        "message": f"{count} produk massal berhasil dihapus.",
        "deletedCount": count,
    }

# ------------------------------------------
# 1.1 VIP Reseller Explorer Endpoints
# ------------------------------------------
@router.get("/admin/vip-services", tags=["Admin VIP"])
def get_admin_vip_services(
    search: Optional[str] = None,
    type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 2500,
):
    result = CatalogService.search_vip_services(search=search, vip_type=type, vip_status=status, limit=limit)
    return result

@router.post("/admin/vip-services", tags=["Admin VIP"])
async def import_admin_vip_service(request: Request):
    payload = await request.json()
    imported = CatalogService.import_vip_service(payload)
    cache.invalidate("catalog", "categories", "homepage_sections")
    RealtimeBroadcaster.broadcast(
        "catalog:updated",
        {"action": "imported", "id": imported.get("id"), "name": imported.get("name")},
        target_role="all",
    )
    RealtimeBroadcaster.broadcast(
        "category:updated",
        {"action": "sync"},
        target_role="all",
    )
    return {
        "success": True,
        "message": f"Layanan '{imported.get('name')}' berhasil diimpor ke katalog Asterra Store.",
        "data": imported,
    }

@router.post("/admin/sync-vip", tags=["Admin VIP"])
def sync_vip_services():
    from app.services.vip_service import VipService
    result = VipService.sync_vip_services()
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Gagal sinkronisasi VIP Reseller"))
    cache.invalidate("catalog")
    RealtimeBroadcaster.broadcast(
        "catalog:updated",
        {"action": "sync_vip"},
        target_role="admin",
    )
    RealtimeBroadcaster.broadcast(
        "vip:status_updated",
        {"action": "sync_vip"},
        target_role="admin",
    )
    return result

@router.post("/admin/refresh-stock", tags=["Admin VIP"])
def refresh_stock():
    from app.services.vip_service import VipService
    result = VipService.check_stock()
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Gagal pengecekan stok live"))
    cache.invalidate("catalog")
    RealtimeBroadcaster.broadcast(
        "catalog:updated",
        {"action": "refresh_stock"},
        target_role="admin",
    )
    RealtimeBroadcaster.broadcast(
        "vip:status_updated",
        {"action": "refresh_stock", "checked": result.get("checked", 0)},
        target_role="admin",
    )
    return result

# ------------------------------------------
# 1.2 Media Streaming (Blob & Local Files)
# ------------------------------------------
@router.get("/media/{media_path:path}", tags=["Media"])
async def get_media_file(media_path: str):
    token = settings.BLOB_READ_WRITE_TOKEN or os.getenv("BLOB_READ_WRITE_TOKEN", "")
    if token:
        parts = token.split("_")
        store_id = parts[3] if len(parts) >= 4 else None
        if store_id:
            blob_url = f"https://{store_id}.private.blob.vercel-storage.com/{media_path}"
            headers = {"Authorization": f"Bearer {token}"}
            try:
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.get(blob_url, headers=headers)
                    if res.status_code == 200:
                        content_type = res.headers.get("content-type", "image/png")
                        return Response(
                            content=res.content,
                            media_type=content_type,
                            headers={
                                "Content-Type": content_type,
                                "Cache-Control": "public, max-age=31536000, immutable",
                            },
                        )
            except Exception as e:
                print(f"[MediaAPI] Error fetching blob {media_path}: {e}")

    # Fallback to local public file
    local_path = pathlib.Path(__file__).resolve().parent.parent.parent.parent / "public" / media_path
    if local_path.exists() and local_path.is_file():
        content_type = "image/png"
        if local_path.suffix.lower() in [".jpg", ".jpeg"]:
            content_type = "image/jpeg"
        elif local_path.suffix.lower() == ".webp":
            content_type = "image/webp"
        return Response(
            content=local_path.read_bytes(),
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=86400"},
        )

    default_banner = pathlib.Path(__file__).resolve().parent.parent.parent.parent / "public" / "images" / "default-product-banner.png"
    if default_banner.exists() and default_banner.is_file():
        return Response(
            content=default_banner.read_bytes(),
            media_type="image/png",
            headers={"Cache-Control": "public, max-age=86400"},
        )

    raise HTTPException(status_code=404, detail="File media tidak ditemukan")

# ------------------------------------------
# 1.3 Admin Media Upload
# ------------------------------------------
@router.post("/admin/upload", tags=["Admin Media"])
async def upload_admin_media(
    file: UploadFile = File(None),
    folder: str = Form("products"),
    productName: Optional[str] = Form(None),
    productId: Optional[str] = Form(None),
    isSpecialPromo: Optional[str] = Form("false"),
):
    if not file:
        return {
            "success": True,
            "url": "/images/default-product-banner.png",
            "viewUrl": "/images/default-product-banner.png",
            "data": {
                "viewUrl": "/images/default-product-banner.png",
                "url": "/images/default-product-banner.png",
                "pathname": "images/default-product-banner.png",
                "deduplicated": True,
            },
            "message": "Menggunakan banner default.",
        }

    content_type = file.content_type or "image/png"
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Format file '{content_type}' tidak didukung. Harap unggah format JPG, PNG, WEBP, GIF, SVG, atau AVIF.",
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Ukuran file melebihi batas maksimal 5MB.",
        )

    is_promo = str(isSpecialPromo).strip().lower() in ["true", "1", "yes"]
    target_prod_name = (productName or "").strip()
    target_prod_id = (productId or "").strip()

    matched_product = None
    if target_prod_id or target_prod_name:
        matched_product = CatalogService.find_product_by_id_or_name(
            product_id=target_prod_id or None,
            product_name=target_prod_name or None,
        )

    if matched_product and folder == "products":
        existing_banner = matched_product.get("imageUrl") or ""
        has_official_banner = (
            bool(existing_banner)
            and not existing_banner.endswith("default-product-banner.png")
            and len(existing_banner) > 5
        )
        if has_official_banner and not is_promo:
            prod_display_name = matched_product.get("name") or target_prod_name
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Produk '{prod_display_name}' sudah memiliki banner resmi ({existing_banner}). "
                    "Upload banner produk reguler ditolak untuk mencegah duplikasi dan redundansi aset. "
                    "Silakan centang 'Banner Promo Khusus' jika ingin mengunggah banner promosi tertentu."
                ),
            )

    raw_filename = file.filename or "image.webp"
    ext = raw_filename.split(".")[-1].lower() if "." in raw_filename else "webp"
    if ext not in ["jpg", "jpeg", "png", "webp", "gif", "svg", "avif"]:
        ext = "webp"

    base_label = target_prod_name or (matched_product.get("name") if matched_product else "") or raw_filename.rsplit(".", 1)[0]
    prod_slug = re.sub(r"[^a-zA-Z0-9]+", "-", base_label.lower()).strip("-")
    if not prod_slug:
        prod_slug = "banner"
    prod_slug = prod_slug[:50]

    content_hash = hashlib.sha256(content).hexdigest()[:12]
    prefix = "promo-" if (is_promo and folder == "products") else ""
    pathname = f"{folder}/{prefix}{prod_slug}-{content_hash}.{ext}"

    token = settings.BLOB_READ_WRITE_TOKEN or os.getenv("BLOB_READ_WRITE_TOKEN", "")
    blob_url = None
    deduplicated = False

    if token:
        parts = token.split("_")
        store_id = parts[3] if len(parts) >= 4 else None

        if store_id:
            try:
                async with httpx.AsyncClient(timeout=10.0) as check_client:
                    check_res = await check_client.head(
                        f"https://{store_id}.private.blob.vercel-storage.com/{pathname}",
                        headers={"Authorization": f"Bearer {token}"},
                    )
                    if check_res.status_code == 200:
                        blob_url = f"https://{store_id}.private.blob.vercel-storage.com/{pathname}"
                        deduplicated = True
            except Exception as e:
                print(f"[UploadAPI] Check-before-upload error (ignorable): {e}")

        if not blob_url:
            put_url = f"https://blob.vercel-storage.com/?pathname={pathname}"
            put_headers = {
                "authorization": f"Bearer {token}",
                "x-api-version": "12",
                "x-vercel-blob-access": "private",
                "x-content-type": content_type,
                "x-allow-overwrite": "1",
                "x-add-random-suffix": "0",
            }
            try:
                async with httpx.AsyncClient(timeout=30.0) as upload_client:
                    upload_res = await upload_client.put(put_url, content=content, headers=put_headers)
                    if upload_res.status_code == 200:
                        res_json = upload_res.json()
                        blob_url = res_json.get("url")
                    else:
                        print(f"[UploadAPI] Vercel Blob PUT error ({upload_res.status_code}): {upload_res.text}")
            except Exception as upload_err:
                print(f"[UploadAPI] Exception uploading to Vercel Blob: {upload_err}")

    if not blob_url:
        public_dir = pathlib.Path(__file__).resolve().parent.parent.parent.parent / "public" / folder
        public_dir.mkdir(parents=True, exist_ok=True)
        file_path = public_dir / f"{prefix}{prod_slug}-{content_hash}.{ext}"
        file_path.write_bytes(content)
        blob_url = f"/api/v1/media/{pathname}"

    view_url = f"/api/v1/media/{pathname}"
    msg = (
        "Banner sudah ada di storage (deduplicated). Tidak ada upload ulang."
        if deduplicated
        else ("Banner promo khusus berhasil diunggah ke Vercel Blob." if is_promo else "Banner produk berhasil diunggah ke Vercel Blob (Private Mode).")
    )

    return {
        "success": True,
        "url": blob_url,
        "viewUrl": view_url,
        "data": {
            "viewUrl": view_url,
            "url": blob_url,
            "pathname": pathname,
            "deduplicated": deduplicated,
            "isSpecialPromo": is_promo,
            "productName": target_prod_name or prod_slug,
        },
        "message": msg,
    }

# ------------------------------------------
# 1.4 Promo Banner Endpoints (Storefront & Admin)
# ------------------------------------------
@router.post("/banners", tags=["Promo Banners"])
@router.post("/admin/banners", tags=["Promo Banners"])
async def upload_promo_banner(
    file: Optional[UploadFile] = File(None),
    title: str = Form(...),
    description: Optional[str] = Form(""),
    ctaText: Optional[str] = Form("Beli Sekarang"),
    cta_text: Optional[str] = Form(None),
    bannerType: Optional[str] = Form("hero"),
    banner_type: Optional[str] = Form(None),
    linkUrl: Optional[str] = Form(None),
    link_url: Optional[str] = Form(None),
    destinationUrl: Optional[str] = Form(None),
    targetPage: Optional[str] = Form("home"),
    target_page: Optional[str] = Form(None),
    displayOrder: Optional[int] = Form(0),
    display_order: Optional[int] = Form(None),
    isActive: Optional[bool] = Form(True),
    is_active: Optional[bool] = Form(None),
    expiresAt: Optional[str] = Form(None),
    expires_at: Optional[str] = Form(None),
    scheduledUntil: Optional[str] = Form(None),
    id: Optional[str] = Form(None),
):
    final_link = destinationUrl or link_url if (destinationUrl or link_url) is not None else linkUrl
    final_target = target_page if target_page is not None else (targetPage or "home")
    final_order = display_order if display_order is not None else (displayOrder if displayOrder is not None else 0)
    final_active = is_active if is_active is not None else (isActive if isActive is not None else True)
    final_cta = cta_text if cta_text is not None else (ctaText or "Beli Sekarang")
    final_type = banner_type if banner_type is not None else (bannerType or "hero")
    final_expires = expires_at or scheduledUntil if (expires_at or scheduledUntil) is not None else expiresAt

    # 1. If file is provided and has filename: perform full upload and replace/store image
    if file is not None and getattr(file, "filename", None):
        content_type = file.content_type or "image/webp"
        content = await file.read()
        if len(content) > 0:
            try:
                res = await BannerService.upload_banner(
                    content=content,
                    filename=file.filename or "banner.webp",
                    content_type=content_type,
                    title=title,
                    description=description or "",
                    cta_text=final_cta,
                    banner_type=final_type,
                    link_url=final_link,
                    target_page=final_target,
                    display_order=int(final_order),
                    is_active=bool(final_active),
                    expires_at=final_expires,
                    banner_id=id,
                )
                cache.invalidate("banners")
                return res
            except ValueError as ve:
                raise HTTPException(status_code=400, detail=str(ve))
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Gagal mengunggah banner: {str(e)}")

    # 2. If no new file uploaded, but updating an existing banner by ID:
    if id:
        try:
            res = BannerService.update_banner(
                banner_id=id,
                title=title,
                description=description or "",
                cta_text=final_cta,
                banner_type=final_type,
                link_url=final_link,
                target_page=final_target,
                display_order=int(final_order),
                is_active=bool(final_active),
                expires_at=final_expires,
            )
            cache.invalidate("banners")
            return res
        except ValueError as ve:
            raise HTTPException(status_code=400, detail=str(ve))
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gagal memperbarui banner: {str(e)}")

    raise HTTPException(status_code=400, detail="File gambar banner wajib diunggah untuk banner baru.")

@router.patch("/banners/{banner_id}/toggle-status", tags=["Promo Banners"])
@router.patch("/admin/banners/{banner_id}/toggle-status", tags=["Promo Banners"])
async def toggle_promo_banner_status(banner_id: str, request: Request):
    new_status = None
    try:
        body = await request.json()
        if "isActive" in body:
            new_status = bool(body["isActive"])
        elif "status" in body:
            new_status = body["status"] == "active"
    except Exception:
        pass

    updated = BannerService.toggle_status(banner_id, new_status=new_status)
    if not updated:
        raise HTTPException(status_code=404, detail="Banner tidak ditemukan.")
    cache.invalidate("banners")
    return {
        "success": True,
        "data": updated,
        "message": f"Status banner '{updated.get('title')}' berhasil diubah.",
    }

@router.get("/banners", tags=["Promo Banners"])
@router.get("/admin/banners", tags=["Promo Banners"])
def get_promo_banners(
    request: Request,
    response: Response,
    active_only: bool = Query(True, alias="activeOnly"),
    target_page: Optional[str] = Query(None, alias="targetPage"),
    banner_type: Optional[str] = Query(None, alias="bannerType"),
):
    # Admin requests (activeOnly=False or /admin/ path) should never be served from stale browser cache
    is_admin = (not active_only) or "/admin/" in request.url.path or request.url.path.endswith("/admin")
    if is_admin:
        banners = BannerService.get_banners(
            active_only=False,
            target_page=target_page,
            banner_type=banner_type,
        )
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return {
            "success": True,
            "data": banners,
            "total": len(banners),
        }

    # Public storefront requests use smart caching & ETags
    cache_key = f"b_{active_only}_{target_page or 'all'}_{banner_type or 'all'}"
    etag = cache.generate_etag("banners", cache_key)
    if cache.is_not_modified(request, etag):
        return cache.not_modified_response(etag, max_age=60)

    banners = cache.get("banners", cache_key)
    if banners is None:
        banners = BannerService.get_banners(
            active_only=active_only,
            target_page=target_page,
            banner_type=banner_type,
        )
        cache.set("banners", cache_key, banners, ttl=60)

    cache.apply_headers(response, etag=etag, max_age=60)
    return {
        "success": True,
        "data": banners,
        "total": len(banners),
    }

@router.get("/banners/{banner_id}", tags=["Promo Banners"])
@router.get("/admin/banners/{banner_id}", tags=["Promo Banners"])
def get_promo_banner_detail(banner_id: str, request: Request, response: Response):
    cache_key = f"b_detail_{banner_id}"
    etag = cache.generate_etag("banners", cache_key)
    if cache.is_not_modified(request, etag):
        return cache.not_modified_response(etag, max_age=120)

    banner = cache.get("banners", cache_key)
    if banner is None:
        banner = BannerService.get_banner_by_id(banner_id)
        if not banner:
            raise HTTPException(status_code=404, detail="Banner tidak ditemukan.")
        cache.set("banners", cache_key, banner, ttl=120)

    cache.apply_headers(response, etag=etag, max_age=120)
    return {
        "success": True,
        "data": banner,
    }

@router.delete("/banners/{banner_id}", tags=["Promo Banners"])
@router.delete("/admin/banners/{banner_id}", tags=["Promo Banners"])
async def delete_promo_banner(banner_id: str):
    success = await BannerService.delete_banner(banner_id)
    if not success:
        raise HTTPException(status_code=404, detail="Banner tidak ditemukan atau sudah dihapus.")
    cache.invalidate("banners")
    return {
        "success": True,
        "message": f"Banner {banner_id} berhasil dihapus dari sistem dan storage.",
    }

# ------------------------------------------
# 1.5 Homepage Sections & Product Ordering Engine
# ------------------------------------------
from app.services.homepage_section_service import HomepageSectionService

@router.get("/homepage/sections", tags=["Homepage Sections"])
def get_homepage_sections(request: Request, response: Response, limit: int = 8):
    cache_key = f"hp_sections_l_{limit}"
    etag = cache.generate_etag("homepage_sections", cache_key)
    if cache.is_not_modified(request, etag):
        return cache.not_modified_response(etag, max_age=15)

    data = cache.get("homepage_sections", cache_key)
    if data is None:
        data = HomepageSectionService.get_all_homepage_sections(limit=limit)
        cache.set("homepage_sections", cache_key, data, ttl=30)

    cache.apply_headers(response, etag=etag, max_age=15)
    return data

@router.get("/homepage/sections/{section_key}", tags=["Homepage Sections"])
def get_homepage_section_by_key(section_key: str, request: Request, response: Response, limit: int = 8):
    if section_key not in ["promo", "terlaris", "terbaru"]:
        raise HTTPException(status_code=400, detail="Section key tidak valid. Gunakan 'promo', 'terlaris', atau 'terbaru'.")
    return {
        "success": True,
        "data": HomepageSectionService.compute_section_products(section_key, limit=limit),
    }

@router.get("/admin/homepage/sections/config", tags=["Admin Homepage Ordering"])
def get_admin_homepage_sections_config():
    configs = HomepageSectionService.get_sections_config()
    return {
        "success": True,
        "configs": configs,
    }

@router.post("/admin/homepage/sections/{section_key}", tags=["Admin Homepage Ordering"])
@router.put("/admin/homepage/sections/{section_key}", tags=["Admin Homepage Ordering"])
async def update_admin_homepage_section(section_key: str, request: Request):
    if section_key not in ["promo", "terlaris", "terbaru"]:
        raise HTTPException(status_code=400, detail="Section key tidak valid. Gunakan 'promo', 'terlaris', atau 'terbaru'.")
    payload = await request.json()
    mode = payload.get("mode", "auto")
    manual_ids = payload.get("manualProductIds") or payload.get("productIds") or []
    updated_by = payload.get("updatedBy", "admin")

    try:
        updated = HomepageSectionService.update_section_config(
            section_key=section_key,
            mode=mode,
            manual_product_ids=manual_ids,
            updated_by=updated_by,
        )
        return {
            "success": True,
            "message": f"Konfigurasi urutan homepage kategori '{section_key.upper()}' berhasil disimpan.",
            "data": updated,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memperbarui urutan section: {str(e)}")


# ------------------------------------------
# 8. Category Management Endpoints
# ------------------------------------------
@router.get("/categories", tags=["Categories"])
def get_public_categories():
    categories = CategoryService.get_public_categories()
    return {
        "success": True,
        "data": categories,
        "total": len(categories),
    }

@router.get("/admin/categories", tags=["Admin Categories"])
def get_admin_categories():
    categories = CategoryService.get_admin_categories()
    return {
        "success": True,
        "data": categories,
        "total": len(categories),
    }

@router.post("/admin/categories", tags=["Admin Categories"])
async def create_admin_category(request: Request):
    payload = await request.json()
    try:
        new_cat = CategoryService.create_category(payload)
        cache.invalidate("catalog")
        return {
            "success": True,
            "message": f"Kategori '{new_cat.get('name')}' berhasil ditambahkan.",
            "data": new_cat,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menambahkan kategori: {str(e)}")

@router.patch("/admin/categories/{category_id}", tags=["Admin Categories"])
async def update_admin_category(category_id: str, request: Request):
    payload = await request.json()
    try:
        updated = CategoryService.update_category(category_id, payload)
        if not updated:
            raise HTTPException(status_code=404, detail="Kategori tidak ditemukan.")
        cache.invalidate("catalog")
        return {
            "success": True,
            "message": f"Kategori '{updated.get('name')}' berhasil diperbarui.",
            "data": updated,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memperbarui kategori: {str(e)}")

@router.delete("/admin/categories/{category_id}", tags=["Admin Categories"])
def delete_admin_category(category_id: str):
    try:
        res = CategoryService.delete_category(category_id)
        cache.invalidate("catalog")
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghapus kategori: {str(e)}")





# ------------------------------------------
# Product Card & Dynamic Variant Endpoints (Storefront & Admin)
# ------------------------------------------
from app.services.card_service import CardService

@router.get("/cards", tags=["Product Cards"])
def get_cards(
    section: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    cards = CardService.get_cards(
        status="active",
        section=section,
        category=category,
        search=search,
        include_catalogs=False,
    )
    return {
        "success": True,
        "data": cards,
        "total": len(cards),
    }

@router.get("/cards/{id_or_slug}", tags=["Product Cards"])
def get_card_by_id_or_slug(id_or_slug: str):
    card = CardService.get_card_by_id_or_slug(id_or_slug, include_catalogs=True)
    if not card:
        raise HTTPException(status_code=404, detail="Card Produk tidak ditemukan.")
    return {
        "success": True,
        "data": card,
    }

@router.get("/cards/{id_or_slug}/attributes", tags=["Product Cards"])
def get_card_attributes(id_or_slug: str):
    card = CardService.get_card_by_id_or_slug(id_or_slug, include_catalogs=False)
    if not card:
        raise HTTPException(status_code=404, detail="Card Produk tidak ditemukan.")
    attrs = CardService.get_attributes(card["id"])
    return {
        "success": True,
        "data": attrs,
    }

@router.get("/cards/{id_or_slug}/variants", tags=["Product Cards"])
def get_card_variants(id_or_slug: str):
    card = CardService.get_card_by_id_or_slug(id_or_slug, include_catalogs=False)
    if not card:
        raise HTTPException(status_code=404, detail="Card Produk tidak ditemukan.")
    variants = CardService.get_variants(card["id"])
    return {
        "success": True,
        "data": variants,
    }

# Admin Card CRUD
@router.get("/admin/cards", tags=["Admin Product Cards"])
def get_admin_cards(
    status: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    cards = CardService.get_cards(
        status=status,
        category=category,
        search=search,
        include_catalogs=True,
    )
    return {
        "success": True,
        "data": cards,
        "total": len(cards),
    }

@router.post("/admin/cards", tags=["Admin Product Cards"])
async def create_admin_card(request: Request):
    payload = await request.json()
    try:
        card = CardService.create_card(payload)
        cache.invalidate("catalog")
        RealtimeBroadcaster.broadcast("cards:updated", {"action": "created", "id": card["id"]}, target_role="all")
        return {
            "success": True,
            "message": f"Card Produk '{card['name']}' berhasil dibuat.",
            "data": card,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal membuat Card Produk: {str(e)}")

@router.patch("/admin/cards/{card_id}", tags=["Admin Product Cards"])
@router.put("/admin/cards/{card_id}", tags=["Admin Product Cards"])
async def update_admin_card(card_id: str, request: Request):
    payload = await request.json()
    try:
        card = CardService.update_card(card_id, payload)
        cache.invalidate("catalog")
        RealtimeBroadcaster.broadcast("cards:updated", {"action": "updated", "id": card_id}, target_role="all")
        return {
            "success": True,
            "message": f"Card Produk '{card['name']}' berhasil diperbarui.",
            "data": card,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal memperbarui Card Produk: {str(e)}")

@router.delete("/admin/cards/{card_id}", tags=["Admin Product Cards"])
def delete_admin_card(card_id: str):
    try:
        res = CardService.delete_card(card_id)
        cache.invalidate("catalog")
        RealtimeBroadcaster.broadcast("cards:updated", {"action": "deleted", "id": card_id}, target_role="all")
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menghapus Card Produk: {str(e)}")

@router.post("/admin/cards/{card_id}/toggle-status", tags=["Admin Product Cards"])
def toggle_admin_card_status(card_id: str):
    try:
        res = CardService.toggle_status(card_id)
        cache.invalidate("catalog")
        RealtimeBroadcaster.broadcast("cards:updated", {"action": "toggled", "id": card_id}, target_role="all")
        return {
            "success": True,
            "message": f"Status Card Produk berhasil diubah menjadi {res['status']}.",
            "status": res["status"],
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/admin/cards/{card_id}/link-catalog", tags=["Admin Product Cards"])
async def link_catalog_to_card(card_id: str, request: Request):
    payload = await request.json()
    catalog_id = payload.get("catalogId") or payload.get("catalog_id")
    target_card_id = payload.get("cardId") if "cardId" in payload else card_id
    if not catalog_id:
        raise HTTPException(status_code=400, detail="catalogId wajib diisi.")
    try:
        res = CardService.link_catalog_to_card(catalog_id, target_card_id)
        cache.invalidate("catalog")
        RealtimeBroadcaster.broadcast("catalog:updated", {"action": "linked", "catalogId": catalog_id, "cardId": target_card_id}, target_role="all")
        return {
            "success": True,
            "message": "Relasi katalog berhasil diperbarui.",
            "data": res,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

# Admin Dynamic Attributes & Variants
@router.get("/admin/cards/{card_id}/attributes", tags=["Admin Attributes"])
def get_admin_card_attributes(card_id: str):
    attrs = CardService.get_attributes(card_id)
    return {"success": True, "data": attrs}

@router.post("/admin/cards/{card_id}/attributes", tags=["Admin Attributes"])
async def save_admin_card_attribute(card_id: str, request: Request):
    payload = await request.json()
    try:
        attr = CardService.save_attribute(card_id, payload)
        cache.invalidate("catalog")
        return {"success": True, "message": "Atribut berhasil disimpan.", "data": attr}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.delete("/admin/cards/{card_id}/attributes/{attr_id}", tags=["Admin Attributes"])
def delete_admin_card_attribute(card_id: str, attr_id: str):
    try:
        res = CardService.delete_attribute(attr_id)
        cache.invalidate("catalog")
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.get("/admin/cards/{card_id}/variants", tags=["Admin Variants"])
def get_admin_card_variants(card_id: str):
    variants = CardService.get_variants(card_id)
    return {"success": True, "data": variants}

@router.post("/admin/cards/{card_id}/variants", tags=["Admin Variants"])
async def save_admin_card_variant(card_id: str, request: Request):
    payload = await request.json()
    try:
        var = CardService.save_variant(card_id, payload)
        cache.invalidate("catalog")
        return {"success": True, "message": "Kombinasi varian berhasil disimpan.", "data": var}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

@router.delete("/admin/cards/{card_id}/variants/{variant_id}", tags=["Admin Variants"])
def delete_admin_card_variant(card_id: str, variant_id: str):
    try:
        res = CardService.delete_variant(variant_id)
        cache.invalidate("catalog")
        return res
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
