import os
import sys
import unittest
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.promo_service import PromoService
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

class TestPromoValidation(unittest.TestCase):
    def setUp(self):
        # Save previous promos state
        self.original_promos = PromoService._promos
        now = datetime.now(timezone.utc)
        yesterday = (now - timedelta(days=2)).isoformat()
        last_week = (now - timedelta(days=7)).isoformat()
        tomorrow = (now + timedelta(days=1)).isoformat()
        next_week = (now + timedelta(days=7)).isoformat()

        PromoService._promos = [
            {
                "id": "promo-active",
                "code": "PROMOAKTIF",
                "description": "Promo Aktif 10%",
                "discountType": "percentage",
                "discountValue": 10,
                "maxDiscount": 50000,
                "minOrderAmount": 20000,
                "usageLimit": 100,
                "usedCount": 5,
                "startDate": last_week,
                "expiresAt": next_week,
                "isActive": True,
            },
            {
                "id": "promo-expired",
                "code": "PROMOEXPIRED",
                "description": "Promo Kadaluarsa",
                "discountType": "percentage",
                "discountValue": 20,
                "maxDiscount": 10000,
                "minOrderAmount": 0,
                "usageLimit": 100,
                "usedCount": 0,
                "startDate": last_week,
                "expiresAt": yesterday,
                "isActive": True,
            },
            {
                "id": "promo-inactive",
                "code": "PROMONONAKTIF",
                "description": "Promo Nonaktif",
                "discountType": "fixed",
                "discountValue": 5000,
                "maxDiscount": None,
                "minOrderAmount": 0,
                "usageLimit": 100,
                "usedCount": 0,
                "startDate": last_week,
                "expiresAt": next_week,
                "isActive": False,
            },
            {
                "id": "promo-future",
                "code": "PROMOBELUMAKTIF",
                "description": "Promo Masa Depan",
                "discountType": "fixed",
                "discountValue": 5000,
                "maxDiscount": None,
                "minOrderAmount": 0,
                "usageLimit": 100,
                "usedCount": 0,
                "startDate": tomorrow,
                "expiresAt": next_week,
                "isActive": True,
            },
            {
                "id": "promo-quota-full",
                "code": "PROMOFULL",
                "description": "Promo Kuota Habis",
                "discountType": "fixed",
                "discountValue": 5000,
                "maxDiscount": None,
                "minOrderAmount": 0,
                "usageLimit": 10,
                "usedCount": 10,
                "startDate": last_week,
                "expiresAt": next_week,
                "isActive": True,
            },
            {
                "id": "promo-product-x",
                "code": "PROMOTARGETX",
                "description": "Promo Khusus Produk X 20%",
                "discountType": "percentage",
                "discountValue": 20,
                "maxDiscount": 50000,
                "minOrderAmount": 15000,
                "usageLimit": 100,
                "usedCount": 0,
                "startDate": last_week,
                "expiresAt": next_week,
                "isActive": True,
                "targetScope": "specific_product",
                "targetProductId": "prod-x",
                "targetProductName": "Produk X Spesial",
            },
            {
                "id": "promo-fixed-product-x",
                "code": "PROMOFIXEDX",
                "description": "Promo Potongan Tetap Rp 25.000 Khusus Produk X",
                "discountType": "fixed",
                "discountValue": 25000,
                "maxDiscount": None,
                "minOrderAmount": 0,
                "usageLimit": 100,
                "usedCount": 0,
                "startDate": last_week,
                "expiresAt": next_week,
                "isActive": True,
                "targetScope": "specific_product",
                "targetProductId": "prod-x",
                "targetProductName": "Produk X Spesial",
            },
        ]

    def tearDown(self):
        PromoService._promos = self.original_promos

    def test_01_valid_promo(self):
        res = PromoService.validate_promo("PROMOAKTIF", 50000)
        self.assertTrue(res["valid"])
        self.assertEqual(res["code"], "PROMOAKTIF")
        self.assertEqual(res["discountAmount"], 5000)
        self.assertEqual(res["finalTotal"], 45000)
        self.assertIn("berhasil", res["message"].lower())

    def test_02_nonexistent_promo_friendly_message(self):
        res = PromoService.validate_promo("KODETIDAKADA123", 50000)
        self.assertFalse(res["valid"])
        self.assertIn("tidak ditemukan atau tidak terdaftar", res["error"])
        self.assertIn("KODETIDAKADA123", res["error"])
        # Must not be a technical error
        self.assertNotIn("status 200", res["error"].lower())
        self.assertNotIn("exception", res["error"].lower())

    def test_03_expired_promo_friendly_message(self):
        res = PromoService.validate_promo("PROMOEXPIRED", 50000)
        self.assertFalse(res["valid"])
        self.assertIn("telah kedaluwarsa", res["error"])
        self.assertIn("PROMOEXPIRED", res["error"])
        self.assertNotIn("status 200", res["error"].lower())

    def test_04_empty_promo_code(self):
        res = PromoService.validate_promo("   ", 50000)
        self.assertFalse(res["valid"])
        self.assertIn("masukkan kode promo", res["error"].lower())

    def test_05_inactive_promo(self):
        res = PromoService.validate_promo("PROMONONAKTIF", 50000)
        self.assertFalse(res["valid"])
        self.assertIn("sudah tidak aktif", res["error"])

    def test_06_not_yet_started_promo(self):
        res = PromoService.validate_promo("PROMOBELUMAKTIF", 50000)
        self.assertFalse(res["valid"])
        self.assertIn("baru dapat digunakan mulai", res["error"])

    def test_07_quota_exhausted_promo(self):
        res = PromoService.validate_promo("PROMOFULL", 50000)
        self.assertFalse(res["valid"])
        self.assertIn("kuota", res["error"].lower())

    def test_08_min_order_not_met(self):
        res = PromoService.validate_promo("PROMOAKTIF", 10000)  # min 20,000
        self.assertFalse(res["valid"])
        self.assertIn("minimal", res["error"].lower())

    def test_09_api_endpoint_nonexistent_promo_returns_friendly_json(self):
        response = client.post("/api/v1/promos/validate", json={"code": "KODEPALSU", "subtotal": 50000})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertFalse(data.get("valid"))
        self.assertIn("tidak ditemukan atau tidak terdaftar", data.get("error"))
        self.assertIn("KODEPALSU", data.get("error"))

    def test_10_api_endpoint_expired_promo_returns_friendly_json(self):
        response = client.post("/api/v1/promos/validate", json={"code": "PROMOEXPIRED", "subtotal": 50000})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertFalse(data.get("valid"))
        self.assertIn("telah kedaluwarsa", data.get("error"))
        self.assertIn("PROMOEXPIRED", data.get("error"))

    def test_11_api_endpoint_valid_promo_returns_success(self):
        response = client.post("/api/v1/promos/validate", json={"code": "PROMOAKTIF", "subtotal": 50000})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(data.get("success") if "data" in locals() else response.json().get("success"))
        data = response.json()
        self.assertTrue(data.get("valid"))
        self.assertEqual(data["data"]["discountAmount"], 5000)

    def test_12_product_specific_promo_success(self):
        # Valid when prod-x is in items
        items = [
            {"product_id": "prod-x", "unit_price": 30000, "quantity": 1}
        ]
        res = PromoService.validate_promo("PROMOTARGETX", 30000, items=items)
        self.assertTrue(res["valid"])
        self.assertEqual(res["code"], "PROMOTARGETX")
        # 20% of 30,000 = 6,000
        self.assertEqual(res["discountAmount"], 6000)
        self.assertEqual(res["finalTotal"], 24000)
        self.assertEqual(res["targetProductId"], "prod-x")
        self.assertIn("khusus", res["message"].lower())

    def test_13_product_specific_promo_rejected_when_product_absent(self):
        # Cart only has prod-y
        items = [
            {"product_id": "prod-y", "unit_price": 50000, "quantity": 1}
        ]
        res = PromoService.validate_promo("PROMOTARGETX", 50000, items=items)
        self.assertFalse(res["valid"])
        self.assertIn("khusus untuk produk 'Produk X Spesial'", res["error"])
        self.assertIn("tidak dapat digunakan", res["error"])

    def test_14_product_specific_promo_rejected_when_no_items(self):
        # Cart items list empty or None
        res = PromoService.validate_promo("PROMOTARGETX", 50000, items=[])
        self.assertFalse(res["valid"])
        self.assertIn("khusus untuk produk", res["error"])

    def test_15_product_specific_promo_multi_item_isolation(self):
        # Cart has prod-x (Rp 20.000) and expensive prod-y (Rp 100.000). Total: Rp 120.000
        items = [
            {"product_id": "prod-x", "unit_price": 20000, "quantity": 1},
            {"product_id": "prod-y", "unit_price": 100000, "quantity": 1},
        ]
        res = PromoService.validate_promo("PROMOTARGETX", 120000, items=items)
        self.assertTrue(res["valid"])
        # 20% of prod-x (20.000) = 4,000 (NOT 20% of 120.000 = 24.000!)
        self.assertEqual(res["discountAmount"], 4000)
        self.assertEqual(res["finalTotal"], 116000)

    def test_16_product_specific_fixed_discount_capped_at_product_price(self):
        # PROMOFIXEDX gives Rp 25.000 fixed discount, but prod-x price is only Rp 10.000
        items = [
            {"product_id": "prod-x", "unit_price": 10000, "quantity": 1},
            {"product_id": "prod-y", "unit_price": 50000, "quantity": 1},
        ]
        res = PromoService.validate_promo("PROMOFIXEDX", 60000, items=items)
        self.assertTrue(res["valid"])
        # Fixed discount must be capped at eligible_subtotal (10.000), not full 25.000!
        self.assertEqual(res["discountAmount"], 10000)
        self.assertEqual(res["finalTotal"], 50000)

    def test_17_product_specific_min_order_checked_on_target_product_only(self):
        # PROMOTARGETX has minOrderAmount = 15.000.
        # Total cart is 100.000, but prod-x is only 10.000
        items = [
            {"product_id": "prod-x", "unit_price": 10000, "quantity": 1},
            {"product_id": "prod-y", "unit_price": 90000, "quantity": 1},
        ]
        res = PromoService.validate_promo("PROMOTARGETX", 100000, items=items)
        self.assertFalse(res["valid"])
        self.assertIn("Minimal pembelian untuk produk 'Produk X Spesial'", res["error"])

    def test_18_api_endpoint_product_specific_promo_with_items(self):
        # Test API endpoint POST /api/v1/promos/validate
        payload = {
            "code": "PROMOTARGETX",
            "subtotal": 60000,
            "items": [
                {"product_id": "prod-x", "unit_price": 30000, "quantity": 1},
                {"product_id": "prod-z", "unit_price": 30000, "quantity": 1},
            ]
        }
        response = client.post("/api/v1/promos/validate", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertTrue(data.get("valid"))
        self.assertEqual(data["data"]["discountAmount"], 6000)
