import os
import base64
import hashlib
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import httpx

from app.config import settings

logger = logging.getLogger("midtrans_service")

class MidtransService:
    """
    Official Midtrans Payment Gateway & Core API Dynamic QRIS Service Engine for Asterra Store.
    Features:
    1. Dynamic QRIS Generation via Core API (/v2/charge with payment_type: 'qris')
       - 100% In-Page Native Modal without Snap pop-up and without external redirects.
       - Returns live EMVCo qr_string and Midtrans CDN qr_code image URL.
    2. Webhook Notification Verification (SHA-512 Signature Hash)
    3. Payment Status Query & Fallback Simulation for Staging/Local Testing
    """

    @classmethod
    def get_base_url(cls) -> str:
        if settings.MIDTRANS_IS_PRODUCTION:
            return "https://api.midtrans.com/v2"
        return "https://api.sandbox.midtrans.com/v2"

    @classmethod
    def get_auth_headers(cls) -> Dict[str, str]:
        server_key = settings.MIDTRANS_SERVER_KEY.strip()
        auth_str = f"{server_key}:"
        encoded = base64.b64encode(auth_str.encode("utf-8")).decode("utf-8")
        return {
            "Authorization": f"Basic {encoded}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        }

    @classmethod
    def generate_qris(
        cls,
        order_id: str,
        amount: int,
        customer_name: str = "Pelanggan Asterra",
        customer_email: str = "customer@asterra.store",
        customer_phone: str = "",
        title: str = "Pembayaran Asterra Store",
    ) -> Dict[str, Any]:
        """
        Generates dynamic QRIS for the specified order via Midtrans Core API.
        Communicates directly with Midtrans Core API without fallback mock QR strings.
        """
        tz_jkt = timezone(timedelta(hours=7))
        now = datetime.now(tz_jkt)
        expiry_dt = now + timedelta(minutes=15)
        expiry_iso = expiry_dt.strftime("%Y-%m-%dT%H:%M:%S+07:00")

        server_key = settings.MIDTRANS_SERVER_KEY.strip()
        if not server_key:
            logger.error("[Midtrans] MIDTRANS_SERVER_KEY belum dikonfigurasi di environment.")
            return {
                "success": False,
                "error": "MIDTRANS_SERVER_KEY belum dikonfigurasi di backend environment.",
            }

        base_url = cls.get_base_url()
        headers = cls.get_auth_headers()

        payload = {
            "payment_type": "qris",
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(amount),
            },
            "qris": {
                "acquirer": "gopay",
            },
            "customer_details": {
                "first_name": customer_name,
                "email": customer_email,
                "phone": customer_phone or "081234567890",
            },
        }

        logger.info(f"[Midtrans] Sending charge request for order {order_id} ({amount} IDR) to {base_url}/charge")
        try:
            with httpx.Client(timeout=15.0) as client:
                resp = client.post(f"{base_url}/charge", json=payload, headers=headers)
                data = resp.json()
        except Exception as e:
            logger.error(f"[Midtrans] Request connection error to {base_url}/charge: {e}")
            return {
                "success": False,
                "error": f"Gagal menghubungi server Midtrans: {str(e)}",
            }

        if resp.status_code in [200, 201] and str(data.get("status_code")) in ["200", "201"]:
            qr_string = data.get("qr_string", "")
            actions = data.get("actions", [])
            qr_url = None
            for action in actions:
                if action.get("name") in ["generate-qr-code", "qr-code"]:
                    qr_url = action.get("url")
                    break

            if not qr_url:
                for action in actions:
                    if action.get("url"):
                        qr_url = action.get("url")
                        break

            if not qr_url and qr_string:
                qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=350x350&data={qr_string}"

            trans_id = data.get("transaction_id", f"MID-{order_id}")
            expire_time_str = data.get("expiry_time") or data.get("expire_time")
            if expire_time_str:
                try:
                    # Format usually "YYYY-MM-DD HH:MM:SS"
                    parsed_dt = datetime.strptime(expire_time_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=tz_jkt)
                    expiry_iso = parsed_dt.strftime("%Y-%m-%dT%H:%M:%S+07:00")
                except Exception:
                    pass

            return {
                "success": True,
                "payment_id": f"PAY-MIDTRANS-{order_id}",
                "order_id": order_id,
                "amount": amount,
                "payment_method": "qris",
                "transaction_id": trans_id,
                "payment_status": "pending",
                "qr_string": qr_string,
                "qr_url": qr_url,
                "checkout_url": None,  # Direct In-Page Modal (No redirect/Snap)
                "redirect_url": None,
                "expired_at": expiry_iso,
                "instructions": [
                    {
                        "title": "Cara Pembayaran QRIS Midtrans",
                        "steps": [
                            "Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, Dana, ShopeePay, LinkAja).",
                            "Pilih menu 'Scan' atau 'Bayar dengan QRIS'.",
                            "Arahkan kamera smartphone Anda ke kode QRIS dinamis di layar ini.",
                            f"Periksa nama penerima dan nominal Rp {amount:,}.".replace(",", "."),
                            "Konfirmasi pembayaran dan masukkan PIN Anda.",
                            "Pesanan akan otomatis terverifikasi lunas dalam hitungan detik tanpa upload bukti transfer.",
                        ],
                    }
                ],
            }
        else:
            # If rejected due to existing active transaction (conflict/406), attempt recovery via status check
            if str(data.get("status_code")) in ["406", "412"] or "conflict" in str(data).lower():
                status_res = cls.check_status(order_id)
                if status_res.get("success") and status_res.get("data"):
                    sdata = status_res["data"]
                    if sdata.get("transaction_status") == "pending":
                        trans_id = sdata.get("transaction_id")
                        qr_url = f"{base_url}/qris/{trans_id}/qr-code"
                        expire_time_str = sdata.get("expiry_time")
                        if expire_time_str:
                            try:
                                parsed_dt = datetime.strptime(expire_time_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=tz_jkt)
                                expiry_iso = parsed_dt.strftime("%Y-%m-%dT%H:%M:%S+07:00")
                            except Exception:
                                pass
                        logger.info(f"[Midtrans] Recovered existing active transaction {trans_id} for order {order_id}")
                        return {
                            "success": True,
                            "payment_id": f"PAY-MIDTRANS-{order_id}",
                            "order_id": order_id,
                            "amount": int(float(sdata.get("gross_amount", amount))),
                            "payment_method": "qris",
                            "transaction_id": trans_id,
                            "payment_status": "pending",
                            "qr_string": "",
                            "qr_url": qr_url,
                            "checkout_url": None,
                            "redirect_url": None,
                            "expired_at": expiry_iso,
                            "instructions": [
                                {
                                    "title": "Cara Pembayaran QRIS Midtrans",
                                    "steps": [
                                        "Buka aplikasi m-Banking (BCA, Mandiri, BRI, BNI) atau E-Wallet (GoPay, OVO, Dana, ShopeePay, LinkAja).",
                                        "Pilih menu 'Scan' atau 'Bayar dengan QRIS'.",
                                        "Arahkan kamera smartphone Anda ke kode QRIS dinamis di layar ini.",
                                        f"Periksa nama penerima dan nominal Rp {amount:,}.".replace(",", "."),
                                        "Konfirmasi pembayaran dan masukkan PIN Anda.",
                                        "Pesanan akan otomatis terverifikasi lunas dalam hitungan detik tanpa upload bukti transfer.",
                                    ],
                                }
                            ],
                        }

            status_msg = data.get("status_message") or data.get("error") or data.get("message") or f"HTTP {resp.status_code}"
            logger.error(f"[Midtrans] Charge rejected by Midtrans API: {resp.status_code} - {data}")
            return {
                "success": False,
                "error": f"Midtrans Charge Gagal: {status_msg}",
                "status_code": data.get("status_code", str(resp.status_code)),
                "raw_response": data,
            }

    @classmethod
    def verify_webhook(cls, body_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Cryptographically verifies Midtrans notification payload using SHA-512 signature hash.
        Formula: SHA512(order_id + status_code + gross_amount + ServerKey)
        """
        order_id = str(body_dict.get("order_id") or "").strip()
        status_code = str(body_dict.get("status_code") or "").strip()
        gross_amount = str(body_dict.get("gross_amount") or "").strip()
        signature_key = str(body_dict.get("signature_key") or "").strip().lower()
        transaction_status = str(body_dict.get("transaction_status") or "").strip().lower()
        fraud_status = str(body_dict.get("fraud_status") or "accept").strip().lower()
        transaction_id = str(body_dict.get("transaction_id") or "")
        payment_type = str(body_dict.get("payment_type") or "qris")

        server_key = settings.MIDTRANS_SERVER_KEY.strip()

        # In dev/mock mode without configured server_key, allow simulated webhooks
        if not server_key or server_key.startswith("mock_") or server_key.startswith("your-"):
            logger.info(f"[Midtrans] Development mode signature bypass for order {order_id}")
            is_valid = True
        else:
            raw_signature = f"{order_id}{status_code}{gross_amount}{server_key}"
            expected_signature = hashlib.sha512(raw_signature.encode("utf-8")).hexdigest().lower()
            is_valid = (signature_key == expected_signature)

        if not is_valid:
            logger.warning(
                f"[Midtrans] Invalid webhook signature for order {order_id}. Provided: {signature_key}"
            )
            return {
                "is_valid": False,
                "order_id": order_id,
                "error": "Invalid signature key",
            }

        # Normalize status into standard internal status
        # settlement or capture (with accept) means PAID
        if transaction_status == "settlement" or (transaction_status == "capture" and fraud_status == "accept"):
            normalized_status = "PAID"
        elif transaction_status in ["cancel", "deny", "expire"]:
            normalized_status = "CANCELLED"
        elif transaction_status == "pending":
            normalized_status = "PENDING"
        elif transaction_status in ["refund", "partial_refund"]:
            normalized_status = "REFUNDED"
        else:
            normalized_status = transaction_status.upper()

        return {
            "is_valid": True,
            "order_id": order_id,
            "status": normalized_status,
            "raw_status": transaction_status,
            "payment_type": payment_type,
            "transaction_id": transaction_id,
            "reference": f"MID-{transaction_id or order_id}",
        }

    @classmethod
    def check_status(cls, order_id: str) -> Dict[str, Any]:
        """
        Directly checks transaction status with Midtrans API (/v2/{order_id}/status).
        """
        server_key = settings.MIDTRANS_SERVER_KEY.strip()
        if not server_key or server_key.startswith("mock_") or server_key.startswith("your-"):
            return {"success": False, "message": "Midtrans server key not configured"}

        try:
            base_url = cls.get_base_url()
            headers = cls.get_auth_headers()
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(f"{base_url}/{order_id}/status", headers=headers)
                data = resp.json()
            return {"success": resp.status_code == 200, "data": data}
        except Exception as e:
            logger.error(f"[Midtrans] Status check failed for {order_id}: {e}")
            return {"success": False, "message": str(e)}

