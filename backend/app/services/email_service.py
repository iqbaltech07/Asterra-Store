import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional
from datetime import datetime
from app.config import settings

class EmailService:
    @classmethod
    def _dispatch_email(cls, to_email: str, subject: str, html_content: str) -> bool:
        """
        Dispatches an HTML email via configured SMTP server.
        Gracefully logs and handles offline/sandbox mode.
        """
        if not to_email or "@" not in to_email:
            return False

        smtp_host = (settings.SMTP_HOST or "").strip()
        smtp_user = (settings.SMTP_USER or "").strip()
        smtp_pass = (settings.SMTP_PASS or "").strip()
        smtp_port = settings.SMTP_PORT or 587
        smtp_from = settings.SMTP_FROM or "Asterra Store <no-reply@asterrastore.biz.id>"

        # Fallback simulation if SMTP is placeholder or missing
        if not smtp_host or smtp_host in ["smtp.example.com", "localhost", "127.0.0.1"] or not smtp_user or "your-" in smtp_pass:
            print(f"[EmailService:Sandbox] Dispatched simulated email to {to_email}: '{subject}'")
            return True

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = smtp_from
            msg["Reply-To"] = "no-reply@asterrastore.biz.id"
            msg["To"] = to_email

            part = MIMEText(html_content, "html")
            msg.attach(part)

            clean_pass = smtp_pass.replace(" ", "") if "gmail.com" in smtp_host.lower() else smtp_pass

            # Extract clean email address for SMTP envelope sender
            clean_sender = smtp_from
            if "<" in clean_sender and ">" in clean_sender:
                clean_sender = clean_sender.split("<")[1].split(">")[0].strip()

            with smtplib.SMTP(smtp_host, smtp_port, timeout=12.0) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(smtp_user, clean_pass)
                server.sendmail(clean_sender, [to_email], msg.as_string())

            print(f"[EmailService] Real email delivered via {smtp_host} to {to_email} ('{subject}')")
            return True
        except Exception as e:
            print(f"[EmailService] Warning: Failed to deliver SMTP email to {to_email}: {e}")
            return False

    @classmethod
    def send_otp_email(cls, to_email: str, recipient_name: str, otp_code: str) -> bool:
        """
        Sends a 6-digit OTP email for affiliate sales verification.
        """
        subject = f"{otp_code} adalah Kode Verifikasi Pendaftaran Sales Asterra Store"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
            .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; }}
            .header {{ background: #121A2A; padding: 26px; text-align: center; color: #ffffff; }}
            .header h1 {{ margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.5px; }}
            .header p {{ margin: 4px 0 0; font-size: 12px; color: #94a3b8; }}
            .body {{ padding: 32px 24px; }}
            .greeting {{ font-size: 15px; margin-bottom: 16px; line-height: 1.5; }}
            .otp-box {{ background: #f8fafc; border: 2px dashed #0284c7; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0; }}
            .otp-code {{ font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #0284c7; margin: 0; }}
            .notice {{ font-size: 13px; color: #64748b; line-height: 1.6; margin-top: 16px; background: #f1f5f9; padding: 14px; border-radius: 8px; }}
            .footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Asterra Store — Tim Sales & Afiliasi</h1>
              <p>Portal Resmi Kemitraan Digital</p>
            </div>
            <div class="body">
              <p class="greeting">Halo <strong>{recipient_name}</strong>,</p>
              <p class="greeting">Terima kasih telah mendaftar sebagai Mitra Sales Asterra Store. Gunakan kode verifikasi berikut untuk mengaktifkan akun kemitraan dan kode referral Anda:</p>
              
              <div class="otp-box">
                <p class="otp-code">{otp_code}</p>
              </div>

              <div class="notice">
                • Kode OTP ini berlaku selama <strong>10 menit</strong>.<br>
                • Jaga kerahasiaan kode ini dan jangan berikan kepada pihak mana pun.<br>
                • Jika Anda tidak melakukan pendaftaran ini, abaikan email ini.
              </div>
            </div>
            <div class="footer">
              &copy; 2026 Asterra Store. Solusi Akun & Lisensi Digital Bergaransi.
            </div>
          </div>
        </body>
        </html>
        """

        print(f"\n=======================================================")
        print(f"[EMAIL SERVICE] OTP SENT TO {to_email}")
        print(f"VERIFICATION CODE: {otp_code}")
        print(f"=======================================================\n")

        return cls._dispatch_email(to_email, subject, html_content)

    @classmethod
    def send_welcome_member_email(cls, to_email: str, recipient_name: str) -> bool:
        """
        Sends an elevated welcome notification to a newly registered member (e.g. via Google OAuth).
        """
        clean_name = (recipient_name or "Sahabat Asterra").strip()
        subject = f"Selamat Bergabung di Asterra Store, {clean_name} — Akun Member Anda Siap Digunakan"
        store_url = "https://asterrastore.biz.id" if settings.ENVIRONMENT == "production" else "http://localhost:3000"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
            .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
            .header {{ background: #121A2A; padding: 32px 24px; text-align: center; color: #ffffff; }}
            .header h1 {{ margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #ffffff; }}
            .header p {{ margin: 8px 0 0; font-size: 13px; color: #94a3b8; }}
            .body {{ padding: 32px 24px; }}
            .greeting {{ font-size: 16px; margin-bottom: 16px; line-height: 1.6; color: #0f172a; }}
            .hero-badge {{ display: inline-block; background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.25); color: #059669; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }}
            .benefits-card {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }}
            .benefit-item {{ margin-bottom: 14px; font-size: 13px; line-height: 1.6; color: #334155; }}
            .benefit-item:last-child {{ margin-bottom: 0; }}
            .cta-box {{ text-align: center; margin: 32px 0 16px; }}
            .cta-btn {{ display: inline-block; background: #121A2A; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 14px; padding: 13px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(18,26,42,0.15); }}
            .footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; line-height: 1.5; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="hero-badge">Akun Member Resmi Aktif</span>
              <h1>Selamat Datang di Asterra Store</h1>
              <p>Katalog Lisensi & Akun Digital Premium Bergaransi Penuh</p>
            </div>
            <div class="body">
              <p class="greeting">Halo <strong>{clean_name}</strong>,</p>
              <p class="greeting">
                Akun Anda berhasil terdaftar melalui Google Authentication. Mulai sekarang, Anda dapat menikmati kemudahan memesan berbagai produk digital unggulan dengan garansi penuh penggantian akun 100%.
              </p>

              <div class="benefits-card">
                <div class="benefit-item">
                  <strong>Pengiriman Instan & Otomatis:</strong> Kredensial akun (Canva Pro, Gemini AI, Netflix, dll.) dikirim otomatis dan tersimpan aman di akun Anda.
                </div>
                <div class="benefit-item">
                  <strong>Garansi Penuh 100%:</strong> Perlindungan garansi selama masa aktif pesanan dengan dukungan klaim garansi responsif.
                </div>
                <div class="benefit-item">
                  <strong>Riwayat Pesanan Terintegrasi:</strong> Pantau status lisensi, masa aktif, dan faktur pembayaran kapan saja melalui portal profil Anda.
                </div>
              </div>

              <div class="cta-box">
                <a href="{store_url}" class="cta-btn">Jelajahi Katalog Produk &rarr;</a>
              </div>

              <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 24px;">
                Butuh bantuan pesanan? Hubungi tim Customer Support kami melalui WhatsApp resmi kami.
              </p>
            </div>
            <div class="footer">
              &copy; 2026 Asterra Store. Hak Cipta Dilindungi.<br>
              Email ini dikirim otomatis ke {to_email} saat akun Google berhasil terhubung.
            </div>
          </div>
        </body>
        </html>
        """

        return cls._dispatch_email(to_email, subject, html_content)

    @classmethod
    def send_order_completed_email(cls, order: Dict[str, Any]) -> bool:
        """
        Sends an order completed notification containing live account credentials and usage guidelines.
        """
        to_email = order.get("customerEmail") or order.get("customer_email") or ""
        cust_name = order.get("customerName") or order.get("customer_name") or "Pelanggan Setia"
        order_id = str(order.get("id") or "").upper()
        store_url = "https://asterrastore.biz.id" if settings.ENVIRONMENT == "production" else "http://localhost:3000"
        order_url = f"{store_url}/order?id={order_id}"

        # Extract items
        items = order.get("items") or []
        primary_product = "Produk Digital"
        if items and isinstance(items, list):
            first_item = items[0]
            primary_product = first_item.get("productName") or first_item.get("product_name") or primary_product

        # Parse credentials
        raw_note = order.get("providerNote") or order.get("provider_note") or order.get("customerNotes") or order.get("customer_notes") or ""
        parsed_creds = cls._parse_credentials(raw_note)

        # Build credentials HTML table/cards
        creds_html = ""
        if parsed_creds:
            rows = ""
            for c in parsed_creds:
                rows += f"""
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 10px 14px; font-size: 12px; font-weight: 600; color: #475569; width: 38%;">{c['label']}</td>
                  <td style="padding: 10px 14px; font-size: 13px; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #0284c7; word-break: break-all;">{c['value']}</td>
                </tr>
                """
            creds_html = f"""
            <div style="background: #f8fafc; border: 1px solid #0284c7; border-radius: 10px; overflow: hidden; margin: 20px 0;">
              <div style="background: #e0f2fe; padding: 10px 14px; font-size: 12px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
                Kredensial Akun / Lisensi Anda:
              </div>
              <table style="width: 100%; border-collapse: collapse; background: #ffffff;">
                {rows}
              </table>
            </div>
            """
        elif raw_note.strip():
            creds_html = f"""
            <div style="background: #f8fafc; border: 1px solid #0284c7; border-radius: 10px; padding: 16px; margin: 20px 0;">
              <div style="font-size: 12px; font-weight: 700; color: #0369a1; margin-bottom: 8px;">Kredensial Akun / Lisensi Anda:</div>
              <pre style="margin: 0; font-family: ui-monospace, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #0f172a; white-space: pre-wrap; word-break: break-all;">{raw_note.strip()}</pre>
            </div>
            """

        amount = order.get("totalAmount") or order.get("total_amount") or 0
        formatted_amount = f"Rp {amount:,}".replace(",", ".")

        subject = f"Pesanan Selesai #{order_id} — Kredensial {primary_product} Anda Siap Digunakan"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
            .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; }}
            .header {{ background: #121A2A; padding: 28px 24px; text-align: center; color: #ffffff; }}
            .status-badge {{ display: inline-block; background: rgba(16,185,129,0.15); border: 1px solid rgba(16,185,129,0.3); color: #10b981; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }}
            .header h1 {{ margin: 0; font-size: 20px; font-weight: 800; }}
            .body {{ padding: 28px 24px; }}
            .meta-table {{ width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0; }}
            .meta-table td {{ padding: 6px 0; color: #64748b; }}
            .meta-table td.val {{ text-align: right; font-weight: 600; color: #0f172a; }}
            .guidelines {{ background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; padding: 14px; font-size: 12px; color: #92400e; line-height: 1.6; margin: 20px 0; }}
            .cta-box {{ text-align: center; margin: 24px 0 12px; }}
            .cta-btn {{ display: inline-block; background: #121A2A; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 8px; }}
            .footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="status-badge">Pesanan Selesai & Berhasil Dikirim</span>
              <h1>Kredensial Akun Anda Siap</h1>
            </div>
            <div class="body">
              <p style="font-size: 15px; margin: 0 0 16px; color: #0f172a;">
                Halo <strong>{cust_name}</strong>, pesanan Anda dengan nomor <strong>#{order_id}</strong> telah berhasil diselesaikan.
              </p>

              <table class="meta-table">
                <tr>
                  <td>Nomor Pesanan:</td>
                  <td class="val" style="font-family: monospace;">#{order_id}</td>
                </tr>
                <tr>
                  <td>Produk:</td>
                  <td class="val">{primary_product}</td>
                </tr>
                <tr>
                  <td>Total Pembayaran:</td>
                  <td class="val" style="color: #059669;">{formatted_amount}</td>
                </tr>
              </table>

              {creds_html}

              <div class="guidelines">
                <strong>Ketentuan Penggunaan & Garansi:</strong><br>
                • Jangan mengubah email atau sandi utama pada akun sharing agar garansi tetap aktif.<br>
                • Seluruh akun dilindungi garansi penggantian penuh selama masa aktif.<br>
                • Simpan kredensial ini baik-baik atau akses kembali di riwayat pesanan Anda.
              </div>

              <div class="cta-box">
                <a href="{order_url}" class="cta-btn">Lihat Status & Rincian Pesanan &rarr;</a>
              </div>
            </div>
            <div class="footer">
              &copy; 2026 Asterra Store. Solusi Akun & Lisensi Digital Bergaransi.
            </div>
          </div>
        </body>
        </html>
        """

        return cls._dispatch_email(to_email, subject, html_content)

    @classmethod
    def send_order_cancelled_email(cls, order: Dict[str, Any], reason: Optional[str] = None) -> bool:
        """
        Sends an order cancellation notification when an order expires or is marked as cancelled.
        """
        to_email = order.get("customerEmail") or order.get("customer_email") or ""
        cust_name = order.get("customerName") or order.get("customer_name") or "Pelanggan Setia"
        order_id = str(order.get("id") or "").upper()
        store_url = "https://asterrastore.biz.id" if settings.ENVIRONMENT == "production" else "http://localhost:3000"

        items = order.get("items") or []
        primary_product = "Produk Digital"
        if items and isinstance(items, list):
            first_item = items[0]
            primary_product = first_item.get("productName") or first_item.get("product_name") or primary_product

        amount = order.get("totalAmount") or order.get("total_amount") or 0
        formatted_amount = f"Rp {amount:,}".replace(",", ".")
        cancel_reason = reason or "Waktu pembayaran pesanan telah habis (kedaluwarsa)."

        subject = f"Pemberitahuan Pembatalan Pesanan #{order_id} — Asterra Store"

        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }}
            .container {{ max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #e2e8f0; overflow: hidden; }}
            .header {{ background: #121A2A; padding: 28px 24px; text-align: center; color: #ffffff; }}
            .status-badge {{ display: inline-block; background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; font-weight: 700; font-size: 11px; padding: 4px 12px; border-radius: 9999px; margin-bottom: 12px; }}
            .header h1 {{ margin: 0; font-size: 20px; font-weight: 800; }}
            .body {{ padding: 28px 24px; }}
            .meta-table {{ width: 100%; border-collapse: collapse; font-size: 13px; margin: 16px 0; }}
            .meta-table td {{ padding: 6px 0; color: #64748b; }}
            .meta-table td.val {{ text-align: right; font-weight: 600; color: #0f172a; }}
            .notice-box {{ background: #fef2f2; border: 1px solid #fee2e2; border-radius: 8px; padding: 14px; font-size: 12px; color: #991b1b; line-height: 1.6; margin: 20px 0; }}
            .cta-box {{ text-align: center; margin: 24px 0 12px; }}
            .cta-btn {{ display: inline-block; background: #121A2A; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 13px; padding: 12px 24px; border-radius: 8px; }}
            .footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="status-badge">Pesanan Dibatalkan</span>
              <h1>Pemberitahuan Pesanan</h1>
            </div>
            <div class="body">
              <p style="font-size: 15px; margin: 0 0 16px; color: #0f172a;">
                Halo <strong>{cust_name}</strong>, pesanan Anda dengan nomor <strong>#{order_id}</strong> telah dibatalkan.
              </p>

              <table class="meta-table">
                <tr>
                  <td>Nomor Pesanan:</td>
                  <td class="val" style="font-family: monospace;">#{order_id}</td>
                </tr>
                <tr>
                  <td>Produk:</td>
                  <td class="val">{primary_product}</td>
                </tr>
                <tr>
                  <td>Total Pesanan:</td>
                  <td class="val">{formatted_amount}</td>
                </tr>
              </table>

              <div class="notice-box">
                <strong>Alasan Pembatalan:</strong><br>
                {cancel_reason}
              </div>

              <p style="font-size: 13px; color: #475569; line-height: 1.6;">
                Jika Anda sebelumnya sudah melakukan pembayaran atau dana telah terpotong dari rekening/e-wallet Anda, mohon jangan khawatir. Segera hubungi Admin Asterra Store melalui WhatsApp dengan melampirkan bukti transfer agar kami dapat segera memproses pesanan atau pengembalian dana (refund).
              </p>

              <div class="cta-box">
                <a href="{store_url}" class="cta-btn">Pesan Ulang Produk &rarr;</a>
              </div>
            </div>
            <div class="footer">
              &copy; 2026 Asterra Store. Hak Cipta Dilindungi.
            </div>
          </div>
        </body>
        </html>
        """

        return cls._dispatch_email(to_email, subject, html_content)

    @classmethod
    def _parse_credentials(cls, raw: Optional[str]) -> List[Dict[str, str]]:
        if not raw:
            return []
        cleaned = raw.replace("[SANDBOX TEST]", "").strip()
        if cleaned.lower().startswith("akun sukses terkirim:"):
            cleaned = cleaned[len("akun sukses terkirim:"):].strip()

        items = []
        parts = [p.strip() for p in cleaned.replace("\r", "").split("\n") if p.strip()]
        if len(parts) == 1 and "|" in parts[0]:
            parts = [p.strip() for p in parts[0].split("|") if p.strip()]

        for part in parts:
            if "=" in part:
                k, v = part.split("=", 1)
            elif ":" in part and not part.startswith("http"):
                k, v = part.split(":", 1)
            else:
                k, v = "", part

            k = k.strip()
            v = v.strip()

            if any(w in k.lower() for w in ["akun", "account", "login"]) and any(sep in v for sep in [":", "—"]) and not v.startswith("http"):
                sep = "—" if "—" in v else ":"
                sub = [s.strip() for s in v.split(sep, 1)]
                if len(sub) == 2 and "@" in sub[0]:
                    items.append({"label": "Email / Akun", "value": sub[0]})
                    items.append({"label": "Kata Sandi", "value": sub[1]})
                    continue

            label = k or "Informasi Akun"
            if any(w in k.lower() for w in ["pass", "sandi", "pin"]):
                label = "Kata Sandi / PIN"
            elif any(w in k.lower() for w in ["akun", "email", "user"]):
                label = "Email / Akun"
            elif any(w in k.lower() for w in ["link", "ketentuan", "panduan", "url"]):
                label = "Ketentuan & Link Akses"
            elif any(w in k.lower() for w in ["sn", "serial", "kode", "lisensi", "license"]):
                label = "Kode Lisensi"

            items.append({"label": label, "value": v})

        return items
