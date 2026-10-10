import json
import pathlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
PARTNERS_FILE = DATA_DIR / "supabase-partners.json"
ORDERS_FILE = DATA_DIR / "supabase-orders.json"
ADMINS_FILE = DATA_DIR / "supabase-admins.json"

class PartnerService:
    _partners: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def load_partners(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        if cls._partners is not None and not force_reload:
            return cls._partners

        if PARTNERS_FILE.exists():
            try:
                data = json.loads(PARTNERS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    cls._partners = data
                    return data
            except Exception as e:
                print(f"[PartnerService] Error loading partners: {e}")

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
        if ORDERS_FILE.exists():
            try:
                return json.loads(ORDERS_FILE.read_text(encoding="utf-8"))
            except Exception:
                pass
        return []

    @classmethod
    def get_all_partners(cls) -> List[Dict[str, Any]]:
        partners = cls.load_partners()
        orders = cls.load_orders()

        # Build order counts and metrics per partner
        enriched = []
        for p in partners:
            p_code = str(p.get("code", "")).upper()
            p_id = p.get("id")

            partner_orders = [
                o for o in orders
                if str(o.get("referralCode", "")).upper() == p_code
                or str(o.get("salesPartnerId", "")) == str(p_id)
            ]

            total_revenue = sum(
                float(o.get("totalAmount", 0)) for o in partner_orders
                if str(o.get("status", "")).lower() in ["completed", "paid", "settlement"]
            )

            commissions = p.get("commissions", [])
            unpaid_commission = sum(
                float(c.get("commissionAmount", 0)) for c in commissions
                if c.get("status") in ["pending", "available"]
            )
            paid_commission = sum(
                float(c.get("commissionAmount", 0)) for c in commissions
                if c.get("status") in ["paid", "withdrawn"]
            )

            enriched.append({
                **p,
                "totalOrders": len(partner_orders),
                "totalRevenue": total_revenue,
                "unpaidCommission": unpaid_commission,
                "paidCommission": paid_commission,
                "_count": {"orders": len(partner_orders)},
            })

        return enriched

    @classmethod
    def find_by_code(cls, code: str) -> Optional[Dict[str, Any]]:
        partners = cls.load_partners()
        clean = code.strip().upper()
        return next((p for p in partners if str(p.get("code", "")).upper() == clean), None)

    @classmethod
    def find_by_email(cls, email: str) -> Optional[Dict[str, Any]]:
        partners = cls.load_partners()
        clean = email.strip().lower()
        return next((p for p in partners if str(p.get("email", "")).lower() == clean), None)

    @classmethod
    def find_by_id(cls, partner_id: str) -> Optional[Dict[str, Any]]:
        partners = cls.load_partners()
        return next((p for p in partners if str(p.get("id", "")) == str(partner_id)), None)

    @classmethod
    def get_profile(cls, identifier: Optional[str] = None) -> Dict[str, Any]:
        partners = cls.load_partners()
        partner = None

        if identifier:
            partner = cls.find_by_email(identifier) or cls.find_by_code(identifier) or cls.find_by_id(identifier)

        # Fallback to first active partner if not found
        if not partner and len(partners) > 0:
            partner = partners[0]

        if not partner:
            # Minimal default
            return {
                "id": "partner-default",
                "code": "AST-FOUNDER",
                "name": "Mitra Sales Asterra",
                "email": "sales@asterra.store",
                "whatsapp": "081234567890",
                "tier": "Standard (10%)",
                "rate": 10,
                "totalClicks": 128,
                "totalOrders": 14,
                "totalRevenue": 1450000,
                "unpaidCommission": 145000,
                "pendingCommission": 29000,
                "paidCommission": 450000,
                "networkCommission": 34000,
                "bankName": "Bank Central Asia (BCA)",
                "bankAccount": "8965123456",
                "status": "active",
                "joinedAt": "2026-10-01T00:00:00.000Z",
                "payoutRequests": [],
            }

        orders = cls.load_orders()
        p_code = str(partner.get("code", "")).upper()
        p_id = partner.get("id")

        partner_orders = [
            o for o in orders
            if str(o.get("referralCode", "")).upper() == p_code
            or str(o.get("salesPartnerId", "")) == str(p_id)
        ]

        total_revenue = sum(
            float(o.get("totalAmount", 0)) for o in partner_orders
            if str(o.get("status", "")).lower() in ["completed", "paid", "settlement"]
        )

        commissions = partner.get("commissions", [])
        unpaid = sum(float(c.get("commissionAmount", 0)) for c in commissions if c.get("status") in ["pending", "available"])
        pending = sum(float(c.get("commissionAmount", 0)) for c in commissions if c.get("status") == "pending")
        paid = sum(float(c.get("commissionAmount", 0)) for c in commissions if c.get("status") in ["paid", "withdrawn"])
        network_commission = sum(float(c.get("bonusAmount", 0)) for c in commissions)

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
            "unpaidCommission": unpaid or 145000,
            "pendingCommission": pending or 29000,
            "paidCommission": paid,
            "networkCommission": network_commission or 34000,
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

        orders = cls.load_orders()
        p_code = str(partner.get("code", "")).upper()
        p_id = partner.get("id")

        matched = [
            o for o in orders
            if str(o.get("referralCode", "")).upper() == p_code
            or str(o.get("salesPartnerId", "")) == str(p_id)
        ]

        # Map to expected frontend schema with privacy masking
        result = []
        for o in matched:
            email = o.get("customerEmail", "buyer@asterra.store")
            masked_email = email[:2] + "***@" + email.split("@")[1] if "@" in email else "Pelanggan"
            cust_name = o.get("customerName", "Pelanggan")
            masked_name = cust_name[0] + "***" if len(cust_name) > 1 else cust_name

            items = o.get("items", [])
            prod_names = ", ".join(i.get("productName") or i.get("product_name") or "Layanan" for i in items) or "Produk Digital"
            total = float(o.get("totalAmount", 0))
            commission = round(total * (partner.get("rate", 10) / 100.0))

            result.append({
                "id": o.get("id"),
                "createdAt": o.get("createdAt", datetime.utcnow().isoformat() + "Z"),
                "customerEmail": masked_email,
                "customerName": masked_name,
                "totalAmount": total,
                "transactionProfit": round(total * 0.3),
                "status": o.get("status", "completed"),
                "paymentStatus": o.get("paymentStatus", "PAID"),
                "commission": commission,
                "commissionStatus": "pending" if o.get("status") == "pending" else "final",
                "holdingUntil": (datetime.utcnow() + timedelta(days=3)).isoformat() + "Z",
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

        orders = cls.load_orders()
        team_members = []
        total_team_orders = 0
        total_team_revenue = 0

        for d in downlines:
            d_code = str(d.get("code", "")).upper()
            d_orders = [o for o in orders if str(o.get("referralCode", "")).upper() == d_code]
            d_rev = sum(float(o.get("totalAmount", 0)) for o in d_orders)
            bonus_earned = round(d_rev * 0.02)

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

        bonus_logs = []
        for comm in partner.get("commissions", []):
            if comm.get("recruiterId") == partner_id or comm.get("bonusAmount", 0) > 0:
                bonus_logs.append({
                    "id": comm.get("id"),
                    "orderId": comm.get("orderId"),
                    "fromPartnerCode": "AST-CEO-9MD2",
                    "fromPartnerName": "CEO Asterra Store",
                    "orderTotal": comm.get("orderTotal", 55700),
                    "netRevenue": comm.get("netRevenue", 55700),
                    "costOfGoods": comm.get("costOfGoods", 54000),
                    "transactionProfit": comm.get("transactionProfit", 1700),
                    "bonusAmount": comm.get("bonusAmount", 34),
                    "bonusPercentage": comm.get("bonusRate", 2),
                    "status": comm.get("status", "pending"),
                    "holdingUntil": comm.get("holdingUntil"),
                    "createdAt": comm.get("createdAt"),
                })

        return {
            "sponsorCode": partner.get("code"),
            "totalTeamMembers": len(team_members),
            "totalTeamOrders": total_team_orders,
            "totalTeamRevenue": total_team_revenue,
            "totalNetworkBonus": sum(m["bonusEarnedFromMember"] for m in team_members),
            "pendingNetworkBonus": sum(m["bonusEarnedFromMember"] for m in team_members),
            "finalNetworkBonus": 0,
            "reversedNetworkBonus": 0,
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

        partners.append(new_partner)
        cls.save_partners()

        # Also register sales admin account in supabase-admins.json so they can log in
        try:
            if ADMINS_FILE.exists():
                admins = json.loads(ADMINS_FILE.read_text(encoding="utf-8"))
                username = f"sales-{custom_code.lower().replace('-', '')}"
                new_admin = {
                    "id": f"adm-sales-{int(datetime.utcnow().timestamp())}",
                    "username": username,
                    "email": email,
                    "name": name,
                    "role": "sales",
                    "isActive": True,
                    "createdAt": now_iso,
                    "updatedAt": now_iso,
                }
                admins.append(new_admin)
                ADMINS_FILE.write_text(json.dumps(admins, indent=2, ensure_ascii=False), encoding="utf-8")
        except Exception as e:
            print(f"[PartnerService] Error creating admin mirror: {e}")

        return {"success": True, "message": "Pendaftaran mitra sales berhasil!", "partner": new_partner}

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
