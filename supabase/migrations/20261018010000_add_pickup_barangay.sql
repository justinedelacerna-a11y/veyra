-- ============================================================
-- Migration: 20261018010000_add_pickup_barangay.sql
-- Description: Add pickup_barangay column to reservations table
--              to support selecting any of the 86 Butuan City barangays.
-- Safety: Add column as NULLable. Preserves all existing records
--         and location IDs. No data loss or table locks.
-- ============================================================

ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS pickup_barangay TEXT NULL;

COMMENT ON COLUMN public.reservations.pickup_barangay IS
  'Customer-selected Butuan City barangay for vehicle pickup and handover. Optional. Supports all 86 verified barangays.';
