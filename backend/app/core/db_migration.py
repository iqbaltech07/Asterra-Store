from sqlalchemy import text
from app.core.database import engine

def run_migrations():
    """
    Applies idempotent migrations to the Supabase PostgreSQL database
    supporting the separation of Product Cards, dynamic Catalog variants,
    dummy order tracking, calibrated card sold count, and store operating hours.
    """
    statements = [
        # 1. Product Cards table
        """
        CREATE TABLE IF NOT EXISTS product_cards (
            id VARCHAR(100) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            slug VARCHAR(255) UNIQUE NOT NULL,
            logo_url TEXT,
            description TEXT,
            category_id VARCHAR(100),
            category_name VARCHAR(150),
            status VARCHAR(50) DEFAULT 'active',
            display_order INTEGER DEFAULT 0,
            is_featured BOOLEAN DEFAULT FALSE,
            sections TEXT DEFAULT '["promo"]',
            rating VARCHAR(10) DEFAULT '5.0',
            badge_label VARCHAR(100),
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_product_cards_slug ON product_cards(slug);",
        "CREATE INDEX IF NOT EXISTS idx_product_cards_status ON product_cards(status);",

        # 2. Add card_id to products (katalog)
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS card_id VARCHAR(100) REFERENCES product_cards(id) ON DELETE SET NULL;",
        "CREATE INDEX IF NOT EXISTS idx_products_card_id ON products(card_id);",

        # 3. Product Attributes table
        """
        CREATE TABLE IF NOT EXISTS product_attributes (
            id VARCHAR(100) PRIMARY KEY,
            card_id VARCHAR(100) NOT NULL REFERENCES product_cards(id) ON DELETE CASCADE,
            name VARCHAR(150) NOT NULL,
            display_order INTEGER DEFAULT 0,
            is_required BOOLEAN DEFAULT TRUE,
            is_active BOOLEAN DEFAULT TRUE,
            options TEXT DEFAULT '[]',
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_product_attributes_card_id ON product_attributes(card_id);",

        # 4. Product Variants table
        """
        CREATE TABLE IF NOT EXISTS product_variants (
            id VARCHAR(100) PRIMARY KEY,
            card_id VARCHAR(100) NOT NULL REFERENCES product_cards(id) ON DELETE CASCADE,
            catalog_id VARCHAR(100) REFERENCES products(id) ON DELETE SET NULL,
            sku VARCHAR(100),
            combination TEXT DEFAULT '{}',
            price NUMERIC(15, 2) DEFAULT 0,
            price_formatted VARCHAR(100),
            stock INTEGER DEFAULT 100,
            status VARCHAR(50) DEFAULT 'active',
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_product_variants_card_id ON product_variants(card_id);",
        "CREATE INDEX IF NOT EXISTS idx_product_variants_catalog_id ON product_variants(catalog_id);",

        # 5. Add is_dummy to orders table
        "ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_dummy BOOLEAN DEFAULT FALSE;",
        "CREATE INDEX IF NOT EXISTS idx_orders_is_dummy ON orders(is_dummy);",

        # 6. Add operational hours fields
        "ALTER TABLE store_operating_hours ADD COLUMN IF NOT EXISTS auto_close_time VARCHAR(20) DEFAULT '21:00';",
        "ALTER TABLE store_operating_hours ADD COLUMN IF NOT EXISTS last_manual_opened_at TIMESTAMP WITHOUT TIME ZONE;",
        "ALTER TABLE store_operating_hours ADD COLUMN IF NOT EXISTS last_manual_closed_at TIMESTAMP WITHOUT TIME ZONE;",

        # 7. Add card_id to order_items for immutable historical sales association
        "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS card_id VARCHAR(100);",
        "CREATE INDEX IF NOT EXISTS idx_order_items_card_id ON order_items(card_id);",

        # 8. Add base_sold_count to product_cards
        "ALTER TABLE product_cards ADD COLUMN IF NOT EXISTS base_sold_count INTEGER DEFAULT 0 NOT NULL;",

        # 9. Backfill existing order_items.card_id from products.card_id
        """
        UPDATE order_items oi
        SET card_id = p.card_id
        FROM products p
        WHERE oi.product_id = p.id
          AND oi.card_id IS NULL
          AND p.card_id IS NOT NULL;
        """,

        # 10. Calibrate base_sold_count on product_cards for realistic 20-40 range distribution
        """
        UPDATE product_cards SET base_sold_count = CASE
            WHEN slug = 'netflix' THEN 38
            WHEN slug = 'spotify' THEN 37
            WHEN slug = 'google-gemini' THEN 34
            WHEN slug = 'capcut' THEN 34
            WHEN slug = 'youtube' THEN 32
            WHEN slug = 'mobile-legends' THEN 30
            WHEN slug = 'canva' THEN 29
            WHEN slug = 'wetv' THEN 27
            WHEN slug = 'viu' THEN 20
            WHEN slug = 'pubg-mobile' THEN 26
            WHEN slug = 'chatgpt' THEN 25
            WHEN slug = 'bstation' THEN 22
            WHEN slug = 'vidio' THEN 23
            WHEN slug = 'iqiyi' THEN 22
            WHEN slug = 'alight-motion' THEN 21
            ELSE 22
        END;
        """,
    ]

    try:
        with engine.begin() as conn:
            for stmt in statements:
                conn.execute(text(stmt.strip()))
        print("[Migration] All database schema migrations successfully applied.")
        return True
    except Exception as e:
        print(f"[Migration] Error executing migrations: {e}")
        return False

if __name__ == "__main__":
    run_migrations()
