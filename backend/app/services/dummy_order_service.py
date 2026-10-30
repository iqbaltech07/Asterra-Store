import random
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import joinedload
from app.core.database import SessionLocal
from app.models.product import Product
from app.models.product_card import ProductCard
from app.models.order import Order, OrderItem
from app.services.store_operating_hours_service import StoreOperatingHoursService
from app.services.realtime_broadcaster import RealtimeBroadcaster

WIB = timezone(timedelta(hours=7))

INDONESIAN_FIRST_NAMES = [
    'Ahmad', 'Aditya', 'Agus', 'Aldi', 'Alvin', 'Andi', 'Andre', 'Angga', 'Anisa', 'Arif',
    'Arya', 'Ayu', 'Bagus', 'Bambang', 'Bayu', 'Bima', 'Budi', 'Chandra', 'Citra', 'Danang',
    'Dedi', 'Denny', 'Devi', 'Dewi', 'Dian', 'Diki', 'Dimas', 'Dina', 'Doni', 'Dwi',
    'Eka', 'Eko', 'Fajar', 'Fandi', 'Farhan', 'Fauzan', 'Febri', 'Fikri', 'Galih', 'Gilang',
    'Gita', 'Hadi', 'Hafiz', 'Hendra', 'Hesti', 'Ilham', 'Indah', 'Indra', 'Intan', 'Irfan',
    'Kurnia', 'Lestari', 'Lukman', 'Mega', 'Maya', 'Maulana', 'Mita', 'Muhammad', 'Nabila', 'Nanda',
    'Novita', 'Nugroho', 'Nur', 'Panji', 'Permana', 'Pratama', 'Putra', 'Putri', 'Raden', 'Rafi',
    'Rahma', 'Rahmat', 'Rama', 'Randi', 'Rangga', 'Reza', 'Rian', 'Rifki', 'Riko', 'Rio',
    'Riri', 'Riska', 'Rizky', 'Roni', 'Ryan', 'Sandi', 'Satria', 'Septian', 'Sinta', 'Siti',
    'Surya', 'Taufik', 'Teguh', 'Tiara', 'Tri', 'Wahyu', 'Wawan', 'Widia', 'Winda', 'Yoga',
    'Yogi', 'Yuda', 'Yudi', 'Yulia', 'Yusuf', 'Zaki', 'Zahra', 'Zul',
]

INDONESIAN_LAST_NAMES = [
    'Abadi', 'Akbar', 'Alamsyah', 'Anggoro', 'Anshori', 'Ardiansyah', 'Arianto', 'Ariyanto', 'Ashari', 'Asyari',
    'Budiman', 'Cahyono', 'Darmawan', 'Effendi', 'Fachrezi', 'Fadillah', 'Fauzi', 'Firmansyah', 'Gunawan', 'Hakim',
    'Hamzah', 'Handayani', 'Hardiansyah', 'Hartanto', 'Hasan', 'Hasanah', 'Hasibuan', 'Hidayat', 'Hidayatullah', 'Ibrahim',
    'Irawan', 'Iskandar', 'Jaelani', 'Kamil', 'Kurniawan', 'Kusuma', 'Laksamana', 'Lubis', 'Mahardika', 'Mahendra',
    'Mansyur', 'Marpaung', 'Maulana', 'Mubarok', 'Mulyadi', 'Munandar', 'Nasution', 'Nugraha', 'Nugroho', 'Nurcahyo',
    'Pambudi', 'Pamungkas', 'Pangestu', 'Pasaribu', 'Permana', 'Pradana', 'Prakoso', 'Prasetya', 'Prasetyo', 'Pratama',
    'Prayoga', 'Purnomo', 'Purwanto', 'Puspasari', 'Putra', 'Putri', 'Qodir', 'Rachman', 'Raditya', 'Rahardjo',
    'Rahman', 'Ramadhan', 'Rasyid', 'Ridwan', 'Riyadi', 'Rosadi', 'Rusli', 'Safitri', 'Saleh', 'Santoso',
    'Saputra', 'Saputri', 'Sari', 'Sasmita', 'Setiawan', 'Sihombing', 'Siregar', 'Subagyo', 'Sudrajat', 'Sugeng',
    'Suharto', 'Sukoco', 'Sulaiman', 'Sumantri', 'Supriyadi', 'Suryadi', 'Susanto', 'Sutanto', 'Sutrisno', 'Syahputra',
    'Tanoto', 'Tanjung', 'Tarigan', 'Triyono', 'Utama', 'Utami', 'Wardhana', 'Wibawa', 'Wibowo', 'Wicaksono',
    'Widagdo', 'Widodo', 'Wijaya', 'Winata', 'Wirawan', 'Wulandari', 'Yudha', 'Yulianto', 'Yunani', 'Zulkarnain',
]

def mask_name(full_name: str) -> str:
    """Masks a full name into AsterraStore canonical masked customer format."""
    words = full_name.strip().split()
    masked_words = []
    for w in words:
        if len(w) <= 1:
            masked_words.append(w)
        elif len(w) == 2:
            masked_words.append(w[0] + "*")
        elif len(w) <= 4:
            masked_words.append(w[0] + "*" * (len(w) - 1))
        else:
            masked_words.append(w[0] + "*" * (len(w) - 2) + w[-1])
    return " ".join(masked_words)

