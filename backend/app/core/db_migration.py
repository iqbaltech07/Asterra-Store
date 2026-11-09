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

        # 10. Calibrate and reset base_sold_count on product_cards:
        # - Priority products with special fixed baseline: Netflix (31), YouTube (26), Spotify (21), Apple Music (20), ChatGPT (18), CapCut (16)
        # - Produk Terbaru: strictly between 10 and 14
        # - Produk lainnya: strictly between 12 and 17 (never below 12)
        """
        UPDATE product_cards SET base_sold_count = CASE
            -- Produk prioritas khusus
            WHEN slug = 'netflix' OR id = 'card-netflix' THEN 31
            WHEN slug = 'youtube' OR id = 'card-youtube' THEN 26
            WHEN slug = 'spotify' OR id = 'card-spotify' THEN 21
            WHEN slug = 'apple-music' OR id = 'card-apple-music' THEN 20
            WHEN slug = 'chatgpt' OR id = 'card-chatgpt' THEN 18
            WHEN slug = 'capcut' OR id = 'card-capcut' THEN 16
            -- Produk Terbaru (strictly 10-14)
            WHEN slug = 'google-gemini' OR id = 'card-google-gemini' THEN 14
            WHEN slug = 'iqiyi' OR id = 'card-iqiyi' THEN 13
            WHEN slug = 'viu' OR id = 'card-viu' THEN 13
            WHEN slug = 'duolingo' OR id = 'card-duolingo' THEN 12
            WHEN slug = 'getcontact' OR id = 'card-getcontact' THEN 12
            WHEN slug = 'zoom' OR id = 'card-zoom' THEN 12
            WHEN slug = 'alight-motion' OR id = 'card-alight-motion' THEN 11
            WHEN slug = 'wetv' OR id = 'card-wetv' THEN 11
            WHEN slug = 'wink' OR id = 'card-wink' THEN 11
            WHEN slug = 'bstation' OR id = 'card-bstation' THEN 10
            WHEN slug = 'meitu' OR id = 'card-meitu' THEN 10
            WHEN slug = 'loklok' OR id = 'card-loklok' THEN 10
            -- Produk Lainnya (strictly 12-17, never below 12)
            WHEN slug = 'canva' OR id = 'card-canva' THEN 17
            WHEN slug = 'vidio' OR id = 'card-vidio' THEN 16
            WHEN slug = 'camscanner' OR id = 'card-camscanner' THEN 16
            WHEN slug = 'picsart' OR id = 'card-picsart' THEN 17
            WHEN slug = 'remini' OR id = 'card-remini' THEN 15
            WHEN slug = 'mobile-legends' OR id = 'card-mobile-legends' THEN 15
            WHEN slug = 'disney-hotstar' OR id = 'card-disney-hotstar' THEN 15
            WHEN slug = 'pubg-mobile' OR id = 'card-pubg-mobile' THEN 14
            WHEN slug = 'vision-plus' OR id = 'card-vision-plus' THEN 14
            WHEN slug = 'icloud' OR id = 'card-icloud' THEN 14
            WHEN slug = 'vsco' OR id = 'card-vsco' THEN 14
            WHEN slug = 'strava' OR id = 'card-strava' THEN 13
            ELSE 12 + (ABS(HASHTEXT(COALESCE(slug, id, 'other'))) % 6)
        END;
        """,

        # 10b. Clean old simulated test dummy orders so sold counts reset cleanly to the new baseline
        """
        DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE is_dummy = true);
        DELETE FROM orders WHERE is_dummy = true;
        """,

        # 11. DANA Payment Events table for Asterra Payment Listener
        """
        CREATE TABLE IF NOT EXISTS dana_payment_events (
            id VARCHAR(100) PRIMARY KEY,
            event_id VARCHAR(100) UNIQUE NOT NULL,
            device_id VARCHAR(100) NOT NULL,
            amount NUMERIC(15, 2) NOT NULL,
            currency VARCHAR(10) DEFAULT 'IDR' NOT NULL,
            transaction_time TIMESTAMP WITH TIME ZONE NOT NULL,
            source VARCHAR(50) DEFAULT 'dana_business' NOT NULL,
            raw_reference VARCHAR(255),
            status VARCHAR(50) DEFAULT 'DETECTED' NOT NULL,
            matched_order_id VARCHAR(100),
            verified_by_admin_id VARCHAR(100),
            verified_at TIMESTAMP WITHOUT TIME ZONE,
            notes TEXT,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc'),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc')
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_dana_payment_events_event_id ON dana_payment_events(event_id);",
        "CREATE INDEX IF NOT EXISTS idx_dana_payment_events_status ON dana_payment_events(status);",
        "CREATE INDEX IF NOT EXISTS idx_dana_payment_events_device_id ON dana_payment_events(device_id);",
        "CREATE INDEX IF NOT EXISTS idx_dana_payment_events_matched_order ON dana_payment_events(matched_order_id);",
        "CREATE INDEX IF NOT EXISTS idx_dana_payment_events_tx_time ON dana_payment_events(transaction_time);",

        # 12. Sales Gamification Configs table
        """
        CREATE TABLE IF NOT EXISTS sales_gamification_configs (
            id VARCHAR(50) PRIMARY KEY,
            is_enabled BOOLEAN DEFAULT TRUE NOT NULL,
            daily_target_amount INTEGER DEFAULT 25000 NOT NULL,
            weekly_streak_days INTEGER DEFAULT 7 NOT NULL,
            weekly_bonus_percentage NUMERIC(5, 2) DEFAULT 10.00 NOT NULL,
            timezone VARCHAR(50) DEFAULT 'Asia/Jakarta' NOT NULL,
            week_start_day VARCHAR(20) DEFAULT 'MONDAY' NOT NULL,
            product_suggestion_enabled BOOLEAN DEFAULT TRUE NOT NULL,
            auto_approve_weekly_bonus BOOLEAN DEFAULT TRUE NOT NULL,
            updated_by VARCHAR(100),
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc') NOT NULL
        );
        """,
        """
        INSERT INTO sales_gamification_configs (id, is_enabled, daily_target_amount, weekly_streak_days, weekly_bonus_percentage, timezone, week_start_day, product_suggestion_enabled, auto_approve_weekly_bonus)
        VALUES ('default', TRUE, 25000, 7, 10.00, 'Asia/Jakarta', 'MONDAY', TRUE, TRUE)
        ON CONFLICT (id) DO NOTHING;
        """,

        # 13. Sales Daily Gamification table
        """
        CREATE TABLE IF NOT EXISTS sales_daily_gamification (
            id VARCHAR(100) PRIMARY KEY,
            sales_id VARCHAR(100) NOT NULL REFERENCES sales_partners(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            target_amount INTEGER DEFAULT 25000 NOT NULL,
            accumulated_commission INTEGER DEFAULT 0 NOT NULL,
            estimated_pending_commission INTEGER DEFAULT 0 NOT NULL,
            eligible_orders_count INTEGER DEFAULT 0 NOT NULL,
            status VARCHAR(30) DEFAULT 'NOT_STARTED' NOT NULL,
            completed_at TIMESTAMP WITHOUT TIME ZONE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc') NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc') NOT NULL,
            CONSTRAINT uq_sales_daily_gamification_sales_date UNIQUE(sales_id, date)
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_sales_daily_gamification_sales_id ON sales_daily_gamification(sales_id);",
        "CREATE INDEX IF NOT EXISTS idx_sales_daily_gamification_date ON sales_daily_gamification(date);",
        "CREATE INDEX IF NOT EXISTS idx_sales_daily_gamification_status ON sales_daily_gamification(status);",

        # 14. Sales Weekly Gamification table
        """
        CREATE TABLE IF NOT EXISTS sales_weekly_gamification (
            id VARCHAR(100) PRIMARY KEY,
            sales_id VARCHAR(100) NOT NULL REFERENCES sales_partners(id) ON DELETE CASCADE,
            week_start DATE NOT NULL,
            week_end DATE NOT NULL,
            completed_days INTEGER DEFAULT 0 NOT NULL,
            total_commission INTEGER DEFAULT 0 NOT NULL,
            bonus_percentage NUMERIC(5, 2) DEFAULT 10.00 NOT NULL,
            bonus_amount INTEGER DEFAULT 0 NOT NULL,
            status VARCHAR(30) DEFAULT 'IN_PROGRESS' NOT NULL,
            bonus_paid_at TIMESTAMP WITHOUT TIME ZONE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc') NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc') NOT NULL,
            CONSTRAINT uq_sales_weekly_gamification_sales_week UNIQUE(sales_id, week_start)
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_sales_weekly_gamification_sales_id ON sales_weekly_gamification(sales_id);",
        "CREATE INDEX IF NOT EXISTS idx_sales_weekly_gamification_week_start ON sales_weekly_gamification(week_start);",
        "CREATE INDEX IF NOT EXISTS idx_sales_weekly_gamification_status ON sales_weekly_gamification(status);",

        # 15. Sales Gamification Bonus Ledger table
        """
        CREATE TABLE IF NOT EXISTS sales_gamification_bonus_ledger (
            id VARCHAR(100) PRIMARY KEY,
            sales_id VARCHAR(100) NOT NULL REFERENCES sales_partners(id) ON DELETE CASCADE,
            weekly_gamification_id VARCHAR(100) NOT NULL REFERENCES sales_weekly_gamification(id) ON DELETE CASCADE,
            bonus_type VARCHAR(50) DEFAULT 'WEEKLY_STREAK' NOT NULL,
            base_commission INTEGER DEFAULT 0 NOT NULL,
            bonus_percentage NUMERIC(5, 2) DEFAULT 10.00 NOT NULL,
            bonus_amount INTEGER DEFAULT 0 NOT NULL,
            status VARCHAR(30) DEFAULT 'PENDING' NOT NULL,
            reversal_reason TEXT,
            approved_by VARCHAR(100),
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc') NOT NULL,
            approved_at TIMESTAMP WITHOUT TIME ZONE,
            paid_at TIMESTAMP WITHOUT TIME ZONE,
            CONSTRAINT uq_sales_gamification_bonus_weekly_type UNIQUE(weekly_gamification_id, bonus_type)
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_sales_gamification_bonus_sales_id ON sales_gamification_bonus_ledger(sales_id);",
        "CREATE INDEX IF NOT EXISTS idx_sales_gamification_bonus_status ON sales_gamification_bonus_ledger(status);",

        # 16. Sales Gamification Order Events table
        """
        CREATE TABLE IF NOT EXISTS sales_gamification_order_events (
            id VARCHAR(100) PRIMARY KEY,
            order_id VARCHAR(100) UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
            commission_id VARCHAR(100),
            sales_id VARCHAR(100) NOT NULL REFERENCES sales_partners(id) ON DELETE CASCADE,
            daily_gamification_id VARCHAR(100) REFERENCES sales_daily_gamification(id) ON DELETE SET NULL,
            wib_date DATE NOT NULL,
            direct_commission_amount INTEGER DEFAULT 0 NOT NULL,
            is_counted BOOLEAN DEFAULT FALSE NOT NULL,
            order_status VARCHAR(50) DEFAULT 'pending' NOT NULL,
            validated_at TIMESTAMP WITHOUT TIME ZONE,
            reversed_at TIMESTAMP WITHOUT TIME ZONE,
            created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc') NOT NULL,
            updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (NOW() AT TIME ZONE 'utc') NOT NULL
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_sales_gamification_events_order_id ON sales_gamification_order_events(order_id);",
        "CREATE INDEX IF NOT EXISTS idx_sales_gamification_events_sales_id ON sales_gamification_order_events(sales_id);",
        "CREATE INDEX IF NOT EXISTS idx_sales_gamification_events_daily_id ON sales_gamification_order_events(daily_gamification_id);",
        "CREATE INDEX IF NOT EXISTS idx_sales_gamification_events_wib_date ON sales_gamification_order_events(wib_date);",
        "CREATE INDEX IF NOT EXISTS idx_sales_gamification_events_is_counted ON sales_gamification_order_events(is_counted);",

        # 17. Dynamic Product Order Input & Checkout Fulfillment columns
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS input_type VARCHAR(50) DEFAULT 'email';",
        "ALTER TABLE products ADD COLUMN IF NOT EXISTS input_config TEXT;",
        "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS fulfillment_method VARCHAR(50);",
        "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS target_type VARCHAR(50);",
        "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS target_value TEXT;",
        "ALTER TABLE order_items ADD COLUMN IF NOT EXISTS input_config_snapshot TEXT;",

        # 18. Enforce Supabase Row-Level Security (RLS) on all public tables
        """
        DO $$
        DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = false) LOOP
                EXECUTE 'ALTER TABLE "' || r.tablename || '" ENABLE ROW LEVEL SECURITY;';
            END LOOP;
        END $$;
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
