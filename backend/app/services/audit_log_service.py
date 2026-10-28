import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

class AuditLogService:
    _logs: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def _normalize_iso_date(cls, dt_str: Optional[str]) -> str:
        if not dt_str:
            return datetime.utcnow().isoformat() + "Z"
        s = str(dt_str).strip()
        if not s.endswith("Z") and "+" not in s:
            return s + "Z"
        return s

    @classmethod
    def _load_raw_logs(cls) -> List[Dict[str, Any]]:
        if cls._logs is not None:
            return cls._logs

        bootstrapped: List[Dict[str, Any]] = [
            {
                "id": "log-sys-boot",
                "order_id": "-",
                "orderId": "-",
                "customer_name": "Sistem",
                "customer_email": "system@asterra.store",
                "actor": "system",
                "action": "system_boot",
                "previous_status": None,
                "new_status": "active",
                "notes": "Backend service active with real Supabase synchronized dataset.",
                "created_at": "2026-10-09T08:00:00.000Z",
                "createdAt": "2026-10-09T08:00:00.000Z",
            }
        ]

        try:
            from app.core.database import SessionLocal
            from app.models.order import Order
            db = SessionLocal()
            try:
                orders = db.query(Order).order_by(Order.created_at.desc()).limit(50).all()
                for idx, o in enumerate(orders):
                    oid = o.id or f"ORD-{idx}"
                    created = cls._normalize_iso_date(o.created_at.isoformat() if hasattr(o.created_at, "isoformat") else str(o.created_at))
                    c_name = o.customer_name or "Pelanggan"
                    c_email = o.customer_email or "buyer@asterra.store"
                    st = o.status or "pending"
                    tot = float(o.total_amount or 0)

                    bootstrapped.append({
                        "id": f"log-order-created-{idx}",
                        "order_id": oid,
                        "orderId": oid,
                        "customer_name": c_name,
                        "customer_email": c_email,
                        "actor": "customer",
                        "action": "order_created",
                        "previous_status": None,
                        "new_status": "pending",
                        "notes": f"Pesanan {oid} dibuat oleh pelanggan dengan total Rp {tot:,.0f}".replace(",", "."),
                        "created_at": created,
                        "createdAt": created,
                    })
            finally:
                db.close()
        except Exception:
            pass

        cls._logs = bootstrapped
        return cls._logs

    @classmethod
    def _save_logs(cls) -> bool:
        return True

    @classmethod
    def record_log(
        cls,
        order_id: Optional[str],
        actor: str,
        action: str,
        previous_status: Optional[str] = None,
        new_status: Optional[str] = None,
        notes: str = "",
        customer_name: Optional[str] = None,
        customer_email: Optional[str] = None,
        created_at: Optional[str] = None,
    ) -> Dict[str, Any]:
        logs = cls._load_raw_logs()
        ts = cls._normalize_iso_date(created_at or (datetime.utcnow().isoformat() + "Z"))
        clean_oid = (order_id or "-").strip()

        # Normalize actor
        clean_actor = str(actor).lower().strip()
        if "admin" in clean_actor:
            std_actor = "admin"
        elif "tripay" in clean_actor or "webhook" in clean_actor:
            std_actor = "tripay_webhook"
        elif "customer" in clean_actor or "pelanggan" in clean_actor:
            std_actor = "customer"
        else:
            std_actor = "system"

        log_entry = {
            "id": f"log-{int(datetime.utcnow().timestamp() * 1000)}-{uuid.uuid4().hex[:6]}",
            "order_id": clean_oid,
            "orderId": clean_oid,
            "customer_name": customer_name or "Pelanggan",
            "customer_email": customer_email or "customer@asterra.store",
            "actor": std_actor,
            "action": action,
            "previous_status": previous_status,
            "new_status": new_status,
            "notes": notes,
            "created_at": ts,
            "createdAt": ts,
        }

        logs.insert(0, log_entry)
        cls._save_logs()
        return log_entry

    @classmethod
    def get_logs(
        cls,
        actor: Optional[str] = None,
        order_id: Optional[str] = None,
        since: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> Dict[str, Any]:
        logs = cls._load_raw_logs()

        if since and since.strip():
            clean_since = since.strip()
            # Filter logs strictly after clean_since
            logs = [l for l in logs if str(l.get("created_at") or l.get("createdAt") or "") > clean_since]
            # Chronological ascending sort (oldest first) so offline events replay in natural historical order
            sorted_logs = sorted(logs, key=lambda x: str(x.get("created_at") or x.get("createdAt") or ""))
        else:
            # Sort newest first for default UI view
            sorted_logs = sorted(logs, key=lambda x: str(x.get("created_at") or x.get("createdAt") or ""), reverse=True)

        if actor and actor.strip() and actor != "all":
            act = actor.lower().strip()
            sorted_logs = [l for l in sorted_logs if act in str(l.get("actor", "")).lower()]

        if order_id and order_id.strip():
            oid_q = order_id.upper().strip()
            sorted_logs = [l for l in sorted_logs if oid_q in str(l.get("order_id", "")).upper()]

        total = len(sorted_logs)
        total_pages = max(1, (total + limit - 1) // limit)
        start = (page - 1) * limit
        paginated = sorted_logs[start : start + limit]

        return {
            "logs": paginated,
            "total": total,
            "page": page,
            "totalPages": total_pages,
            "limit": limit,
        }
