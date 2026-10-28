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
        data = response.json()
        self.assertTrue(data.get("success"))
        self.assertTrue(data.get("valid"))
        self.assertEqual(data["data"]["discountAmount"], 5000)
