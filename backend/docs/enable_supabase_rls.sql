-- ==============================================================================
-- Supabase Row Level Security (RLS) Enablement Script
-- Database: Asterra Store Production/Staging (Supabase PostgreSQL)
-- Description: Enables RLS across all 28 public tables to comply with
--              Supabase Security Advisor guidelines and prevent direct PostgREST exposure.
-- ==============================================================================

ALTER TABLE public."account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."admin_users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."commissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."homepage_product_sections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."order_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."order_processing_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."payment_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."payout_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."product_attributes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."product_cards" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."product_variants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."products" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."profit_ledgers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."promo_banners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."promo_campaigns" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."promo_codes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."promo_usages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."referral_discount_usages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."referral_sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."reseller_api_settings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."sales_partners" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."store_operating_hours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."verification" ENABLE ROW LEVEL SECURITY;

-- Note: The database connects via PostgreSQL superuser/owner (role postgres),
-- which bypasses RLS by default. Direct client access (anon/authenticated roles)
-- through Supabase Data API / PostgREST is locked down as intended.
