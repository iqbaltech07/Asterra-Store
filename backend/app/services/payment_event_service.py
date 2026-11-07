import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.payment_event import PaymentEvent
from app.models.order import Order
from app.services.audit_log_service import AuditLogService
from app.services.realtime_broadcaster import RealtimeBroadcaster
from app.services.order_service import OrderService

class PaymentEventService:

    @classmethod
    def _parse_datetime(cls, dt_str: Any) -> datetime:
        if isinstance(dt_str, datetime):
            return dt_str
        if not dt_str:
            return datetime.now(timezone.utc)
        s = str(dt_str).strip()
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        try:
            return datetime.fromisoformat(s)
        except Exception:
            return datetime.now(timezone.utc)

    @classmethod
    def process_dana_event(cls, payload: Dict[str, Any], device_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Processes incoming DANA Bisnis payment notification event.
        Guarantees idempotency via event_id, validates nominal, auto-matches pending invoices,
        persists event, and triggers audit & admin notifications.
        """
        event_id = str(payload.get("event_id") or "").strip()
        if not event_id:
            raise ValueError("Parameter event_id wajib diisi.")

        target_device_id = str(device_id or payload.get("device_id") or "asterra-device-01").strip()

        # 1. Idempotency Check
        db = SessionLocal()
        try:
            existing = db.query(PaymentEvent).filter(PaymentEvent.event_id == event_id).first()
            if existing:
                return {
                    "success": True,
                    "event_id": existing.event_id,
                    "status": "DUPLICATE",
                    "matched_order_id": existing.matched_order_id,
                    "message": f"Event {event_id} sudah pernah diterima dan tercatat.",
                    "data": existing.to_dict(),
                }

            # 2. Validation
            try:
                amount = float(payload.get("amount", 0))
            except (ValueError, TypeError):
                raise ValueError("Nominal amount tidak valid.")

            if amount <= 0:
                raise ValueError("Nominal pembayaran harus lebih besar dari 0.")

            currency = str(payload.get("currency", "IDR")).strip().upper()
            if currency != "IDR":
                raise ValueError("Mata uang yang didukung hanya IDR.")

            tx_time = cls._parse_datetime(payload.get("transaction_time"))
            source = str(payload.get("source", "dana_business")).strip()
            raw_ref = payload.get("raw_reference")

            # 3. Create Event record with initial DETECTED status
            event_uuid = f"pe-{uuid.uuid4().hex[:12]}"
            new_event = PaymentEvent(
                id=event_uuid,
                event_id=event_id,
                device_id=target_device_id,
                amount=amount,
                currency=currency,
                transaction_time=tx_time,
                source=source,
                raw_reference=str(raw_ref) if raw_ref else None,
                status="DETECTED",
                notes="Notifikasi pembayaran DANA Bisnis berhasil dibaca.",
            )

            # 4. Invoice Matching Workflow
            # Check pending orders with the exact total_amount within 24h window
            window_start = tx_time - timedelta(hours=24)
            window_end = tx_time + timedelta(hours=2)

            pending_orders = (
                db.query(Order)
                .filter(
                    Order.status.in_(["pending", "menunggu_pembayaran"]),
                    (Order.is_dummy == False) | (Order.is_dummy == None),
                )
                .all()
            )

            candidate_orders = []
            for o in pending_orders:
                try:
                    tot = float(o.total_amount or 0)
                    if abs(tot - amount) < 0.01:
                        # Order matches amount
                        candidate_orders.append(o)
                except Exception:
                    continue

            matched_order_obj = None
            if len(candidate_orders) == 1:
                matched = candidate_orders[0]
                matched_order_obj = matched
                new_event.matched_order_id = matched.id
                new_event.status = "PAID"
                new_event.verified_at = datetime.utcnow()
                new_event.notes = f"Pembayaran QRIS DANA Bisnis senilai Rp {amount:,.0f} diverifikasi otomatis oleh LiPay untuk invoice {matched.id}.".replace(",", ".")
            elif len(candidate_orders) > 1:
                matched_ids = ", ".join([o.id for o in candidate_orders])
                new_event.status = "PENDING_REVIEW"
                new_event.notes = f"Ditemukan {len(candidate_orders)} order dengan nominal cocok ({matched_ids}). Menunggu pemilihan verifikasi admin."
            else:
                new_event.status = "PENDING_REVIEW"
                new_event.notes = f"Tidak ditemukan invoice pending dengan nominal Rp {amount:,.0f}. Menunggu verifikasi admin.".replace(",", ".")

            db.add(new_event)
            db.commit()
            db.refresh(new_event)

            # Auto-update Asterra order to PAID and trigger fulfillment when exactly matched
            if matched_order_obj and new_event.status == "PAID":
                try:
                    OrderService.update_status(
                        matched_order_obj.id,
                        "paid",
                        notes="Sistem: Pembayaran QRIS diverifikasi otomatis oleh LiPay",
                    )
                except Exception as ord_err:
                    print(f"[PaymentEventService] Auto order status update error: {ord_err}")

                try:
                    RealtimeBroadcaster.broadcast(
                        "order:payment_verified",
                        {
                            "order_id": matched_order_obj.id,
                            "id": matched_order_obj.id,
                            "event_id": new_event.event_id,
                            "amount": amount,
                            "status": "paid",
                            "payment_status": "settlement",
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                        target_role="all",
                    )
                    RealtimeBroadcaster.broadcast(
                        "order:status_changed",
                        {
                            "order_id": matched_order_obj.id,
                            "id": matched_order_obj.id,
                            "status": "paid",
                            "new_status": "paid",
                            "payment_status": "settlement",
                            "timestamp": datetime.utcnow().isoformat(),
                        },
                        target_role="all",
                    )
                except Exception as b_ex:
                    print(f"[PaymentEventService] Realtime broadcast error on auto-paid: {b_ex}")

            event_dict = new_event.to_dict()

            # 5. Audit Logging
            AuditLogService.record_log(
                order_id=new_event.matched_order_id or "-",
                actor="dana_listener",
                action="payment_event_received",
                previous_status="DETECTED",
                new_status=new_event.status,
                notes=f"Event DANA {event_id} diterima dari {target_device_id} senilai Rp {amount:,.0f}. {new_event.notes}".replace(",", "."),
            )

            # 6. Realtime Broadcaster to Admin
            try:
                RealtimeBroadcaster.broadcast(
                    "payment_event:received",
                    {
                        "event_id": event_id,
                        "device_id": target_device_id,
                        "amount": amount,
                        "status": new_event.status,
                        "matched_order_id": new_event.matched_order_id,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    target_role="admin",
                )
            except Exception as e:
                print(f"[PaymentEventService] Realtime broadcast warning: {e}")

            return {
                "success": True,
                "event_id": new_event.event_id,
                "status": new_event.status,
                "matched_order_id": new_event.matched_order_id,
                "message": "Payment event berhasil dicatat dan diproses.",
                "data": event_dict,
            }
        finally:
            db.close()

    @classmethod
    def get_events(cls, status: Optional[str] = None, page: int = 1, limit: int = 50) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            query = db.query(PaymentEvent)
            if status and status.upper() != "ALL":
                query = query.filter(PaymentEvent.status == status.upper())

            total = query.count()
            offset = (max(1, page) - 1) * limit
            events = query.order_by(PaymentEvent.created_at.desc()).offset(offset).limit(limit).all()

            return {
                "success": True,
                "total": total,
                "page": page,
                "limit": limit,
                "data": [e.to_dict() for e in events],
            }
        finally:
            db.close()

    @classmethod
    def get_event_by_id(cls, event_id: str) -> Optional[Dict[str, Any]]:
        db = SessionLocal()
        try:
            event = (
                db.query(PaymentEvent)
                .filter((PaymentEvent.event_id == event_id) | (PaymentEvent.id == event_id))
                .first()
            )
            if not event:
                return None
            res = event.to_dict()
            if event.matched_order_id:
                order = db.query(Order).filter(Order.id == event.matched_order_id).first()
                if order:
                    res["matched_order"] = order.to_dict()
            return res
        finally:
            db.close()

    @classmethod
    def confirm_payment_event(
        cls,
        event_id: str,
        admin_user: Dict[str, Any],
        order_id: Optional[str] = None,
        notes: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Admin explicitly confirms DANA payment after verifying against DANA Bisnis transaction history.
        Transitions event to PAID and triggers existing Asterra order fulfillment workflow.
        """
        db = SessionLocal()
        try:
            event = (
                db.query(PaymentEvent)
                .filter((PaymentEvent.event_id == event_id) | (PaymentEvent.id == event_id))
                .first()
            )
            if not event:
                raise ValueError("Payment event tidak ditemukan.")

            if event.status == "PAID":
                raise ValueError("Payment event sudah berstatus PAID sebelumnya.")

            if event.status == "REJECTED":
                raise ValueError("Payment event sudah ditolak (REJECTED).")

            target_order_id = order_id or event.matched_order_id
            if not target_order_id:
                raise ValueError("Target order ID wajib ditentukan untuk konfirmasi pembayaran.")

            admin_name = admin_user.get("name") or admin_user.get("email") or "Admin"
            admin_id = str(admin_user.get("id") or admin_user.get("sub") or admin_name)

            event.status = "PAID"
            event.matched_order_id = target_order_id
            event.verified_by_admin_id = admin_id
            event.verified_at = datetime.utcnow()
            confirm_note = f"Dikonfirmasi valid via DANA Bisnis oleh {admin_name}."
            if notes:
                confirm_note += f" Catatan: {notes}"
            event.notes = confirm_note

            db.commit()
            db.refresh(event)

            # Update existing Asterra order workflow to PAID
            order_update_note = f"Admin: Pembayaran QRIS diverifikasi manual oleh {admin_name}"
            if notes:
                order_update_note += f" ({notes})"
            updated_order = OrderService.update_status(target_order_id, "paid", notes=order_update_note)

            # Audit log
            AuditLogService.record_log(
                order_id=target_order_id,
                actor="admin",
                action="payment_event_confirmed_paid",
                previous_status="PENDING_REVIEW",
                new_status="PAID",
                notes=f"Admin {admin_name} memverifikasi pembayaran DANA {event.event_id} untuk pesanan {target_order_id}.",
            )

            # Realtime broadcast
            try:
                RealtimeBroadcaster.broadcast(
                    "payment_event:confirmed",
                    {
                        "event_id": event.event_id,
                        "order_id": target_order_id,
                        "status": "PAID",
                        "admin": admin_name,
                        "timestamp": datetime.utcnow().isoformat(),
                    },
                    target_role="admin",
                )
            except Exception:
                pass

            return {
                "success": True,
                "message": f"Pembayaran untuk order {target_order_id} berhasil dikonfirmasi menjadi PAID.",
                "data": event.to_dict(),
                "order": updated_order,
            }
        finally:
            db.close()

    @classmethod
    def reject_payment_event(
        cls,
        event_id: str,
        admin_user: Dict[str, Any],
        reason: str,
    ) -> Dict[str, Any]:
        """
        Admin marks the event as REJECTED (e.g. fraudulent, unrecognized, or mismatched).
        """
        if not reason or not reason.strip():
            raise ValueError("Alasan penolakan (reason) wajib diisi.")

        db = SessionLocal()
        try:
            event = (
                db.query(PaymentEvent)
                .filter((PaymentEvent.event_id == event_id) | (PaymentEvent.id == event_id))
                .first()
            )
            if not event:
                raise ValueError("Payment event tidak ditemukan.")

            if event.status == "PAID":
                raise ValueError("Payment event yang sudah PAID tidak dapat ditolak.")

            admin_name = admin_user.get("name") or admin_user.get("email") or "Admin"
            admin_id = str(admin_user.get("id") or admin_user.get("sub") or admin_name)

            event.status = "REJECTED"
            event.verified_by_admin_id = admin_id
            event.verified_at = datetime.utcnow()
            event.notes = f"Ditolak oleh {admin_name}. Alasan: {reason.strip()}"

            db.commit()
            db.refresh(event)

            # Audit log
            AuditLogService.record_log(
                order_id=event.matched_order_id or "-",
                actor="admin",
                action="payment_event_rejected",
                previous_status="PENDING_REVIEW",
                new_status="REJECTED",
                notes=f"Admin {admin_name} menolak event DANA {event.event_id}. Alasan: {reason.strip()}",
            )

            return {
                "success": True,
                "message": f"Payment event {event.event_id} berhasil ditolak (REJECTED).",
                "data": event.to_dict(),
            }
        finally:
            db.close()

