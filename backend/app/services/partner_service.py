import json
import pathlib
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
                if db_partners:
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
        except Exception as e:
            print(f"[PartnerService] Error loading orders from OrderService: {e}")
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

            available_unpaid = max(0.0, final_comm - paid_commission)

            enriched.append({
                **p,
                "totalOrders": len(partner_orders),
                "totalRevenue": total_revenue,
                "unpaidCommission": available_unpaid,
                "pendingCommission": pending_comm,
                "paidCommission": paid_commission,
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

        # Do not fallback to another partner or return fake dummy metrics
        if not partner:
            return None

        p_code = str(partner.get("code", "")).upper()
        p_id = partner.get("id")

        partner_orders = cls.get_orders_for_partner(p_id or p_code)

        total_revenue = sum(
            float(o.get("totalAmount", 0)) for o in partner_orders
            if str(o.get("status", "")).lower() in ["completed", "paid", "settlement", "processing"]
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

        available_unpaid = max(0.0, final_comm - paid_comm)

        # Network commissions from team
        network_data = cls.get_network_for_partner(p_id or p_code)
        network_comm = float(network_data.get("totalNetworkBonus", 0))

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
            "pendingCommission": pending_comm,
            "paidCommission": paid_comm,
            "networkCommission": network_comm,
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

        if not partner:
            return {
                "sponsorCode": "AST-FOUNDER",
                "totalTeamMembers": 0,
                "totalTeamOrders": 0,
                "totalTeamRevenue": 0,
                "totalNetworkBonus": 0,
                "pendingNetworkBonus": 0,
                "finalNetworkBonus": 0,
                "reversedNetworkBonus": 0,
                "teamMembers": [],
                "bonusLogs": [],
            }

        partners = cls.load_partners()
        partner_id = partner.get("id")
        downlines = [p for p in partners if p.get("referredById") == partner_id]
        downline_map = {p.get("id"): p for p in downlines if p.get("id")}

        orders = cls.load_orders()

        # 1. Sync any completed downline order missing from DB
        for d in downlines:
            d_code = str(d.get("code", "")).upper()
            d_id = d.get("id")
            for o in orders:
                if str(o.get("referralCode", "")).upper() == d_code or str(o.get("salesPartnerId", "")) == str(d_id):
                    o_st = str(o.get("status") or o.get("order_status") or "").lower()
                    if o_st in ["completed", "paid", "settlement"]:
                        o_id = str(o.get("id", "")).strip().upper()
                        try:
                            from app.services.referral_profit_service import ReferralProfitService
                            ReferralProfitService.sync_order_commissions_and_ledger(o_id, o_st)
                        except Exception:
                            pass

        # 2. Query Commission table from PostgreSQL
        recruiter_comms = []
        try:
            db = SessionLocal()
            try:
                recruiter_comms = (
                    db.query(Commission)
                    .filter(Commission.recruiter_id == partner_id)
                    .order_by(Commission.created_at.desc())
                    .all()
                )
            finally:
                db.close()
        except Exception as e:
            print(f"[PartnerService] Error querying recruiter commissions: {e}")

        # 3. Build chronological bonus logs
        bonus_logs = []
        for comm in recruiter_comms:
            dl = downline_map.get(comm.partner_id)
            dl_code = dl.get("code", "MITRA") if dl else "MITRA"
            dl_name = dl.get("name", "Mitra Teman") if dl else "Mitra Teman"

            bonus_logs.append({
                "id": comm.id,
                "orderId": comm.order_id,
                "fromPartnerCode": dl_code,
                "fromPartnerName": dl_name,
                "orderTotal": comm.order_total,
                "netRevenue": comm.net_revenue,
                "costOfGoods": comm.cost_of_goods,
                "transactionProfit": comm.transaction_profit,
                "bonusAmount": comm.bonus_amount,
                "bonusPercentage": comm.bonus_rate or 2,
                "status": comm.status,  # "pending", "final", "reversed"
                "holdingUntil": comm.holding_until.isoformat() + "Z" if comm.holding_until else None,
                "createdAt": comm.created_at.isoformat() + "Z" if comm.created_at else None,
            })

        # 4. Build Team Members summary
        team_members = []
        total_team_orders = 0
        total_team_revenue = 0

        for d in downlines:
            d_code = str(d.get("code", "")).upper()
            d_id = d.get("id")
            d_orders = [
                o for o in orders
                if str(o.get("referralCode", "")).upper() == d_code
                or str(o.get("salesPartnerId", "")) == str(d_id)
            ]
            d_rev = sum(
                float(o.get("totalAmount", 0)) for o in d_orders
                if str(o.get("status", "")).lower() in ["completed", "paid", "settlement"]
            )
            # Recruiter bonus strictly calculated from 2% of profit in Commission table
            member_comms = [c for c in recruiter_comms if c.partner_id == d_id and c.status != "reversed"]
            bonus_earned = sum(c.bonus_amount for c in member_comms)

            total_team_orders += len(d_orders)
            total_team_revenue += d_rev

            team_members.append({
                "id": d.get("id"),
                "name": d.get("name"),
                "email": d.get("email"),
                "whatsapp": d.get("whatsapp"),
                "code": d.get("code"),
                "joinedAt": d.get("createdAt") or datetime.utcnow().isoformat() + "Z",
                "totalOrders": len(d_orders),
                "totalRevenue": d_rev,
                "status": d.get("status", "active"),
                "bonusEarnedFromMember": bonus_earned,
            })

        # 5. Financial Aggregations based on verified DB commissions
        valid_comms = [c for c in recruiter_comms if c.status != "reversed"]
        pending_comms = [c for c in recruiter_comms if c.status == "pending"]
        final_comms = [c for c in recruiter_comms if c.status == "final"]
        reversed_comms = [c for c in recruiter_comms if c.status == "reversed"]

        total_net_bonus = sum(c.bonus_amount for c in valid_comms)
        pending_net_bonus = sum(c.bonus_amount for c in pending_comms)
        final_net_bonus = sum(c.bonus_amount for c in final_comms)
        reversed_net_bonus = sum(c.bonus_amount for c in reversed_comms)

        return {
            "sponsorCode": partner.get("code"),
            "totalTeamMembers": len(team_members),
            "totalTeamOrders": total_team_orders,
            "totalTeamRevenue": total_team_revenue,
            "totalNetworkBonus": total_net_bonus,
            "pendingNetworkBonus": pending_net_bonus,
            "finalNetworkBonus": final_net_bonus,
            "reversedNetworkBonus": reversed_net_bonus,
            "teamMembers": team_members,
            "bonusLogs": bonus_logs,
        }

    @classmethod
    def register_partner(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        partners = cls.load_partners()
        name = payload.get("name", "").strip()
        email = payload.get("email", "").strip().lower()
        whatsapp = payload.get("whatsapp", "").strip()
        custom_code = payload.get("customCode") or payload.get("code")
        ref_by = payload.get("referredByCode") or payload.get("referralCode")

        # Check existing
        existing = next((p for p in partners if p.get("email", "").lower() == email or p.get("whatsapp") == whatsapp), None)
        if existing:
            return {"success": False, "message": f"Akun sales dengan email/WhatsApp ini sudah terdaftar (Kode: {existing.get('code')})"}

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
            print(f"[PartnerService] Error creating partner in DB: {e}")

        partners.append(new_partner)
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

        # Also refresh admin user cache
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

    @classmethod
    def process_payout(cls, partner_id: str, amount: Optional[float] = None, notes: Optional[str] = None) -> Dict[str, Any]:
        """
        Disburses eligible approved commissions (status='final') for the given partner
        and idempotently marks them as 'paid' in the database.
        """
        from app.models.commission import Commission
        from app.core.database import SessionLocal
        now = datetime.utcnow()
        try:
            db = SessionLocal()
            try:
                # Find final commissions for this partner
                eligible_comms = db.query(Commission).filter(
                    Commission.partner_id == partner_id,
                    Commission.status == "final",
                ).all()

                disbursed_total = 0
                affected_ids = []
                for c in eligible_comms:
                    if amount is not None and disbursed_total + c.commission_amount > amount:
                        continue
                    c.status = "paid"
                    c.released_at = now
                    c.updated_at = now
                    disbursed_total += c.commission_amount
                    affected_ids.append(c.id)

                db.commit()

                # Also update local json partner payout record if present
                partners = cls.load_partners()
                for p in partners:
                    if str(p.get("id")) == str(partner_id) or str(p.get("code")).upper() == str(partner_id).upper():
                        if "payoutRequests" not in p:
                            p["payoutRequests"] = []
                        p["payoutRequests"].insert(0, {
                            "id": f"pay-{int(now.timestamp())}",
                            "amount": disbursed_total,
                            "date": now.strftime("%Y-%m-%d"),
                            "status": "paid",
                            "notes": notes or "Pencairan komisi kemitraan sales via Admin",
                        })
                        cls.save_partners()
                        break

                return {
                    "success": True,
                    "disbursedAmount": disbursed_total,
                    "commissionIds": affected_ids,
                    "message": f"Pencairan komisi sebesar Rp {disbursed_total:,.0f} berhasil dicatat.".replace(",", "."),
                }
            finally:
                db.close()
        except Exception as e:
            return {
                "success": False,
                "disbursedAmount": 0,
                "message": f"Gagal memproses pencairan komisi: {e}",
            }
