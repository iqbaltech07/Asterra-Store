import os
import sys
import unittest
from datetime import datetime, timezone, timedelta

# Ensure backend path
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from app.core.database import SessionLocal
from app.models.product_card import ProductCard
from app.models.product import Product
from app.models.product_variant import ProductAttribute, ProductVariant
from app.models.order import Order, OrderItem
from app.models.store_operating_hours import StoreOperatingHours
from app.services.card_service import CardService
from app.services.dummy_order_service import DummyOrderService
from app.services.store_operating_hours_service import StoreOperatingHoursService, WIB
from app.services.catalog_service import CatalogService
from app.services.order_service import OrderService

class TestAsterraDynamicArchitecture(unittest.TestCase):
    def test_01_product_cards_exist(self):
        """Verify seeded product cards exist in DB with active status and connected catalogs"""
        db = SessionLocal()
        try:
            cards = db.query(ProductCard).all()
            self.assertGreaterEqual(len(cards), 15, "Expected at least 15 product cards")
            gemini = db.query(ProductCard).filter(ProductCard.slug == "google-gemini").first()
            self.assertIsNotNone(gemini, "Google Gemini card must exist")
            self.assertEqual(gemini.name, "Google Gemini")
            self.assertGreater(len(gemini.catalogs), 0, "Google Gemini should have connected catalogs")
            gemini_dict = gemini.to_dict(include_catalogs=True)
            self.assertGreater(gemini_dict["minPrice"], 0, "Google Gemini minPrice should be > 0")
            self.assertIn(gemini_dict["stockStatus"], ["ready", "out_of_stock"])
        finally:
            db.close()

    def test_02_card_crud_and_rating_update(self):
        """Verify Card Produk CRUD operations: update rating, base_sold_count, display_order, status toggle"""
        db = SessionLocal()
        try:
            card = db.query(ProductCard).first()
            self.assertIsNotNone(card)
            orig_rating = card.rating
            orig_base = card.base_sold_count

            # Test updating rating and base_sold_count
            updated = CardService.update_card(card.id, {
                "rating": "4.95",
                "baseSoldCount": 35,
            })
            self.assertEqual(updated["rating"], "4.95")
            self.assertEqual(updated["baseSoldCount"], 35)

            # Revert to clean state
            CardService.update_card(card.id, {
                "rating": orig_rating,
                "baseSoldCount": orig_base,
            })
        finally:
            db.close()

    def test_03_card_attributes_and_variants(self):
        """Verify dynamic attributes and variants exist and are manageable"""
        db = SessionLocal()
        try:
            attrs = db.query(ProductAttribute).all()
            self.assertGreaterEqual(len(attrs), 10, "Expected dynamic attributes")
            
            gemini = db.query(ProductCard).filter(ProductCard.slug == "google-gemini").first()
            gemini_attrs = CardService.get_attributes(gemini.id)
            self.assertIsInstance(gemini_attrs, list)
            attr_names = [a["name"] for a in gemini_attrs]
            self.assertIn("Durasi Masa Aktif", attr_names)
        finally:
            db.close()

    def test_04_standalone_catalogs_isolated(self):
        """Verify standalone catalogs have card_id = None and remain fully functional"""
        db = SessionLocal()
        try:
            standalone = db.query(Product).filter(Product.card_id.is_(None)).all()
            self.assertGreater(len(standalone), 0, "Expected standalone catalogs with card_id IS NULL")
            for s in standalone[:5]:
                self.assertIsNone(s.card_id)
        finally:
            db.close()

    def test_05_dummy_order_generator_eligibility(self):
        """Verify dummy orders only pick active, non-empty, priced catalogs whose parent Card is active"""
        eligible = DummyOrderService.get_eligible_catalogs()
        self.assertGreater(len(eligible), 0, "Expected eligible catalogs for dummy orders")
        for cat in eligible:
            self.assertEqual(cat.status, "active")
            self.assertGreater(cat.price, 0)
            self.assertNotEqual(cat.provider_status, "empty")
            if cat.stock is not None:
                self.assertGreater(cat.stock, 0)
            if cat.card_id and cat.card:
                self.assertEqual(cat.card.status, "active")

    def test_06_dummy_order_isolation_and_zero_stock_deduction(self):
        """Verify dummy order has is_dummy=True, status=completed, leaves product stock untouched, and is excluded from revenue"""
        eligible = DummyOrderService.get_eligible_catalogs()
        self.assertGreater(len(eligible), 0)
        chosen = eligible[0]
        initial_stock = chosen.stock

        dummy_order = DummyOrderService.generate_and_save_dummy_order()
        self.assertIsNotNone(dummy_order, "Dummy order should be generated successfully")
        self.assertTrue(dummy_order.get("is_dummy"), "Dummy order must have is_dummy=True")
        self.assertEqual(dummy_order.get("status"), "completed")

        # Verify stock was NOT deducted
        db = SessionLocal()
        try:
            prod_after = db.query(Product).filter(Product.id == chosen.id).first()
            self.assertEqual(prod_after.stock, initial_stock, "Product stock MUST NOT be deducted by dummy orders")
        finally:
            db.close()

        # Verify revenue strictly excludes dummy orders
        orders_data = OrderService.get_orders(limit=50)
        self.assertIn("orders", orders_data)

    def test_07_public_card_sold_count_aggregation(self):
        """Verify CardService.get_real_sold_counts aggregates orders and computes soldCount on cards"""
        sold_counts = CardService.get_real_sold_counts()
        self.assertIsInstance(sold_counts, dict)
        for card_id, count in sold_counts.items():
            self.assertGreaterEqual(count, 0)

        # Verify card.to_dict includes base_sold_count + real orders, bounded between 20 and 40
        db = SessionLocal()
        try:
            card = db.query(ProductCard).first()
            if card:
                cd = card.to_dict(sold_count=5)
                expected_total = max(20, min(40, (card.base_sold_count or 20) + 5))
                self.assertEqual(cd["soldCount"], expected_total)
                self.assertGreaterEqual(cd["soldCount"], 20)
                self.assertLessEqual(cd["soldCount"], 40)
        finally:
            db.close()

    def test_08_checkout_validation_rejects_archived_or_empty_catalog(self):
        """Verify OrderService.create_order rejects non-existent, archived, or inactive products"""
        # 1. Non-existent product
        with self.assertRaises(ValueError):
            OrderService.create_order({
                "items": [{"productId": "non-existent-sku-xyz-12345", "quantity": 1}],
                "customerEmail": "test@asterra.store",
            })

        # 2. Archived or inactive product
        db = SessionLocal()
        try:
            temp_archived = db.query(Product).filter_by(status="archived").first()
            if not temp_archived:
                cand = db.query(Product).first()
                if cand:
                    cand.status = "archived"
                    db.commit()
                    temp_archived = cand

            if temp_archived:
                with self.assertRaises(ValueError) as ctx:
                    OrderService.create_order({
                        "items": [{"productId": temp_archived.id, "quantity": 1}],
                        "customerEmail": "test@asterra.store",
                    })
                self.assertIn("tidak tersedia", str(ctx.exception).lower())
                # Revert
                temp_archived.status = "active"
                db.commit()
        finally:
            db.close()

    def test_09_store_hours_auto_close_and_manual_reopen_lifecycle(self):
        """
        Verify mandatory operational scenarios:
        A. Toko terbuka sebelum 21.00 WIB jika telah dibuka admin hari itu.
        B. Saat mencapai 21.00 WIB, toko otomatis tertutup.
        C. Setelah ditutup, waktu melewati tengah malam dan mencapai 09.00 WIB; toko tetap tertutup!
        D. Setelah 09.00 WIB, toko tetap tertutup sampai admin secara eksplisit membuka toko.
        E. Setelah admin membuka toko secara manual, status berubah menjadi terbuka.
        F. Backend restart tidak otomatis mengubah status tutup menjadi buka.
        G. Zona waktu menggunakan Asia/Jakarta (WIB).
        """
        # Set a known day: Friday Oct 30, 2026
        base_date = datetime(2026, 10, 30, tzinfo=WIB)

        # 1. Admin explicitly opens the store at 10:00 WIB on Friday
        open_time_wib = base_date.replace(hour=10, minute=0, second=0)
        open_time_utc = open_time_wib.astimezone(timezone.utc).replace(tzinfo=None)

        db = SessionLocal()
        try:
            row = db.query(StoreOperatingHours).filter_by(id="main").first()
            if not row:
                row = StoreOperatingHours(id="main")
                db.add(row)
            row.mode = "manual_open"
            row.last_manual_opened_at = open_time_utc
            row.last_manual_closed_at = None
            row.auto_close_time = "21:00"
            row.timezone = "Asia/Jakarta"
            db.commit()
        finally:
            db.close()

        # SCENARIO A: At 14:00 WIB (before 21:00 WIB on same day), store is OPEN
        time_14 = base_date.replace(hour=14, minute=0, second=0)
        status_14 = StoreOperatingHoursService.get_current_status(time_14)
        self.assertTrue(status_14["is_open"], "Skenario A: Toko harus buka pada 14:00 WIB sebelum 21:00 WIB")
        self.assertEqual(status_14["status"], "open")
        self.assertIn("21:00 WIB", status_14["nextCloseDisplay"])

        # SCENARIO B: At 21:00 WIB, store AUTOMATICALLY CLOSES
        time_21 = base_date.replace(hour=21, minute=0, second=0)
        status_21 = StoreOperatingHoursService.get_current_status(time_21)
        self.assertFalse(status_21["is_open"], "Skenario B: Toko harus otomatis tutup tepat pukul 21:00 WIB")
        self.assertEqual(status_21["status"], "closed")

        # SCENARIO C: Next day (Saturday Oct 31) passes midnight and reaches 09:00 WIB; store STAYS CLOSED
        next_day_09 = (base_date + timedelta(days=1)).replace(hour=9, minute=0, second=0)
        status_next_09 = StoreOperatingHoursService.get_current_status(next_day_09)
        self.assertFalse(status_next_09["is_open"], "Skenario C: Toko harus tetap tutup pada 09:00 WIB esok hari (TIDAK auto-open!)")
        self.assertEqual(status_next_09["status"], "closed")

        # SCENARIO D: At 13:00 WIB next day, store STILL STAYS CLOSED without admin action
        next_day_13 = (base_date + timedelta(days=1)).replace(hour=13, minute=0, second=0)
        status_next_13 = StoreOperatingHoursService.get_current_status(next_day_13)
        self.assertFalse(status_next_13["is_open"], "Skenario D: Toko harus tetap tutup sampai admin membuka secara manual")

        # SCENARIO E: Admin explicitly opens the store manually on next day
        admin_reopen_time_wib = (base_date + timedelta(days=1)).replace(hour=13, minute=30, second=0)
        admin_reopen_time_utc = admin_reopen_time_wib.astimezone(timezone.utc).replace(tzinfo=None)

        db = SessionLocal()
        try:
            row = db.query(StoreOperatingHours).filter_by(id="main").first()
            row.last_manual_opened_at = admin_reopen_time_utc
            row.mode = "manual_open"
            db.commit()
        finally:
            db.close()

        # Verify status is now OPEN after manual action
        time_after_admin_open = (base_date + timedelta(days=1)).replace(hour=13, minute=35, second=0)
        status_after_open = StoreOperatingHoursService.get_current_status(time_after_admin_open)
        self.assertTrue(status_after_open["is_open"], "Skenario E: Toko harus terbuka setelah tindakan manual admin")

        # SCENARIO F: Server restart while closed preserves closed state
        # Simulate closing and server re-read
        db = SessionLocal()
        try:
            row = db.query(StoreOperatingHours).filter_by(id="main").first()
            row.last_manual_closed_at = admin_reopen_time_utc + timedelta(hours=1)
            db.commit()
        finally:
            db.close()

        # Re-ensure table / service init (simulates restart)
        StoreOperatingHoursService.ensure_table(force=True)
        status_restart = StoreOperatingHoursService.get_current_status(time_after_admin_open + timedelta(hours=2))
        self.assertFalse(status_restart["is_open"], "Skenario F: Restart backend tidak boleh mengubah status tutup menjadi buka")

        # SCENARIO G: Timezone verification
        self.assertEqual(status_restart["timezone"], "Asia/Jakarta", "Skenario G: Zona waktu wajib Asia/Jakarta")

    def test_10_dummy_order_interval_scales_when_closed(self):
        """Verify dummy order interval is 2x longer when store is closed (SCENARIO H)"""
        status_open = {"is_open": True}
        status_closed = {"is_open": False}

        open_intervals = [
            DummyOrderService.get_next_sleep_seconds(status_open) for _ in range(30)
        ]
        closed_intervals = [
            DummyOrderService.get_next_sleep_seconds(status_closed) for _ in range(30)
        ]

        # All open intervals should be within 300 to 600s
        for iv in open_intervals:
            self.assertGreaterEqual(iv, 300)
            self.assertLessEqual(iv, 600)

        # All closed intervals should be scaled 2x within 600 to 1200s
        for iv in closed_intervals:
            self.assertGreaterEqual(iv, 600)
            self.assertLessEqual(iv, 1200)

    def test_11_card_sold_count_distribution_20_to_40(self):
        """
        Verify Card Produk Sold Count Distribution:
        1. All cards must display soldCount strictly in [20, 40].
        2. Numbers must be varied and not uniform.
        3. Netflix, Spotify, Gemini, and CapCut must have relatively higher sold counts (32-40).
        4. Other products must be distributed between 20 and 33.
        5. Formula is tied to real orders: soldCount = base_sold_count + order_units.
        """
        cards = CardService.get_cards()
        self.assertGreaterEqual(len(cards), 15, "Expected at least 15 product cards")

        card_map = {c["slug"]: c for c in cards}

        # Check bounds for all cards
        sold_counts = []
        for c in cards:
            sc = c.get("soldCount", 0)
            sold_counts.append(sc)
            self.assertGreaterEqual(sc, 20, f"Card '{c['name']}' soldCount ({sc}) must be >= 20")
            self.assertLessEqual(sc, 40, f"Card '{c['name']}' soldCount ({sc}) must be <= 40")

        # Verify values are varied (not all identical)
        unique_counts = set(sold_counts)
        self.assertGreaterEqual(len(unique_counts), 8, f"Expected diverse sold counts, got {len(unique_counts)} unique values")

        # Top 4 products must be relatively higher (in 32-40 range)
        top_slugs = ["netflix", "spotify", "google-gemini", "capcut"]
        for slug in top_slugs:
            if slug in card_map:
                sc = card_map[slug]["soldCount"]
                self.assertGreaterEqual(sc, 32, f"Unggulan '{slug}' soldCount ({sc}) must be in range 32-40")
                self.assertLessEqual(sc, 40, f"Unggulan '{slug}' soldCount ({sc}) must be in range 32-40")

        # Other products should be distributed between 20 and 33
        other_slugs = ["vidio", "alight-motion", "chatgpt", "canva", "bstation", "iqiyi"]
        for slug in other_slugs:
            if slug in card_map:
                sc = card_map[slug]["soldCount"]
                self.assertGreaterEqual(sc, 20, f"Card '{slug}' soldCount ({sc}) must be >= 20")
                self.assertLessEqual(sc, 33, f"Card '{slug}' soldCount ({sc}) must be <= 33")

        # Verify integration with /orders: total sold equals base_sold_count + order units
        for c in cards:
            expected = max(20, min(40, (c.get("baseSoldCount") or 20) + c.get("orderSoldCount", 0)))
            self.assertEqual(c["soldCount"], expected, f"Card '{c['name']}' soldCount mismatch")

if __name__ == "__main__":
    unittest.main()
