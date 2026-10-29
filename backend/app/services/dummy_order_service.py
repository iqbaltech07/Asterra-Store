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
    def generate_and_save_dummy_order(cls) -> Optional[Dict[str, Any]]:
        """
        Generates and saves a valid dummy order meeting all Phase 7 requirements:
        - Validates candidate product twice (selection & pre-save).
        - Saves with is_dummy = True.
        - Does NOT alter real catalog stock.
        - Emits real-time SSE event for storefront /orders page.
        """
        db = SessionLocal()
        try:
            # Stage 1: Candidate Selection
            eligible_products = cls.get_eligible_catalogs(db)
            if not eligible_products:
                print("[DummyOrderService] No eligible active products available. Skipping dummy order cycle.")
                return None

            selected_product = random.choice(eligible_products)

            # Stage 2: Re-validation right before saving
            prod_check = db.query(Product).filter_by(id=selected_product.id).first()
            if not prod_check or prod_check.status != "active" or prod_check.price <= 0:
                print(f"[DummyOrderService] Product {selected_product.id} status changed prior to save. Aborting.")
                return None
            if prod_check.card_id:
                card_check = db.query(ProductCard).filter_by(id=prod_check.card_id).first()
                if not card_check or card_check.status != "active":
                    print(f"[DummyOrderService] Card parent {prod_check.card_id} inactive. Aborting.")
                    return None

            # Generate Indonesian masked customer name
            first = random.choice(INDONESIAN_FIRST_NAMES)
            last = random.choice(INDONESIAN_LAST_NAMES)
            raw_customer_name = f"{first} {last}"
            masked_customer_name = mask_name(raw_customer_name)
            customer_email = f"buyer_{random.randint(100, 999)}@customer.id"

            # Generate unique order ID format AST-ORD-YYYYMMDD-NNNN
            now_wib = datetime.now(WIB)
            date_key = now_wib.strftime("%Y%m%d")
            order_num = random.randint(1000, 9999)
            order_id = f"AST-ORD-{date_key}-{order_num}"

            # Ensure ID uniqueness
            while db.query(Order).filter_by(id=order_id).first():
                order_num = random.randint(1000, 9999)
                order_id = f"AST-ORD-{date_key}-{order_num}"

            # Create dummy Order with is_dummy = True
            now_utc = datetime.now(timezone.utc)
            order = Order(
                id=order_id,
                customer_email=customer_email,
                customer_name=masked_customer_name,
                customer_whatsapp=f"08{random.randint(1000000000, 9999999999)}",
                total_amount=int(prod_check.price),
                raw_amount=int(prod_check.price),
                status="completed",
                payment_method="QRIS",
                payment_mode="direct",
                payment_status="settlement",
                is_preorder=False,
                is_dummy=True,  # Phase 6 & 7: strictly isolated from real transactions
                fulfillment_mode="automatic",
                paid_at=now_utc,
                fulfilled_at=now_utc,
                created_at=now_utc,
                updated_at=now_utc,
            )
            db.add(order)

            # Create OrderItem
            item = OrderItem(
                id=f"item-{order_id}-1",
                order_id=order_id,
                product_id=prod_check.id,
                product_name=prod_check.name,
                card_id=prod_check.card_id,
                price=int(prod_check.price),
                quantity=1,
                duration="1 Bulan",
            )
            db.add(item)

            # NOTE: DO NOT REDUCE prod_check.stock (Phase 7.4 strictly enforced)
            db.commit()
            db.refresh(order)

            order_dict = order.to_dict()
            print(f"[DummyOrderService] Created dummy order {order_id} for product '{prod_check.name}' (Rp {prod_check.price:,}).")

            # Emit real-time notification to clients
            try:
                RealtimeBroadcaster.broadcast(
                    "order:created",
                    {
                        "orderId": order_id,
                        "productName": prod_check.name,
                        "customerDisplay": masked_customer_name,
                        "status": "completed",
                        "createdAt": now_utc.isoformat() + "Z",
                    },
                    target_role="user",
                )
            except Exception as e:
                print(f"[DummyOrderService] Realtime broadcast note: {e}")

            return order_dict
        except Exception as e:
            db.rollback()
            print(f"[DummyOrderService] Error generating dummy order: {e}")
            return None
        finally:
            db.close()
