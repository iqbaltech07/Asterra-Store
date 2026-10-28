import json
import pathlib
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from app.core.database import SessionLocal
from app.models.promo import PromoCode

class PromoService:
    _promos: Optional[List[Dict[str, Any]]] = None
    _table_ensured: bool = False

    @classmethod
    def ensure_table(cls, force: bool = False):
        """
        Ensures promo_codes table exists in database and has all required columns (runs once per process).
        """
        if cls._table_ensured and not force:
            return
        cls._table_ensured = True
        try:
            from app.core.database import engine, Base
            from sqlalchemy import text
            if engine is not None:
                Base.metadata.create_all(bind=engine, tables=[PromoCode.__table__])
                try:
                    with engine.connect() as conn:
                        conn.execute(text("ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS target_scope VARCHAR DEFAULT 'all';"))
                        conn.execute(text("ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS target_product_id VARCHAR;"))
                        conn.execute(text("ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS target_product_name VARCHAR;"))
                        conn.commit()
                except Exception as e:
                    print(f"[PromoService] DDL Alter note: {e}")
        except Exception as e:
            print(f"[PromoService] DB table verification note: {e}")

    @classmethod
    def load_promos(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        """
        Loads promo codes directly from Supabase PostgreSQL promo_codes table.
        """
        if cls._promos is not None and not force_reload:
            return cls._promos

        # Ensure schema has new columns
        cls.ensure_table()

        # Query Supabase PostgreSQL
        try:
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    db_promos = db.query(PromoCode).all()
                    if db_promos is not None:
                        data = [p.to_dict() for p in db_promos]
                        cls._promos = data
                        return data
                finally:
                    db.close()
        except Exception as e:
            print(f"[PromoService] Warning: Supabase promo query failed: {e}")

        cls._promos = []
        return []

    @classmethod
    def save_promos(cls) -> bool:
        """In-memory state management - no JSON file persistence."""
        return True

    @classmethod
    def validate_promo(
        cls,
        code: str,
        subtotal: float,
        items: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        if not code or not isinstance(code, str) or not code.strip():
            return {
                "valid": False,
                "error": "Silakan masukkan kode promo yang valid.",
                "message": "Silakan masukkan kode promo yang valid.",
            }

        clean_code = code.strip().upper()
        promos = cls.load_promos()
        promo = next((p for p in promos if p.get("code", "").upper() == clean_code), None)

        if not promo:
            return {
                "valid": False,
                "error": f"Kode promo '{clean_code}' tidak ditemukan atau tidak terdaftar.",
                "message": f"Kode promo '{clean_code}' tidak ditemukan atau tidak terdaftar.",
            }

        if not promo.get("isActive", True):
            return {
                "valid": False,
                "error": f"Kode promo '{clean_code}' sudah tidak aktif.",
                "message": f"Kode promo '{clean_code}' sudah tidak aktif.",
            }

        now_utc = datetime.now(timezone.utc)

        # Check start_date
        start_date_str = promo.get("startDate") or promo.get("start_date")
        if start_date_str:
            try:
                start_dt = datetime.fromisoformat(str(start_date_str).replace("Z", "+00:00"))
                if start_dt.tzinfo is None:
                    start_dt = start_dt.replace(tzinfo=timezone.utc)
                if now_utc < start_dt:
                    return {
                        "valid": False,
                        "error": f"Kode promo '{clean_code}' baru dapat digunakan mulai {start_dt.strftime('%d-%m-%Y')}.",
                        "message": f"Kode promo '{clean_code}' belum aktif.",
                    }
            except Exception:
                pass

        # Check expires_at
        expires_at_str = promo.get("expiresAt") or promo.get("expires_at")
        if expires_at_str:
            try:
                exp_dt = datetime.fromisoformat(str(expires_at_str).replace("Z", "+00:00"))
                if exp_dt.tzinfo is None:
                    exp_dt = exp_dt.replace(tzinfo=timezone.utc)
                if now_utc > exp_dt:
                    return {
                        "valid": False,
                        "error": f"Kode promo '{clean_code}' telah kedaluwarsa.",
                        "message": f"Kode promo '{clean_code}' telah kedaluwarsa.",
                    }
            except Exception:
                pass

        # Check usage limit
        usage_limit = promo.get("usageLimit") or promo.get("usage_limit")
        used_count = int(promo.get("usedCount") or promo.get("used_count") or 0)
        if usage_limit is not None and int(usage_limit) > 0 and used_count >= int(usage_limit):
            return {
                "valid": False,
                "error": f"Batas kuota penggunaan kode promo '{clean_code}' telah habis.",
                "message": f"Batas kuota penggunaan kode promo '{clean_code}' telah habis.",
            }

        # Check target scope (all vs specific_product)
        target_scope = promo.get("targetScope") or promo.get("target_scope") or "all"
        target_prod_id = promo.get("targetProductId") or promo.get("target_product_id")
        target_prod_name = promo.get("targetProductName") or promo.get("target_product_name") or "Produk Khusus"

        # Determine eligible subtotal for isolated discount calculation
        eligible_subtotal = subtotal

        if target_scope == "specific_product" or bool(target_prod_id):
            clean_target_id = str(target_prod_id).strip().lower() if target_prod_id else ""
            matching_item = None
            if items and isinstance(items, list):
                for it in items:
                    it_pid = str(it.get("product_id") or it.get("productId") or it.get("id") or "").strip().lower()
                    if it_pid == clean_target_id:
                        matching_item = it
                        break

            if not matching_item:
                return {
                    "valid": False,
                    "error": f"Kode promo '{clean_code}' khusus untuk produk '{target_prod_name}' dan tidak dapat digunakan untuk pesanan ini.",
                    "message": f"Khusus produk {target_prod_name}",
                }

            # Isolated eligible subtotal strictly from target product
            unit_p = float(matching_item.get("unit_price") or matching_item.get("price") or matching_item.get("priceNumeric") or 0)
            qty = max(1, int(matching_item.get("quantity", 1)))
            eligible_subtotal = unit_p * qty

        min_order = float(promo.get("minOrderAmount") or 0)
        if eligible_subtotal < min_order:
            if target_scope == "specific_product" or bool(target_prod_id):
                return {
                    "valid": False,
                    "error": f"Minimal pembelian untuk produk '{target_prod_name}' adalah Rp {min_order:,.0f}.".replace(",", "."),
                    "message": f"Minimal pembelian produk Rp {min_order:,.0f}.".replace(",", "."),
                }
            return {
                "valid": False,
                "error": f"Minimal transaksi untuk kupon ini adalah Rp {min_order:,.0f}.".replace(",", "."),
                "message": f"Minimal pembelian Rp {min_order:,.0f}.".replace(",", "."),
            }

        dtype = promo.get("discountType", "percentage")
        dval = float(promo.get("discountValue", 0))

        if dtype == "percentage":
            discount = round((eligible_subtotal * dval) / 100.0)
            max_d = promo.get("maxDiscount")
            if max_d is not None and float(max_d) > 0:
                discount = min(discount, float(max_d))
        else:
            # Fixed discount: cannot exceed eligible_subtotal
            discount = min(dval, eligible_subtotal)

        return {
            "valid": True,
            "code": promo["code"],
            "description": promo.get("description") or (f"Diskon {clean_code} (Khusus {target_prod_name})" if target_prod_id else f"Diskon {clean_code}"),
            "discountType": dtype,
            "discountValue": dval,
            "discountAmount": discount,
            "finalTotal": max(0.0, subtotal - discount),
            "minOrderAmount": min_order,
            "targetScope": target_scope,
            "targetProductId": target_prod_id,
            "targetProductName": target_prod_name,
            "message": f"Voucher khusus '{target_prod_name}' berhasil digunakan!" if target_prod_id else "Kupon promo berhasil digunakan!",
        }

    @classmethod
    def record_usage(cls, code: str) -> bool:
        """Increments usedCount when promo is successfully used in an order."""
        clean_code = code.strip().upper()
        promos = cls.load_promos()
        matched = next((p for p in promos if p.get("code", "").upper() == clean_code), None)
        if not matched:
            return False

        current_used = int(matched.get("usedCount") or 0)
        matched["usedCount"] = current_used + 1

        # Sync to Supabase PostgreSQL
        try:
            db = SessionLocal()
            try:
                db_promo = db.query(PromoCode).filter(PromoCode.code == clean_code).first()
                if db_promo:
                    db_promo.used_count = (db_promo.used_count or 0) + 1
                    db.commit()
            finally:
                db.close()
        except Exception as e:
            print(f"[PromoService] Supabase record_usage note: {e}")

        cls.save_promos()
        return True

    @classmethod
    def get_all_promos(cls) -> Dict[str, Any]:
        promos = cls.load_promos()
        total_used = sum(int(p.get("usedCount") or 0) for p in promos)
        active_count = sum(1 for p in promos if p.get("isActive", True))

        return {
            "promos": promos,
            "total": len(promos),
            "metrics": {
                "total": len(promos),
                "active": active_count,
                "totalUsed": total_used,
            },
        }

    @classmethod
    def create_promo(cls, payload: Dict[str, Any]) -> Dict[str, Any]:
        promos = cls.load_promos()
        clean_code = str(payload.get("code", "")).strip().upper()

        target_scope = payload.get("targetScope") or ("specific_product" if payload.get("targetProductId") else "all")
        target_prod_id = payload.get("targetProductId") or None
        target_prod_name = payload.get("targetProductName") or None

        new_promo = {
            "id": f"promo-{int(datetime.utcnow().timestamp() * 1000)}-{len(promos) + 1}",
            "code": clean_code,
            "description": payload.get("description"),
            "discountType": payload.get("discountType", "percentage"),
            "discountValue": float(payload.get("discountValue", 10)),
            "maxDiscount": float(payload.get("maxDiscount")) if payload.get("maxDiscount") else None,
            "minOrderAmount": float(payload.get("minOrderAmount", 0)),
            "usageLimit": int(payload.get("usageLimit", 500)) if payload.get("usageLimit") else None,
            "usedCount": 0,
            "perUserLimit": int(payload.get("perUserLimit", 1)),
            "startDate": payload.get("startDate") or datetime.utcnow().isoformat() + "Z",
            "expiresAt": payload.get("expiresAt") or None,
            "isActive": bool(payload.get("isActive", True)),
            "targetScope": target_scope,
            "targetProductId": target_prod_id,
            "targetProductName": target_prod_name,
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "updatedAt": datetime.utcnow().isoformat() + "Z",
        }

        # 1. DB Save
        try:
            cls.ensure_table()
            db = SessionLocal() if SessionLocal else None
            if db:
                try:
                    exp_dt = None
                    if new_promo["expiresAt"]:
                        try:
                            exp_dt = datetime.fromisoformat(str(new_promo["expiresAt"]).replace("Z", "+00:00"))
                        except Exception:
                            pass
                    
                    db_row = PromoCode(
                        id=new_promo["id"],
                        code=new_promo["code"],
                        description=new_promo["description"],
                        discount_type=new_promo["discountType"],
                        discount_value=int(new_promo["discountValue"]),
                        max_discount=int(new_promo["maxDiscount"]) if new_promo["maxDiscount"] is not None else None,
                        min_order_amount=int(new_promo["minOrderAmount"]),
                        usage_limit=new_promo["usageLimit"],
                        used_count=0,
                        per_user_limit=new_promo["perUserLimit"],
                        expires_at=exp_dt,
                        is_active=new_promo["isActive"],
                        target_scope=target_scope,
                        target_product_id=target_prod_id,
                        target_product_name=target_prod_name,
                        created_at=datetime.utcnow(),
                        updated_at=datetime.utcnow(),
                    )
                    db.add(db_row)
                    db.commit()
                finally:
                    db.close()
        except Exception as e:
            print(f"[PromoService] DB insert note: {e}")

        # 2. Local memory & cache
        promos.insert(0, new_promo)
        cls.save_promos()
        return new_promo

    @classmethod
    def update_promo(cls, promo_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        promos = cls.load_promos()
        matched = None
        for idx, p in enumerate(promos):
            if p.get("id") == promo_id or p.get("code", "").upper() == promo_id.upper():
                for k, v in payload.items():
                    if v is not None:
                        p[k] = v
                p["updatedAt"] = datetime.utcnow().isoformat() + "Z"
                promos[idx] = p
                matched = p
                break

        if matched:
            cls.save_promos()

            # DB update
            try:
                db = SessionLocal() if SessionLocal else None
                if db:
                    try:
                        db_p = db.query(PromoCode).filter((PromoCode.id == promo_id) | (PromoCode.code == promo_id.upper())).first()
                        if db_p:
                            if "targetScope" in payload:
                                db_p.target_scope = payload["targetScope"]
                            if "targetProductId" in payload:
                                db_p.target_product_id = payload["targetProductId"]
                            if "targetProductName" in payload:
                                db_p.target_product_name = payload["targetProductName"]
                            if "isActive" in payload:
                                db_p.is_active = bool(payload["isActive"])
                            if "discountValue" in payload:
                                db_p.discount_value = int(payload["discountValue"])
                            if "discountType" in payload:
                                db_p.discount_type = payload["discountType"]
                            if "minOrderAmount" in payload:
                                db_p.min_order_amount = int(payload["minOrderAmount"])
                            if "maxDiscount" in payload:
                                db_p.max_discount = int(payload["maxDiscount"]) if payload["maxDiscount"] else None
                            db.commit()
                    finally:
                        db.close()
            except Exception as e:
                print(f"[PromoService] DB update note: {e}")

            return matched
        return None

    @classmethod
    def toggle_promo(cls, promo_id: str) -> Optional[Dict[str, Any]]:
        promos = cls.load_promos()
        for idx, p in enumerate(promos):
            if p.get("id") == promo_id or p.get("code", "").upper() == promo_id.upper():
                p["isActive"] = not p.get("isActive", True)
                p["updatedAt"] = datetime.utcnow().isoformat() + "Z"
                promos[idx] = p
                cls.save_promos()

                # DB toggle
                try:
                    db = SessionLocal() if SessionLocal else None
                    if db:
                        try:
                            db_p = db.query(PromoCode).filter((PromoCode.id == promo_id) | (PromoCode.code == promo_id.upper())).first()
                            if db_p:
                                db_p.is_active = p["isActive"]
                                db.commit()
                        finally:
                            db.close()
                except Exception as e:
                    print(f"[PromoService] DB toggle note: {e}")

                return p
        return None

    @classmethod
    def delete_promo(cls, promo_id: str) -> bool:
        promos = cls.load_promos()
        initial_len = len(promos)
        cls._promos = [p for p in promos if p.get("id") != promo_id and p.get("code", "").upper() != promo_id.upper()]
        if len(cls._promos) < initial_len:
            cls.save_promos()

            # DB delete
            try:
                db = SessionLocal() if SessionLocal else None
                if db:
                    try:
                        db_p = db.query(PromoCode).filter((PromoCode.id == promo_id) | (PromoCode.code == promo_id.upper())).first()
                        if db_p:
                            db.delete(db_p)
                            db.commit()
                    finally:
                        db.close()
            except Exception as e:
                print(f"[PromoService] DB delete note: {e}")

            return True
        return False
