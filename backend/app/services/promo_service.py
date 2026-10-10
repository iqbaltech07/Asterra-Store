import json
import pathlib
from datetime import datetime
from typing import Dict, Any, List, Optional

DATA_DIR = pathlib.Path(__file__).resolve().parent.parent.parent / "data"
PROMOS_FILE = DATA_DIR / "supabase-promos.json"

class PromoService:
    _promos: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def load_promos(cls, force_reload: bool = False) -> List[Dict[str, Any]]:
        if cls._promos is not None and not force_reload:
            return cls._promos

        if PROMOS_FILE.exists():
            try:
                data = json.loads(PROMOS_FILE.read_text(encoding="utf-8"))
                if isinstance(data, list):
                    cls._promos = data
                    return data
            except Exception as e:
                print(f"[PromoService] Error loading promos: {e}")

        cls._promos = []
        return []

    @classmethod
    def save_promos(cls) -> bool:
        try:
            if cls._promos is not None:
                PROMOS_FILE.parent.mkdir(parents=True, exist_ok=True)
                PROMOS_FILE.write_text(json.dumps(cls._promos, indent=2, ensure_ascii=False), encoding="utf-8")
                return True
        except Exception as e:
            print(f"[PromoService] Error saving promos: {e}")
        return False

    @classmethod
    def validate_promo(cls, code: str, subtotal: float) -> Dict[str, Any]:
        clean_code = code.strip().upper()
        promos = cls.load_promos()
        promo = next((p for p in promos if p.get("code", "").upper() == clean_code), None)

        if not promo:
            # Fallback pattern for dynamic promotional codes
            if clean_code.startswith("AST") or "DISKON" in clean_code or "PROMO" in clean_code:
                discount_amount = min(20000.0, round(subtotal * 0.1))
                return {
                    "valid": True,
                    "code": clean_code,
                    "description": f"Kupon Diskon {clean_code}",
                    "discountType": "percentage",
                    "discountValue": 10,
                    "discountAmount": discount_amount,
                    "finalTotal": max(0.0, subtotal - discount_amount),
                    "minOrderAmount": 0,
                    "message": "Kupon berhasil diterapkan!",
                }
            return {
                "valid": False,
                "error": f"Kode promo '{code}' tidak valid atau telah kedaluwarsa.",
                "message": f"Kode promo '{code}' tidak ditemukan.",
            }

        if not promo.get("isActive", True):
            return {
                "valid": False,
                "error": f"Kode promo '{clean_code}' sudah tidak aktif.",
                "message": "Kode promo tidak aktif.",
            }

        min_order = float(promo.get("minOrderAmount") or 0)
        if subtotal < min_order:
            return {
                "valid": False,
                "error": f"Minimal transaksi untuk kupon ini adalah Rp {min_order:,.0f}.".replace(",", "."),
                "message": f"Minimal pembelian Rp {min_order:,.0f}".replace(",", "."),
            }

        dtype = promo.get("discountType", "percentage")
        dval = float(promo.get("discountValue", 0))

        if dtype == "percentage":
            discount = round((subtotal * dval) / 100.0)
            max_d = promo.get("maxDiscount")
            if max_d is not None and float(max_d) > 0:
                discount = min(discount, float(max_d))
        else:
            discount = dval

        return {
            "valid": True,
            "code": promo["code"],
            "description": promo.get("description") or f"Diskon {clean_code}",
            "discountType": dtype,
            "discountValue": dval,
            "discountAmount": discount,
            "finalTotal": max(0.0, subtotal - discount),
            "minOrderAmount": min_order,
            "message": "Kupon promo berhasil digunakan!",
        }

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
            "createdAt": datetime.utcnow().isoformat() + "Z",
            "updatedAt": datetime.utcnow().isoformat() + "Z",
        }

        promos.insert(0, new_promo)
        cls.save_promos()
        return new_promo

    @classmethod
    def update_promo(cls, promo_id: str, payload: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        promos = cls.load_promos()
        for idx, p in enumerate(promos):
            if p.get("id") == promo_id or p.get("code", "").upper() == promo_id.upper():
                for k, v in payload.items():
                    if v is not None:
                        p[k] = v
                p["updatedAt"] = datetime.utcnow().isoformat() + "Z"
                promos[idx] = p
                cls.save_promos()
                return p
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
                return p
        return None

    @classmethod
    def delete_promo(cls, promo_id: str) -> bool:
        promos = cls.load_promos()
        initial_len = len(promos)
        cls._promos = [p for p in promos if p.get("id") != promo_id and p.get("code", "").upper() != promo_id.upper()]
        if len(cls._promos) < initial_len:
            cls.save_promos()
            return True
        return False
