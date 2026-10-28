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
from app.models.payout_request import PayoutRequest

def mask_customer_name(name: Optional[str]) -> str:
    """
    Asterra Store customer privacy masking:
    - "Marchelino Kurniawan" -> "Mar***no"
    - "Andi" -> "A***"
    - "Bo" -> "B***"
    - None / "" -> ""
    """
    if not name or not str(name).strip():
        return ""
    clean = str(name).strip()
    words = clean.split()
    first_word = words[0] if words else clean
    if len(first_word) <= 4:
        return first_word[0] + "***"
    return first_word[:3] + "***" + first_word[-2:]

class PartnerService:
    _partners: Optional[List[Dict[str, Any]]] = None
    _last_loaded: Optional[datetime] = None
    _pending_registrations: Dict[str, Dict[str, Any]] = {}

    @classmethod
    def load_partners(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        Loads partners directly from Supabase PostgreSQL sales_partners table.
        """
        now = datetime.utcnow()
        if (
            cls._partners is not None
            and not force_reload
            and cls._last_loaded is not None
            and (now - cls._last_loaded).total_seconds() < 5
        ):
            return cls._partners

        # Query Supabase PostgreSQL
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    db_partners = db.query(SalesPartner).order_by(SalesPartner.created_at.asc()).all()
                    db_payouts = db.query(PayoutRequest).order_by(PayoutRequest.created_at.desc()).all()
                    payouts_by_partner: Dict[str, List[Dict[str, Any]]] = {}
                    for pr in db_payouts:
                        payouts_by_partner.setdefault(pr.partner_id, []).append(pr.to_dict())

                    if db_partners is not None:
                        data = []
                        for p in db_partners:
                            p_dict = p.to_dict()
                            p_dict["payoutRequests"] = payouts_by_partner.get(p.id, [])
                            data.append(p_dict)
                        cls._partners = data
                        cls._last_loaded = datetime.utcnow()
                        return data
                finally:
                    db.close()
        except Exception as e:
            print(f"[PartnerService] Warning: Supabase query failed: {e}")

        cls._partners = []
        return []

    @classmethod
    def save_partners(cls) -> bool:
        """In-memory cache management - no JSON file persistence."""
        return True

    @classmethod
    def load_orders(cls) -> List[Dict[str, Any]]:
        try:
            from app.services.order_service import OrderService
            return OrderService.load_orders()
        except Exception:
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
            pending_payouts = sum(
                float(pr.get("amount", 0)) for pr in payouts
                if str(pr.get("status", "")).lower() == "pending"
            )

            # Network commissions from team
            network_data = cls.get_network_for_partner(p_id or p_code)
            final_net = float(network_data.get("finalNetworkBonus", 0))
            pending_net = float(network_data.get("pendingNetworkBonus", 0))
            net_comm = float(network_data.get("totalNetworkBonus", 0))

            available_unpaid = max(0.0, (final_comm + final_net) - paid_commission - pending_payouts)
            total_pending = pending_comm + pending_net

            total_orders_count = len(partner_orders)
            raw_tier = str(p.get("tier", "")).strip().lower()
            if total_orders_count >= 50 or "vip" in raw_tier or p.get("rate") == 20:
                eff_tier = "VIP (20%)"
                eff_rate = 20
            else:
                eff_tier = "Standard (15%)"
                eff_rate = max(15, int(p.get("rate", 15) or 15))

            enriched.append({
                **p,
                "tier": eff_tier,
                "rate": eff_rate,
                "totalOrders": total_orders_count,
                "totalRevenue": total_revenue,
                "unpaidCommission": available_unpaid,
                "pendingCommission": total_pending,
                "paidCommission": paid_commission,
                "pendingPayouts": pending_payouts,
                "networkCommission": net_comm,
                "_count": {"orders": total_orders_count},
            })

        return enriched

    @classmethod
    def find_by_identifier(cls, identifier: str) -> Optional[Dict[str, Any]]:
        clean = identifier.strip().lower()
        clean_upper = clean.upper()
        clean_stripped = clean.replace("-", "")
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    p_obj = db.query(SalesPartner).filter(
                        (SalesPartner.email.ilike(clean))
                        | (SalesPartner.code.ilike(clean_upper))
                        | (SalesPartner.code.ilike(clean))
                        | (SalesPartner.code.ilike(f"AST-{clean_upper}"))
                        | (SalesPartner.code.ilike(f"AST-{clean_upper.replace('AST', '').lstrip('-')}"))
                    ).first()
                    if p_obj:
                        p_dict = p_obj.to_dict()
                        db_payouts = db.query(PayoutRequest).filter(PayoutRequest.partner_id == p_obj.id).order_by(PayoutRequest.created_at.desc()).all()
                        p_dict["payoutRequests"] = [pr.to_dict() for pr in db_payouts]
                        return p_dict
                finally:
                    db.close()
        except Exception as e:
            print(f"[PartnerService] DB find_by_identifier note: {e}")

        partners = cls.load_partners(force_reload=True)
        return next(
            (
                p for p in partners
                if str(p.get("email", "")).lower() == clean
                or str(p.get("code", "")).upper() == clean_upper
                or str(p.get("code", "")).lower() == clean
                or str(p.get("code", "")).upper().replace("-", "") == clean_stripped.upper()
            ),
            None,
        )

    @classmethod
    def find_by_code(cls, code: str) -> Optional[Dict[str, Any]]:
        return cls.find_by_identifier(code)

    @classmethod
    def find_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        clean = email.strip().lower()
        try:
            db = SessionLocal()
            try:
                p_obj = db.query(SalesPartner).filter(SalesPartner.email.ilike(clean)).first()
                if p_obj:
                    p_dict = p_obj.to_dict()
                    db_payouts = db.query(PayoutRequest).filter(PayoutRequest.partner_id == p_obj.id).order_by(PayoutRequest.created_at.desc()).all()
                    p_dict["payoutRequests"] = [pr.to_dict() for pr in db_payouts]
                    return p_dict
            finally:
                db.close()
        except Exception:
            pass
        partners = cls.load_partners(force_reload=True)
        return next((p for p in partners if str(p.get("email", "")).lower() == clean), None)

    @classmethod
    def find_by_id(cls, partner_id: str) -> Optional[Dict[str, Any]]:
        try:
            db = SessionLocal()
            try:
                p_obj = db.query(SalesPartner).filter(SalesPartner.id == str(partner_id)).first()
                if p_obj:
                    p_dict = p_obj.to_dict()
                    db_payouts = db.query(PayoutRequest).filter(PayoutRequest.partner_id == p_obj.id).order_by(PayoutRequest.created_at.desc()).all()
                    p_dict["payoutRequests"] = [pr.to_dict() for pr in db_payouts]
                    return p_dict
            finally:
                db.close()
        except Exception:
            pass
        partners = cls.load_partners(force_reload=True)
        return next((p for p in partners if str(p.get("id", "")) == str(partner_id)), None)

    @classmethod
    def get_profile(cls, identifier: Optional[str] = None) -> Dict[str, Any]:
        partner = None

        if identifier:
            partner = cls.find_by_email(identifier) or cls.find_by_code(identifier) or cls.find_by_id(identifier)

        if not partner:
            partners = cls.load_partners(force_reload=True)
            if identifier:
                clean_id = str(identifier).strip().lower()
                partner = next(
                    (p for p in partners if str(p.get("id", "")).lower() == clean_id or str(p.get("code", "")).lower() == clean_id or str(p.get("email", "")).lower() == clean_id),
                    None
                )
            if not partner and not identifier and partners:
                partner = partners[0]

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

        # Always ensure fresh payouts from DB if available
        try:
            db = SessionLocal()
            try:
                db_payouts = db.query(PayoutRequest).filter(PayoutRequest.partner_id == p_id).order_by(PayoutRequest.created_at.desc()).all()
                if db_payouts is not None:
                    partner["payoutRequests"] = [pr.to_dict() for pr in db_payouts]
            finally:
                db.close()
        except Exception:
            pass

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
        pending_payouts = sum(
            float(p.get("amount", 0)) for p in payouts
            if str(p.get("status", "")).lower() == "pending"
        )

        # Network commissions from team
        network_data = cls.get_network_for_partner(p_id or p_code)
        network_comm = float(network_data.get("totalNetworkBonus", 0))
        final_net = float(network_data.get("finalNetworkBonus", 0))
        pending_net = float(network_data.get("pendingNetworkBonus", 0))

        available_unpaid = max(0.0, (final_comm + final_net) - paid_comm - pending_payouts)
        total_pending = pending_comm + pending_net

        total_orders_count = len(partner_orders)
        if total_orders_count >= 50:
            effective_tier = "VIP (20%)"
            effective_rate = 20
        else:
            raw_tier = str(partner.get("tier", "")).strip()
            if "vip" in raw_tier.lower() or raw_tier.startswith("VIP"):
                effective_tier = "VIP (20%)"
                effective_rate = 20
            else:
                effective_tier = "Standard (15%)"
                effective_rate = 20 if partner.get("rate") == 20 else max(15, int(partner.get("rate", 15) or 15))

        return {
            "id": partner.get("id"),
            "code": partner.get("code"),
            "name": partner.get("name"),
            "email": partner.get("email"),
            "whatsapp": partner.get("whatsapp"),
            "tier": effective_tier,
            "rate": effective_rate,
            "totalClicks": partner.get("totalClicks", 0),
            "totalOrders": total_orders_count,
            "totalRevenue": total_revenue,
            "unpaidCommission": available_unpaid,
            "pendingCommission": total_pending,
            "paidCommission": paid_comm,
            "pendingPayouts": pending_payouts,
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
            email = str(o.get("customerEmail") or o.get("customer_email") or "").strip()
            if "@" in email:
                local_part, domain_part = email.split("@", 1)
                masked_email = (local_part[:2] if len(local_part) >= 2 else local_part[0]) + "***@" + domain_part
            else:
                masked_email = ""
            cust_name = o.get("customerName") or o.get("customer_name") or ""
            masked_name = mask_customer_name(cust_name)

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
                fallback_rate = 20.0 if (partner.get("rate") == 20 or len(matched) >= 50) else 15.0
                commission_rate = float(comm_rec.commission_rate if (comm_rec and comm_rec.commission_rate) else partner.get("rate", fallback_rate))
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
        from app.services.partner_network import calculate_partner_network
        if not partner:
            return calculate_partner_network(None, [], [])

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
            "tier": "Standard (15%)",
            "rate": 15,
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
                        tier="Standard (15%)",
                        rate=15,
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
                    else:
                        needs_repair = False
                        if not existing.password_hash or len(existing.password_hash) < 10:
                            existing.password_hash = get_password_hash("AsterraSales#2026")
                            needs_repair = True
                        if not existing.is_active:
                            existing.is_active = True
                            needs_repair = True
                        if existing.role != "sales":
                            existing.role = "sales"
                            needs_repair = True
                        if needs_repair:
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
    def submit_payout(
        cls,
        payload: Dict[str, Any],
        authenticated_partner: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        # 1. Partner identification
        if authenticated_partner:
            partner = authenticated_partner
        else:
            partner_id = payload.get("partnerId") or payload.get("id")
            partners = cls.load_partners()
            partner = next(
                (p for p in partners if p.get("id") == partner_id or p.get("code") == partner_id or p.get("email") == partner_id),
                None
            )

        if not partner:
            return {"success": False, "message": "Akun mitra sales tidak ditemukan atau belum terdaftar."}

        # 2. Amount validation
        try:
            raw_amount = payload.get("amount")
            if raw_amount is None:
                return {"success": False, "message": "Nominal penarikan komisi wajib diisi."}
            amount = int(float(raw_amount))
        except (ValueError, TypeError):
            return {"success": False, "message": "Nominal penarikan harus berupa angka yang valid."}

        if amount < 50000:
            return {"success": False, "message": "Minimal penarikan komisi adalah Rp 50.000 sesuai kebijakan Asterra Store."}

        # 3. Bank / E-Wallet validation
        raw_bank = payload.get("bankName")
        raw_account = payload.get("bankAccount")
        raw_holder = payload.get("bankAccountName")

        bank_name = str(raw_bank if raw_bank is not None else partner.get("bankName") or "").strip()
        bank_account = str(raw_account if raw_account is not None else partner.get("bankAccount") or "").strip()
        bank_account_name = str(raw_holder if raw_holder is not None else partner.get("name") or "").strip()
        notes = str(payload.get("notes") or "").strip()

        if not bank_name or bank_name == "-":
            return {"success": False, "message": "Metode pencairan (Bank / E-Wallet) wajib dipilih."}
        if not bank_account or bank_account == "-":
            return {"success": False, "message": "Nomor rekening atau nomor e-wallet tujuan wajib diisi."}
        if not bank_account_name or bank_account_name == "-":
            return {"success": False, "message": "Nama pemilik rekening wajib diisi."}

        # 4. Check available balance (unpaidCommission minus pending payouts)
        profile = cls.get_profile(partner.get("id") or partner.get("code"))
        available_unpaid = float(profile.get("unpaidCommission", 0))

        if amount > available_unpaid:
            formatted_avail = f"{int(available_unpaid):,}".replace(",", ".")
            return {
                "success": False,
                "message": f"Saldo komisi siap ditarik tidak mencukupi (Tersedia: Rp {formatted_avail}). Saldo masa garansi 3 hari belum dapat dicairkan.",
            }

        # 5. Anti-duplicate / debounce check
        partner_payouts = partner.get("payoutRequests", [])
        if partner_payouts:
            recent_pending = next(
                (p for p in partner_payouts if p.get("status") == "pending" and int(p.get("amount", 0)) == amount and p.get("bankAccount") == bank_account),
                None
            )
            if recent_pending:
                return {
                    "success": False,
                    "message": "Pengajuan penarikan serupa sedang menunggu verifikasi admin. Mohon tunggu hingga proses selesai.",
                }

        # 6. Save PayoutRequest to Database
        req_id = f"payreq-{int(datetime.utcnow().timestamp())}-{secrets.token_hex(2)}"
        req_dict = {
            "id": req_id,
            "partnerId": partner.get("id"),
            "amount": amount,
            "bankName": bank_name,
            "bankAccount": bank_account,
            "bankAccountName": bank_account_name,
            "status": "pending",
            "notes": notes if notes else "Pencairan komisi kemitraan sales",
            "requestedAt": datetime.utcnow().isoformat() + "Z",
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "processedAt": None,
        }

        try:
            db = SessionLocal()
            try:
                db_payout = PayoutRequest(
                    id=req_id,
                    partner_id=partner.get("id"),
                    amount=amount,
                    bank_name=bank_name,
                    bank_account=bank_account,
                    bank_account_name=bank_account_name,
                    status="pending",
                    notes=notes if notes else "Pencairan komisi kemitraan sales",
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(db_payout)
                db.commit()
                req_dict = db_payout.to_dict()
            finally:
                db.close()
        except Exception as db_err:
            print(f"[PartnerService] Warning: Failed to insert PayoutRequest into DB, using fallback: {db_err}")

        # Update in-memory & fallback JSON
        if "payoutRequests" not in partner:
            partner["payoutRequests"] = []
        partner["payoutRequests"].insert(0, req_dict)
        cls.save_partners()
        cls._last_loaded = None
        cls.load_partners(force_reload=True)

        # 7. Record Audit Log
        try:
            from app.services.audit_log_service import AuditLogService
            AuditLogService.record_log(
                order_id=req_dict["id"],
                actor="sales",
                action="payout_requested",
                previous_status=None,
                new_status="pending",
                notes=f"Pengajuan penarikan komisi {req_dict['id']} sebesar Rp {amount:,.0f} oleh {partner.get('name', 'Sales')} ({bank_name} - {bank_account})".replace(",", "."),
                customer_name=partner.get("name", "Sales Partner"),
                customer_email=partner.get("email"),
                created_at=req_dict.get("createdAt") or req_dict.get("requestedAt"),
            )
        except Exception as log_err:
            print(f"[PartnerService] Audit log note on submit_payout: {log_err}")

        return {
            "success": True,
            "message": "Permintaan pencairan komisi berhasil diajukan dan sedang diproses admin.",
            "request": req_dict,
            "data": req_dict,
            "partner": partner,
        }

    @classmethod
    def get_all_payout_requests(cls, status: Optional[str] = None) -> List[Dict[str, Any]]:
        partners = cls.load_partners()
        partner_map = {p.get("id"): p for p in partners}

        payouts: List[Dict[str, Any]] = []
        try:
            db = SessionLocal()
            try:
                query = db.query(PayoutRequest).order_by(PayoutRequest.created_at.desc())
                if status and status.lower() != "all":
                    query = query.filter(PayoutRequest.status.ilike(status))
                db_payouts = query.all()
                payouts = [pr.to_dict() for pr in db_payouts]
            finally:
                db.close()
        except Exception as db_err:
            print(f"[PartnerService] DB error in get_all_payout_requests, using local fallback: {db_err}")
            for p in partners:
                for pr in p.get("payoutRequests", []):
                    if not status or status.lower() == "all" or str(pr.get("status", "")).lower() == status.lower():
                        payouts.append(pr)
            payouts.sort(key=lambda x: x.get("createdAt") or x.get("requestedAt") or "", reverse=True)

        # Enrich with partner details
        enriched = []
        for pr in payouts:
            p = partner_map.get(pr.get("partnerId"))
            enriched.append({
                **pr,
                "partnerName": p.get("name") if p else pr.get("bankAccountName", "Mitra Sales"),
                "partnerEmail": p.get("email") if p else "",
                "partnerCode": p.get("code") if p else "",
                "partnerWhatsapp": p.get("whatsapp") if p else "",
                "partnerTier": p.get("tier") if p else "Standard",
                "partnerRate": p.get("rate") if p else 10,
            })
        return enriched

    @classmethod
    def process_payout_action(
        cls,
        payout_id: str,
        action: str,
        admin_name: str = "Admin Asterra",
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        action_clean = action.strip().lower()
        new_status = "completed" if action_clean in ["approve", "approved", "completed", "paid"] else "rejected"

        updated_dict = None
        try:
            db = SessionLocal()
            try:
                pr_model = db.query(PayoutRequest).filter(PayoutRequest.id == payout_id).first()
                if not pr_model:
                    return {"success": False, "message": f"Pengajuan payout '{payout_id}' tidak ditemukan."}
                if pr_model.status != "pending":
                    return {"success": False, "message": f"Pengajuan payout ini sudah berstatus '{pr_model.status}' dan tidak dapat diproses ulang."}

                pr_model.status = new_status
                pr_model.processed_at = datetime.utcnow()
                pr_model.updated_at = datetime.utcnow()
                if notes:
                    existing_notes = pr_model.notes or ""
                    pr_model.notes = f"{existing_notes} [Admin: {notes}]".strip()
                db.commit()
                updated_dict = pr_model.to_dict()
            finally:
                db.close()
        except Exception as db_err:
            print(f"[PartnerService] DB error in process_payout_action: {db_err}")

        # Update in-memory partner data
        partners = cls.load_partners(force_reload=True)
        if not updated_dict:
            # Fallback for offline
            for p in partners:
                for pr in p.get("payoutRequests", []):
                    if pr.get("id") == payout_id:
                        if pr.get("status") != "pending":
                            return {"success": False, "message": f"Pengajuan sudah diproses sebelumnya ({pr.get('status')})."}
                        pr["status"] = new_status
                        pr["processedAt"] = datetime.utcnow().isoformat() + "Z"
                        if notes:
                            pr["notes"] = f"{pr.get('notes', '')} [Admin: {notes}]".strip()
                        updated_dict = pr
                        cls.save_partners()
                        break
                if updated_dict:
                    break

        if not updated_dict:
            return {"success": False, "message": "Gagal memperbarui status pengajuan penarikan dana."}

        # Record Audit Log
        try:
            from app.services.audit_log_service import AuditLogService
            action_code = "payout_approved" if new_status == "completed" else "payout_rejected"
            AuditLogService.record_log(
                order_id=payout_id,
                actor="admin",
                action=action_code,
                previous_status="pending",
                new_status=new_status,
                notes=f"Pencairan komisi {payout_id} senilai Rp {updated_dict.get('amount', 0):,.0f} {new_status} oleh {admin_name}." + (f" Catatan: {notes}" if notes else ""),
                customer_name=updated_dict.get("bankAccountName", "Sales Partner"),
                created_at=datetime.utcnow().isoformat() + "Z",
            )
        except Exception as log_err:
            print(f"[PartnerService] Audit log note: {log_err}")

        status_label = "disetujui & transfer dicatat berhasil" if new_status == "completed" else "berhasil ditolak"
        return {
            "success": True,
            "message": f"Pengajuan penarikan komisi {payout_id} {status_label}.",
            "data": updated_dict,
        }

    @classmethod
    def settle_legacy_partner_payout(cls, partner_id: str, admin_name: str = "Admin") -> Dict[str, Any]:
        profile = cls.get_profile(partner_id)
        if not profile:
            return {"success": False, "message": "Mitra sales tidak ditemukan."}

        amount = int(profile.get("unpaidCommission", 0))
        if amount <= 0:
            return {"success": False, "message": "Tidak ada komisi yang siap dicairkan untuk mitra ini."}

        req_id = f"payreq-{int(datetime.utcnow().timestamp())}-{secrets.token_hex(2)}"
        try:
            db = SessionLocal()
            try:
                db_payout = PayoutRequest(
                    id=req_id,
                    partner_id=profile.get("id"),
                    amount=amount,
                    bank_name=profile.get("bankName") or "BCA",
                    bank_account=profile.get("bankAccount") or "1234567890",
                    bank_account_name=profile.get("name") or "Mitra Sales",
                    status="completed",
                    notes="Pencairan komisi langsung oleh Admin Console",
                    processed_at=datetime.utcnow(),
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                db.add(db_payout)
                db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[PartnerService] Legacy payout error: {e}")

        cls.load_partners(force_reload=True)
        return {
            "success": True,
            "message": f"Pencairan komisi sebesar Rp {amount:,.0f} untuk {profile.get('name')} berhasil dicatat sebagai ditransfer.".replace(",", "."),
        }
