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
    print("ALL TESTS PASSED SUCCESSFULLY!")
