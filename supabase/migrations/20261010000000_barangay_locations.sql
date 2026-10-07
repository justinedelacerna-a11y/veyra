-- ============================================================
-- Migration: 20261010000000_barangay_locations.sql
-- Localize Veyra to Butuan City Barangay-Level Pickup & Return Hubs
-- ============================================================

-- 1. Adapt locations table schema
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS barangay TEXT,
  ADD COLUMN IF NOT EXISTS province TEXT NOT NULL DEFAULT 'Agusan del Norte',
  ADD COLUMN IF NOT EXISTS pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS return_enabled BOOLEAN NOT NULL DEFAULT true;

-- Ensure type constraint supports barangay_hub if needed
ALTER TABLE public.locations DROP CONSTRAINT IF EXISTS locations_type_check;
ALTER TABLE public.locations
  ADD CONSTRAINT locations_type_check
  CHECK (type IN ('airport_terminal', 'city_center', 'private_hub', 'barangay_hub'));

-- 2. Update Primary Location (10c00000-0000-0000-0000-000000000001) to Barangay Libertad Hub
UPDATE public.locations
SET
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  name = 'Barangay Libertad Hub',
  barangay = 'Libertad',
  type = 'city_center',
  address = 'National Highway, Brgy. Libertad, Butuan City, Agusan del Norte',
  city = 'Butuan City',
  province = 'Agusan del Norte',
  operating_hours = '08:00 - 20:00 Daily',
  pickup_available = true,
  pickup_enabled = true,
  return_available = true,
  return_enabled = true,
  timezone = 'Asia/Manila',
  status = 'active',
  updated_at = NOW()
WHERE id = '10c00000-0000-0000-0000-000000000001';

