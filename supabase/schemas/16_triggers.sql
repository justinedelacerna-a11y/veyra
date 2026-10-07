-- ============================================================
-- Veyra -- Triggers: updated_at (16)
-- Auto-maintain updated_at on all tables that have it.
-- ============================================================

-- ------------------------------------
-- Generic updated_at trigger function
-- ------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'Trigger function: sets updated_at = NOW() on UPDATE.';

-- ------------------------------------
-- Attach trigger to all tables with updated_at
-- ------------------------------------

CREATE OR REPLACE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_staff_users_updated_at
  BEFORE UPDATE ON public.staff_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_locations_updated_at
  BEFORE UPDATE ON public.locations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_vehicle_classes_updated_at
  BEFORE UPDATE ON public.vehicle_classes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_availability_blocks_updated_at
  BEFORE UPDATE ON public.availability_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_extras_updated_at
  BEFORE UPDATE ON public.extras
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_rate_plans_updated_at
  BEFORE UPDATE ON public.rate_plans
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_deposits_updated_at
  BEFORE UPDATE ON public.deposits
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_customer_documents_updated_at
  BEFORE UPDATE ON public.customer_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_damage_reports_updated_at
  BEFORE UPDATE ON public.damage_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_maintenance_records_updated_at
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_webhook_events_updated_at
  BEFORE UPDATE ON public.webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------
-- Security / Column-Level Protection Triggers
-- Prevents customers from modifying protected system columns
-- (e.g. membership_number, total_rentals, verification_status, pricing, etc.)
-- ------------------------------------

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
  'Trigger function: enforces immutability of system-controlled customer fields against customer self-updates.';

CREATE OR REPLACE TRIGGER trg_customers_protect_columns
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.protect_customer_columns();

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
  'Trigger function: locks down financial and operational fields on reservations when updated by customer self-service.';

CREATE OR REPLACE TRIGGER trg_reservations_protect_columns
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.protect_reservation_columns();

