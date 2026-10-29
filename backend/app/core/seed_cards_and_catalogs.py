import json
import pathlib
import re
from datetime import datetime
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.product_card import ProductCard
from app.models.product_variant import ProductAttribute, ProductVariant

INITIAL_CARDS = [
    {
        "id": "card-google-gemini",
        "name": "Google Gemini",
        "slug": "google-gemini",
        "category_id": "cat-ai-tools",
        "category_name": "AI Tools",
        "logo_url": "/images/brand/Google-logo.png",
        "description": "Lisensi resmi Google Gemini AI Pro dengan integrasi Google Workspace, ruang penyimpanan Google Drive ekstra besar (hingga 5 TB), dan video generator Veo 3.",
        "display_order": 1,
        "is_featured": True,
        "sections": json.dumps(["promo", "terbaru"]),
        "rating": "5.0",
        "badge_label": "🔥 Promo",
        "match": lambda t: "gemini" in t or "google ai" in t or "google pro" in t,
    },
    {
        "id": "card-canva",
        "name": "Canva",
        "slug": "canva",
        "category_id": "cat-apps-streaming",
        "category_name": "Apps & Streaming",
        "logo_url": "/images/apps/canva.png",
        "description": "Akun resmi Canva Pro & Education untuk desain grafis tanpa batas. Akses 100+ juta foto premium, audio, video, Magic Studio AI, dan hapus background 1 klik.",
        "display_order": 2,
        "is_featured": True,
        "sections": json.dumps(["promo", "terlaris"]),
        "rating": "5.0",
        "badge_label": "🔥 Promo",
        "match": lambda t: "canva" in t,
    },
    {
        "id": "card-capcut",
        "name": "CapCut",
        "slug": "capcut",
        "category_id": "cat-apps-streaming",
        "category_name": "Apps & Streaming",
        "logo_url": "/images/brand/Capcut-logo.png",
        "description": "CapCut Pro resmi untuk editing video tanpa watermark, akses ribuan transisi, efek pro, dan cloud storage.",
        "display_order": 3,
        "is_featured": True,
        "sections": json.dumps(["promo", "terlaris"]),
        "rating": "4.9",
        "badge_label": "🔥 Promo",
        "match": lambda t: "capcut" in t,
    },
    {
        "id": "card-chatgpt",
        "name": "ChatGPT",
        "slug": "chatgpt",
        "category_id": "cat-ai-tools",
        "category_name": "AI Tools",
        "logo_url": "/images/brand/ChatGPT-logo.png",
        "description": "Akses resmi ChatGPT Plus & Business dengan fitur tercanggih OpenAI termasuk GPT-4o, browsing, DALL-E, data analysis, dan voice mode. Aktivasi instan dan bergaransi penuh.",
        "display_order": 4,
        "is_featured": True,
        "sections": json.dumps(["promo", "terlaris"]),
        "rating": "5.0",
        "badge_label": "🔥 Promo",
        "match": lambda t: "chatgpt" in t or "chat gpt" in t or "plus plan" in t or "openai" in t,
    },
    {
        "id": "card-alight-motion",
        "name": "Alight Motion",
        "slug": "alight-motion",
        "category_id": "cat-apps-streaming",
        "category_name": "Apps & Streaming",
        "logo_url": "/images/brand/Alightmotion-logo.png",
        "description": "Alight Motion Pro untuk motion design, visual effects, animasi grafik, dan export tanpa watermark.",
        "display_order": 5,
        "is_featured": False,
        "sections": json.dumps(["terbaru"]),
        "rating": "4.8",
        "badge_label": "Baru",
        "match": lambda t: "alight" in t or "motion" in t,
    },
    {
        "id": "card-youtube",
        "name": "YouTube",
        "slug": "youtube",
        "category_id": "cat-apps-streaming",
        "category_name": "Apps & Streaming",
        "logo_url": "/images/brand/Youtube-logo.png",
        "description": "YouTube Premium resmi bebas iklan, putar di latar belakang, download video offline, dan YouTube Music Premium.",
        "display_order": 6,
        "is_featured": True,
        "sections": json.dumps(["promo", "terlaris"]),
        "rating": "5.0",
        "badge_label": "🔥 Promo",
        "match": lambda t: "youtube" in t or "ytprem" in t,
    },
    {
        "id": "card-spotify",
        "name": "Spotify",
        "slug": "spotify",
        "category_id": "cat-apps-streaming",
        "category_name": "Apps & Streaming",
        "logo_url": "/images/brand/Spotify-logo.png",
        "description": "Spotify Premium resmi bebas iklan, kualitas audio lossless, skip tanpa batas, dan download lagu offline.",
        "display_order": 7,
        "is_featured": True,
        "sections": json.dumps(["terlaris"]),
        "rating": "5.0",
        "badge_label": "Terlaris",
        "match": lambda t: "spotify" in t or "spy" in t,
    },
    {
        "id": "card-netflix",
        "name": "Netflix",
        "slug": "netflix",
        "category_id": "cat-apps-streaming",
        "category_name": "Apps & Streaming",
        "logo_url": "/images/brand/Netflix-logo.png",
        "description": "Netflix Premium Ultra HD 4K resmi. Streaming film dan serial terbaik dunia tanpa gangguan.",
        "display_order": 8,
        "is_featured": True,
        "sections": json.dumps(["promo", "terlaris"]),
        "rating": "5.0",
        "badge_label": "🔥 Promo",
        "match": lambda t: "netflix" in t or "ntflx" in t,
    },
    {
        "id": "card-vidio",
        "name": "Vidio",
        "slug": "vidio",
        "category_id": "cat-apps-streaming",
        "category_name": "Apps & Streaming",
        "logo_url": "/images/apps/vidio.png",
        "description": "Vidio Premier Platinum resmi. Nonton siaran langsung olahraga, Premier League, BRI Liga 1, dan original series.",
        "display_order": 9,
        "is_featured": True,
        "sections": json.dumps(["terlaris"]),
        "rating": "4.9",
        "badge_label": "Terlaris",
        "match": lambda t: "vidio" in t,
    },
    {
        "id": "card-wetv",
        "name": "WeTV",
        "slug": "wetv",
        "category_id": "cat-apps-streaming",
        "category_name": "Apps & Streaming",
        "logo_url": "/images/apps/wetv.png",
        "description": "WeTV VIP resmi nonton drama Asia, anime, dan serial favorit lebih awal tanpa jeda iklan.",
        "display_order": 10,
        "is_featured": False,
        "sections": json.dumps(["terbaru"]),
        "rating": "4.8",
        "badge_label": "Baru",
        "match": lambda t: "wetv" in t,
    },
    {
        "id": "card-iqiyi",
        "name": "iQIYI",
        "slug": "iqiyi",
        "category_id": "cat-apps-streaming",
        "category_name": "Apps & Streaming",
        "logo_url": "/images/brand/iqiyi-logo.png",
        "description": "iQIYI Standard & Premium VIP resmi nonton drama China, anime, dan variety show dalam kualitas 1080p & 4K.",
        "display_order": 11,
        "is_featured": False,
        "sections": json.dumps(["promo", "terbaru"]),
        "rating": "4.8",
        "badge_label": "🔥 Promo",
        "match": lambda t: "iqiyi" in t,
    },
    {
        "id": "card-bstation",
        "name": "Bstation",
        "slug": "bstation",
        "category_id": "cat-apps-streaming",
        "category_name": "Apps & Streaming",
        "logo_url": "/images/brand/BStation-logo.png",
        "description": "Bstation (Bilibili) Premium resmi akses ratusan anime legal berkualitas tinggi, audio Dolby, dan streaming tanpa jeda.",
        "display_order": 12,
        "is_featured": False,
        "sections": json.dumps(["terbaru"]),
        "rating": "4.8",
        "badge_label": "Baru",
        "match": lambda t: "bstation" in t or "bilibili" in t or "bsprem" in t,
    },
    {
        "id": "card-viu",
        "name": "Viu",
        "slug": "viu",
        "category_id": "cat-apps-streaming",
        "category_name": "Apps & Streaming",
        "logo_url": "/images/apps/viu.png",
        "description": "Viu Premium resmi nonton drama Korea terlengkap, drama Asia, dan Viu Originals tanpa iklan.",
        "display_order": 13,
        "is_featured": True,
        "sections": json.dumps(["terlaris", "terbaru"]),
        "rating": "4.9",
        "badge_label": "Terlaris",
        "match": lambda t: "viu" in t,
    },
    {
        "id": "card-mobile-legends",
        "name": "Mobile Legends",
        "slug": "mobile-legends",
        "category_id": "cat-games",
        "category_name": "Top Up Game",
        "logo_url": "/images/brand/Mobilelegends-logo.png",
        "description": "Top Up Diamond Mobile Legends resmi, fast process 1-5 menit, aman dan legal 100%.",
        "display_order": 14,
        "is_featured": True,
        "sections": json.dumps(["promo", "terlaris"]),
        "rating": "5.0",
        "badge_label": "🔥 Promo",
        "match": lambda t: "mobile legend" in t or "mlbb" in t or "diamond" in t,
    },
    {
        "id": "card-pubg-mobile",
        "name": "PUBG Mobile",
        "slug": "pubg-mobile",
        "category_id": "cat-games",
        "category_name": "Top Up Game",
        "logo_url": "/images/brand/Pubg-logo.png",
        "description": "Top Up UC PUBG Mobile resmi langsung masuk akun. Harga termurah dan bergaransi.",
        "display_order": 15,
        "is_featured": True,
        "sections": json.dumps(["promo", "terlaris"]),
        "rating": "5.0",
        "badge_label": "🔥 Promo",
        "match": lambda t: "pubg" in t or "uc pubg" in t,
    },
]

