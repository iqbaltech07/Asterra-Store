import hashlib
from app.config import settings
from app.services.vip_service import VipService
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.core.database import SessionLocal
from datetime import datetime

def test_vip_signature_verification():
    valid_sig = hashlib.md5(f"{settings.VIP_RESELLER_API_ID}{settings.VIP_RESELLER_API_KEY}".encode()).hexdigest()
    assert VipService.verify_webhook_signature(valid_sig) is True
    assert VipService.verify_webhook_signature(valid_sig.upper()) is True
    assert VipService.verify_webhook_signature("invalid_sig_12345") is False
    assert VipService.verify_webhook_signature("") is False
    assert VipService.verify_webhook_signature(None) is False

def test_vip_status_check_live_existing_trx():
    # Test with verified existing transaction on VIP Reseller
    res = VipService.check_order_status("VP6AD0321C06871476953738")
    assert res.get("success") is True
    assert res.get("trxid") == "VP6AD0321C06871476953738"
    assert res.get("status") == "success"
    assert "Sukses Terkirim" in res.get("note", "")

def test_vip_status_check_non_existent_trx():
    res = VipService.check_order_status("VP_NON_EXISTENT_999999")
    assert res.get("success") is False

def test_native_product_is_not_fulfilled_by_vip():
    db = SessionLocal()
    test_order_id = f"TEST-NATIVE-{int(datetime.utcnow().timestamp())}"
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
            product_id="prod-muniiqze-jyh0", # native product
            product_name="Google AI Pro Private 18 Bulan",
            price=89900,
            quantity=1
        )
        db.add(item)
        db.commit()

        # Attempt VIP fulfillment on native product order
        res = VipService.fulfill_order_if_vip(test_order_id)
        assert res.get("is_vip") is False
        assert res.get("success") is False

        # Order must remain untouched by VIP
        refreshed = db.query(Order).filter(Order.id == test_order_id).first()
        assert refreshed.provider_trxid is None
        assert refreshed.status == "pending"

    finally:
        # Cleanup test order
        try:
            db.rollback()
            db.query(OrderItem).filter(OrderItem.order_id == test_order_id).delete()
            db.query(Order).filter(Order.id == test_order_id).delete()
            db.commit()
        except Exception:
            pass
        db.close()

def test_vip_webhook_handler_updates_status_and_note():
    db = SessionLocal()
    test_order_id = f"TEST-WEBHOOK-{int(datetime.utcnow().timestamp())}"
    test_trxid = f"VP-TEST-{int(datetime.utcnow().timestamp())}"
    try:
        # Create a pending order with assigned provider_trxid
        order = Order(
            id=test_order_id,
            customer_email="webhookuser@asterra.store",
            total_amount=15000,
            status="processing",
            payment_mode="manual",
            payment_method="manual_bca",
            payment_status="pending",
            provider="vip-reseller",
            provider_trxid=test_trxid,
            provider_status="waiting"
        )
        db.add(order)
        db.commit()

        # Simulate VIP Reseller callback payload
        payload = {
            "data": {
                "trxid": test_trxid,
                "data": "webhookuser@asterra.store",
                "zone": "",
                "service": "Canva Pro Private 1 Bulan",
                "status": "success",
                "note": "AKUN-CANVA: user@canva.com | Pass: Rahasia123!",
                "price": 10000
            }
        }

        webhook_res = VipService.handle_webhook(payload)
        assert webhook_res.get("result") is True

        # Check order in database
        updated_order = db.query(Order).filter(Order.id == test_order_id).first()
        assert updated_order.status == "completed"
        assert updated_order.provider_status == "success"
        assert "Rahasia123!" in updated_order.provider_note
        assert updated_order.paid_at is not None

    finally:
        try:
            db.rollback()
            db.query(Order).filter(Order.id == test_order_id).delete()
            db.commit()
        except Exception:
            pass
        db.close()

