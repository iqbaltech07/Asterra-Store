import uuid
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings
from app.core.database import SessionLocal
from app.models.order import Order
from app.models.payment_event import PaymentEvent
from app.services.payment_event_service import PaymentEventService

client = TestClient(app)

@pytest.fixture
def auth_headers():
    token = settings.DANA_DEVICE_TOKEN or "asterra_dana_listener_token_dev"
    return {"X-Device-Token": token}

def test_receive_dana_event_unauthorized():
    res = client.post(
        "/api/internal/payment-events/dana",
        json={
            "event_id": "test-unauth-001",
            "amount": 25000,
            "currency": "IDR",
            "transaction_time": datetime.now(timezone.utc).isoformat(),
        },
        headers={"X-Device-Token": "wrong-token"},
    )
    assert res.status_code == 401
    assert "Unauthorized" in res.json().get("detail", "")

def test_receive_dana_event_success_and_matching(auth_headers):
    db = SessionLocal()
    order_id = f"TEST-ORD-{uuid.uuid4().hex[:6].upper()}"
    event_id = f"DANA-EVT-{uuid.uuid4().hex[:8]}"
    test_amount = 27500.0

    try:
        # Create a test pending order
        test_order = Order(
            id=order_id,
            customer_email="testbuyer@asterra.store",
            customer_name="Test Buyer",
            total_amount=test_amount,
            status="pending",
            payment_status="pending",
            payment_method="qris",
            payment_mode="MANUAL",
            created_at=datetime.utcnow(),
        )
        db.add(test_order)
        db.commit()

        # Ingest payment event from Android device
        payload = {
            "event_id": event_id,
            "device_id": "asterra-device-01",
            "amount": test_amount,
            "currency": "IDR",
            "transaction_time": datetime.now(timezone.utc).isoformat(),
            "source": "dana_business",
            "raw_reference": "QRIS/DANA-REF-12345",
        }

        res = client.post(
            "/api/internal/payment-events/dana",
            json=payload,
            headers=auth_headers,
        )

        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert data["event_id"] == event_id
        assert data["status"] == "PENDING_REVIEW"
        assert data["matched_order_id"] == order_id

        # Verify event saved in database
        saved = db.query(PaymentEvent).filter(PaymentEvent.event_id == event_id).first()
        assert saved is not None
        assert float(saved.amount) == test_amount
        assert saved.matched_order_id == order_id

        # Test Idempotency: Submitting the exact same event_id must return DUPLICATE
        dup_res = client.post(
            "/api/internal/payment-events/dana",
            json=payload,
            headers=auth_headers,
        )
        assert dup_res.status_code == 200
        dup_data = dup_res.json()
        assert dup_data["status"] == "DUPLICATE"
        assert dup_data["event_id"] == event_id

    finally:
        # Cleanup
        db.query(PaymentEvent).filter(PaymentEvent.event_id == event_id).delete()
        db.query(Order).filter(Order.id == order_id).delete()
        db.commit()
        db.close()

def test_admin_confirm_payment_workflow():
    db = SessionLocal()
    order_id = f"TEST-ORD-{uuid.uuid4().hex[:6].upper()}"
    event_id = f"DANA-EVT-{uuid.uuid4().hex[:8]}"
    test_amount = 50000.0

    try:
        # Create pending order
        test_order = Order(
            id=order_id,
            customer_email="testbuyer2@asterra.store",
            customer_name="Test Buyer 2",
            total_amount=test_amount,
            status="pending",
            payment_status="pending",
            payment_mode="MANUAL",
            fulfillment_mode="automatic",
            created_at=datetime.utcnow(),
        )
        db.add(test_order)
        db.commit()

        # Ingest event
        PaymentEventService.process_dana_event({
            "event_id": event_id,
            "device_id": "asterra-device-01",
            "amount": test_amount,
            "currency": "IDR",
            "transaction_time": datetime.now(timezone.utc).isoformat(),
        })

        # Admin confirms payment
        admin_payload = {
            "id": "admin-1",
            "name": "Super Admin",
            "email": "admin@asterra.store",
            "role": "superadmin",
        }

        confirm_res = PaymentEventService.confirm_payment_event(
            event_id=event_id,
            admin_user=admin_payload,
            order_id=order_id,
            notes="Telah diverifikasi sesuai mutasi DANA Bisnis.",
        )

        assert confirm_res["success"] is True
        assert confirm_res["data"]["status"] == "PAID"
        assert confirm_res["data"]["matched_order_id"] == order_id

        # Verify order transitioned to paid in DB
        db.refresh(test_order)
        assert test_order.status in ["paid", "processing", "completed"]

    finally:
        # Cleanup
        db.query(PaymentEvent).filter(PaymentEvent.event_id == event_id).delete()
        db.query(Order).filter(Order.id == order_id).delete()
        db.commit()
        db.close()


def test_pay_order_qris_returns_lipay_info():
    db = SessionLocal()
    order_id = f"TEST-PAY-{uuid.uuid4().hex[:6].upper()}"
    try:
        order = Order(
            id=order_id,
            customer_email="buyer_pay@asterra.store",
            customer_name="Buyer Pay",
            total_amount=50000,
            status="pending",
            payment_status="pending",
            payment_method="qris",
            payment_mode="LIPAY",
            created_at=datetime.utcnow(),
        )
        db.add(order)
        db.commit()

        res = client.post(
            f"/api/v1/orders/{order_id}/pay",
            json={"payment_method": "qris"},
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data.get("success") is True
        payment = data.get("payment", {})
        assert payment.get("is_lipay") is True
        assert "qr_image_url" in payment
        assert payment["qr_image_url"] is not None
        assert "qris_merchant_name" in payment
    finally:
        db.query(Order).filter(Order.id == order_id).delete()
        db.commit()
        db.close()

def test_pay_order_manual_transfer_returns_info():
    db = SessionLocal()
    order_id = f"TEST-PAY-MANUAL-{uuid.uuid4().hex[:6].upper()}"
    try:
        order = Order(
            id=order_id,
            customer_email="buyer_manual@asterra.store",
            customer_name="Buyer Manual",
            total_amount=75000,
            status="pending",
            payment_status="pending",
            payment_method="manual_bca",
            payment_mode="MANUAL",
            created_at=datetime.utcnow(),
        )
        db.add(order)
        db.commit()

        res = client.post(
            f"/api/v1/orders/{order_id}/pay",
            json={"payment_method": "manual_bca"},
        )
        assert res.status_code == 200, res.text
        data = res.json()
        assert data.get("success") is True
        payment = data.get("payment", {})
        assert payment.get("is_manual") is True
        assert "qr_image_url" in payment
        assert payment["qr_image_url"] is not None
        assert "instructions" in payment
        assert len(payment["instructions"]) > 0
    finally:
        db.query(Order).filter(Order.id == order_id).delete()
        db.commit()
        db.close()
