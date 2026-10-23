from typing import Dict, Any, List, Optional
from datetime import datetime
import httpx
from app.config import settings

class EmailService:
    @classmethod
    def _dispatch_email(cls, to_email: str, subject: str, html_content: str) -> bool:
        """
        Dispatches an HTML email exclusively via Resend HTTPS REST API (Port 443).
        Bypasses Render SMTP port blocking. In offline/sandbox mode (without API key),
        gracefully logs simulated delivery.
        """
        if not to_email or "@" not in to_email:
            return False

        resend_key = (settings.RESEND_API_KEY or "").strip()
        sender = (settings.RESEND_FROM or "Asterra Store <onboarding@resend.dev>").strip()

        # Fallback simulation if Resend API key is not yet configured (e.g. local dev without key)
        if not resend_key or "your-" in resend_key or resend_key in ["re_placeholder", "test"]:
            print(f"[EmailService:Sandbox] Dispatched simulated email to {to_email}: '{subject}'")
            return True

        try:
            response = httpx.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "from": sender,
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                },
                timeout=15.0,
            )
            if response.status_code in (200, 201):
                res_json = response.json()
                email_id = res_json.get("id", "ok")
                print(f"[EmailService:Resend] Email delivered to {to_email} ('{subject}') - Resend ID: {email_id}")
                return True
            else:
                print(f"[EmailService:Resend] API Error ({response.status_code}) for {to_email}: {response.text}")
                return False
        except Exception as e:
            print(f"[EmailService:Resend] Network request failed for {to_email}: {e}")
            return False

    @classmethod
    def _render_base_email(
        cls,
        *,
        preheader: str,
        badge_text: str,
        badge_color: str = "#0284c7",
        badge_bg: str = "#e0f2fe",
        badge_border: str = "#bae6fd",
        title: str,
        subtitle: str,
        body_content: str,
        cta_text: Optional[str] = None,
        cta_url: Optional[str] = None,
        footer_note: Optional[str] = None,
    ) -> str:
        """
        Builds a responsive, table-based HTML email with inline CSS for 100% email client compatibility
        (Gmail, Apple Mail, Outlook, Android).
        """
        store_url = "https://asterrastore.biz.id" if settings.ENVIRONMENT == "production" else "http://localhost:3000"
        
        cta_button_html = ""
        if cta_text and cta_url:
            cta_button_html = f"""
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 26px auto 10px auto;">
              <tr>
                <td align="center" style="border-radius: 10px; background-color: #0f172a;">
                  <a href="{cta_url}" target="_blank" style="display: inline-block; padding: 13px 28px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; background-color: #0f172a;">
                    {cta_text} &rarr;
                  </a>
                </td>
              </tr>
            </table>
            """

        footer_text = footer_note or "Email ini dikirim otomatis oleh sistem Asterra Store."

        return f"""<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="id">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; color: #1e293b;">
  <!-- Preheader preview text -->
  <span style="display: none !important; visibility: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
    {preheader}
  </span>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 32px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container (560px) -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 14px rgba(15, 23, 42, 0.05);">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px 24px; border-bottom: 1px solid #334155;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: rgba(56, 189, 248, 0.12); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 9999px; padding: 4px 14px; margin-bottom: 10px;">
                      <span style="font-size: 11px; font-weight: 700; color: #38bdf8; letter-spacing: 1px; text-transform: uppercase;">Asterra Store Official</span>
                    </div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">ASTERRA STORE</h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #94a3b8; font-weight: 400;">Katalog Lisensi & Akun Digital Premium Bergaransi</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Title & Context Area -->
          <tr>
            <td style="padding: 28px 28px 12px 28px; text-align: center;">
              <div style="display: inline-block; background-color: {badge_bg}; border: 1px solid {badge_border}; border-radius: 9999px; padding: 4px 14px; margin-bottom: 12px;">
                <span style="font-size: 11px; font-weight: 700; color: {badge_color}; text-transform: uppercase; letter-spacing: 0.5px;">{badge_text}</span>
              </div>
              <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; line-height: 1.3;">{title}</h2>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #64748b; line-height: 1.5;">{subtitle}</p>
            </td>
          </tr>

          <!-- Dynamic Body Content -->
          <tr>
            <td style="padding: 12px 28px 24px 28px;">
              {body_content}
              {cta_button_html}
            </td>
          </tr>

          <!-- Trust & Support Info Banner -->
          <tr>
            <td style="padding: 16px 28px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-size: 12px; color: #64748b; line-height: 1.6; text-align: center;">
                    🛡️ <strong>Garansi Penuh 100%</strong> selama masa aktif produk.<br />
                    Butuh bantuan pesanan? Hubungi Customer Service via <a href="{store_url}" target="_blank" style="color: #0284c7; text-decoration: underline; font-weight: 600;">Website Resmi</a>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Area -->
          <tr>
            <td style="background-color: #ffffff; padding: 22px 28px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 11px; color: #94a3b8; line-height: 1.5;">
                {footer_text}
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                &copy; 2026 Asterra Store. Hak Cipta Dilindungi Undang-Undang.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>"""

    @classmethod
    def send_otp_email(cls, to_email: str, recipient_name: str, otp_code: str) -> bool:
        """
        Sends a 6-digit OTP email for affiliate sales verification.
        """
        subject = f"{otp_code} adalah Kode Verifikasi Pendaftaran Sales Asterra Store"
        clean_name = (recipient_name or "Mitra Sales").strip()

        body_content = f"""
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          Halo <strong>{clean_name}</strong>, terima kasih telah mendaftar sebagai Mitra Sales Asterra Store. Gunakan kode verifikasi berikut untuk mengaktifkan akun kemitraan dan tautan referral Anda:
        </p>

        <!-- OTP Code Box -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0; background-color: #f8fafc; border: 2px dashed #0284c7; border-radius: 12px;">
          <tr>
            <td align="center" style="padding: 22px 16px;">
              <span style="font-size: 11px; font-weight: 700; color: #64748b; letter-spacing: 1px; text-transform: uppercase; display: block; margin-bottom: 6px;">KODE VERIFIKASI (OTP)</span>
              <div style="font-family: ui-monospace, Menlo, Monaco, Consolas, 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0284c7; margin: 0;">
                {otp_code}
              </div>
              <span style="font-size: 12px; color: #0369a1; font-weight: 600; display: block; margin-top: 6px;">⏱️ Berlaku selama 10 menit</span>
            </td>
          </tr>
        </table>

        <!-- Security Notice -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin-top: 16px;">
          <tr>
            <td style="padding: 14px 16px; font-size: 12px; color: #64748b; line-height: 1.6;">
              🔒 <strong>Penting:</strong> Jangan berikan kode OTP ini kepada siapa pun, termasuk pihak yang mengatasnamakan Asterra Store. Jika Anda tidak merasa melakukan pendaftaran ini, abaikan email ini.
            </td>
          </tr>
        </table>
        """

        html_content = cls._render_base_email(
            preheader=f"Kode OTP Anda: {otp_code}. Berlaku 10 menit untuk verifikasi Mitra Sales Asterra Store.",
            badge_text="Verifikasi Kemitraan Sales",
            badge_color="#0284c7",
            badge_bg="#e0f2fe",
            badge_border="#bae6fd",
            title="Kode Verifikasi Pendaftaran",
            subtitle="Gunakan kode OTP berikut untuk mengaktifkan akun kemitraan Anda",
            body_content=body_content,
            footer_note=f"Email verifikasi ini dikirim khusus ke {to_email} untuk pendaftaran Mitra Sales.",
        )

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
        subject = f"Selamat Bergabung di Asterra Store, {clean_name} — Akun Anda Siap Digunakan"
        store_url = "https://asterrastore.biz.id" if settings.ENVIRONMENT == "production" else "http://localhost:3000"

        body_content = f"""
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          Halo <strong>{clean_name}</strong>, akun member Asterra Store Anda telah berhasil dibuat. Mulai sekarang, Anda dapat menikmati kemudahan memesan lisensi dan akun digital premium dengan garansi penggantian penuh 100%.
        </p>

        <!-- Feature List -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 20px 0; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;">
          <tr>
            <td style="padding: 16px 18px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom: 12px;">
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">⚡ Pengiriman Instan Otomatis</div>
                    <div style="font-size: 12px; color: #64748b; line-height: 1.5;">Kredensial pesanan dikirim otomatis detik ini juga setelah pembayaran terkonfirmasi.</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom: 12px;">
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">🛡️ Garansi Penggantian Penuh 100%</div>
                    <div style="font-size: 12px; color: #64748b; line-height: 1.5;">Jaminan perlindungan garansi selama seluruh periode aktif akun dengan layanan klaim yang mudah.</div>
                  </td>
                </tr>
                <tr>
                  <td>
                    <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">📋 Riwayat Pesanan & Akses Kapan Saja</div>
                    <div style="font-size: 12px; color: #64748b; line-height: 1.5;">Pantau detail kredensial akun, tanggal masa aktif, dan invoice resmi kapan saja melalui profil Anda.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        """

        html_content = cls._render_base_email(
            preheader="Selamat bergabung di Asterra Store! Akun member Anda siap digunakan untuk transaksi produk digital.",
            badge_text="Akun Member Resmi Aktif",
            badge_color="#059669",
            badge_bg="#d1fae5",
            badge_border="#a7f3d0",
            title="Selamat Datang di Asterra Store",
            subtitle="Katalog Lisensi & Akun Digital Premium Bergaransi Penuh",
            body_content=body_content,
            cta_text="Jelajahi Katalog Produk",
            cta_url=f"{store_url}/products",
            footer_note=f"Email sambutan ini dikirim otomatis ke {to_email} saat akun berhasil terhubung.",
        )

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
                  <td style="padding: 11px 14px; font-size: 12px; font-weight: 600; color: #475569; width: 36%;">{c['label']}</td>
                  <td style="padding: 11px 14px; font-size: 13px; font-family: ui-monospace, Menlo, Monaco, Consolas, 'Courier New', monospace; font-weight: 700; color: #0284c7; word-break: break-all;">{c['value']}</td>
                </tr>
                """
            creds_html = f"""
            <div style="background-color: #f8fafc; border: 1px solid #38bdf8; border-radius: 12px; overflow: hidden; margin: 20px 0;">
              <div style="background-color: #e0f2fe; padding: 10px 14px; font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
                🔑 Kredensial Akun / Lisensi Anda:
              </div>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff;">
                {rows}
              </table>
            </div>
            """
        elif raw_note.strip():
            creds_html = f"""
            <div style="background-color: #f8fafc; border: 1px solid #38bdf8; border-radius: 12px; padding: 16px; margin: 20px 0;">
              <div style="font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; margin-bottom: 8px;">🔑 Kredensial Akun / Lisensi Anda:</div>
              <pre style="margin: 0; font-family: ui-monospace, Menlo, Monaco, Consolas, 'Courier New', monospace; font-size: 13px; color: #0f172a; white-space: pre-wrap; word-break: break-all;">{raw_note.strip()}</pre>
            </div>
            """

        amount = order.get("totalAmount") or order.get("total_amount") or 0
        formatted_amount = f"Rp {amount:,}".replace(",", ".")

        subject = f"Pesanan Selesai #{order_id} — Kredensial {primary_product} Anda Siap Digunakan"

        body_content = f"""
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          Halo <strong>{cust_name}</strong>, pesanan Anda dengan nomor <strong>#{order_id}</strong> telah berhasil diselesaikan dan kredensial akun siap digunakan.
        </p>

        <!-- Order Summary Table -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin: 16px 0;">
          <tr>
            <td style="padding: 14px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Nomor Pesanan:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; text-align: right; color: #0f172a; font-family: monospace;">#{order_id}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Produk Digital:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; text-align: right; color: #0f172a;">{primary_product}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Total Pembayaran:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; text-align: right; color: #059669;">{formatted_amount}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        {creds_html}

        <!-- Usage Guidelines -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 10px; margin-top: 16px;">
          <tr>
            <td style="padding: 14px 16px; font-size: 12px; color: #92400e; line-height: 1.6;">
              ⚠️ <strong>Ketentuan Penggunaan & Garansi:</strong><br />
              • Dilarang mengubah email atau sandi utama pada akun sharing agar garansi tetap aktif.<br />
              • Akun dilindungi garansi penggantian penuh selama seluruh periode aktif produk.<br />
              • Simpan kredensial ini baik-baik atau akses kembali di riwayat pesanan Anda.
            </td>
          </tr>
        </table>
        """

        html_content = cls._render_base_email(
            preheader=f"Pesanan #{order_id} selesai! Kredensial {primary_product} Anda sudah siap digunakan.",
            badge_text="Pesanan Selesai & Terkirim",
            badge_color="#059669",
            badge_bg="#d1fae5",
            badge_border="#a7f3d0",
            title="Kredensial Akun Anda Siap",
            subtitle=f"Pesanan #{order_id} berhasil diproses oleh sistem Asterra Store",
            body_content=body_content,
            cta_text="Lihat Status & Invoice Pesanan",
            cta_url=order_url,
            footer_note=f"Email transaksi resmi ini dikirimkan ke {to_email} atas pesanan #{order_id}.",
        )

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
        cancel_reason = reason or "Batas waktu pembayaran pesanan telah habis (kedaluwarsa)."

        subject = f"Pemberitahuan Pembatalan Pesanan #{order_id} — Asterra Store"

        body_content = f"""
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
          Halo <strong>{cust_name}</strong>, pesanan Anda dengan nomor <strong>#{order_id}</strong> telah dibatalkan oleh sistem.
        </p>

        <!-- Order Summary -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; margin: 16px 0;">
          <tr>
            <td style="padding: 14px 16px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Nomor Pesanan:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; text-align: right; color: #0f172a; font-family: monospace;">#{order_id}</td>
                </tr>
                <tr style="border-bottom: 1px solid #f1f5f9;">
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Produk:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 600; text-align: right; color: #0f172a;">{primary_product}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 13px; color: #64748b;">Total Pesanan:</td>
                  <td style="padding: 4px 0; font-size: 13px; font-weight: 700; text-align: right; color: #0f172a;">{formatted_amount}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- Cancellation Reason Box -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 10px; margin: 16px 0;">
          <tr>
            <td style="padding: 14px 16px; font-size: 12px; color: #991b1b; line-height: 1.6;">
              🛑 <strong>Alasan Pembatalan:</strong><br />
              {cancel_reason}
            </td>
          </tr>
        </table>

        <p style="font-size: 13px; color: #475569; line-height: 1.6; margin-top: 16px;">
          Jika Anda sebelumnya sudah melakukan transfer pembayaran atau dana terpotong dari saldo Anda, jangan khawatir. Segera hubungi Customer Support kami dengan melampirkan bukti transfer agar kami dapat segera memproses pesanan atau pengembalian dana (refund).
        </p>
        """

        html_content = cls._render_base_email(
            preheader=f"Pesanan #{order_id} telah dibatalkan karena: {cancel_reason}",
            badge_text="Pesanan Dibatalkan",
            badge_color="#e11d48",
            badge_bg="#ffe4e6",
            badge_border="#fecdd3",
            title="Pemberitahuan Pesanan Dibatalkan",
            subtitle=f"Informasi status untuk pesanan #{order_id}",
            body_content=body_content,
            cta_text="Pesan Ulang Produk",
            cta_url=f"{store_url}/products",
            footer_note=f"Email pemberitahuan ini dikirimkan ke {to_email} untuk pesanan #{order_id}.",
        )

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