def seed_data():
    db = SessionLocal()
    try:
        # 1. Load active catalog JSON backup
        catalog_path = pathlib.Path(__file__).resolve().parent.parent.parent / "data" / "active-catalog.json"
        if not catalog_path.exists():
            catalog_path = pathlib.Path("backend/data/active-catalog.json")

        catalogs_data = []
        if catalog_path.exists():
            try:
                catalogs_data = json.loads(catalog_path.read_text(encoding="utf-8"))
                print(f"[Seed] Loaded {len(catalogs_data)} items from active-catalog.json")
            except Exception as e:
                print(f"[Seed] Error reading active-catalog.json: {e}")

        # 2. Upsert Products (Katalog) into database
        existing_products = {p.id: p for p in db.query(Product).all()}
        inserted_prods = 0
        updated_prods = 0

        for item in catalogs_data:
            p_id = item.get("id") or item.get("sku") or item.get("providerCode")
            if not p_id:
                continue

            name = item.get("name") or "Produk Digital"
            cat = item.get("category")
            if isinstance(cat, dict):
                c_id = cat.get("id", "cat-digital")
                c_name = cat.get("name", "Layanan Digital")
            else:
                c_id = item.get("categoryId") or "cat-digital"
                c_name = item.get("categoryName") or "Layanan Digital"

            price = int(item.get("price") or 0)
            pf = item.get("priceFormatted") or f"Rp {price:,.0f}".replace(",", ".")
            brand = item.get("brand") or "Digital"
            status = item.get("status") or "active"
            stock = int(item.get("stock") if item.get("stock") is not None else 100)
            img = item.get("imageUrl") or "/images/default-product-banner.png"

            if p_id not in existing_products:
                prod = Product(
                    id=p_id,
                    name=name,
                    category_id=c_id,
                    category_name=c_name,
                    brand=brand,
                    price=price,
                    price_formatted=pf,
                    description=item.get("description") or "",
                    features=item.get("features") or [],
                    status=status,
                    stock=stock,
                    image_url=img,
                    popular=bool(item.get("popular", False)),
                    provider=item.get("provider", "vip-reseller"),
                    provider_code=item.get("providerCode") or item.get("provider_code") or p_id,
                    provider_name=item.get("providerName") or name,
                    provider_price=item.get("providerPrice"),
                    provider_status=item.get("providerStatus", "available"),
                    profit_margin=item.get("profitMargin"),
                    profit_percentage=item.get("profitPercentage"),
                    guarantee_title=item.get("guaranteeTitle", "Garansi Penuh"),
                    guarantee_desc=item.get("guaranteeDesc", "Jaminan ganti akun 100%"),
                    process_title=item.get("processTitle", "Proses Instan"),
                    process_desc=item.get("processDesc", "1 - 15 menit selesai"),
                    privacy_title=item.get("privacyTitle", "Akun Private"),
                    privacy_desc=item.get("privacyDesc", "Ruang kerja aman & personal"),
                )
                db.add(prod)
                existing_products[p_id] = prod
                inserted_prods += 1
            else:
                prod = existing_products[p_id]
                prod.name = name
                prod.price = price
                prod.price_formatted = pf
                prod.stock = stock
                prod.status = status
                prod.image_url = img
                updated_prods += 1

        db.commit()
        print(f"[Seed] Products in DB: {len(existing_products)} (Inserted: {inserted_prods}, Updated: {updated_prods})")

        # 3. Upsert Initial Card Produk
        existing_cards = {c.id: c for c in db.query(ProductCard).all()}
        card_inserted = 0

        for card_def in INITIAL_CARDS:
            c_id = card_def["id"]
            if c_id not in existing_cards:
                new_card = ProductCard(
                    id=c_id,
                    name=card_def["name"],
                    slug=card_def["slug"],
                    logo_url=card_def["logo_url"],
                    description=card_def["description"],
                    category_id=card_def["category_id"],
                    category_name=card_def["category_name"],
                    status="active",
                    display_order=card_def["display_order"],
                    is_featured=card_def["is_featured"],
                    sections=card_def["sections"],
                    rating=card_def["rating"],
                    badge_label=card_def["badge_label"],
                )
                db.add(new_card)
                existing_cards[c_id] = new_card
                card_inserted += 1
            else:
                card = existing_cards[c_id]
                card.name = card_def["name"]
                card.slug = card_def["slug"]
                card.logo_url = card_def["logo_url"]
                card.description = card_def["description"]
                card.category_id = card_def["category_id"]
                card.category_name = card_def["category_name"]
                card.display_order = card_def["display_order"]
                card.is_featured = card_def["is_featured"]
                card.sections = card_def["sections"]
                card.badge_label = card_def["badge_label"]

        db.commit()
        print(f"[Seed] ProductCards seeded: {len(existing_cards)} (New: {card_inserted})")

        # 4. Link Catalogs to their respective Card Produk
        all_prods = db.query(Product).all()
        linked_count = 0

        for prod in all_prods:
            p_text = f"{prod.name} {prod.id} {prod.provider_code or ''} {prod.brand or ''}".lower()
            matched_card_id = None
            for card_def in INITIAL_CARDS:
                if card_def["match"](p_text):
                    matched_card_id = card_def["id"]
                    break

            if matched_card_id:
                prod.card_id = matched_card_id
                linked_count += 1

        db.commit()
        print(f"[Seed] Successfully linked {linked_count} / {len(all_prods)} catalogs to Card Produk!")

        # 5. Populate Dynamic Attributes for each Card Produk
        # Default attribute names: 'Paket / Nominal', 'Tipe Akun', 'Durasi Masa Aktif', 'Proteksi Garansi'
        all_cards = db.query(ProductCard).all()
        attr_count = 0
        for card in all_cards:
            existing_attrs = {a.name: a for a in db.query(ProductAttribute).filter_by(card_id=card.id).all()}
            default_attrs = [
                {"name": "Paket / Nominal", "order": 1, "req": True},
                {"name": "Tipe Akun", "order": 2, "req": True},
                {"name": "Durasi Masa Aktif", "order": 3, "req": True},
                {"name": "Proteksi Garansi", "order": 4, "req": False},
            ]
            for da in default_attrs:
                if da["name"] not in existing_attrs:
                    db.add(ProductAttribute(
                        id=f"attr-{card.id}-{da['order']}",
                        card_id=card.id,
                        name=da["name"],
                        display_order=da["order"],
                        is_required=da["req"],
                        is_active=True,
                        options=json.dumps([]),
                    ))
                    attr_count += 1
        db.commit()
        print(f"[Seed] Added {attr_count} default attributes across cards.")

    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
