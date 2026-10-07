-- ============================================================
-- Migration: 20261012000000_affordable_local_fleet.sql
-- Transform active fleet to realistic, affordable vehicles
-- for students, families, and residents of Butuan City.
-- ============================================================

-- Step 1: Update vehicle_classes to reflect affordable, practical categories
UPDATE public.vehicle_classes SET
  name = 'Compact Sedan',
  category = 'sedan',
  base_daily_rate = 150000,
  description = 'Reliable and fuel-efficient sedans for city driving and errands in Butuan City.',
  sort_order = 2,
  updated_at = NOW()
WHERE id = 'ec000000-0000-0000-0000-000000000001';

UPDATE public.vehicle_classes SET
  name = 'Midsize SUV',
  category = 'suv',
  base_daily_rate = 250000,
  description = 'Comfortable 7-seater SUVs suited for family trips and regional provincial travel.',
  sort_order = 6,
  updated_at = NOW()
WHERE id = 'ec000000-0000-0000-0000-000000000002';

UPDATE public.vehicle_classes SET
  name = 'Utility Pickup',
  category = 'suv',
  base_daily_rate = 240000,
  description = 'Practical pickup trucks suited for cargo, utility, and provincial road conditions.',
  sort_order = 5,
  updated_at = NOW()
WHERE id = 'ec000000-0000-0000-0000-000000000003';

UPDATE public.vehicle_classes SET
  name = '7-Seater MPV',
  category = 'van',
  base_daily_rate = 180000,
  description = 'Spacious multi-purpose vehicles for families and barkada trips.',
  sort_order = 3,
  updated_at = NOW()
WHERE id = 'ec000000-0000-0000-0000-000000000004';

UPDATE public.vehicle_classes SET
  name = 'Family MPV',
  category = 'van',
  base_daily_rate = 230000,
  description = 'Dependable 7-seater diesel MPVs built for larger groups and long distance journeys.',
  sort_order = 4,
  updated_at = NOW()
WHERE id = 'ec000000-0000-0000-0000-000000000005';

UPDATE public.vehicle_classes SET
  name = 'Budget Hatchback',
  category = 'sedan',
  base_daily_rate = 130000,
  description = 'Compact, economical city hatchbacks ideal for students and everyday errands.',
  sort_order = 1,
  updated_at = NOW()
WHERE id = 'ec000000-0000-0000-0000-000000000006';

-- Step 2: Clean up the 3 extra vehicles from temporary migration to keep exactly 10 active vehicles
DELETE FROM public.vehicle_features WHERE vehicle_id IN (
  'a0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000012',
  'a0000000-0000-0000-0000-000000000013'
);
DELETE FROM public.vehicles WHERE id IN (
  'a0000000-0000-0000-0000-000000000011',
  'a0000000-0000-0000-0000-000000000012',
  'a0000000-0000-0000-0000-000000000013'
);

-- Step 3: In-place update of the 10 vehicles to the target fleet
-- 1. Toyota Wigo 2024 (₱1,300/day)
UPDATE public.vehicles SET
  vehicle_class_id = 'ec000000-0000-0000-0000-000000000006',
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  location_id = '10c00000-0000-0000-0000-000000000001',
  make = 'Toyota',
  model = 'Wigo',
  year = 2024,
  plate_number = 'DEV-WIG-01',
  vin = 'DEV17TOYOTAWIG001',
  color = 'Silver Metallic',
  transmission = 'automatic',
  fuel_type = 'petrol',
  seats = 5,
  luggage_capacity = 2,
  doors = 5,
  daily_rate = 130000,
  security_deposit = 500000,
  currency = 'PHP',
  mileage_allowance_km = 300,
  excess_mileage_rate = 1500,
  fleet_status = 'available',
  condition = 'excellent',
  odometer_km = 8200,
  fuel_level_pct = 100,
  last_inspection_date = '2026-03-01',
  next_maintenance_due = '2026-09-01',
  acquisition_date = '2024-01-15',
  internal_notes = 'Compact hatchback stationed at Barangay Libertad Hub. Popular student daily rental.',
  deleted_at = NULL,
  updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000001';