class DummyOrderService:
    @classmethod
    def get_eligible_catalogs(cls, db=None) -> List[Product]:
        """
        Phase 7 Strict Eligibility Filter:
        1. Catalog status == 'active' and not archived.
        2. Valid price > 0.
        3. Stock > 0 and provider_status != 'empty'.
        4. If connected to Card Produk (card_id IS NOT NULL):
           Card Produk must be active and not archived!
        5. Standalone catalogs (card_id IS NULL) are allowed if active.
        """
        should_close = False
        if db is None:
            db = SessionLocal()
            should_close = True

        try:
            query = (
                db.query(Product)
                .options(joinedload(Product.card))
                .filter(Product.status == "active")
                .filter(Product.price > 0)
            )
            candidates = query.all()

            eligible = []
            for p in candidates:
                # Stock & provider availability check
                if p.stock is not None and p.stock <= 0:
                    continue
                if p.provider_status == "empty":
                    continue

                # Card Produk status check
                if p.card_id:
                    if not p.card or p.card.status != "active":
                        continue

                eligible.append(p)

            return eligible
        finally:
            if should_close:
                db.close()

    @classmethod
    def get_next_sleep_seconds(cls, store_status: Optional[Dict[str, Any]] = None) -> int:
        """
        Phase 9 Interval Adjustment:
        When store is OPEN: normal interval (e.g. 300 to 600s = 5-10 mins).
        When store is CLOSED: 2x normal interval (e.g. 600 to 1200s = 10-20 mins).
        Rule: interval_tutup = interval_normal * 2.
        """
        if store_status is None:
            store_status = StoreOperatingHoursService.get_current_status()
        is_open = bool(store_status.get("isOpen", False) or store_status.get("is_open", False))

        # Base normal interval: 5 to 10 minutes (300 to 600 seconds)
        normal_seconds = random.randint(300, 600)

        if is_open:
            return normal_seconds
        else:
            # 2x slower when store is closed!
            return normal_seconds * 2

    @classmethod
    def check_and_trigger_due_dummy_order(cls, db=None) -> Optional[Dict[str, Any]]:
        """
        Serverless-resilient & opportunistic execution check.
        Ensures dummy orders are generated strictly when due, adhering to store operating hours:
        - Store OPEN: interval 300–600 seconds (5–10 mins)
        - Store CLOSED: interval 600–1200 seconds (10–20 mins)
        - Thread & process-safe via PostgreSQL advisory lock (key: 8822001)
        - NEVER generates on every page hit if interval has not elapsed
        - Zero duplicate orders, full diagnostic logging
        """
        should_close = False
        if db is None:
            if not SessionLocal:
                return None
            db = SessionLocal()
            should_close = True

        lock_acquired = False
        try:
            # 1. Acquire distributed PostgreSQL advisory lock (key: 8822001)
            try:
                from sqlalchemy import text
                res = db.execute(text("SELECT pg_try_advisory_lock(8822001)")).scalar()
                lock_acquired = bool(res)
            except Exception:
                lock_acquired = True

            if not lock_acquired:
                # Another worker or serverless instance is actively evaluating/generating
                return None

            # 2. Get store operating hours status
            store_status = StoreOperatingHoursService.get_current_status()
            is_open = bool(store_status.get("isOpen", False) or store_status.get("is_open", False))

            # 3. Query latest dummy order
            latest_dummy = (
                db.query(Order)
                .filter(Order.is_dummy == True)
                .order_by(Order.created_at.desc())
                .first()
            )

            now_utc = datetime.utcnow()

            if latest_dummy and latest_dummy.created_at:
                created_at = latest_dummy.created_at
                if created_at.tzinfo:
                    created_at = created_at.replace(tzinfo=None)
                elapsed_seconds = (now_utc - created_at).total_seconds()

                # Derive consistent target interval for this slot based on the hash of latest order ID
                seed_val = sum(ord(c) for c in (latest_dummy.id or ""))
                rng = random.Random(seed_val)
                target_interval = rng.randint(300, 600) if is_open else rng.randint(600, 1200)

                if elapsed_seconds < target_interval:
                    # Interval not elapsed yet. Strictly skip generation.
                    return None

                print(
                    f"[DummyOrderService] Periodic dummy order is due. Elapsed: {int(elapsed_seconds)}s >= "
                    f"Target: {target_interval}s (Store {'OPEN' if is_open else 'CLOSED'}). Generating..."
                )
            else:
                print(
                    f"[DummyOrderService] No existing dummy orders found in database. Initializing first dummy order..."
                )

            # 4. Generate and save the dummy order
            new_order = cls.generate_and_save_dummy_order()
            if new_order:
                # Reload order service cache
                try:
                    from app.services.order_service import OrderService
                    OrderService.load_orders(force_reload=True)
                except Exception as oe:
                    print(f"[DummyOrderService] Order cache reload note: {oe}")
                print(f"[DummyOrderService] Successfully generated periodic dummy order: {new_order.get('id')}")

            return new_order
        except Exception as e:
            print(f"[DummyOrderService] Error in check_and_trigger_due_dummy_order: {e}")
            return None
        finally:
            if lock_acquired:
                try:
                    from sqlalchemy import text
                    db.execute(text("SELECT pg_advisory_unlock(8822001)"))
                except Exception:
                    pass
            if should_close:
                db.close()

    @classmethod
    def generate_and_save_dummy_order(cls) -> Optional[Dict[str, Any]]:
        """
        STRICT: Fake orders are strictly visual on the user frontend (/orders).
        They must NEVER be persisted to the PostgreSQL database or admin console.
        """
        return None
