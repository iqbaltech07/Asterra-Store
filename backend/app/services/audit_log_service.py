import json
import pathlib
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
LOGS_FILE = DATA_DIR / "supabase-logs.json"
ORDERS_FILE = DATA_DIR / "supabase-orders.json"

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

        if LOGS_FILE.exists():
            try:
                data = json.loads(LOGS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    cls._logs = data
                    return cls._logs
            except Exception as e:
                print(f"[AuditLogService] Error reading supabase-logs.json: {e}")

        # Bootstrap initial logs from orders if logs file doesn't exist yet
        bootstrapped: List[Dict[str, Any]] = []
        if ORDERS_FILE.exists():
            try:
                orders = json.loads(ORDERS_FILE.read_text(encoding="utf-8"))
                for idx, o in enumerate(orders):
                    oid = o.get("id") or o.get("orderId") or f"ORD-{idx}"
                    created = cls._normalize_iso_date(o.get("createdAt") or o.get("created_at"))
                    c_name = o.get("customerName") or o.get("customer_name") or "Pelanggan"
                    c_email = o.get("customerEmail") or o.get("customer_email") or "buyer@asterra.store"
                    st = o.get("status", "pending")
                    tot = float(o.get("totalAmount") or o.get("total_amount") or 0)

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

                    if st in ["completed", "paid", "settlement"]:
                        paid_at = cls._normalize_iso_date(o.get("paidAt") or o.get("paid_at") or created)
                        pay_method = o.get("paymentMethod") or o.get("payment_method") or "manual"
                        is_gateway = not str(pay_method).startswith("manual_")
                        bootstrapped.append({
                            "id": f"log-order-paid-{idx}",
                            "order_id": oid,
                            "orderId": oid,
                            "customer_name": c_name,
                            "customer_email": c_email,
                            "actor": "tripay_webhook" if is_gateway else "admin",
                            "action": "payment_received",
                            "previous_status": "pending",
                            "new_status": "completed",
                            "notes": f"Pembayaran pesanan {oid} terkonfirmasi lunas via {pay_method}.",
                            "created_at": paid_at,
                            "createdAt": paid_at,
                        })
            except Exception as e:
                print(f"[AuditLogService] Error bootstrapping initial logs: {e}")

        # System boot log
        bootstrapped.append({
            "id": "log-sys-boot",
            "order_id": "-",
            "orderId": "-",
            "customer_name": "Sistem",
            "customer_email": "system@asterra.store",
            "actor": "system",
            "action": "system_boot",
            "previous_status": None,
            "new_status": "active",
            "notes": "Backend service active on port 8000 with real Supabase synchronized dataset.",
            "created_at": "2026-10-09T08:00:00.000Z",
            "createdAt": "2026-10-09T08:00:00.000Z",
        })

        cls._logs = bootstrapped
        cls._save_logs()
        return cls._logs

    @classmethod
    def _save_logs(cls) -> bool:
        try:
            if cls._logs is not None:
                LOGS_FILE.parent.mkdir(parents=True, exist_ok=True)
                LOGS_FILE.write_text(json.dumps(cls._logs, indent=2, ensure_ascii=False), encoding="utf-8")
                return True
        except Exception as e:
            print(f"[AuditLogService] Error saving supabase-logs.json: {e}")
        return False

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
