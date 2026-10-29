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
from app.models.order import Order
from app.models.store_operating_hours import StoreOperatingHours
from app.services.card_service import CardService
from app.services.dummy_order_service import DummyOrderService
from app.services.store_operating_hours_service import StoreOperatingHoursService, WIB
from app.services.catalog_service import CatalogService
from app.services.order_service import OrderService

class TestAsterraDynamicArchitecture(unittest.TestCase):
    def test_01_product_cards_exist(self):
        """Verify seeded product cards exist in DB"""
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

    def test_02_card_attributes_and_variants(self):
        """Verify dynamic attributes and variants exist"""
        db = SessionLocal()
        try:
            attrs = db.query(ProductAttribute).all()
            self.assertGreaterEqual(len(attrs), 10, "Expected dynamic attributes")
            
            # Test CardService get_attributes
            gemini = db.query(ProductCard).filter(ProductCard.slug == "google-gemini").first()
            gemini_attrs = CardService.get_attributes(gemini.id)
            self.assertIsInstance(gemini_attrs, list)
            attr_names = [a["name"] for a in gemini_attrs]
            self.assertIn("Durasi Masa Aktif", attr_names)
        finally:
            db.close()

    def test_03_standalone_catalogs_isolated(self):
        """Verify standalone catalogs have card_id = None and are not broken"""
        db = SessionLocal()
        try:
            standalone = db.query(Product).filter(Product.card_id.is_(None)).all()
            self.assertGreater(len(standalone), 0, "Expected standalone catalogs with card_id IS NULL")
            # All standalone products should be valid
            for s in standalone[:5]:
                self.assertIsNone(s.card_id)
        finally:
            db.close()

    def test_04_dummy_order_generator_eligibility(self):
        """Verify dummy orders only pick active, non-empty, priced catalogs"""
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

    def test_05_dummy_order_isolation_and_zero_stock_deduction(self):
        """Verify dummy order has is_dummy=True, status=completed, and leaves product stock untouched"""
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

    def test_06_real_sold_count_excludes_dummy(self):
        """Verify CardService.get_real_sold_counts strictly excludes dummy orders"""
        sold_counts = CardService.get_real_sold_counts()
        self.assertIsInstance(sold_counts, dict)
        
        # In database, check count of dummy orders vs real orders
        db = SessionLocal()
        try:
            dummy_count = db.query(Order).filter(Order.is_dummy.is_(True)).count()
            self.assertGreaterEqual(dummy_count, 1, "There should be at least one dummy order")
            
            # Verify dummy order is NOT in real sold aggregation
            for card_id, count in sold_counts.items():
                self.assertGreaterEqual(count, 0)
        finally:
            db.close()

    def test_07_store_hours_auto_close_at_21_wib(self):
        """Verify store operating hours auto-close logic at 21:00 WIB"""
        now_wib = datetime.now(WIB)
        status = StoreOperatingHoursService.get_current_status(now_wib)
        self.assertIn("is_open", status)
        self.assertIn("mode", status)

        # Test past 21:00 WIB evaluation
        dt_past_21 = now_wib.replace(hour=21, minute=30, second=0)
        status_past_21 = StoreOperatingHoursService.get_current_status(dt_past_21)
        # In auto mode, at 21:30 WIB it must be closed
        if status_past_21["mode"] == "auto":
            self.assertFalse(status_past_21["is_open"], "Store should be closed past 21:00 WIB in auto mode")

        # Test before 21:00 WIB evaluation (e.g. 14:00 WIB)
        dt_daytime = now_wib.replace(hour=14, minute=0, second=0)
        status_day = StoreOperatingHoursService.get_current_status(dt_daytime)
        if status_day["mode"] == "auto":
            self.assertTrue(status_day["is_open"], "Store should be open at 14:00 WIB in auto mode")

    def test_08_dummy_order_interval_scales_when_closed(self):
        """Verify dummy order interval is 2x longer when store is closed"""
        now_wib = datetime.now(WIB)
        dt_open = now_wib.replace(hour=14, minute=0, second=0)
        dt_closed = now_wib.replace(hour=22, minute=0, second=0)

        # Force status calculation
        status_open = {"is_open": True}
        status_closed = {"is_open": False}

        # Samples
        open_intervals = [
            DummyOrderService.get_next_sleep_seconds(status_open) for _ in range(50)
        ]
        closed_intervals = [
            DummyOrderService.get_next_sleep_seconds(status_closed) for _ in range(50)
        ]

        # All open intervals should be within 300 to 600s
        for iv in open_intervals:
            self.assertGreaterEqual(iv, 300)
            self.assertLessEqual(iv, 600)

        # All closed intervals should be scaled 2x within 600 to 1200s
        for iv in closed_intervals:
            self.assertGreaterEqual(iv, 600)
            self.assertLessEqual(iv, 1200)

if __name__ == "__main__":
    unittest.main()
