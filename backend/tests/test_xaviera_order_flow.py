import pytest
from app.config import settings
from app.services.xaviera_service import XavieraService
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.core.database import SessionLocal
from datetime import datetime

def test_xaviera_target_requirement():
    # 1. Akun Premium default email requirement
    req_prem = XavieraService.get_product_target_requirement(
        product_name="Netflix Premium 1 Bulan",
        brand="Netflix",
        category="Streaming",
        provider_code="xvs-prod:p_netflix1"
    )
    assert req_prem["type"] == "email"
    assert req_prem["requires_zone"] is False

    # 2. Akun Premium with phone / whatsapp override
    req_phone = XavieraService.get_product_target_requirement(
        product_name="Spotify Premium 1 Bulan",
        brand="Spotify",
        category="Music",
        provider_code="xvs-prod:p_spotify1",
        target_type_override="whatsapp"
    )
    assert req_phone["type"] == "phone"
    assert req_phone["requires_zone"] is False

def test_xaviera_sandbox_order_placement():
    # Force sandbox mode for safe unit testing
    orig_mode = getattr(settings, "XAVIERA_SANDBOX_MODE", False)
    try:
        settings.XAVIERA_SANDBOX_MODE = True

        # Test Akun Premium order placement with instant credentials return
        res_prem = XavieraService.place_order(
            service_code="xvs-prod:p_netflix1:v_net_1m",
            target_id="customer@test.com",
            qty=1
        )
        assert res_prem["success"] is True
        assert res_prem["trxid"].startswith("ord_test_")
        assert res_prem["credentials"] is not None
        assert len(res_prem["credentials"]) > 0
        assert "email" in res_prem["credentials"][0]
        assert "password" in res_prem["credentials"][0]
    finally:
        settings.XAVIERA_SANDBOX_MODE = orig_mode

def test_native_product_is_not_fulfilled_by_xaviera():
    db = SessionLocal()
    test_order_id = f"TEST-NATIVE-XVS-{int(datetime.utcnow().timestamp())}"
    try:
        # Create test native product order
        order = Order(
            id=test_order_id,
            customer_email="testnative@asterra.store",
            total_amount=89900,
            status="pending",
            payment_mode="manual",
            payment_method="manual_bca",
            payment_status="pending",
            provider="native"
        )
        db.add(order)
        item = OrderItem(
            id=f"item-{test_order_id}",
            order_id=test_order_id,
            product_id="prod-muniiqze-jyh0",
            product_name="Google AI Pro Private 18 Bulan",
            price=89900,
            quantity=1
        )
        db.add(item)
        db.commit()

        # Attempt Xaviera fulfillment on native product order
        res = XavieraService.fulfill_order_if_xaviera(test_order_id)
        assert res.get("is_xaviera") is False
        assert res.get("success") is False

        # Order must remain untouched
        refreshed = db.query(Order).filter(Order.id == test_order_id).first()
        assert refreshed.provider_trxid is None
        assert refreshed.status == "pending"

    finally:
        try:
            db.rollback()
            db.query(OrderItem).filter(OrderItem.order_id == test_order_id).delete()
            db.query(Order).filter(Order.id == test_order_id).delete()
            db.commit()
        except Exception:
            pass
        db.close()