-- 2. Mitsubishi Mirage 2024 (₱1,400/day)
UPDATE public.vehicles SET
  vehicle_class_id = 'ec000000-0000-0000-0000-000000000006',
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  location_id = '10c00000-0000-0000-0000-000000000012',
  make = 'Mitsubishi',
  model = 'Mirage',
  year = 2024,
  plate_number = 'DEV-MRG-02',
  vin = 'DEV17MITSMIR002',
  color = 'Cool Silver',
  transmission = 'automatic',
  fuel_type = 'petrol',
  seats = 5,
  luggage_capacity = 2,
  doors = 5,
  daily_rate = 140000,
  security_deposit = 500000,
  currency = 'PHP',
  mileage_allowance_km = 300,
  excess_mileage_rate = 1500,
  fleet_status = 'available',
  condition = 'excellent',
  odometer_km = 12500,
  fuel_level_pct = 100,
  last_inspection_date = '2026-03-01',
  next_maintenance_due = '2026-09-01',
  acquisition_date = '2024-02-01',
  internal_notes = 'Economical city hatchback stationed at Barangay Villa Kananga Hub.',
  deleted_at = NULL,
  updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000002';

-- 3. Toyota Vios 2024 (₱1,500/day)
UPDATE public.vehicles SET
  vehicle_class_id = 'ec000000-0000-0000-0000-000000000001',
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  location_id = '10c00000-0000-0000-0000-000000000013',
  make = 'Toyota',
  model = 'Vios',
  year = 2024,
  plate_number = 'DEV-VIO-03',
  vin = 'DEV17TOYOTAVIO003',
  color = 'Super Red',
  transmission = 'automatic',
  fuel_type = 'petrol',
  seats = 5,
  luggage_capacity = 3,
  doors = 4,
  daily_rate = 150000,
  security_deposit = 500000,
  currency = 'PHP',
  mileage_allowance_km = 300,
  excess_mileage_rate = 1500,
  fleet_status = 'available',
  condition = 'excellent',
  odometer_km = 14100,
  fuel_level_pct = 100,
  last_inspection_date = '2026-03-05',
  next_maintenance_due = '2026-09-05',
  acquisition_date = '2024-01-20',
  internal_notes = 'Reliable sedan stationed at Barangay San Vicente Hub. Ideal for city errands.',
  deleted_at = NULL,
  updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000003';

-- 4. Honda City 2024 (₱1,600/day)
UPDATE public.vehicles SET
  vehicle_class_id = 'ec000000-0000-0000-0000-000000000001',
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  location_id = '10c00000-0000-0000-0000-000000000001',
  make = 'Honda',
  model = 'City',
  year = 2024,
  plate_number = 'DEV-CTY-04',
  vin = 'DEV17HONDACITY004',
  color = 'Platinum White Pearl',
  transmission = 'automatic',
  fuel_type = 'petrol',
  seats = 5,
  luggage_capacity = 3,
  doors = 4,
  daily_rate = 160000,
  security_deposit = 500000,
  currency = 'PHP',
  mileage_allowance_km = 300,
  excess_mileage_rate = 1500,
  fleet_status = 'available',
  condition = 'excellent',
  odometer_km = 11200,
  fuel_level_pct = 100,
  last_inspection_date = '2026-03-02',
  next_maintenance_due = '2026-09-02',
  acquisition_date = '2024-02-15',
  internal_notes = 'Comfortable sedan stationed at Barangay Libertad Hub.',
  deleted_at = NULL,
  updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000004';

