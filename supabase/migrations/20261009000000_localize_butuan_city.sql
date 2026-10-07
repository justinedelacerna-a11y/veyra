-- ============================================================
-- Migration: 20261009000000_localize_butuan_city.sql
-- Localize Veyra to Butuan City, Agusan del Norte, Philippines
-- ============================================================

-- Update main operational branch to Butuan City
UPDATE public.branches
SET
  name = 'Veyra Butuan City Hub',
  city = 'Butuan City',
  timezone = 'Asia/Manila',
  contact_phone = '+63 85 888 0101',
  contact_email = 'butuan@veyra.ph',
  status = 'active',
  updated_at = NOW()
WHERE id = 'b0000000-0000-0000-0000-000000000001';

-- Mark other branches inactive
UPDATE public.branches
SET status = 'inactive', updated_at = NOW()
WHERE id != 'b0000000-0000-0000-0000-000000000001';

-- Update primary pickup and return location to Butuan City
UPDATE public.locations
SET
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  name = 'Butuan City Operations Hub',
  type = 'city_center',
  address = 'Butuan City, Agusan del Norte, Philippines',
  city = 'Butuan City',
  operating_hours = '08:00 - 20:00 Daily',
  pickup_available = true,
  return_available = true,
  timezone = 'Asia/Manila',
  status = 'active',
  updated_at = NOW()
WHERE id = '10c00000-0000-0000-0000-000000000001';

-- Mark other locations inactive to restrict operations to Butuan City
UPDATE public.locations
SET
  status = 'inactive',
  pickup_available = false,
  return_available = false,
  updated_at = NOW()
WHERE id != '10c00000-0000-0000-0000-000000000001';

-- Reassign all fleet vehicles to the Butuan City Hub
UPDATE public.vehicles
SET
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  updated_at = NOW()
WHERE branch_id IS NOT NULL;

-- Reassign existing reservations to Butuan City Hub
UPDATE public.reservations
SET
  pickup_location_id = '10c00000-0000-0000-0000-000000000001',
  return_location_id = '10c00000-0000-0000-0000-000000000001',
  updated_at = NOW()
WHERE pickup_location_id != '10c00000-0000-0000-0000-000000000001'
   OR return_location_id != '10c00000-0000-0000-0000-000000000001';
