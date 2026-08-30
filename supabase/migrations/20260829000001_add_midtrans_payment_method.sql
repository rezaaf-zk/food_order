-- ============================================================================
-- MIGRATION: Support Midtrans Snap Payment Gateway
-- Reference: ANTIGRAVITY_MIDTRANS_MIGRATION.md
-- ============================================================================

-- 1. Update orders table payment_method check constraint to allow 'midtrans'
ALTER TABLE public.orders 
  DROP CONSTRAINT IF EXISTS orders_payment_method_check;

ALTER TABLE public.orders 
  ADD CONSTRAINT orders_payment_method_check 
  CHECK (payment_method IN ('cash', 'midtrans', 'stripe', 'qris', 'transfer'));

-- 2. Ensure payments table provider index exists for fast lookup
CREATE INDEX IF NOT EXISTS idx_payments_provider ON public.payments(provider);
CREATE INDEX IF NOT EXISTS idx_payments_provider_payment_id ON public.payments(provider_payment_id);
