from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(String, primary_key=True)
    order_id = Column(String, ForeignKey("orders.id"), nullable=False)
    product_id = Column(String, nullable=False)
    product_name = Column(String, nullable=False)
    price = Column(Integer, nullable=False)
    quantity = Column(Integer, default=1)
    duration = Column(String, nullable=True)
    target_email = Column(String, nullable=True)
    target_phone = Column(String, nullable=True)

    order = relationship("Order", back_populates="items")

    def to_dict(self):
        return {
            "id": self.id,
            "orderId": self.order_id,
            "productId": self.product_id,
            "productName": self.product_name,
            "price": self.price,
            "quantity": self.quantity,
            "duration": self.duration,
            "targetEmail": self.target_email,
            "targetPhone": self.target_phone,
        }

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True)
    customer_email = Column(String, nullable=False)
    customer_whatsapp = Column(String, nullable=True)
    customer_name = Column(String, nullable=True)
    total_amount = Column(Integer, nullable=False)
    raw_amount = Column(Integer, nullable=True)
    unique_code = Column(Integer, nullable=True)
    status = Column(String, default="pending")
    payment_method = Column(String, nullable=True)
    payment_reference = Column(String, nullable=True)
    payment_mode = Column(String, nullable=True)
    payment_status = Column(String, nullable=True)
    customer_notes = Column(Text, nullable=True)
    referral_code = Column(String, nullable=True)
    sales_partner_id = Column(String, nullable=True)
    recruiter_partner_id = Column(String, nullable=True)
    promo_discount = Column(Integer, default=0)
    referral_discount = Column(Integer, default=0)
    expires_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "orderId": self.id,
            "customerEmail": self.customer_email,
            "customerWhatsapp": self.customer_whatsapp,
            "customerName": self.customer_name,
            "totalAmount": self.total_amount,
            "rawAmount": self.raw_amount,
            "uniqueCode": self.unique_code,
            "status": self.status,
            "paymentMethod": self.payment_method,
            "paymentReference": self.payment_reference,
            "paymentMode": self.payment_mode,
            "paymentStatus": self.payment_status,
            "customerNotes": self.customer_notes,
            "referralCode": self.referral_code,
            "salesPartnerId": self.sales_partner_id,
            "recruiterPartnerId": self.recruiter_partner_id,
            "promoDiscount": self.promo_discount,
            "referralDiscount": self.referral_discount,
            "expiresAt": self.expires_at.isoformat() if self.expires_at else None,
            "paidAt": self.paid_at.isoformat() if self.paid_at else None,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
            "items": [it.to_dict() for it in self.items] if self.items else [],
        }
