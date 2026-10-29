import json
import pytest
from datetime import datetime
from unittest.mock import patch

from app.core.database import SessionLocal
from app.models.product import Product
from app.models.order import Order
from app.services.order_service import OrderService
from app.services.order_processing_service import OrderProcessingService
from app.services.resellers.reseller_registry import ResellerRegistry
from app.services.email_service import EmailService
from app.services.vip_service import VipService

ADMIN_USER = {
    "id": "admin-test-01",
    "email": "admin@asterra.store",
    "name": "Super Admin",
    "role": "superadmin",
}

@pytest.fixture(autouse=True)
def ensure_db():
    OrderProcessingService.ensure_tables(force=True)

@pytest.fixture
def real_product_id():
    db = SessionLocal()
    try:
        p = db.query(Product).first()
        if not p:
            p = Product(
                id="vip-viu1bln-s1",
                name="Viu Premium 1 Bulan Test",
                category_id="cat-streaming",
                category_name="Streaming",
                brand="Viu",
                price=15000,
                price_formatted="Rp 15.000",
                status="active",
                stock=100,
                provider="vip-reseller",
                provider_code="viu1bln",
                provider_name="VIP Reseller",
                provider_price=10000,
                provider_status="active",
            )
            db.add(p)
            db.commit()
            db.refresh(p)
        return p.id
    finally:
        db.close()

def test_manual_mode_order_creation_and_credential_requirement(real_product_id):
    # 1. Set mode to manual
    OrderProcessingService.update_order_mode_config(
        {"order_mode": "manual", "active_reseller": "vip-reseller"},
        admin_user=ADMIN_USER,
    )
    cfg = OrderProcessingService.get_order_mode_config()
    assert cfg["order_mode"] == "manual"

    # 2. Create order in manual mode
    order_payload = {
        "customerEmail": "buyer_manual@asterra.store",
        "customerWhatsapp": "081234567891",
        "customerName": "Manual Buyer",
        "items": [
            {
                "product_id": real_product_id,
                "product_name": "Viu Premium Private 1 Bulan",
                "unit_price": 25000,
                "quantity": 1,
                "target_phone": "081234567891",
            }
        ],
    }
    order = OrderService.create_order(order_payload)
    order_id = order["id"]

    assert order["fulfillment_mode"] == "manual"
    assert order["status"] == "pending"

    # 3. Transition to 'processing' (e.g. payment verified)
    # Must NOT call VIP fulfillment because order mode is manual!
    with patch.object(VipService, "place_order") as mock_place_order:
        updated = OrderService.update_status(order_id, "processing", notes="Pembayaran diverifikasi")
        assert updated is not None
        assert updated["status"] == "processing"
        # In manual mode, automated place_order MUST NOT be called!
        mock_place_order.assert_not_called()

    # 4. Attempting to complete order directly WITHOUT credentials MUST raise ValueError
    with pytest.raises(ValueError, match="Mode manual mewajibkan pengisian kredensial"):
        OrderService.update_status(order_id, "completed")

    # 5. Completing order via OrderProcessingService with valid credentials
    credentials = [
        {"label": "Email / Akun", "value": "viu.premium@asterra.store"},
        {"label": "Kata Sandi", "value": "AsterraPass123!"},
        {"label": "Masa Aktif", "value": "30 Hari Bergaransi"},
    ]

    with patch.object(EmailService, "_dispatch_email", return_value=True):
        complete_res = OrderProcessingService.complete_manual_order(
            order_id=order_id,
            payload={"credentials": credentials, "notes": "Akun fresh garansi 30 hari"},
            admin_user=ADMIN_USER,
        )

    assert complete_res["success"] is True
    assert complete_res["email_sent"] is True
    assert complete_res["email_status"] == "sent"

    completed_order = complete_res["order"]
    assert completed_order["status"] == "completed"
    assert completed_order["fulfillment_mode"] == "manual"
    assert completed_order["fulfillment_admin_id"] == "admin@asterra.store"
    assert "viu.premium@asterra.store" in completed_order["provider_note"]

    stored_creds = json.loads(completed_order["fulfillment_credentials"])
    assert len(stored_creds) == 3
    assert stored_creds[0]["value"] == "viu.premium@asterra.store"