-- 3. Upsert Official Butuan City Barangay Hubs (all under the same Veyra Butuan City operational branch)
INSERT INTO public.locations (
  id, branch_id, name, barangay, type, address, city, province,
  operating_hours, pickup_available, pickup_enabled, return_available, return_enabled,
  timezone, status, updated_at
)
VALUES
  (
    '10c00000-0000-0000-0000-000000000011',
    'b0000000-0000-0000-0000-000000000001',
    'Barangay Ampayon Hub',
    'Ampayon',
    'city_center',
    'Surigao-Agusan Highway, Brgy. Ampayon, Butuan City, Agusan del Norte',
    'Butuan City',
    'Agusan del Norte',
    '08:00 - 20:00 Daily',
    true, true, true, true,
    'Asia/Manila', 'active', NOW()
  ),
  (
    '10c00000-0000-0000-0000-000000000012',
    'b0000000-0000-0000-0000-000000000001',
    'Barangay Villa Kananga Hub',
    'Villa Kananga',
    'city_center',
    'Montilla Boulevard, Brgy. Villa Kananga, Butuan City, Agusan del Norte',
    'Butuan City',
    'Agusan del Norte',
    '08:00 - 20:00 Daily',
    true, true, true, true,
    'Asia/Manila', 'active', NOW()
  ),
  (
    '10c00000-0000-0000-0000-000000000013',
    'b0000000-0000-0000-0000-000000000001',
    'Barangay San Vicente Hub',
    'San Vicente',
    'city_center',
    'J.C. Aquino Avenue, Brgy. San Vicente, Butuan City, Agusan del Norte',
    'Butuan City',
    'Agusan del Norte',
    '08:00 - 20:00 Daily',
    true, true, true, true,
    'Asia/Manila', 'active', NOW()
  ),
  (
    '10c00000-0000-0000-0000-000000000014',
    'b0000000-0000-0000-0000-000000000001',
    'Barangay J.P. Rizal Hub',
    'J.P. Rizal',
    'city_center',
    'Poblacion Commercial Core, Brgy. J.P. Rizal, Butuan City, Agusan del Norte',
    'Butuan City',
    'Agusan del Norte',
    '08:00 - 20:00 Daily',
    true, true, true, true,
    'Asia/Manila', 'active', NOW()
  ),
  (
    '10c00000-0000-0000-0000-000000000015',
    'b0000000-0000-0000-0000-000000000001',
    'Barangay Baan Km. 3 Hub',
    'Baan Km. 3',
    'city_center',
    'Baan Km. 3, Butuan City, Agusan del Norte',
    'Butuan City',
    'Agusan del Norte',
    '08:00 - 20:00 Daily',
    true, true, true, true,
    'Asia/Manila', 'active', NOW()
  ),
  (
    '10c00000-0000-0000-0000-000000000016',
    'b0000000-0000-0000-0000-000000000001',
    'Barangay Dagohoy Hub',
    'Dagohoy',
    'city_center',
    'Downtown District, Brgy. Dagohoy, Butuan City, Agusan del Norte',
    'Butuan City',
    'Agusan del Norte',
    '08:00 - 20:00 Daily',
    true, true, true, true,
    'Asia/Manila', 'active', NOW()
  ),
  (
    '10c00000-0000-0000-0000-000000000017',
    'b0000000-0000-0000-0000-000000000001',
    'Barangay Leon Kilat Hub',
    'Leon Kilat',
    'city_center',
    'Poblacion District, Brgy. Leon Kilat, Butuan City, Agusan del Norte',
    'Butuan City',
    'Agusan del Norte',
    '08:00 - 20:00 Daily',
    true, true, true, true,
    'Asia/Manila', 'active', NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  barangay = EXCLUDED.barangay,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  province = EXCLUDED.province,
  pickup_available = EXCLUDED.pickup_available,
  pickup_enabled = EXCLUDED.pickup_enabled,
  return_available = EXCLUDED.return_available,
  return_enabled = EXCLUDED.return_enabled,
  status = EXCLUDED.status,
  updated_at = NOW();

-- 4. Adapt vehicles table to support stationed location_id
ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL;

-- Station vehicles across Butuan barangays
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000001' WHERE id = 'a0000000-0000-0000-0000-000000000001'; -- Porsche Taycan -> Libertad
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000012' WHERE id = 'a0000000-0000-0000-0000-000000000002'; -- BMW 530i -> Villa Kananga
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000013' WHERE id = 'a0000000-0000-0000-0000-000000000003'; -- Mercedes S500 -> San Vicente
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000001' WHERE id = 'a0000000-0000-0000-0000-000000000004'; -- Toyota Alphard -> Libertad (verified tests)
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000011' WHERE id = 'a0000000-0000-0000-0000-000000000005'; -- Tesla Model Y -> Ampayon
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000014' WHERE id = 'a0000000-0000-0000-0000-000000000006'; -- Lexus LM 350h -> J.P. Rizal
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000015' WHERE id = 'a0000000-0000-0000-0000-000000000007'; -- Toyota Camry -> Baan Km. 3
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000016' WHERE id = 'a0000000-0000-0000-0000-000000000008'; -- Nissan Patrol -> Dagohoy
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000017' WHERE id = 'a0000000-0000-0000-0000-000000000009'; -- Toyota Prado -> Leon Kilat
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000012' WHERE id = 'a0000000-0000-0000-0000-000000000010'; -- Mercedes E300 -> Villa Kananga

-- Fallback for any other vehicle
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000001' WHERE location_id IS NULL;

-- 5. Update vehicle_catalog view to append location_id, barangay, and location_name at the end
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
  v.created_at,
  v.location_id,
  l.barangay,
  l.name AS location_name
FROM public.vehicles v
JOIN public.branches b ON b.id = v.branch_id
LEFT JOIN public.locations l ON l.id = v.location_id
WHERE v.deleted_at IS NULL
  AND v.fleet_status != 'retired'
  AND b.status = 'active';

GRANT SELECT ON public.vehicle_catalog TO anon, authenticated;
