-- ============================================================
-- Migration: 20261011000000_affordable_fleet.sql
-- Add Economy Compact vehicle class and affordable fleet vehicles
-- stationed at Butuan City barangay hubs.
-- ============================================================

-- 1. Add Economy Compact vehicle class
INSERT INTO public.vehicle_classes (id, name, category, base_daily_rate, description, sort_order)
VALUES (
  'ec000000-0000-0000-0000-000000000006',
  'Economy Compact',
  'sedan',
  150000,
  'Affordable, fuel-efficient compact sedans ideal for everyday errands and short city trips.',
  6
)
ON CONFLICT (id) DO UPDATE SET
  name            = EXCLUDED.name,
  base_daily_rate = EXCLUDED.base_daily_rate,
  description     = EXCLUDED.description,
  sort_order      = EXCLUDED.sort_order,
  updated_at      = NOW();

-- 2. Add affordable fleet vehicles
INSERT INTO public.vehicles (
  id, vehicle_class_id, branch_id, make, model, year, plate_number, vin,
  color, transmission, fuel_type, seats, luggage_capacity, doors,
  daily_rate, currency, security_deposit, mileage_allowance_km, excess_mileage_rate,
  fleet_status, condition, odometer_km, fuel_level_pct, acquisition_date,
  internal_notes, location_id
)
VALUES
  (
    'a0000000-0000-0000-0000-000000000011',
    'ec000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000001',
    'Toyota', 'Vios XLE CVT', 2024,
    'DEV-VIO-11', 'DEV17TOYOTAVIO011',
    'Nebula Blue Metallic', 'automatic', 'petrol',
    5, 3, 4,
    175000, 'PHP', 500000, 300, 1200,
    'available', 'excellent', 3800, 95,
    '2024-06-10',
    'Economy sedan; Baan Km. 3 barangay hub.',
    '10c00000-0000-0000-0000-000000000015'
  ),
  (
    'a0000000-0000-0000-0000-000000000012',
    'ec000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000001',
    'Mitsubishi', 'Mirage G4 GLS CVT', 2024,
    'DEV-MRG-12', 'DEV17MITSMRG4012',
    'Sterling Silver Metallic', 'automatic', 'petrol',
    5, 3, 4,
    150000, 'PHP', 450000, 300, 1000,
    'available', 'excellent', 5100, 90,
    '2024-07-01',
    'Compact economy; Dagohoy barangay hub.',
    '10c00000-0000-0000-0000-000000000016'
  ),
  (
    'a0000000-0000-0000-0000-000000000013',
    'ec000000-0000-0000-0000-000000000006',
    'b0000000-0000-0000-0000-000000000001',
    'Honda', 'City RS e:HEV', 2024,
    'DEV-HCI-13', 'DEV17HONDACITY013',
    'Lunar Silver Metallic', 'automatic', 'hybrid',
    5, 3, 4,
    220000, 'PHP', 600000, 350, 1500,
    'available', 'excellent', 2600, 98,
    '2024-07-15',
    'Hybrid economy; Leon Kilat barangay hub.',
    '10c00000-0000-0000-0000-000000000017'
  )
ON CONFLICT (id) DO UPDATE SET
  location_id  = EXCLUDED.location_id,
  fleet_status = EXCLUDED.fleet_status,
  updated_at   = NOW();

-- 3. Add vehicle features for the new affordable vehicles
INSERT INTO public.vehicle_features (vehicle_id, feature)
VALUES
  -- Toyota Vios XLE
  ('a0000000-0000-0000-0000-000000000011', 'Apple CarPlay & Android Auto'),
  ('a0000000-0000-0000-0000-000000000011', 'Reverse Camera'),
  ('a0000000-0000-0000-0000-000000000011', 'Toyota Safety Sense'),
  ('a0000000-0000-0000-0000-000000000011', 'Automatic Climate Control'),
  -- Mitsubishi Mirage G4 GLS
  ('a0000000-0000-0000-0000-000000000012', 'Apple CarPlay'),
  ('a0000000-0000-0000-0000-000000000012', 'Rear Parking Sensors'),
  ('a0000000-0000-0000-0000-000000000012', 'MIVEC Efficient Engine'),
  ('a0000000-0000-0000-0000-000000000012', 'Automatic Climate Control'),
  -- Honda City RS e:HEV
  ('a0000000-0000-0000-0000-000000000013', 'Honda SENSING Safety Suite'),
  ('a0000000-0000-0000-0000-000000000013', 'Apple CarPlay & Android Auto'),
  ('a0000000-0000-0000-0000-000000000013', 'e:HEV Hybrid System'),
  ('a0000000-0000-0000-0000-000000000013', 'Wireless Phone Charging')
ON CONFLICT (vehicle_id, feature) DO NOTHING;

-- 4. Idempotently re-apply location_id for all existing catalog vehicles.
--    Ensures that running seed-catalog.mjs (which upserts vehicles without
--    location_id) after the barangay migration does not NULL out assignments.
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000001'
  WHERE id = 'a0000000-0000-0000-0000-000000000001'; -- Porsche Taycan       -> Libertad
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000012'
  WHERE id = 'a0000000-0000-0000-0000-000000000002'; -- Land Cruiser Prado   -> Villa Kananga
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000013'
  WHERE id = 'a0000000-0000-0000-0000-000000000003'; -- BMW 530i             -> San Vicente
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000001'
  WHERE id = 'a0000000-0000-0000-0000-000000000004'; -- Toyota Alphard       -> Libertad
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000011'
  WHERE id = 'a0000000-0000-0000-0000-000000000005'; -- Mercedes-Benz S 500  -> Ampayon
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000014'
  WHERE id = 'a0000000-0000-0000-0000-000000000006'; -- Tesla Model Y        -> J.P. Rizal
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000015'
  WHERE id = 'a0000000-0000-0000-0000-000000000007'; -- Lexus LM 350h        -> Baan Km. 3
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000001'
  WHERE id = 'a0000000-0000-0000-0000-000000000008'; -- Toyota Camry HEV     -> Libertad
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000013'
  WHERE id = 'a0000000-0000-0000-0000-000000000009'; -- Nissan Patrol NISMO  -> San Vicente
UPDATE public.vehicles SET location_id = '10c00000-0000-0000-0000-000000000012'
  WHERE id = 'a0000000-0000-0000-0000-000000000010'; -- Mercedes-Benz E 300  -> Villa Kananga