def test_dynamic_target_requirements_resolution():
    # 1. CapCut Pro
    capcut_req = VipService.get_product_target_requirement(
        product_name="CapCut Pro Private 1 Bulan",
        brand="CapCut Pro",
        provider_code="CAPCUTPRIVATE1BLN-S2"
    )
    assert capcut_req["type"] == "phone"
    assert capcut_req["requires_zone"] is False
    assert "081234567890" in capcut_req["placeholder"]

    # 2. Mobile Legends (Game with zone)
    ml_req = VipService.get_product_target_requirement(
        product_name="Mobile Legends 86 Diamonds",
        brand="Mobile Legends",
        provider_code="ML86"
    )
    assert ml_req["type"] == "game"
    assert ml_req["requires_zone"] is True
    assert "Server / Zone ID" in ml_req["zone_label"]

    # 3. Free Fire (Game without zone)
    ff_req = VipService.get_product_target_requirement(
        product_name="Free Fire 100 Diamonds",
        brand="Free Fire",
        provider_code="FF100"
    )
    assert ff_req["type"] == "game"
    assert ff_req["requires_zone"] is False

    # 4. PLN Token (Customer / Meter ID)
    pln_req = VipService.get_product_target_requirement(
        product_name="Token PLN 20.000",
        brand="PLN",
        provider_code="PLN20"
    )
    assert pln_req["type"] == "customer_id"

    # 5. YouTube Premium (Email based)
    yt_req = VipService.get_product_target_requirement(
        product_name="YouTube Premium Family Invite 1 Bulan",
        brand="YouTube Premium",
        provider_code="YTPREMINVT1BLN-S3"
    )
    assert yt_req["type"] == "email"

def test_capcut_order_fulfills_with_phone_target():
    db = SessionLocal()
    test_order_id = f"TEST-CAPCUT-{int(datetime.utcnow().timestamp())}"
    try:
        # Create test Capcut order with phone target
        order = Order(
            id=test_order_id,
            customer_email="capcutbuyer@gmail.com",
            customer_whatsapp="081299998888",
            total_amount=15000,
            status="processing",
            payment_mode="manual",
            payment_method="manual_bca",
            payment_status="paid",
            provider="vip-reseller"
        )
        db.add(order)
        item = OrderItem(
            id=f"item-{test_order_id}",
            order_id=test_order_id,
            product_id="vip-capcutshared1blngar28d-s2",
            product_name="CapCut Pro Shared 1 Bulan",
            price=15000,
            quantity=1,
            target_id="081234567890",
            target_phone="081234567890",
            target_email="capcutbuyer@gmail.com"
        )
        db.add(item)
        db.commit()

        # Fulfill order (In sandbox mode, strictly protects real balance)
        res = VipService.fulfill_order_if_vip(test_order_id)
        assert res.get("is_vip") is True
        assert res.get("success") is True
        assert "VP-TEST-" in res.get("order", {}).get("providerTrxId", "")

        # Verify DB record
        refreshed = db.query(Order).filter(Order.id == test_order_id).first()
        assert refreshed.provider_trxid is not None
        assert "VP-TEST-" in refreshed.provider_trxid

    finally:
        try:
            db.rollback()
            db.query(OrderItem).filter(OrderItem.order_id == test_order_id).delete()
            db.query(Order).filter(Order.id == test_order_id).delete()
            db.commit()
        except Exception:
            pass
        db.close()

if __name__ == "__main__":
    test_vip_signature_verification()
    print("✓ test_vip_signature_verification passed")
    test_vip_status_check_live_existing_trx()
    print("✓ test_vip_status_check_live_existing_trx passed")
    test_vip_status_check_non_existent_trx()
    print("✓ test_vip_status_check_non_existent_trx passed")
    test_native_product_is_not_fulfilled_by_vip()
    print("✓ test_native_product_is_not_fulfilled_by_vip passed")
    test_vip_webhook_handler_updates_status_and_note()
    print("✓ test_vip_webhook_handler_updates_status_and_note passed")
    test_dynamic_target_requirements_resolution()
    print("✓ test_dynamic_target_requirements_resolution passed")
    test_capcut_order_fulfills_with_phone_target()
    print("✓ test_capcut_order_fulfills_with_phone_target passed")
    print("ALL TESTS PASSED SUCCESSFULLY!")