-- 5. Toyota Avanza 2024 (₱1,800/day)
UPDATE public.vehicles SET
  vehicle_class_id = 'ec000000-0000-0000-0000-000000000004',
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  location_id = '10c00000-0000-0000-0000-000000000011',
  make = 'Toyota',
  model = 'Avanza',
  year = 2024,
  plate_number = 'DEV-AVZ-05',
  vin = 'DEV17TOYOTAAVZ005',
  color = 'Dark Red Mica Metallic',
  transmission = 'automatic',
  fuel_type = 'petrol',
  seats = 7,
  luggage_capacity = 4,
  doors = 5,
  daily_rate = 180000,
  security_deposit = 600000,
  currency = 'PHP',
  mileage_allowance_km = 300,
  excess_mileage_rate = 1500,
  fleet_status = 'available',
  condition = 'excellent',
  odometer_km = 16800,
  fuel_level_pct = 100,
  last_inspection_date = '2026-03-01',
  next_maintenance_due = '2026-09-01',
  acquisition_date = '2024-03-01',
  internal_notes = '7-seater MPV stationed at Barangay Ampayon Hub. Great for family outings.',
  deleted_at = NULL,
  updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000005';

-- 6. Nissan Livina 2024 (₱1,800/day)
UPDATE public.vehicles SET
  vehicle_class_id = 'ec000000-0000-0000-0000-000000000004',
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  location_id = '10c00000-0000-0000-0000-000000000014',
  make = 'Nissan',
  model = 'Livina',
  year = 2024,
  plate_number = 'DEV-LIV-06',
  vin = 'DEV17NISSANLIV006',
  color = 'Diamond Pearl White',
  transmission = 'automatic',
  fuel_type = 'petrol',
  seats = 7,
  luggage_capacity = 4,
  doors = 5,
  daily_rate = 180000,
  security_deposit = 600000,
  currency = 'PHP',
  mileage_allowance_km = 300,
  excess_mileage_rate = 1500,
  fleet_status = 'available',
  condition = 'excellent',
  odometer_km = 15200,
  fuel_level_pct = 100,
  last_inspection_date = '2026-03-04',
  next_maintenance_due = '2026-09-04',
  acquisition_date = '2024-03-10',
  internal_notes = '7-seater MPV stationed at Barangay J.P. Rizal Hub.',
  deleted_at = NULL,
  updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000006';

-- 7. Mitsubishi Xpander 2024 (₱2,000/day)
UPDATE public.vehicles SET
  vehicle_class_id = 'ec000000-0000-0000-0000-000000000004',
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  location_id = '10c00000-0000-0000-0000-000000000015',
  make = 'Mitsubishi',
  model = 'Xpander',
  year = 2024,
  plate_number = 'DEV-XPD-07',
  vin = 'DEV17MITSXPD007',
  color = 'Graphite Gray Metallic',
  transmission = 'automatic',
  fuel_type = 'petrol',
  seats = 7,
  luggage_capacity = 4,
  doors = 5,
  daily_rate = 200000,
  security_deposit = 700000,
  currency = 'PHP',
  mileage_allowance_km = 300,
  excess_mileage_rate = 1500,
  fleet_status = 'available',
  condition = 'excellent',
  odometer_km = 13900,
  fuel_level_pct = 100,
  last_inspection_date = '2026-03-01',
  next_maintenance_due = '2026-09-01',
  acquisition_date = '2024-02-20',
  internal_notes = 'Spacious 7-seater MPV stationed at Barangay Baan Km. 3 Hub.',
  deleted_at = NULL,
  updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000007';

