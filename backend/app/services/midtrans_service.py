import os
import base64
import hashlib
import logging
from typing import Dict, Any, Optional, List
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
                        "title": "Cara Pembayaran QRIS",
                        "steps": [
                            "Buka aplikasi E-Wallet (GoPay, OVO, DANA, ShopeePay, LinkAja) atau m-Banking (BCA, Mandiri, BRI, BNI & bank lainnya).",
                            "Pilih menu 'Scan' atau 'Bayar dengan QRIS'.",
                            "Arahkan kamera smartphone Anda ke kode QRIS di layar ini.",
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

    @classmethod
    def get_bank_instructions(
        cls, bank: str, va_number: str, amount: int, biller_code: str = "", bill_key: str = ""
    ) -> List[Dict[str, Any]]:
        amt_str = f"Rp {amount:,.0f}".replace(",", ".")
        b = bank.lower()

        if b == "bca":
            return [
                {
                    "title": "BCA Mobile (m-BCA)",
                    "steps": [
                        "Buka aplikasi BCA Mobile dan pilih m-BCA.",
                        "Masukkan Kode Akses Anda, lalu pilih menu m-Transfer.",
                        "Pilih menu BCA Virtual Account.",
                        f"Masukkan nomor Virtual Account: {va_number}.",
                        f"Pastikan nama penerima Asterra Store dan nominal tepat {amt_str}.",
                        "Masukkan PIN m-BCA Anda untuk menyelesaikan pembayaran.",
                    ],
                },
                {
                    "title": "myBCA",
                    "steps": [
                        "Buka aplikasi myBCA dan login.",
                        "Pilih menu Transfer > Virtual Account.",
                        f"Masukkan nomor Virtual Account: {va_number}.",
                        f"Periksa rincian pembayaran ({amt_str}) dan konfirmasi dengan PIN myBCA.",
                    ],
                },
                {
                    "title": "ATM BCA",
                    "steps": [
                        "Masukkan kartu ATM BCA dan 6 digit PIN Anda.",
                        "Pilih menu Transaksi Lainnya > Transfer > ke Rek BCA Virtual Account.",
                        f"Masukkan nomor Virtual Account: {va_number} lalu tekan Benar.",
                        "Periksa detail pembayaran pada layar ATM, lalu tekan Ya.",
                    ],
                },
                {
                    "title": "KlikBCA",
                    "steps": [
                        "Login ke KlikBCA Individual (https://ibank.klikbca.com).",
                        "Pilih menu Transfer Dana > Transfer ke BCA Virtual Account.",
                        f"Masukkan nomor Virtual Account: {va_number}.",
                        "Masukkan respon KeyBCA Appli 1 dan klik Kirim.",
                    ],
                },
            ]

        if b == "bni":
            return [
                {
                    "title": "BNI Mobile Banking",
                    "steps": [
                        "Buka aplikasi BNI Mobile Banking dan login dengan MPIN.",
                        "Pilih menu Transfer > Virtual Account Billing.",
                        f"Pilih tab Input Baru, masukkan nomor Virtual Account: {va_number}.",
                        f"Periksa informasi tagihan dan nominal pembayaran {amt_str}.",
                        "Masukkan Password Transaksi Anda dan klik Lanjut.",
                    ],
                },
                {
                    "title": "ATM BNI",
                    "steps": [
                        "Masukkan kartu ATM BNI dan PIN Anda.",
                        "Pilih menu Menu Lainnya > Transfer > Virtual Account Billing.",
                        f"Masukkan nomor Virtual Account: {va_number} lalu tekan Benar.",
                        "Konfirmasi rincian pembayaran pada layar dan tekan Ya.",
                    ],
                },
                {
                    "title": "BNI Internet Banking",
                    "steps": [
                        "Akses https://ibank.bni.co.id dan login.",
                        "Pilih menu Transfer > Virtual Account Billing.",
                        f"Masukkan nomor Virtual Account: {va_number}.",
                        "Masukkan kode otentikasi token BNI Anda untuk menyelesaikan transaksi.",
                    ],
                },
            ]

        if b == "bri":
            return [
                {
                    "title": "BRImo (BRI Mobile)",
                    "steps": [
                        "Buka aplikasi BRImo dan login dengan akun Anda.",
                        "Pilih menu Tagihan > BRIVA (atau cari menu BRIVA).",
                        f"Pilih Tambah Transaksi Baru, masukkan nomor BRIVA: {va_number}.",
                        f"Layar akan menampilkan rincian pesanan dan total nominal {amt_str}.",
                        "Klik Bayar dan masukkan 6 digit PIN BRImo Anda.",
                    ],
                },
                {
                    "title": "ATM BRI",
                    "steps": [
                        "Masukkan kartu ATM BRI dan PIN.",
                        "Pilih menu Transaksi Lain > Pembayaran > Lainnya > BRIVA.",
                        f"Masukkan nomor Virtual Account BRIVA: {va_number}, tekan Benar.",
                        "Periksa konfirmasi rincian pesanan di layar, lalu pilih Ya.",
                    ],
                },
            ]

        if b == "mandiri":
            return [
                {
                    "title": "Livin' by Mandiri (Kuning)",
                    "steps": [
                        "Buka aplikasi Livin' by Mandiri dan login.",
                        f"Pilih menu Bayar > ketik kode {biller_code} atau cari penyedia jasa Midtrans.",
                        f"Masukkan Nomor Pembayaran / Bill Key: {bill_key}.",
                        f"Rincian tagihan akan muncul otomatis, periksa total nominal {amt_str}.",
                        "Klik Lanjut Bayar dan masukkan PIN Livin' Anda.",
                    ],
                },
                {
                    "title": "ATM Mandiri",
                    "steps": [
                        "Masukkan kartu ATM Mandiri dan 6 digit PIN Anda.",
                        "Pilih menu Bayar/Beli > Lainnya > Lainnya > Multi Payment.",
                        f"Masukkan Kode Perusahaan: {biller_code} lalu tekan Benar.",
                        f"Masukkan Nomor Pembayaran / Bill Key: {bill_key} lalu tekan Benar.",
                        "Konfirmasi rincian tagihan pada layar, tekan 1 lalu tekan Ya.",
                    ],
                },
            ]

        return [
            {
                "title": f"Cara Pembayaran {bank.upper()} Virtual Account",
                "steps": [
                    f"Transfer ke nomor Virtual Account: {va_number}.",
                    f"Pastikan nominal transfer tepat {amt_str}.",
                    "Pembayaran akan otomatis terkonfirmasi secara realtime.",
                ],
            }
        ]

    @classmethod
    def generate_bank_transfer(
        cls,
        order_id: str,
        amount: int,
        bank: str,
        customer_name: str = "Pelanggan Asterra",
        customer_email: str = "customer@asterra.store",
        customer_phone: str = "",
        title: str = "Pembayaran Asterra Store",
    ) -> Dict[str, Any]:
        """
        Generates Virtual Account for the specified bank via Midtrans Core API.
        Supported banks: BCA, BNI, BRI, Mandiri (echannel).
        """
        tz_jkt = timezone(timedelta(hours=7))
        now = datetime.now(tz_jkt)
        expiry_dt = now + timedelta(hours=24)
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
        b = bank.lower().replace("_va", "")

        payload: Dict[str, Any] = {
            "transaction_details": {
                "order_id": order_id,
                "gross_amount": int(amount),
            },
            "customer_details": {
                "first_name": customer_name,
                "email": customer_email,
                "phone": customer_phone or "081234567890",
            },
        }

        if b == "mandiri":
            payload["payment_type"] = "echannel"
            payload["echannel"] = {
                "bill_info1": "Payment For:",
                "bill_info2": f"Order {order_id}"[:30],
            }
        else:
            payload["payment_type"] = "bank_transfer"
            payload["bank_transfer"] = {"bank": b}

        logger.info(f"[Midtrans] Sending bank charge request for order {order_id} ({b}) to {base_url}/charge")
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
            trans_id = data.get("transaction_id", f"MID-{order_id}")
            expire_time_str = data.get("expiry_time") or data.get("expire_time")
            if expire_time_str:
                try:
                    parsed_dt = datetime.strptime(expire_time_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=tz_jkt)
                    expiry_iso = parsed_dt.strftime("%Y-%m-%dT%H:%M:%S+07:00")
                except Exception:
                    pass

            biller_code = str(data.get("biller_code") or "")
            bill_key = str(data.get("bill_key") or "")
            va_numbers = data.get("va_numbers", [])
            va_number = ""
            if va_numbers and isinstance(va_numbers, list) and len(va_numbers) > 0:
                va_number = va_numbers[0].get("va_number", "")
            elif bill_key:
                va_number = f"{biller_code} {bill_key}".strip()

            instructions = cls.get_bank_instructions(
                bank=b,
                va_number=va_number,
                amount=amount,
                biller_code=biller_code,
                bill_key=bill_key,
            )

            return {
                "success": True,
                "payment_id": f"PAY-MIDTRANS-{order_id}",
                "order_id": order_id,
                "amount": amount,
                "payment_method": f"{b}_va",
                "bank": b,
                "va_number": va_number,
                "biller_code": biller_code,
                "bill_key": bill_key,
                "transaction_id": trans_id,
                "payment_status": "pending",
                "checkout_url": None,
                "redirect_url": None,
                "expired_at": expiry_iso,
                "instructions": instructions,
            }
        else:
            # Conflict recovery (e.g. 406/412 already exists)
            if str(data.get("status_code")) in ["406", "412"] or "conflict" in str(data).lower():
                status_res = cls.check_status(order_id)
                if status_res.get("success") and status_res.get("data"):
                    sdata = status_res["data"]
                    if sdata.get("transaction_status") == "pending":
                        trans_id = sdata.get("transaction_id")
                        biller_code = str(sdata.get("biller_code") or "")
                        bill_key = str(sdata.get("bill_key") or "")
                        va_numbers = sdata.get("va_numbers", [])
                        va_number = ""
                        if va_numbers and isinstance(va_numbers, list) and len(va_numbers) > 0:
                            va_number = va_numbers[0].get("va_number", "")
                        elif bill_key:
                            va_number = f"{biller_code} {bill_key}".strip()

                        expire_time_str = sdata.get("expiry_time")
                        if expire_time_str:
                            try:
                                parsed_dt = datetime.strptime(expire_time_str, "%Y-%m-%d %H:%M:%S").replace(tzinfo=tz_jkt)
                                expiry_iso = parsed_dt.strftime("%Y-%m-%dT%H:%M:%S+07:00")
                            except Exception:
                                pass

                        instructions = cls.get_bank_instructions(
                            bank=b,
                            va_number=va_number,
                            amount=amount,
                            biller_code=biller_code,
                            bill_key=bill_key,
                        )

                        return {
                            "success": True,
                            "payment_id": f"PAY-MIDTRANS-{order_id}",
                            "order_id": order_id,
                            "amount": int(float(sdata.get("gross_amount", amount))),
                            "payment_method": f"{b}_va",
                            "bank": b,
                            "va_number": va_number,
                            "biller_code": biller_code,
                            "bill_key": bill_key,
                            "transaction_id": trans_id,
                            "payment_status": "pending",
                            "checkout_url": None,
                            "redirect_url": None,
                            "expired_at": expiry_iso,
                            "instructions": instructions,
                        }

            status_msg = data.get("status_message") or data.get("error") or data.get("message") or f"HTTP {resp.status_code}"
            logger.error(f"[Midtrans] Bank charge rejected: {resp.status_code} - {data}")
            return {
                "success": False,
                "error": f"Midtrans Charge Gagal: {status_msg}",
                "status_code": data.get("status_code", str(resp.status_code)),
                "raw_response": data,
            }

