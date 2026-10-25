import json
import pathlib
import secrets
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

from app.core.database import SessionLocal
from app.models.partner import SalesPartner
from app.models.commission import Commission
from app.models.profit_ledger import ProfitLedger

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
PARTNERS_FILE = DATA_DIR / "supabase-partners.json"
ORDERS_FILE = DATA_DIR / "supabase-orders.json"
ADMINS_FILE = DATA_DIR / "supabase-admins.json"

class PartnerService:
    _partners: Optional[List[Dict[str, Any]]] = None
    _last_loaded: Optional[datetime] = None
    _pending_registrations: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def load_partners(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        Loads partners directly from Supabase PostgreSQL sales_partners table.
        Falls back to local clean JSON file if offline.
        """
        now = datetime.utcnow()
        if (
            cls._partners is not None
            and not force_reload
            and cls._last_loaded is not None
            and (now - cls._last_loaded).total_seconds() < 5
        ):
            return cls._partners

        # 1. Try querying Supabase PostgreSQL
        try:
            db = SessionLocal()
            try:
                db_partners = db.query(SalesPartner).order_by(SalesPartner.created_at.asc()).all()
                if db_partners is not None:
                    data = [p.to_dict() for p in db_partners]
                    cls._partners = data
                    cls._last_loaded = datetime.utcnow()
                    cls.save_partners()
                    return data
            finally:
                db.close()
        except Exception as e:
            print(f"[PartnerService] Warning: Supabase query failed, using local fallback: {e}")

        # 2. Fallback to local file
        if PARTNERS_FILE.exists():
            try:
                data = json.loads(PARTNERS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    cls._partners = data
                    cls._last_loaded = datetime.utcnow()
                    return data
            except Exception as e:
                print(f"[PartnerService] Error loading partners fallback: {e}")

        cls._partners = []
        return []

    @classmethod
    def save_partners(cls) -> bool:
        try:
            if cls._partners is not None:
                PARTNERS_FILE.parent.mkdir(parents=True, exist_ok=True)
                PARTNERS_FILE.write_text(json.dumps(cls._partners, indent=2, ensure_ascii=False), encoding="utf-8")
                return True
        except Exception as e:
            print(f"[PartnerService] Error saving partners: {e}")
        return False

    @classmethod
    def load_orders(cls) -> List[Dict[str, Any]]:
        try:
            from app.services.order_service import OrderService
            return OrderService.load_orders()
        except Exception:
            pass
        if ORDERS_FILE.exists():
            try:
                return json.loads(ORDERS_FILE.read_text(encoding="utf-8"))
            except Exception:
                pass
        return []

    @classmethod
    def get_all_partners(cls) -> List[Dict[str, Any]]:
        partners = cls.load_partners()

        # Build order counts and metrics per partner
        enriched = []
        for p in partners:
            p_code = str(p.get("code", "")).upper()
            p_id = p.get("id")

            partner_orders = cls.get_orders_for_partner(p_id or p_code)

            # Sum revenue from all paid and successful orders
            total_revenue = sum(
                float(
                    o.get("totalAmount")
                    if o.get("totalAmount") is not None
                    else (o.get("total_amount") if o.get("total_amount") is not None else o.get("amount", 0.0))
                )
                for o in partner_orders
                if str(o.get("status") or o.get("order_status") or "").lower() in [
                    "completed", "paid", "settlement", "processing", "process", "diproses", "selesai", "done"
                ]
            )

            pending_comm = sum(
                float(o.get("commission", 0)) for o in partner_orders
                if o.get("commissionStatus") == "pending"
            )

            final_comm = sum(
                float(o.get("commission", 0)) for o in partner_orders
                if o.get("commissionStatus") == "final"
            )

            payouts = p.get("payoutRequests", [])
            paid_commission = sum(
                float(pr.get("amount", 0)) for pr in payouts
                if str(pr.get("status", "")).lower() in ["approved", "completed", "paid"]
            )

            # Network commissions from team
            network_data = cls.get_network_for_partner(p_id or p_code)
            final_net = float(network_data.get("finalNetworkBonus", 0))
            pending_net = float(network_data.get("pendingNetworkBonus", 0))
            net_comm = float(network_data.get("totalNetworkBonus", 0))

            available_unpaid = max(0.0, (final_comm + final_net) - paid_commission)
            total_pending = pending_comm + pending_net

            enriched.append({
                **p,
                "totalOrders": len(partner_orders),
                "totalRevenue": total_revenue,
                "unpaidCommission": available_unpaid,
                "pendingCommission": total_pending,
                "paidCommission": paid_commission,
                "networkCommission": net_comm,
                "_count": {"orders": len(partner_orders)},
            })

        return enriched

    @classmethod
    def find_by_code(cls, code: str) -> Optional[Dict[str, Any]]:
        clean = code.strip().upper()
        try:
            db = SessionLocal()
            try:
                p_obj = db.query(SalesPartner).filter(SalesPartner.code.ilike(clean)).first()
                if p_obj:
                    return p_obj.to_dict()
            finally:
                db.close()
        except Exception:
            pass
        partners = cls.load_partners()
        return next((p for p in partners if str(p.get("code", "")).upper() == clean), None)

    @classmethod
    def find_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        clean = email.strip().lower()
        try:
            db = SessionLocal()
            try:
                p_obj = db.query(SalesPartner).filter(SalesPartner.email.ilike(clean)).first()
                if p_obj:
                    return p_obj.to_dict()
            finally:
                db.close()
        except Exception:
            pass
        partners = cls.load_partners()
        return next((p for p in partners if str(p.get("email", "")).lower() == clean), None)

    @classmethod
    def find_by_id(cls, partner_id: str) -> Optional[Dict[str, Any]]:
        try:
            db = SessionLocal()
            try:
                p_obj = db.query(SalesPartner).filter(SalesPartner.id == str(partner_id)).first()
                if p_obj:
                    return p_obj.to_dict()
            finally:
                db.close()
        except Exception:
            pass
        partners = cls.load_partners()
        return next((p for p in partners if str(p.get("id", "")) == str(partner_id)), None)

    @classmethod
    def get_profile(cls, identifier: Optional[str] = None) -> Dict[str, Any]:
        partners = cls.load_partners()
        partner = None

        if identifier:
            partner = cls.find_by_email(identifier) or cls.find_by_code(identifier) or cls.find_by_id(identifier)

        if not partner:
            return {
                "id": "",
                "code": "",
                "name": "Mitra Sales Tidak Ditemukan",
                "email": "",
                "whatsapp": "",
                "tier": "None",
                "rate": 0,
                "totalClicks": 0,
                "totalOrders": 0,
                "totalRevenue": 0,
                "unpaidCommission": 0,
                "pendingCommission": 0,
                "paidCommission": 0,
                "networkCommission": 0,
                "bankName": "-",
                "bankAccount": "-",
                "status": "inactive",
                "joinedAt": datetime.utcnow().isoformat() + "Z",
                "payoutRequests": [],
            }

        p_code = str(partner.get("code", "")).upper()
        p_id = partner.get("id")

        partner_orders = cls.get_orders_for_partner(p_id or p_code)

        total_revenue = sum(
            float(o.get("totalAmount", 0)) for o in partner_orders
            if str(o.get("status", "")).lower() in ["completed", "paid", "settlement"]
        )

        pending_comm = sum(
            float(o.get("commission", 0)) for o in partner_orders
            if o.get("commissionStatus") == "pending"
        )
        final_comm = sum(
            float(o.get("commission", 0)) for o in partner_orders
            if o.get("commissionStatus") == "final"
        )

        payouts = partner.get("payoutRequests", [])
        paid_comm = sum(
            float(p.get("amount", 0)) for p in payouts
            if str(p.get("status", "")).lower() in ["approved", "completed", "paid"]
        )

        # Network commissions from team
        network_data = cls.get_network_for_partner(p_id or p_code)
        network_comm = float(network_data.get("totalNetworkBonus", 0))
        final_net = float(network_data.get("finalNetworkBonus", 0))
        pending_net = float(network_data.get("pendingNetworkBonus", 0))

        available_unpaid = max(0.0, (final_comm + final_net) - paid_comm)
        total_pending = pending_comm + pending_net

        return {
            "id": partner.get("id"),
            "code": partner.get("code"),
            "name": partner.get("name"),
            "email": partner.get("email"),
            "whatsapp": partner.get("whatsapp"),
            "tier": partner.get("tier", "Standard (10%)"),
            "rate": partner.get("rate", 10),
            "totalClicks": partner.get("totalClicks", 0),
            "totalOrders": len(partner_orders),
            "totalRevenue": total_revenue,
            "unpaidCommission": available_unpaid,
            "pendingCommission": total_pending,
            "paidCommission": paid_comm,
            "networkCommission": network_comm,
            "finalNetworkCommission": final_net,
            "pendingNetworkCommission": pending_net,
            "bankName": partner.get("bankName") or "Bank Central Asia (BCA)",
            "bankAccount": partner.get("bankAccount") or "8965123456",
            "status": partner.get("status", "active"),
            "joinedAt": partner.get("createdAt") or "2026-10-01T00:00:00.000Z",
            "payoutRequests": partner.get("payoutRequests", []),
        }

    @classmethod
    def get_orders_for_partner(cls, identifier: Optional[str] = None) -> List[Dict[str, Any]]:
        partner = None
        if identifier:
            partner = cls.find_by_email(identifier) or cls.find_by_code(identifier) or cls.find_by_id(identifier)
        if not partner:
            partners = cls.load_partners()
            partner = partners[0] if len(partners) > 0 else None

        if not partner:
            return []

        # Resolve active and registered campaigns for dynamic commission booster
        campaign_map = {}
        try:
            from app.services.campaign_service import CampaignService
            for c in CampaignService.get_all_campaigns():
                c_id = str(c.get("id", "")).strip()
                c_slug = str(c.get("slug", "")).strip()
                bonus_pct = float(c.get("affiliateBonusPercent") or c.get("affiliateCommissionOverride") or 15.0)
                meta = {
                    "id": c_id,
                    "name": c.get("name") or c.get("title") or "Campaign Promo",
                    "rate": bonus_pct,
                }
                if c_id:
                    campaign_map[c_id] = meta
                if c_slug:
                    campaign_map[c_slug] = meta
        except Exception:
            pass

        orders = cls.load_orders()
        p_code = str(partner.get("code") or "").strip().upper()
        p_id = str(partner.get("id") or "").strip()

        matched = []
        for o in orders:
            o_code = str(o.get("referralCode") or o.get("referral_code") or "").strip().upper()
            o_pid = str(o.get("salesPartnerId") or o.get("sales_partner_id") or "").strip()
            notes = str(o.get("customerNotes") or o.get("customer_notes") or "").upper()
            if (p_code and (o_code == p_code or f"[SALES REF: {p_code}]" in notes)) or (p_id and o_pid == p_id):
                matched.append(o)

        # Fetch existing commissions from database for these orders
        comm_map = {}
        try:
            db = SessionLocal()
            try:
                db_comms = db.query(Commission).filter(Commission.partner_id == p_id).all()
                for c in db_comms:
                    comm_map[str(c.order_id).strip().upper()] = c
            finally:
                db.close()
        except Exception as e:
            print(f"[PartnerService] Warning querying commissions: {e}")

        # Map to expected frontend schema with privacy masking
        result = []
        now = datetime.utcnow()

        for o in matched:
            clean_id = str(o.get("id", "")).strip().upper()
            email = o.get("customerEmail") or o.get("customer_email") or "buyer@asterra.store"
            masked_email = email[:2] + "***@" + email.split("@")[1] if "@" in email else "Pelanggan"
            cust_name = o.get("customerName") or o.get("customer_name") or "Pelanggan"
            masked_name = cust_name[0] + "***" if len(cust_name) > 1 else cust_name

            items = o.get("items", [])
            prod_names = ", ".join(i.get("productName") or i.get("product_name") or "Layanan" for i in items) or "Produk Digital"
            total = float(
                o.get("totalAmount")
                if o.get("totalAmount") is not None
                else (o.get("total_amount") if o.get("total_amount") is not None else o.get("amount", 0.0))
            )

            o_status = str(o.get("status") or o.get("order_status") or "").lower()

            # If commission record is missing in DB for completed order, auto-sync it idempotently
            comm_rec = comm_map.get(clean_id)
            if not comm_rec and o_status in ["completed", "paid", "settlement"]:
                try:
                    from app.services.referral_profit_service import ReferralProfitService
                    ReferralProfitService.sync_order_commissions_and_ledger(clean_id, o_status)
                    db = SessionLocal()
                    try:
                        comm_rec = db.query(Commission).filter(Commission.order_id == clean_id).first()
                        if comm_rec:
                            comm_map[clean_id] = comm_rec
                    finally:
                        db.close()
                except Exception as e:
                    print(f"[PartnerService] Auto-sync missing commission for {clean_id}: {e}")

            camp_key = str(
                o.get("campaignId") or o.get("campaign_id") or
                o.get("campaign_slug") or o.get("campaignSlug") or
                o.get("campaign") or o.get("utm_campaign") or ""
            ).strip()
            camp_discount = float(o.get("campaignDiscount") or o.get("campaign_discount") or 0)
            is_campaign_sale = bool(camp_key) or (camp_discount > 0)
            camp_meta = campaign_map.get(camp_key, {}) if camp_key else {}
            if not camp_meta and camp_key:
                for k, v in campaign_map.items():
                    if k.lower() == camp_key.lower():
                        camp_meta = v
                        break

            if is_campaign_sale:
                campaign_rate = (
                    float(comm_rec.commission_rate)
                    if (comm_rec and comm_rec.commission_rate and comm_rec.commission_rate > 0)
                    else (camp_meta.get("rate") or float(o.get("campaignRate") or o.get("commissionRate") or 15.0))
                )
                commission_rate = campaign_rate
                campaign_name = camp_meta.get("name") or o.get("campaignName") or (f"Promo Campaign ({camp_key})" if camp_key else "Promo Campaign Spesial")
            else:
                campaign_rate = None
                commission_rate = float(comm_rec.commission_rate if (comm_rec and comm_rec.commission_rate) else partner.get("rate", 10.0))
                campaign_name = None

            trans_profit = int(comm_rec.transaction_profit) if (comm_rec and comm_rec.transaction_profit is not None) else max(0, round(total * 0.35))
            commission = int(comm_rec.commission_amount) if (comm_rec and comm_rec.commission_amount is not None) else round(trans_profit * (commission_rate / 100.0))

            created_at_val = o.get("createdAt") or o.get("created_at") or (now.isoformat() + "Z")
            if isinstance(created_at_val, str) and not created_at_val.endswith("Z"):
                created_at_val = created_at_val + "Z"

            # Parse order created datetime for 3-day warranty check
            try:
                dt_str = created_at_val.replace("Z", "+00:00")
                parsed_created = datetime.fromisoformat(dt_str)
                if parsed_created.tzinfo is not None:
                    parsed_created = parsed_created.replace(tzinfo=None)
            except Exception:
                parsed_created = now

            holding_until_dt = (comm_rec.holding_until if (comm_rec and comm_rec.holding_until) else (parsed_created + timedelta(days=3)))

            if comm_rec and comm_rec.status:
                comm_status = comm_rec.status
            elif o_status in ["cancelled", "refunded", "expired", "failed", "batal"]:
                comm_status = "reversed"
            elif o_status in ["completed", "paid", "settlement", "done", "selesai"]:
                comm_status = "final" if now >= holding_until_dt else "pending"
            elif o_status in ["processing", "process", "diproses"]:
                comm_status = "pending"
            else:
                comm_status = "pending"

            holding_until_iso = holding_until_dt.isoformat() + "Z" if holding_until_dt else (now + timedelta(days=3)).isoformat() + "Z"

            result.append({
                "id": o.get("id"),
                "createdAt": created_at_val,
                "customerEmail": masked_email,
                "customerName": masked_name,
                "totalAmount": total,
                "transactionProfit": trans_profit,
                "status": o.get("status", "completed"),
                "paymentStatus": o.get("paymentStatus", "PAID"),
                "commission": commission,
                "commissionRate": commission_rate,
                "isCampaignSale": is_campaign_sale,
                "campaignId": (camp_meta.get("id") or camp_key) if is_campaign_sale else None,
                "campaignName": campaign_name,
                "campaignRate": campaign_rate,
                "commissionStatus": comm_status,
                "holdingUntil": holding_until_iso,
                "itemsCount": len(items) if len(items) > 0 else 1,
                "productNames": prod_names,
            })

        return result

    @classmethod
    def get_network_for_partner(cls, identifier: Optional[str] = None) -> Dict[str, Any]:
        partner = None
        if identifier:
            partner = cls.find_by_email(identifier) or cls.find_by_code(identifier) or cls.find_by_id(identifier)
        if not partner:
            partners = cls.load_partners()
            partner = partners[0] if len(partners) > 0 else None

        from app.services.partner_network import calculate_partner_network
        return calculate_partner_network(partner, cls.load_partners(), cls.load_orders())


    @classmethod
    def register_partner(cls, payload: Dict[str, Any], require_otp: bool = True) -> Dict[str, Any]:
        partners = cls.load_partners()
        name = payload.get("name", "").strip()
        email = payload.get("email", "").strip().lower()
        whatsapp = payload.get("whatsapp", "").strip()
        custom_code = payload.get("customCode") or payload.get("code")
        ref_by = payload.get("referredByCode") or payload.get("referralCode")

        if not name:
            return {"success": False, "message": "Nama lengkap wajib diisi."}
        if not email or "@" not in email:
            return {"success": False, "message": "Format alamat email tidak valid."}
        if not whatsapp:
            return {"success": False, "message": "Nomor WhatsApp wajib diisi."}

        # Check existing active partner
        existing = next(
            (p for p in partners if (p.get("email", "").lower() == email or p.get("whatsapp") == whatsapp) and str(p.get("status", "")).lower() in ["active", "aktif"]),
            None
        )
        if existing:
            return {"success": False, "message": f"Akun sales dengan email/WhatsApp ini sudah aktif (Kode: {existing.get('code')}). Silakan langsung masuk."}

        # If OTP verification is required (public registration flow)
        if require_otp:
            from app.core.cache import SmartCache
            from app.services.email_service import EmailService

            # Generate 6-digit cryptographic random OTP
            otp_code = f"{secrets.randbelow(900000) + 100000}"
            now = time.time()
            pending_data = {
                "name": name,
                "email": email,
                "whatsapp": whatsapp,
                "password": str(payload.get("password") or "AsterraSales#2026").strip(),
                "customCode": custom_code,
                "referralCode": ref_by,
                "bankName": payload.get("bankName") or "Bank Central Asia (BCA)",
                "bankAccount": payload.get("bankAccount") or "-",
                "otp": otp_code,
                "attempts": 0,
                "createdAt": now,
                "expiresAt": now + 600,  # 10 minutes
                "lastResendAt": now,
            }

            # Store in local memory and Upstash Redis cache
            cls._pending_registrations[email] = pending_data
            SmartCache.set("sales_reg_otp", email, pending_data, ttl=600)

            # Send email with branded template
            EmailService.send_otp_email(to_email=email, recipient_name=name, otp_code=otp_code)

            return {
                "success": True,
                "requireOtp": True,
                "email": email,
                "message": f"Kode OTP verifikasi telah dikirim ke email {email}. Silakan masukkan kode untuk mengaktifkan akun.",
            }

        # Direct activation path (admin creation or bypassed OTP)
        return cls._activate_partner_account(payload)

    @classmethod
    def verify_partner_otp(cls, email: str, otp: str) -> Dict[str, Any]:
        from app.core.cache import SmartCache
        email = str(email or "").strip().lower()
        otp = str(otp or "").strip()

        if not email or not otp:
            return {"success": False, "message": "Email dan kode OTP wajib diisi."}

        # Retrieve pending registration
        pending = cls._pending_registrations.get(email)
        if not pending:
            cached = SmartCache.get("sales_reg_otp", email)
            if cached and isinstance(cached, dict):
                pending = cached

        if not pending:
            return {
                "success": False,
                "message": "Sesi pendaftaran tidak ditemukan atau sudah kedaluwarsa. Silakan daftar kembali.",
            }

        # Check expiration (10 minutes)
        if time.time() > pending.get("expiresAt", 0):
            return {
                "success": False,
                "message": "Kode OTP telah kedaluwarsa. Silakan klik 'Kirim Ulang OTP'.",
            }

        # Check maximum failed attempts
        if pending.get("attempts", 0) >= 5:
            return {
                "success": False,
                "message": "Terlalu banyak percobaan kode salah. Silakan minta kode OTP baru.",
            }

        # Verify OTP code
        if str(pending.get("otp")) != otp:
            pending["attempts"] = pending.get("attempts", 0) + 1
            cls._pending_registrations[email] = pending
            SmartCache.set("sales_reg_otp", email, pending, ttl=600)
            remaining = max(0, 5 - pending["attempts"])
            return {
                "success": False,
                "message": f"Kode OTP tidak cocok. Sisa kesempatan: {remaining} kali.",
            }

        # OTP is verified! Activate account
        result = cls._activate_partner_account(pending)
        if result.get("success"):
            # Clean up pending OTP
            cls._pending_registrations.pop(email, None)
            SmartCache.set("sales_reg_otp", email, None, ttl=1)

            # Issue authenticated session token
            from app.core.auth import create_admin_session_token
            partner = result.get("partner") or {}
            token = create_admin_session_token(
                id_val=partner.get("id", f"partner-{int(time.time())}"),
                email=email,
                role="sales",
                name=partner.get("name", ""),
            )
            result["token"] = token
            result["message"] = "Verifikasi email berhasil! Akun mitra sales Anda telah aktif."

        return result

    @classmethod
    def resend_partner_otp(cls, email: str) -> Dict[str, Any]:
        from app.core.cache import SmartCache
        from app.services.email_service import EmailService

        email = str(email or "").strip().lower()
        if not email:
            return {"success": False, "message": "Alamat email wajib diisi."}

        pending = cls._pending_registrations.get(email)
        if not pending:
            cached = SmartCache.get("sales_reg_otp", email)
            if cached and isinstance(cached, dict):
                pending = cached

        if not pending:
            return {
                "success": False,
                "message": "Data pendaftaran tidak ditemukan atau sudah kedaluwarsa. Silakan daftar kembali.",
            }

        # Rate limit cooldown: 60 seconds
        now = time.time()
        elapsed = now - pending.get("lastResendAt", 0)
        if elapsed < 60:
            return {
                "success": False,
                "message": f"Harap tunggu {int(60 - elapsed)} detik sebelum meminta kode baru.",
            }

        # Generate new OTP code
        new_otp = f"{secrets.randbelow(900000) + 100000}"
        pending["otp"] = new_otp
        pending["attempts"] = 0
        pending["expiresAt"] = now + 600
        pending["lastResendAt"] = now

        cls._pending_registrations[email] = pending
        SmartCache.set("sales_reg_otp", email, pending, ttl=600)

        # Dispatch email
        EmailService.send_otp_email(
            to_email=email,
            recipient_name=pending.get("name", "Mitra Sales"),
            otp_code=new_otp
        )

        return {
            "success": True,
            "message": f"Kode OTP baru telah berhasil dikirim ke email {email}.",
        }

    @classmethod
    def _activate_partner_account(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        partners = cls.load_partners()
        name = payload.get("name", "").strip()
        email = payload.get("email", "").strip().lower()
        whatsapp = payload.get("whatsapp", "").strip()
        custom_code = payload.get("customCode") or payload.get("code")
        ref_by = payload.get("referralCode") or payload.get("referredByCode")

        # Find recruiter if provided
        recruiter_id = None
        if ref_by:
            recruiter = cls.find_by_code(ref_by)
            if recruiter:
                recruiter_id = recruiter.get("id")

        if not custom_code:
            code_prefix = name.split()[0].replace("-", "").upper()[:6]
            custom_code = f"AST-{code_prefix}-{len(partners) + 1}MD"
        else:
            custom_code = custom_code.strip().upper()

        now_iso = datetime.utcnow().isoformat() + "Z"
        new_partner = {
            "id": f"partner-{int(datetime.utcnow().timestamp() * 1000)}",
            "name": name,
            "email": email,
            "whatsapp": whatsapp,
            "code": custom_code,
            "tier": "Standard (10%)",
            "rate": 10,
            "totalClicks": 0,
            "bankName": payload.get("bankName") or "Bank Central Asia (BCA)",
            "bankAccount": payload.get("bankAccount") or "-",
            "status": "active",
            "referredById": recruiter_id,
            "createdAt": now_iso,
            "updatedAt": now_iso,
            "commissions": [],
            "payoutRequests": [],
        }

        # 1. Persist to PostgreSQL sales_partners table
        try:
            db = SessionLocal()
            try:
                # Remove any existing inactive partner record with same email
                existing_p = db.query(SalesPartner).filter(SalesPartner.email.ilike(email)).first()
                if existing_p:
                    existing_p.name = name
                    existing_p.whatsapp = whatsapp
                    existing_p.code = custom_code
                    existing_p.status = "active"
                    existing_p.referred_by_id = recruiter_id
                    new_partner["id"] = existing_p.id
                else:
                    p_obj = SalesPartner(
                        id=new_partner["id"],
                        name=name,
                        email=email,
                        whatsapp=whatsapp,
                        code=custom_code,
                        tier="Standard (10%)",
                        rate=10,
                        total_clicks=0,
                        bank_name=new_partner["bankName"],
                        bank_account=new_partner["bankAccount"],
                        status="active",
                        referred_by_id=recruiter_id,
                    )
                    db.add(p_obj)
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[PartnerService] Error persisting partner to DB: {e}")

        # Update JSON store
        cls._partners = [p for p in partners if p.get("email", "").lower() != email]
        cls._partners.append(new_partner)
        cls.save_partners()

        # 2. Persist sales account directly to AdminUser table with secure password hash
        raw_pass = str(payload.get("password") or "AsterraSales#2026").strip()
        username = f"sales-{custom_code.lower().replace('-', '')}"
        try:
            from app.core.security import get_password_hash
            from app.models.admin_user import AdminUser
            pw_hash = get_password_hash(raw_pass)

            db = SessionLocal()
            try:
                existing_admin = db.query(AdminUser).filter(
                    (AdminUser.email.ilike(email)) | (AdminUser.username.ilike(username))
                ).first()
                if existing_admin:
                    existing_admin.password_hash = pw_hash
                    existing_admin.role = "sales"
                    existing_admin.is_active = True
                    db.commit()
                else:
                    admin_rec = AdminUser(
                        id=f"adm-sales-{int(datetime.utcnow().timestamp())}",
                        username=username,
                        email=email,
                        name=name,
                        password_hash=pw_hash,
                        role="sales",
                        is_active=True,
                    )
                    db.add(admin_rec)
                    db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[PartnerService] Error creating AdminUser for partner: {e}")

        # Refresh admin user cache
        from app.services.admin_user_service import AdminUserService
        AdminUserService.load_admins(force_reload=True)

        return {"success": True, "message": "Pendaftaran mitra sales berhasil!", "partner": new_partner}

    @classmethod
    def sync_missing_sales_admins(cls) -> int:
        """Ensures every registered partner has an active sales AdminUser account for seamless login."""
        from app.core.security import get_password_hash
        from app.models.admin_user import AdminUser
        partners = cls.load_partners()
        synced_count = 0
        try:
            db = SessionLocal()
            try:
                for p in partners:
                    p_email = str(p.get("email", "")).strip().lower()
                    p_code = str(p.get("code", "")).strip().upper()
                    p_name = p.get("name") or f"Sales {p_code}"
                    if not p_email:
                        continue
                    username = f"sales-{p_code.lower().replace('-', '')}"

                    existing = db.query(AdminUser).filter(
                        (AdminUser.email.ilike(p_email)) | (AdminUser.username.ilike(username))
                    ).first()

                    if not existing:
                        default_hash = get_password_hash("AsterraSales#2026")
                        new_sales_user = AdminUser(
                            id=f"adm-sales-{int(datetime.utcnow().timestamp())}-{p_code[:4]}",
                            username=username,
                            email=p_email,
                            name=p_name,
                            password_hash=default_hash,
                            role="sales",
                            is_active=True,
                        )
                        db.add(new_sales_user)
                        db.commit()
                        synced_count += 1
            finally:
                db.close()
        except Exception as e:
            print(f"[PartnerService] Error syncing missing sales admins: {e}")

        if synced_count > 0:
            from app.services.admin_user_service import AdminUserService
            AdminUserService.load_admins(force_reload=True)
        return synced_count

    @classmethod
    def submit_payout(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        partners = cls.load_partners()
        partner_id = payload.get("partnerId")
        amount = float(payload.get("amount", 0))

        partner = next((p for p in partners if p.get("id") == partner_id or p.get("code") == partner_id), None)
        if not partner and len(partners) > 0:
            partner = partners[0]

        if not partner:
            return {"success": False, "message": "Mitra sales tidak ditemukan"}

        req = {
            "id": f"payreq-{int(datetime.utcnow().timestamp())}",
            "amount": amount,
            "bankName": payload.get("bankName") or partner.get("bankName", "BCA"),
            "bankAccount": payload.get("bankAccount") or partner.get("bankAccount", "1234567890"),
            "bankAccountName": payload.get("bankAccountName") or partner.get("name"),
            "status": "pending",
            "requestedAt": datetime.utcnow().isoformat() + "Z",
            "notes": payload.get("notes", "Pencairan komisi kemitraan sales"),
        }

        if "payoutRequests" not in partner:
            partner["payoutRequests"] = []
        partner["payoutRequests"].insert(0, req)
        cls.save_partners()

        return {"success": True, "message": "Permintaan pencairan komisi berhasil diajukan dan sedang diproses.", "request": req}
