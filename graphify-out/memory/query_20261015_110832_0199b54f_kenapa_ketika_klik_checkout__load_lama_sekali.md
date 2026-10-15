---
type: "query"
date: "2026-10-15T11:08:32.875901+00:00"
question: "kenapa ketika klik checkout, load lama sekali?"
contributor: "graphify"
outcome: "useful"
source_nodes: ["checkout/page.tsx", "CheckoutPageContent()", ".load_orders()", "create_order()"]
---

# Q: kenapa ketika klik checkout, load lama sekali?

## Answer

Expanded from original query via vocab: ['checkout', 'order', 'orders', 'cart', 'payment', 'session', 'usesession', 'campaign', 'promo', 'tripay', 'load', 'loading'].
Traversal revealed two main bottlenecks:
1. Navigation & Frontend Waterfall (checkout/page.tsx): Missing router.prefetch, 6 waterfall network calls (useSession, campaigns/active, duplicate payment-config, user profile, affiliate validate-referral).
2. OrderService.create_order() Backend Blocking Chain: cls.load_orders(force_reload=True) reloads and normalizes the entire Supabase PostgreSQL database and writes 2 JSON files to disk synchronously on every order creation, along with synchronous audit logs and commission ledger sync.

## Outcome

- Signal: useful

## Source Nodes

- checkout/page.tsx
- CheckoutPageContent()
- .load_orders()
- create_order()