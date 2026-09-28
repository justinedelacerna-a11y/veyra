-- ============================================================
-- Veyra -- Public Vehicle Catalog View (18)
-- Customer-facing safe vehicle view.
-- Excludes sensitive/operational data:
--   vin, plate_number, internal_notes, odometer_km,
--   acquisition_date, next_maintenance_due, next_maintenance_odometer
--
-- Security Model:
--   - public.vehicles has NO SELECT policy for anon or regular customers.
--   - This view acts as a secure projection boundary.
--   - Granted to anon and authenticated roles.
-- ============================================================

CREATE OR REPLACE VIEW public.vehicle_catalog AS
SELECT
  v.id,
  v.vehicle_class_id,
  v.branch_id,
  v.make,
  v.model,
  v.year,
  v.color,
  v.transmission,
  v.fuel_type,
  v.seats,
  v.luggage_capacity,
  v.doors,
  v.daily_rate,
  v.currency,
  v.security_deposit,
  v.mileage_allowance_km,
  v.excess_mileage_rate,
  v.fleet_status,
  v.created_at
FROM public.vehicles v
JOIN public.branches b ON b.id = v.branch_id
WHERE v.deleted_at IS NULL
  AND v.fleet_status != 'retired'
  AND b.status = 'active';

COMMENT ON VIEW public.vehicle_catalog IS
  'Customer-safe vehicle catalog view. Excludes VIN, plate number, odometer, internal notes, and maintenance schedules.';

-- Grant read access to public roles
GRANT SELECT ON public.vehicle_catalog TO anon, authenticated;
