---
type: "query"
date: "2026-10-15T11:44:13.435938+00:00"
question: "optimasi performa klik bayar sekarang checkout"
contributor: "graphify"
outcome: "useful"
source_nodes: ["create_order()", ".load_orders()", "CampaignService", "CheckoutPageContent()"]
---

# Q: optimasi performa klik bayar sekarang checkout

## Answer

Optimized OrderService.create_order, CampaignService.ensure_table, and checkout route:
1. Eliminated cls.load_orders(force_reload=True) and replaced with instant in-memory append (cls._orders.insert(0, normalized)).
2. Offloaded secondary tasks (commissions, audit logs, telemetries, and disk saves) to FastAPI BackgroundTasks.
3. Added _table_ensured guard in CampaignService to prevent repeating DDL ALTER TABLE queries on every checkout.
4. Optimized referral discount check to use memory cache / indexed query instead of loading all orders.
5. Added FastAPI lifespan pre-warming on server boot.
6. Removed redundant payment-config fetch and added router.prefetch('/checkout').

## Outcome

- Signal: useful

## Source Nodes

- create_order()
- .load_orders()
- CampaignService
- CheckoutPageContent()