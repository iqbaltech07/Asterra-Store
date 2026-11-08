import json
import logging
from typing import Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.product import Product
from app.services.order_processing_service import OrderProcessingService

logger = logging.getLogger("CatalogInputAudit")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

CHOICE_KEYWORDS = [
    "chatgpt", "openai", "gpt-4", "gpt", "netflix", "disney", "prime video",
    "vidio", "wetv", "iqiyi", "hbogo", "hbo", "spotify", "crunchyroll",
    "remaker", "midjourney", "claude"
]

EMAIL_INVITE_KEYWORDS = [
    "youtube", "family", "invite", "undangan", "canva", "google one",
    "gemini", "duolingo", "notion", "office 365", "microsoft 365", "apple music"
]

PHONE_KEYWORDS = [
    "capcut", "pulsa", "telkomsel", "tsel", "indosat", "isat", "tri", "three",
    "xl", "axis", "smartfren", "dana", "gopay", "ovo", "shopeepay", "linkaja",
    "kuota", "paket data"
]

ZONE_GAME_KEYWORDS = [
    "mobile legends", "mlbb", "lifeafter", "ragnarok", "genshin", "honkai", "zenless"
]

NO_ZONE_GAME_KEYWORDS = [
    "free fire", "ff", "valorant", "pubg", "point blank", "codm",
    "call of duty", "honor of kings", "hok", "arena of valor", "aov"
]

VOUCHER_KEYWORDS = [
    "voucher", "gift card", "redeem code", "steam wallet", "playstation", "google play"
]

def classify_product_input(prod_name: str, brand: str = "", category: str = "", provider_code: str = "") -> Tuple[str, Dict[str, Any], bool]:
    """
    Analyzes product metadata and returns:
    (input_type, input_config_dict, is_ambiguous)
    """
    text = f"{prod_name} {brand} {category} {provider_code}".lower()

    # 1. Game with zone
    if any(k in text for k in ZONE_GAME_KEYWORDS):
        return "game", {
            "type": "game",
            "label": "User ID Game *",
            "placeholder": "contoh: 136216325",
            "helper": "Masukan User ID akun game tujuan top-up.",
            "requires_zone": True,
            "zone_label": "Server / Zone ID *",
            "zone_placeholder": "contoh: 2685",
            "zone_helper": "Server atau Zone ID akun game Anda.",
            "required": True,
        }, False

    # 2. Game without zone
    if any(k in text for k in NO_ZONE_GAME_KEYWORDS):
        return "game", {
            "type": "game",
            "label": "User ID Game *",
            "placeholder": "contoh: 849201948",
            "helper": "Masukan User ID akun game Anda.",
            "requires_zone": False,
            "required": True,
        }, False

    # 3. Voucher / Digital Code (No input needed)
    if any(k in text for k in VOUCHER_KEYWORDS):
        return "none", {
            "type": "none",
            "label": "Tidak Memerlukan Input Tujuan",
            "helper": "Kode voucher atau lisensi akan otomatis diterbitkan di rincian pesanan Anda.",
            "required": False,
        }, False

    # 4. Phone based (CapCut, Pulsa, Telco, E-wallet)
    if any(k in text for k in PHONE_KEYWORDS):
        brand_clean = brand.strip() if brand and brand.lower() != "digital" else "Akun"
        return "phone", {
            "type": "phone",
            "label": f"Nomor WhatsApp / HP Tujuan Aktivasi {brand_clean} *",
            "placeholder": "contoh: 081234567890",
            "helper": f"Aktivasi paket atau pengisian akan diproses ke nomor {brand_clean} ini.",
            "required": True,
        }, False

    # 5. Invite email products (YouTube Family, Canva, etc.)
    if any(k in text for k in EMAIL_INVITE_KEYWORDS):
        brand_clean = brand.strip() if brand and brand.lower() != "digital" else prod_name.split()[0]
        return "email", {
            "type": "email",
            "label": f"Email Akun {brand_clean} Tujuan Aktivasi *",
            "placeholder": "contoh: akun_anda@gmail.com",
            "helper": f"Undangan atau akses premium {brand_clean} akan dikaitkan ke email akun ini (bukan otomatis email login website).",
            "required": True,
        }, False

    # 6. Choice products (ChatGPT, Netflix, Spotify private/shared credentials)
    if any(k in text for k in CHOICE_KEYWORDS):
        brand_clean = brand.strip() if brand and brand.lower() != "digital" else prod_name.split()[0]
        return "choice", {
            "type": "choice",
            "label": f"Pilihan Metode Pengiriman Akun {brand_clean} *",
            "placeholder": "Pilih WhatsApp atau Gmail untuk menerima kredensial akun",
            "helper": f"Akun {brand_clean} disediakan oleh AsterraStore dan akan dikirimkan ke kontak WhatsApp atau Gmail yang Anda tentukan.",
            "options": ["whatsapp", "gmail"],
            "default_option": "whatsapp",
            "fields": {
                "whatsapp": {
                    "label": "Nomor WhatsApp Penerima Akun *",
                    "placeholder": "contoh: 081234567890",
                    "helper": "Kredensial login akun akan dikirimkan melalui WhatsApp ini."
                },
                "gmail": {
                    "label": "Email Gmail Penerima Akun *",
                    "placeholder": "contoh: akun_penerima@gmail.com",
                    "helper": "Kredensial login akun akan dikirimkan melalui email Gmail ini."
                }
            },
            "required": True,
        }, False

    # 7. Ambiguous fallback: Flags for admin review and blocks unverified checkout
    return "custom", {
        "type": "custom",
        "label": f"Produk Dalam Peninjauan Admin *",
        "placeholder": "Menunggu verifikasi konfigurasi input oleh admin",
        "helper": "Konfigurasi jenis fulfillment produk ini sedang dalam peninjauan admin dan belum dapat dipesan.",
        "required": True,
        "needs_review": True,
    }, True

