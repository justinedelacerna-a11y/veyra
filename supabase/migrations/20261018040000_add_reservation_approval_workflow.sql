-- ============================================================
-- Migration: 20261018040000_add_reservation_approval_workflow.sql
-- Description: Add 'pending_approval' status to public.reservations,
--              along with approval audit fields (approved_at, approved_by,
--              rejection_reason) and pending review index.
-- Safety: Non-destructive constraint replacement and nullable column additions.
-- ============================================================

-- 1. Update status check constraint to include 'pending_approval'
ALTER TABLE public.reservations
  DROP CONSTRAINT IF EXISTS reservations_status_check;

ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check CHECK (status IN (
    'draft',
    'quote_created',
    'held',
    'payment_pending',
    'pending_approval',
    'confirmed',
    'pickup_ready',
    'active',
    'return_inspection',
    'completed',
    'expired',
    'payment_failed',
    'cancelled',
    'no_show',
    'disputed'
  ));

-- 2. Add approval audit tracking and rejection reason columns
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS approved_by UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT NULL;

COMMENT ON COLUMN public.reservations.approved_at IS
  'Timestamp when authorized administrator approved the reservation.';
COMMENT ON COLUMN public.reservations.approved_by IS
  'Internal user ID of the staff member who approved the reservation.';
COMMENT ON COLUMN public.reservations.rejection_reason IS
  'Reason recorded by staff if reservation was rejected during review.';

-- 3. Partial index for fast pending approval queue retrieval
CREATE INDEX IF NOT EXISTS idx_reservations_pending_approval
  ON public.reservations (created_at DESC)
  WHERE status = 'pending_approval';
