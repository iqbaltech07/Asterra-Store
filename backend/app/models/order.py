from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Boolean
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
    target_id = Column(String, nullable=True)
    target_zone = Column(String, nullable=True)

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
            "targetId": self.target_id,
            "target_id": self.target_id,
            "targetZone": self.target_zone,
            "target_zone": self.target_zone,
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
    referral_session_id = Column(String, nullable=True)
    sales_partner_id = Column(String, nullable=True)
    recruiter_partner_id = Column(String, nullable=True)
    promo_discount = Column(Integer, default=0)
    referral_discount = Column(Integer, default=0)
    campaign_id = Column(String, nullable=True)
    campaign_discount = Column(Integer, default=0)
    provider = Column(String, nullable=True)
    provider_trxid = Column(String, nullable=True)
    provider_status = Column(String, nullable=True)
    provider_note = Column(Text, nullable=True)
    is_preorder = Column(Boolean, default=False, nullable=True)
    # Order Fulfillment & Credential Delivery fields
    fulfillment_mode = Column(String, default="manual", nullable=True)  # 'manual' | 'automatic'
    fulfillment_credentials = Column(Text, nullable=True)  # JSON-formatted credentials list
    fulfillment_admin_id = Column(String, nullable=True)  # Admin user id who completed manual fulfillment
    fulfilled_at = Column(DateTime, nullable=True)
    email_delivery_status = Column(String, default="pending", nullable=True)  # 'pending' | 'sent' | 'failed'
    email_delivery_error = Column(Text, nullable=True)
    email_last_sent_at = Column(DateTime, nullable=True)
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
            "referralSessionId": self.referral_session_id,
            "salesPartnerId": self.sales_partner_id,
            "recruiterPartnerId": self.recruiter_partner_id,
            "promoDiscount": self.promo_discount,
            "referralDiscount": self.referral_discount,
            "campaignId": self.campaign_id,
            "campaignDiscount": self.campaign_discount,
            "provider": self.provider,
            "providerTrxId": self.provider_trxid,
            "provider_trxid": self.provider_trxid,
            "providerStatus": self.provider_status,
            "provider_status": self.provider_status,
            "providerNote": self.provider_note,
            "provider_note": self.provider_note,
            "expiresAt": (self.expires_at.isoformat() + "Z") if self.expires_at else None,
            "paidAt": (self.paid_at.isoformat() + "Z") if self.paid_at else None,
            "createdAt": (self.created_at.isoformat() + "Z") if self.created_at else None,
            "updatedAt": (self.updated_at.isoformat() + "Z") if self.updated_at else None,
            "expires_at": (self.expires_at.isoformat() + "Z") if self.expires_at else None,
            "paid_at": (self.paid_at.isoformat() + "Z") if self.paid_at else None,
            "created_at": (self.created_at.isoformat() + "Z") if self.created_at else None,
            "updated_at": (self.updated_at.isoformat() + "Z") if self.updated_at else None,
            "referral_code": self.referral_code,
            "referral_session_id": self.referral_session_id,
            "sales_partner_id": self.sales_partner_id,
            "recruiter_partner_id": self.recruiter_partner_id,
            "promo_discount": self.promo_discount,
            "referral_discount": self.referral_discount,
            "campaign_id": self.campaign_id,
            "campaign_discount": self.campaign_discount,
            "unique_code": self.unique_code,
            "raw_amount": self.raw_amount,
            "total_amount": self.total_amount,
            "payment_mode": self.payment_mode,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "customer_email": self.customer_email,
            "customer_name": self.customer_name,
            "customer_whatsapp": self.customer_whatsapp,
            "customer_notes": self.customer_notes,
            "is_preorder": bool(self.is_preorder),
            "isPreorder": bool(self.is_preorder),
            "order_status": self.status,
            "fulfillmentMode": self.fulfillment_mode or "manual",
            "fulfillment_mode": self.fulfillment_mode or "manual",
            "fulfillmentCredentials": self.fulfillment_credentials,
            "fulfillment_credentials": self.fulfillment_credentials,
            "fulfillmentAdminId": self.fulfillment_admin_id,
            "fulfillment_admin_id": self.fulfillment_admin_id,
            "fulfilledAt": (self.fulfilled_at.isoformat() + "Z") if self.fulfilled_at else None,
            "fulfilled_at": (self.fulfilled_at.isoformat() + "Z") if self.fulfilled_at else None,
            "emailDeliveryStatus": self.email_delivery_status or "pending",
            "email_delivery_status": self.email_delivery_status or "pending",
            "emailDeliveryError": self.email_delivery_error,
            "email_delivery_error": self.email_delivery_error,
            "emailLastSentAt": (self.email_last_sent_at.isoformat() + "Z") if self.email_last_sent_at else None,
            "email_last_sent_at": (self.email_last_sent_at.isoformat() + "Z") if self.email_last_sent_at else None,
            "items": [it.to_dict() for it in self.items] if self.items else [],
        }