def test_manual_mode_email_failure_does_not_rollback_fulfillment(real_product_id):
    # Setup manual order
    OrderProcessingService.update_order_mode_config(
        {"order_mode": "manual", "active_reseller": "vip-reseller"},
        admin_user=ADMIN_USER,
    )
    order = OrderService.create_order({
        "customerEmail": "email_fail_test@asterra.store",
        "customerName": "Fail Test",
        "items": [{"product_id": real_product_id, "product_name": "Test Product", "unit_price": 50000, "quantity": 1}],
    })
    order_id = order["id"]
    OrderService.update_status(order_id, "processing")

    # Simulate email failure
    with patch.object(EmailService, "_dispatch_email", return_value=False):
        res = OrderProcessingService.complete_manual_order(
            order_id=order_id,
            payload={"credentials": [{"label": "Akun", "value": "user@test.com"}, {"label": "Pass", "value": "1234"}]},
            admin_user=ADMIN_USER,
        )

    # Order should STILL be completed, but email_delivery_status recorded as failed
    assert res["success"] is True
    assert res["email_sent"] is False
    assert res["email_status"] == "failed"
    assert res["order"]["status"] == "completed"

    # Test Idempotent Resend Email
    with patch.object(EmailService, "_dispatch_email", return_value=True):
        resend_res = OrderProcessingService.resend_completion_email(order_id, admin_user=ADMIN_USER)

    assert resend_res["success"] is True
    assert resend_res["email_status"] == "sent"
    assert resend_res["order"]["status"] == "completed"

def test_automatic_mode_fulfillment_flow(real_product_id):
    # 1. Set mode to automatic
    OrderProcessingService.update_order_mode_config(
        {"order_mode": "automatic", "active_reseller": "vip-reseller"},
        admin_user=ADMIN_USER,
    )
    cfg = OrderProcessingService.get_order_mode_config()
    assert cfg["order_mode"] == "automatic"

    # 2. Create order in automatic mode
    order = OrderService.create_order({
        "customerEmail": "auto_buyer@asterra.store",
        "customerName": "Auto Buyer",
        "items": [
            {
                "product_id": real_product_id,
                "product_name": "Layanan Otomatis",
                "unit_price": 10000,
                "quantity": 1,
            }
        ],
    })
    assert order["fulfillment_mode"] == "automatic"

    # 3. Switching configuration does not retroactively change existing orders
    OrderProcessingService.update_order_mode_config(
        {"order_mode": "manual", "active_reseller": "vip-reseller"},
        admin_user=ADMIN_USER,
    )
    fetched = OrderService.get_order_by_id(order["id"])
    assert fetched["fulfillment_mode"] == "automatic"

def test_unsupported_reseller_activation_rejected():
    # Setting an unsupported reseller must be rejected
    with pytest.raises(ValueError, match="belum didukung"):
        OrderProcessingService.update_order_mode_config(
            {"order_mode": "automatic", "active_reseller": "fake-unsupported-provider"},
            admin_user=ADMIN_USER,
        )

def test_reseller_api_security_and_ssrf_protection():
    # 1. Secrets are masked in get_reseller_configs
    configs = OrderProcessingService.get_reseller_configs()
    vip_cfg = next((c for c in configs if c["id"] == "vip-reseller"), None)
    assert vip_cfg is not None
    assert "apiKey" not in vip_cfg  # raw api key never exposed
    assert "apiSign" not in vip_cfg  # raw sign never exposed
    assert "maskedApiKey" in vip_cfg
    assert "maskedApiSign" in vip_cfg

    # 2. SSRF Protection: localhost or internal IP rejection
    with pytest.raises(ValueError, match="SSRF"):
        OrderProcessingService.update_reseller_config(
            "vip-reseller",
            {"baseUrl": "http://localhost:8080/api"},
            admin_user=ADMIN_USER,
        )

    with pytest.raises(ValueError, match="SSRF"):
        OrderProcessingService.update_reseller_config(
            "vip-reseller",
            {"baseUrl": "http://169.254.169.254/latest/meta-data"},
            admin_user=ADMIN_USER,
        )

    with pytest.raises(ValueError, match="SSRF"):
        OrderProcessingService.update_reseller_config(
            "vip-reseller",
            {"baseUrl": "http://192.168.1.100/api"},
            admin_user=ADMIN_USER,
        )

    with pytest.raises(ValueError, match="SSRF"):
        OrderProcessingService.update_reseller_config(
            "vip-reseller",
            {"baseUrl": "http://127.0.0.1:8000/api"},
            admin_user=ADMIN_USER,
        )

    # 3. Valid public HTTPS URL is accepted
    updated = OrderProcessingService.update_reseller_config(
        "vip-reseller",
        {"baseUrl": "https://vip-reseller.co.id/api"},
        admin_user=ADMIN_USER,
    )
    assert updated["baseUrl"] == "https://vip-reseller.co.id/api"
