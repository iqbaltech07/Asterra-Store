import pytest
import uuid
from datetime import datetime
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.models.order import Order
from app.services.qris_service import QrisService, DEFAULT_QRIS_PAYLOAD

client = TestClient(app)


def test_qris_service_crc16():
    # Known test vector for Asterra static QRIS:
    # Tag 6304 prefix, expected CRC: 7816
    raw_payload_prefix = (
        "00020101021126570011ID.DANA.WWW011893600915303581731802090358173180303UMI"
        "51440014ID.CO.QRIS.WWW0215ID10266111175770303UMI5204481453033605802ID"
        "5919Asterra Store, Cell6012Kab. Bandung6105409146304"
    )
    crc = QrisService.crc16_ccitt(raw_payload_prefix)
    assert crc == "7816", f"Expected 7816, got {crc}"


def test_qris_service_parse_tlv():
    tlvs = QrisService.parse_emvco_tlv(DEFAULT_QRIS_PAYLOAD)
    tag_map = dict(tlvs)
    assert tag_map.get("00") == "01"
    assert tag_map.get("01") == "11"  # Static
    assert tag_map.get("53") == "360"  # IDR
    assert tag_map.get("58") == "ID"
    assert "Asterra" in tag_map.get("59", "")


def test_qris_service_build_dynamic_qris():
    test_amount = 27500
    dynamic_payload = QrisService.build_dynamic_qris(DEFAULT_QRIS_PAYLOAD, test_amount)

    # 1. Verify CRC is valid
    content_to_crc = dynamic_payload[:-4]
    expected_crc = dynamic_payload[-4:]
    calculated_crc = QrisService.crc16_ccitt(content_to_crc)
    assert calculated_crc == expected_crc, f"CRC mismatch: {calculated_crc} != {expected_crc}"

    # 2. Verify Tag 01 switched to 12 (Dynamic)
    tlvs = dict(QrisService.parse_emvco_tlv(dynamic_payload))
    assert tlvs.get("01") == "12", "Tag 01 must be 12 (Dynamic)"

    # 3. Verify Tag 54 matches the amount
    assert tlvs.get("54") == str(test_amount), f"Tag 54 must match {test_amount}"


def test_qris_service_svg_data_uri():
    test_amount = 50000
    dynamic_payload = QrisService.build_dynamic_qris(DEFAULT_QRIS_PAYLOAD, test_amount)
    data_uri = QrisService.generate_qr_svg_data_uri(dynamic_payload)
    assert data_uri.startswith("data:image/svg+xml"), f"Invalid data URI: {data_uri[:50]}"
    assert "%3Csvg" in data_uri or "<svg" in data_uri


def test_pay_order_returns_dynamic_qris():
    db = SessionLocal()
    order_id = f"TEST-DYN-QRIS-{uuid.uuid4().hex[:6].upper()}"
    test_amount = 35247.0

    try:
        order = Order(
            id=order_id,
            customer_email="dynqris@asterra.store",
            customer_name="Dynamic QRIS Tester",
            total_amount=test_amount,
            status="pending",
            payment_status="pending",
            payment_method="qris",
            payment_mode="LIPAY",
            created_at=datetime.utcnow(),
        )
        db.add(order)
        db.commit()

        res = client.post(f"/api/v1/orders/{order_id}/pay", json={"payment_method": "qris"})
        assert res.status_code == 200, res.text
        data = res.json()
        assert data.get("success") is True
        payment = data.get("payment", {})

        assert payment.get("is_lipay") is True
        assert payment.get("is_dynamic") is True
        assert payment.get("amount") == test_amount

        # Check qr_string
        qr_string = payment.get("qr_string")
        assert qr_string is not None
        assert "540535247" in qr_string or "35247" in qr_string

        # Check qr_image_url is SVG data URI
        qr_image = payment.get("qr_image_url")
        assert qr_image is not None
        assert qr_image.startswith("data:image/svg+xml")

    finally:
        db.query(Order).filter(Order.id == order_id).delete()
        db.commit()
        db.close()
