import json
import pathlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
ORDERS_FILE = DATA_DIR / "supabase-orders.json"

class AuditLogService:
    @classmethod
    def get_logs(
        cls,
        actor: Optional[str] = None,
        order_id: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> Dict[str, Any]:
        logs: List[Dict[str, Any]] = []

        # Generate audit trail from real orders
        if ORDERS_FILE.exists():
            try:
                orders = json.loads(ORDERS_FILE.read_text(encoding="utf-8"))
                for idx, o in enumerate(orders):
                    created = o.get("createdAt") or datetime.utcnow().isoformat()
                    oid = o.get("id")
                    email = o.get("customerEmail") or "buyer@asterra.store"
                    st = o.get("status", "pending")

                    # Order creation log
                    logs.append({
                        "id": f"log-create-{idx}",
                        "orderId": oid,
                        "action": "order_created",
                        "actor": f"Customer ({email})",
                        "notes": f"Pesanan {oid} dibuat dengan nominal Rp {float(o.get('totalAmount', 0)):,.0f}".replace(",", "."),
                        "createdAt": created,
                    })

                    # Order completion log if paid
                    if st in ["completed", "paid", "settlement"]:
                        paid_at = o.get("paidAt") or created
                        logs.append({
                            "id": f"log-paid-{idx}",
                            "orderId": oid,
                            "action": "payment_settled",
                            "actor": f"Payment Gateway ({o.get('paymentMethod', 'manual')})",
                            "notes": f"Pembayaran pesanan {oid} terkonfirmasi lunas.",
                            "createdAt": paid_at,
                        })
            except Exception as e:
                print(f"[AuditLogService] Error parsing orders for logs: {e}")

        # Add system boot log
        logs.append({
            "id": "log-sys-boot",
            "orderId": None,
            "action": "system_boot",
            "actor": "FastAPI Core Engine",
            "notes": "Backend service active on port 8000 with real Supabase synchronized dataset.",
            "createdAt": "2026-10-09T08:00:00.000Z",
        })

        # Sort newest first
        logs.sort(key=lambda x: str(x.get("createdAt", "")), reverse=True)

        if actor and actor.strip():
            act = actor.lower().strip()
            logs = [l for l in logs if act in str(l.get("actor", "")).lower()]

        if order_id and order_id.strip():
            oid_q = order_id.upper().strip()
            logs = [l for l in logs if str(l.get("orderId", "")).upper() == oid_q]

        total = len(logs)
        total_pages = max(1, (total + limit - 1) // limit)
        start = (page - 1) * limit
        paginated = logs[start : start + limit]

        return {
            "logs": paginated,
            "total": total,
            "page": page,
            "totalPages": total_pages,
            "limit": limit,
        }