def run_catalog_input_audit(force: bool = False) -> Dict[str, Any]:
    """
    Scans all products in database and applies idempotent input configuration.
    Preserves existing custom configs if force=False.
    """
    OrderProcessingService.ensure_tables()
    db: Session = SessionLocal()
    try:
        products: List[Product] = db.query(Product).all()
        total_count = len(products)
        updated_count = 0
        skipped_count = 0
        needs_review_list = []
        category_stats: Dict[str, int] = {}

        for p in products:
            # Check if product already has verified non-default configuration
            existing_type = getattr(p, "input_type", None)
            existing_cfg = getattr(p, "input_config", None)

            if not force and existing_cfg and existing_type:
                skipped_count += 1
                category_stats[existing_type] = category_stats.get(existing_type, 0) + 1
                continue

            in_type, in_cfg, is_ambiguous = classify_product_input(
                prod_name=p.name or "",
                brand=p.brand or "",
                category=p.category_name or "",
                provider_code=p.provider_code or "",
            )

            p.input_type = in_type
            p.input_config = json.dumps(in_cfg)
            updated_count += 1
            category_stats[in_type] = category_stats.get(in_type, 0) + 1

            if is_ambiguous:
                needs_review_list.append({
                    "id": p.id,
                    "name": p.name,
                    "brand": p.brand,
                    "category": p.category_name,
                    "assigned_type": in_type,
                })

        db.commit()

        # Invalidate catalog cache so changes take effect immediately
        from app.core.cache import cache
        cache.invalidate("catalog", "categories", "homepage_sections")
        from app.services.catalog_service import CatalogService
        CatalogService.load_products(force_reload=True)

        summary = {
            "success": True,
            "total_products": total_count,
            "updated_count": updated_count,
            "skipped_count": skipped_count,
            "type_distribution": category_stats,
            "needs_review_count": len(needs_review_list),
            "needs_review_items": needs_review_list,
        }
        return summary
    finally:
        db.close()

if __name__ == "__main__":
    result = run_catalog_input_audit(force=False)
    print("Catalog Input Audit & Mapping Finished:")
    print(json.dumps(result, indent=2))