-- 8. Toyota Innova 2024 (₱2,300/day)
UPDATE public.vehicles SET
  vehicle_class_id = 'ec000000-0000-0000-0000-000000000005',
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  location_id = '10c00000-0000-0000-0000-000000000016',
  make = 'Toyota',
  model = 'Innova',
  year = 2024,
  plate_number = 'DEV-INV-08',
  vin = 'DEV17TOYOTAINV008',
  color = 'Attitude Black Mica',
  transmission = 'automatic',
  fuel_type = 'diesel',
  seats = 7,
  luggage_capacity = 5,
  doors = 5,
  daily_rate = 230000,
  security_deposit = 800000,
  currency = 'PHP',
  mileage_allowance_km = 300,
  excess_mileage_rate = 1500,
  fleet_status = 'available',
  condition = 'excellent',
  odometer_km = 21000,
  fuel_level_pct = 100,
  last_inspection_date = '2026-03-01',
  next_maintenance_due = '2026-09-01',
  acquisition_date = '2024-01-10',
  internal_notes = 'Dependable diesel 7-seater MPV stationed at Barangay Dagohoy Hub.',
  deleted_at = NULL,
  updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000008';

-- 9. Toyota Hilux 2024 (₱2,400/day)
UPDATE public.vehicles SET
  vehicle_class_id = 'ec000000-0000-0000-0000-000000000003',
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  location_id = '10c00000-0000-0000-0000-000000000017',
  make = 'Toyota',
  model = 'Hilux',
  year = 2024,
  plate_number = 'DEV-HLX-09',
  vin = 'DEV17TOYOTAHLX009',
  color = 'Super White',
  transmission = 'automatic',
  fuel_type = 'diesel',
  seats = 5,
  luggage_capacity = 5,
  doors = 4,
  daily_rate = 240000,
  security_deposit = 800000,
  currency = 'PHP',
  mileage_allowance_km = 300,
  excess_mileage_rate = 1500,
  fleet_status = 'available',
  condition = 'excellent',
  odometer_km = 19500,
  fuel_level_pct = 100,
  last_inspection_date = '2026-03-01',
  next_maintenance_due = '2026-09-01',
  acquisition_date = '2024-02-05',
  internal_notes = 'Utility pickup truck stationed at Barangay Leon Kilat Hub.',
  deleted_at = NULL,
  updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000009';

-- 10. Mitsubishi Montero Sport 2024 (₱2,500/day)
UPDATE public.vehicles SET
  vehicle_class_id = 'ec000000-0000-0000-0000-000000000002',
  branch_id = 'b0000000-0000-0000-0000-000000000001',
  location_id = '10c00000-0000-0000-0000-000000000012',
  make = 'Mitsubishi',
  model = 'Montero Sport',
  year = 2024,
  plate_number = 'DEV-MNT-10',
  vin = 'DEV17MITSMON010',
  color = 'White Diamond',
  transmission = 'automatic',
  fuel_type = 'diesel',
  seats = 7,
  luggage_capacity = 5,
  doors = 5,
  daily_rate = 250000,
  security_deposit = 1000000,
  currency = 'PHP',
  mileage_allowance_km = 300,
  excess_mileage_rate = 1500,
  fleet_status = 'available',
  condition = 'excellent',
  odometer_km = 18400,
  fuel_level_pct = 100,
  last_inspection_date = '2026-03-01',
  next_maintenance_due = '2026-09-01',
  acquisition_date = '2024-01-25',
  internal_notes = 'Midsize 7-seater SUV stationed at Barangay Villa Kananga Hub.',
  deleted_at = NULL,
  updated_at = NOW()
WHERE id = 'a0000000-0000-0000-0000-000000000010';

-- Step 4: Refresh vehicle features for the 10 vehicles
DELETE FROM public.vehicle_features WHERE vehicle_id IN (
  'a0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000002',
  'a0000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000004',
  'a0000000-0000-0000-0000-000000000005',
  'a0000000-0000-0000-0000-000000000006',
  'a0000000-0000-0000-0000-000000000007',
  'a0000000-0000-0000-0000-000000000008',
  'a0000000-0000-0000-0000-000000000009',
  'a0000000-0000-0000-0000-000000000010'
);

