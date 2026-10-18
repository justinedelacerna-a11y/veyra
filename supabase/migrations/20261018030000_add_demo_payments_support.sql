-- ============================================================
-- Migration: 20261018030000_add_demo_payments_support.sql
-- Description: Add demo transaction support to public.payments
--              to distinctly track simulated payments in capstone demo mode.
-- Safety: Add column as NOT NULL with DEFAULT false. Preserves all
--         existing payment records and amounts. No table lock.
-- ============================================================

ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.payments.is_demo IS
  'True if the payment transaction was processed under demonstration/simulation mode without real funds.';

CREATE INDEX IF NOT EXISTS idx_payments_is_demo ON public.payments (is_demo);
