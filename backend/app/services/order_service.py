import json
import pathlib
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import joinedload
from app.core.database import SessionLocal
from app.models.order import Order, OrderItem

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
ORDERS_FILE = DATA_DIR / "supabase-orders.json"
LEGACY_ORDERS_FILE = DATA_DIR / "orders.json"

class OrderService:
    _orders: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def _normalize_order(cls, order: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(order, dict):
            return order

        o = dict(order)

        # Amounts
        tot = o.get("total_amount") if o.get("total_amount") is not None else o.get("totalAmount", 0)
        tot_val = float(tot) if tot is not None else 0.0
        raw = o.get("raw_amount") if o.get("raw_amount") is not None else o.get("rawAmount", tot_val)
        raw_val = float(raw) if raw is not None else tot_val
        unique = o.get("unique_code") if o.get("unique_code") is not None else o.get("uniqueCode", 0)
        unique_val = int(unique) if unique is not None else 0

        o["totalAmount"] = tot_val
        o["total_amount"] = tot_val
        o["amount"] = tot_val
        o["rawAmount"] = raw_val
        o["raw_amount"] = raw_val
        o["uniqueCode"] = unique_val
        o["unique_code"] = unique_val

        # Status & Dates
        status = str(o.get("status") or o.get("order_status") or "pending").lower()
        o["status"] = status
        o["order_status"] = status

        created = o.get("createdAt") or o.get("created_at") or o.get("order_date") or (datetime.utcnow().isoformat() + "Z")
        o["createdAt"] = created
        o["created_at"] = created
        o["order_date"] = created

        updated = o.get("updatedAt") or o.get("updated_at") or created
        o["updatedAt"] = updated
        o["updated_at"] = updated

        expires = o.get("expiresAt") or o.get("expires_at")
        if not expires:
            try:
                dt = datetime.fromisoformat(created.replace("Z", "+00:00"))
                expires = (dt + timedelta(hours=24)).isoformat() + "Z"
            except Exception:
                expires = (datetime.utcnow() + timedelta(hours=24)).isoformat() + "Z"
        o["expiresAt"] = expires
        o["expires_at"] = expires

        # Contact info
        cust_email = o.get("customerEmail") or o.get("customer_email") or ""
        cust_name = o.get("customerName") or o.get("customer_name") or ""
        cust_phone = o.get("customerWhatsapp") or o.get("customer_whatsapp") or ""
        cust_notes = o.get("customerNotes") or o.get("customer_notes") or ""

        o["customerEmail"] = cust_email
        o["customer_email"] = cust_email
        o["customerName"] = cust_name
        o["customer_name"] = cust_name
        o["customerWhatsapp"] = cust_phone
        o["customer_whatsapp"] = cust_phone
        o["customerNotes"] = cust_notes
        o["customer_notes"] = cust_notes

        # Payment details
        pay_mode = o.get("paymentMode") or o.get("payment_mode") or "manual"
        pay_method = o.get("paymentMethod") or o.get("payment_method") or "manual_bca"
        pay_status = o.get("paymentStatus") or o.get("payment_status") or "pending"

        o["paymentMode"] = pay_mode
        o["payment_mode"] = pay_mode
        o["paymentMethod"] = pay_method
        o["payment_method"] = pay_method
        o["paymentStatus"] = pay_status
        o["payment_status"] = pay_status

        if not o.get("payment") or not isinstance(o.get("payment"), dict):
            o["payment"] = {
                "id": f"PAY-{o.get('id', '')}",
                "payment_method": pay_method,
                "transaction_id": o.get("paymentReference") or f"TRX-{o.get('id', '')}",
                "payment_status": pay_status,
                "amount": tot_val,
            }

        # Normalize items
        items = o.get("items", [])
        norm_items = []
        for it in items:
            it_dict = dict(it) if isinstance(it, dict) else {}
            p_id = it_dict.get("productId") or it_dict.get("product_id") or "item"
            p_name = it_dict.get("productName") or it_dict.get("product_name") or "Layanan Digital"
            price = it_dict.get("price") if it_dict.get("price") is not None else it_dict.get("unit_price", 0)
            price_val = float(price) if price is not None else 0.0
            qty = int(it_dict.get("quantity", 1))

            it_dict["productId"] = p_id
            it_dict["product_id"] = p_id
            it_dict["productName"] = p_name
            it_dict["product_name"] = p_name
            it_dict["price"] = price_val
            it_dict["unit_price"] = price_val
            it_dict["quantity"] = qty

            norm_items.append(it_dict)

        o["items"] = norm_items
        return o

    @classmethod
    def load_orders(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        Loads orders directly from Supabase PostgreSQL database.
        Falls back to local clean JSON files if Supabase is offline.
        """
        if cls._orders is not None and not force_reload:
            return cls._orders

        # 1. Try querying Supabase PostgreSQL
        try:
            db = SessionLocal()
            try:
                db_orders = db.query(Order).options(joinedload(Order.items)).order_by(Order.created_at.desc()).all()
                if db_orders:
                    normalized = [cls._normalize_order(o.to_dict()) for o in db_orders]
                    cls._orders = normalized
                    cls.save_orders()
                    return normalized
            finally:
                db.close()
        except Exception as e:
            print(f"[OrderService] Warning: Supabase orders query failed, using local fallback: {e}")

        # 2. Priority 1 Fallback: Supabase orders JSON
        if ORDERS_FILE.exists():
            try:
                data = json.loads(ORDERS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list) and len(data) > 0:
                    cls._orders = [cls._normalize_order(o) for o in data]
                    return cls._orders
            except Exception as e:
                print(f"[OrderService] Error loading supabase-orders.json: {e}")

        # Priority 2 Fallback: Legacy orders file
        if LEGACY_ORDERS_FILE.exists():
            try:
                data = json.loads(LEGACY_ORDERS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list) and len(data) > 0:
                    cls._orders = [cls._normalize_order(o) for o in data]
                    return cls._orders
            except Exception as e:
                print(f"[OrderService] Error loading orders.json: {e}")

        cls._orders = []
        return []

    @classmethod
    def save_orders(cls) -> bool:
        """Saves current orders state to local backup cache."""
        try:
            if cls._orders is not None:
                ORDERS_FILE.parent.mkdir(parents=True, exist_ok=True)
                ORDERS_FILE.write_text(json.dumps(cls._orders, indent=2, ensure_ascii=False), encoding="utf-8")
                LEGACY_ORDERS_FILE.write_text(json.dumps(cls._orders, indent=2, ensure_ascii=False), encoding="utf-8")
                return True
        except Exception as e:
            print(f"[OrderService] Error saving backup orders: {e}")
        return False

    @classmethod
    def get_orders(
        cls,
        status: Optional[str] = None,
        search: Optional[str] = None,
        email: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        all_orders = cls.load_orders()

        # Compute summary metrics across all orders
        total_revenue = 0
        pending_count = 0
        processing_count = 0
        completed_count = 0
        cancelled_count = 0

        for o in all_orders:
            st = str(o.get("status", "")).lower()
            amt = float(o.get("totalAmount", 0))

            if st in ["completed", "paid", "settlement"]:
                completed_count += 1
                total_revenue += amt
            elif st == "processing":
                processing_count += 1
                total_revenue += amt
            elif st == "pending":
                pending_count += 1
            elif st in ["cancelled", "expired"]:
                cancelled_count += 1

        filtered = all_orders

        if status and status != "all":
            clean_status = status.lower().strip()
            filtered = [f for f in filtered if str(f.get("status", "")).lower() == clean_status]

        if email and email.strip():
            clean_email = email.lower().strip()
            filtered = [f for f in filtered if clean_email in str(f.get("customerEmail", "")).lower()]

        if search and search.strip():
            q = search.lower().strip()
            filtered = [
                f for f in filtered
                if q in str(f.get("id", "")).lower()
                or q in str(f.get("customerEmail", "")).lower()
                or q in str(f.get("customerName", "")).lower()
                or q in str(f.get("customerWhatsapp", "")).lower()
                or q in str(f.get("referralCode", "")).lower()
                or any(
                    q in str(item.get("productName", "")).lower() or q in str(item.get("product_name", "")).lower()
                    for item in f.get("items", [])
                )
            ]

        total = len(filtered)
        total_pages = max(1, (total + limit - 1) // limit)
        start_idx = (page - 1) * limit
        paginated = filtered[start_idx : start_idx + limit]

        return {
            "orders": paginated,
            "total": total,
            "page": page,
            "totalPages": total_pages,
            "limit": limit,
            "metrics": {
                "total": len(all_orders),
                "totalRevenue": total_revenue,
                "completed": completed_count,
                "pending": pending_count,
                "processing": processing_count,
                "cancelled": cancelled_count,
            },
        }

    @classmethod
    def get_order_by_id(cls, order_id: str) -> Optional[Dict[str, Any]]:
        # Query Supabase directly for instant accuracy
        clean_id = order_id.strip().upper()
        try:
            db = SessionLocal()
            try:
                order_obj = db.query(Order).options(joinedload(Order.items)).filter(Order.id == clean_id).first()
                if order_obj:
                    return cls._normalize_order(order_obj.to_dict())
            finally:
                db.close()
        except Exception:
            pass

        orders = cls.load_orders()
        for o in orders:
            if str(o.get("id", "")).upper() == clean_id:
                return o
        return None

    @classmethod
    def create_order(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.utcnow()
        today_str = now.strftime("%Y%m%d")
        rand_code = random.randint(1000, 9999)
        order_id = f"AST-ORD-{today_str}-{rand_code}"

        items = payload.get("items", [])
        raw_total = sum(
            int(item.get("unit_price") or item.get("price") or 0) * int(item.get("quantity", 1))
            for item in items
        )

        unique_code = random.randint(100, 999)
        promo_discount = int(payload.get("promo_discount") or payload.get("promoDiscount") or 0)
        referral_discount = int(payload.get("referral_discount") or payload.get("referralDiscount") or 0)
        total_amount = max(0, raw_total - promo_discount - referral_discount)

        contact = payload.get("customer_contact", {})
        customer_email = contact.get("email") or payload.get("customerEmail") or "buyer@asterra.store"
        customer_phone = contact.get("phone") or payload.get("customerWhatsapp") or "081234567890"
        customer_name = contact.get("name") or payload.get("customerName") or "Pelanggan Asterra"

        # 1. Save directly into Supabase
        try:
            db = SessionLocal()
            try:
                order_record = Order(
                    id=order_id,
                    customer_email=customer_email,
                    customer_whatsapp=customer_phone,
                    customer_name=customer_name,
                    customer_notes=payload.get("customer_notes") or payload.get("customerNotes") or "",
                    total_amount=total_amount,
                    raw_amount=raw_total,
                    promo_discount=promo_discount,
                    referral_discount=referral_discount,
                    unique_code=unique_code,
                    payment_mode=payload.get("payment_mode") or payload.get("paymentMode") or "manual",
                    payment_method=payload.get("payment_method") or payload.get("paymentMethod") or "manual_bca",
                    payment_reference=None,
                    payment_status="pending",
                    status="pending",
                    created_at=now,
                    updated_at=now,
                    expires_at=now + timedelta(hours=24),
                    referral_code=payload.get("referral_code") or payload.get("referralCode"),
                )
                db.add(order_record)

                for item in items:
                    item_id = f"item-{random.randint(10000, 99999)}"
                    order_item_rec = OrderItem(
                        id=item_id,
                        order_id=order_id,
                        product_id=item.get("product_id") or item.get("productId") or "vip-service",
                        product_name=item.get("product_name") or item.get("productName") or "Layanan Digital",
                        price=int(item.get("unit_price") or item.get("price") or 0),
                        quantity=int(item.get("quantity", 1)),
                        target_email=customer_email,
                        target_phone=customer_phone,
                    )
                    db.add(order_item_rec)

                db.commit()
                db.refresh(order_record)
                normalized = cls._normalize_order(order_record.to_dict())
            finally:
                db.close()
        except Exception as e:
            print(f"[OrderService] Error saving order to Supabase: {e}")
            raise e

        # 2. Reload and sync cache
        cls.load_orders(force_reload=True)
        return normalized

    @classmethod
    def update_status(cls, order_id: str, new_status: str, notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        clean_id = order_id.strip().upper()
        now_dt = datetime.utcnow()
        normalized = None

        # 1. Update in Supabase
        try:
            db = SessionLocal()
            try:
                order_obj = db.query(Order).options(joinedload(Order.items)).filter(Order.id == clean_id).first()
                if order_obj:
                    order_obj.status = new_status
                    order_obj.updated_at = now_dt
                    if new_status in ["completed", "paid", "settlement"]:
                        order_obj.paid_at = now_dt
                        order_obj.payment_status = "settlement"
                    elif new_status in ["cancelled", "expired"]:
                        order_obj.payment_status = "cancelled"
                    if notes:
                        curr_notes = order_obj.customer_notes or ""
                        order_obj.customer_notes = f"{curr_notes} | Admin: {notes}".strip(" | ")

                    db.commit()
                    db.refresh(order_obj)
                    normalized = cls._normalize_order(order_obj.to_dict())
            finally:
                db.close()
        except Exception as e:
            print(f"[OrderService] Error updating order status in Supabase: {e}")

        # 2. Reload and sync cache
        cls.load_orders(force_reload=True)
        return normalized