INSERT INTO public.vehicle_features (vehicle_id, feature) VALUES
  -- Toyota Wigo
  ('a0000000-0000-0000-0000-000000000001', 'Touchscreen Infotainment with Bluetooth'),
  ('a0000000-0000-0000-0000-000000000001', 'Dual SRS Airbags'),
  ('a0000000-0000-0000-0000-000000000001', 'ABS with EBD'),
  ('a0000000-0000-0000-0000-000000000001', 'Ultra Fuel-Efficient 1.0L Engine'),
  ('a0000000-0000-0000-0000-000000000001', 'Keyless Entry & Push Start'),

  -- Mitsubishi Mirage
  ('a0000000-0000-0000-0000-000000000002', 'Touchscreen Audio with Smartphone Mirroring'),
  ('a0000000-0000-0000-0000-000000000002', 'Dual Front Airbags'),
  ('a0000000-0000-0000-0000-000000000002', 'Rearview Camera'),
  ('a0000000-0000-0000-0000-000000000002', 'Economical 1.2L MIVEC Engine'),
  ('a0000000-0000-0000-0000-000000000002', 'Strong Cold Air Conditioning'),

  -- Toyota Vios
  ('a0000000-0000-0000-0000-000000000003', 'Apple CarPlay & Android Auto'),
  ('a0000000-0000-0000-0000-000000000003', 'Vehicle Stability Control & Hill-Start Assist'),
  ('a0000000-0000-0000-0000-000000000003', 'Backup Camera with Guide Lines'),
  ('a0000000-0000-0000-0000-000000000003', 'Reliable 1.3L Dual VVT-i Engine'),
  ('a0000000-0000-0000-0000-000000000003', 'Multiple SRS Airbags'),

  -- Honda City
  ('a0000000-0000-0000-0000-000000000004', '8-inch Touchscreen Audio'),
  ('a0000000-0000-0000-0000-000000000004', 'Multi-Angle Rearview Camera'),
  ('a0000000-0000-0000-0000-000000000004', 'Responsive 1.5L DOHC i-VTEC'),
  ('a0000000-0000-0000-0000-000000000004', 'Vehicle Stability Assist'),
  ('a0000000-0000-0000-0000-000000000004', 'Automatic Climate Control'),

  -- Toyota Avanza
  ('a0000000-0000-0000-0000-000000000005', 'Flexible 7-Passenger Seating'),
  ('a0000000-0000-0000-0000-000000000005', 'Long Sofa Mode Fold-Flat Seats'),
  ('a0000000-0000-0000-0000-000000000005', 'Rear Cabin Air Conditioning Vents'),
  ('a0000000-0000-0000-0000-000000000005', 'Touchscreen with Apple CarPlay'),
  ('a0000000-0000-0000-0000-000000000005', 'Vehicle Stability Control'),

  -- Nissan Livina
  ('a0000000-0000-0000-0000-000000000006', 'Comfortable 7-Passenger 3-Row Cabin'),
  ('a0000000-0000-0000-0000-000000000006', 'Independent Rear Air Conditioning'),
  ('a0000000-0000-0000-0000-000000000006', 'Touchscreen with Smartphone Connectivity'),
  ('a0000000-0000-0000-0000-000000000006', 'Rear Parking Sensors & Camera'),
  ('a0000000-0000-0000-0000-000000000006', 'Smooth Fuel-Efficient Ride'),

  -- Mitsubishi Xpander
  ('a0000000-0000-0000-0000-000000000007', 'High 225mm Ground Clearance for Provincial Roads'),
  ('a0000000-0000-0000-0000-000000000007', 'Spacious 7-Passenger Versatile Layout'),
  ('a0000000-0000-0000-0000-000000000007', 'Smartphone-Link Display Audio'),
  ('a0000000-0000-0000-0000-000000000007', 'Electronic Parking Brake with Auto Hold'),
  ('a0000000-0000-0000-0000-000000000007', 'Active Stability Control & Hill Start Assist'),

  -- Toyota Innova
  ('a0000000-0000-0000-0000-000000000008', 'Proven 2.8L D-4D Turbo Diesel Engine'),
  ('a0000000-0000-0000-0000-000000000008', 'Dedicated Dual Climate Control with Ceiling Vents'),
  ('a0000000-0000-0000-0000-000000000008', 'Spacious 7-Passenger Capacity with Large Cargo Bed'),
  ('a0000000-0000-0000-0000-000000000008', 'Eco & Power Driving Mode Selector'),
  ('a0000000-0000-0000-0000-000000000008', 'Isofix Anchors & Multi-Point Seatbelts'),

  -- Toyota Hilux
  ('a0000000-0000-0000-0000-000000000009', 'Heavy-Duty Cargo Bed for Equipment & Luggage'),
  ('a0000000-0000-0000-0000-000000000009', 'High-Torque 2.4L Turbo Diesel Engine'),
  ('a0000000-0000-0000-0000-000000000009', 'Tough Ladder Frame Chassis with High Clearance'),
  ('a0000000-0000-0000-0000-000000000009', 'Touchscreen Audio with Apple CarPlay & Android Auto'),
  ('a0000000-0000-0000-0000-000000000009', 'Rear Differential Lock & Hill-Start Assist'),

  -- Mitsubishi Montero Sport
  ('a0000000-0000-0000-0000-000000000010', 'Refined 2.4L MIVEC Clean Turbo Diesel'),
  ('a0000000-0000-0000-0000-000000000010', 'Smooth 8-Speed Automatic Transmission'),
  ('a0000000-0000-0000-0000-000000000010', 'Comfortable 7-Seater 3-Row Cabin'),
  ('a0000000-0000-0000-0000-000000000010', 'Dual-Zone Climate Control'),
  ('a0000000-0000-0000-0000-000000000010', 'Forward Collision Mitigation & Stability Control');

