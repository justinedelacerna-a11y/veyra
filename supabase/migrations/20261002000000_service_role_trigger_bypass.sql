-- ============================================================
-- Migration: 20261002000000_service_role_trigger_bypass.sql
-- Description: Allow service_role to update protected columns on
--              reservations and customers while maintaining strict
--              customer self-service immutability.
-- ============================================================

CREATE OR REPLACE FUNCTION public.protect_reservation_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
BEGIN
  -- If executed by service_role or database superuser (server payment processing, webhooks, reaper cron),
  -- allow updates to operational/financial fields.
  IF current_setting('request.jwt.claim.role', true) = 'service_role' 
     OR current_user IN ('postgres', 'service_role') THEN
    RETURN NEW;
  END IF;

  -- If non-staff user is updating (e.g. customer self-cancellation),
  -- lock down financial, vehicle assignment, and operational fields.
  IF veyra_private.current_staff_role() IS NULL THEN
    NEW.customer_id         := OLD.customer_id;
    NEW.quote_id            := OLD.quote_id;
    NEW.vehicle_id          := OLD.vehicle_id;
    NEW.assigned_vehicle_id := OLD.assigned_vehicle_id;
    NEW.pickup_location_id  := OLD.pickup_location_id;
    NEW.return_location_id  := OLD.return_location_id;
    NEW.pickup_at           := OLD.pickup_at;
    NEW.return_at           := OLD.return_at;
    NEW.total_amount        := OLD.total_amount;
    NEW.deposit_amount      := OLD.deposit_amount;
    NEW.currency            := OLD.currency;
    NEW.payment_status      := OLD.payment_status;
    NEW.internal_notes      := OLD.internal_notes;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_reservation_columns() IS
  'Trigger function: locks down financial and operational fields on reservations when updated by customer self-service, while allowing service_role payment settlement.';

CREATE OR REPLACE FUNCTION public.protect_customer_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, veyra_private
AS $$
BEGIN
  -- If executed by service_role or database superuser, allow system sync
  IF current_setting('request.jwt.claim.role', true) = 'service_role' 
     OR current_user IN ('postgres', 'service_role') THEN
    RETURN NEW;
  END IF;

  -- If not staff/admin, customer cannot alter system/protected columns
  IF veyra_private.current_staff_role() IS NULL THEN
    NEW.user_id             := OLD.user_id;
    NEW.membership_number   := OLD.membership_number;
    NEW.membership_tier     := OLD.membership_tier;
    NEW.total_rentals       := OLD.total_rentals;
    NEW.verification_status := OLD.verification_status;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.protect_customer_columns() IS
  'Trigger function: enforces immutability of system-controlled customer fields against customer self-updates, while allowing service_role updates.';
