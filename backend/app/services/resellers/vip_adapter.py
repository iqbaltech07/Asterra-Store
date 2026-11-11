"""
Backward compatibility wrapper for VIP Reseller.
All functionalities migrated to Xaviera Store API Gateway.
"""
from app.services.resellers.xaviera_adapter import XavieraAdapter, VipResellerAdapter

__all__ = ["XavieraAdapter", "VipResellerAdapter"]
