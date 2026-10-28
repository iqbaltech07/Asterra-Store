from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.database import SessionLocal
from app.models.commission import Commission

def calculate_partner_network(partner: Optional[Dict[str, Any]], all_partners: List[Dict[str, Any]], orders: List[Dict[str, Any]]) -> Dict[str, Any]:
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

    partner_id = partner.get("id")
    downlines = [p for p in all_partners if p.get("referredById") == partner_id]
    downline_map = {p.get("id"): p for p in downlines if p.get("id")}

    # 1. Sync any completed downline order ONLY IF missing from DB
    existing_comm_ids = set()
    try:
        db = SessionLocal()
        try:
            db_comms = db.query(Commission.order_id).filter(Commission.recruiter_id == partner_id).all()
            existing_comm_ids = {c[0] for c in db_comms if c and c[0]}
        finally:
            db.close()
    except Exception:
        pass

    for d in downlines:
        d_code = str(d.get("code", "")).upper()
        d_id = d.get("id")
        for o in orders:
            if str(o.get("referralCode", "")).upper() == d_code or str(o.get("salesPartnerId", "")) == str(d_id):
                o_st = str(o.get("status") or o.get("order_status") or "").lower()
                if o_st in ["completed", "paid", "settlement"]:
                    o_id = str(o.get("id", "")).strip().upper()
                    if o_id not in existing_comm_ids:
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
        print(f"[PartnerNetwork] Error querying recruiter commissions: {e}")

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
            "bonusAmount": comm.bonus_amount,
            "bonusPercentage": comm.bonus_rate or 2,
            "status": comm.status,
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