-- Step 5: Update vehicle_images table alt text
UPDATE public.vehicle_images SET alt_text = 'Toyota Wigo 2024 Compact Hatchback in Butuan City' WHERE vehicle_id = 'a0000000-0000-0000-0000-000000000001';
UPDATE public.vehicle_images SET alt_text = 'Mitsubishi Mirage 2024 Economical Hatchback in Butuan City' WHERE vehicle_id = 'a0000000-0000-0000-0000-000000000002';
UPDATE public.vehicle_images SET alt_text = 'Toyota Vios 2024 Compact Sedan in Butuan City' WHERE vehicle_id = 'a0000000-0000-0000-0000-000000000003';
UPDATE public.vehicle_images SET alt_text = 'Honda City 2024 Sedan in Butuan City' WHERE vehicle_id = 'a0000000-0000-0000-0000-000000000004';
UPDATE public.vehicle_images SET alt_text = 'Toyota Avanza 2024 7-Seater MPV in Butuan City' WHERE vehicle_id = 'a0000000-0000-0000-0000-000000000005';
UPDATE public.vehicle_images SET alt_text = 'Nissan Livina 2024 7-Seater MPV in Butuan City' WHERE vehicle_id = 'a0000000-0000-0000-0000-000000000006';
UPDATE public.vehicle_images SET alt_text = 'Mitsubishi Xpander 2024 7-Seater MPV in Butuan City' WHERE vehicle_id = 'a0000000-0000-0000-0000-000000000007';
UPDATE public.vehicle_images SET alt_text = 'Toyota Innova 2024 Diesel 7-Seater MPV in Butuan City' WHERE vehicle_id = 'a0000000-0000-0000-0000-000000000008';
UPDATE public.vehicle_images SET alt_text = 'Toyota Hilux 2024 Pickup Truck in Butuan City' WHERE vehicle_id = 'a0000000-0000-0000-0000-000000000009';
UPDATE public.vehicle_images SET alt_text = 'Mitsubishi Montero Sport 2024 Midsize SUV in Butuan City' WHERE vehicle_id = 'a0000000-0000-0000-0000-000000000010';
