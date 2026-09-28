-- ============================================================
-- Veyra -- Synthetic Seed Data for Local Development
-- Environment: LOCAL / TEST ONLY
-- Notice: ALL identifiers use clearly prefixed 'dev_' markers.
-- NO real customer data, NO real payment details, NO real secrets.
-- ============================================================

-- ------------------------------------------------------------
-- 1. BRANCHES (02_branches.sql)
-- ------------------------------------------------------------
INSERT INTO public.branches (id, name, city, timezone, contact_phone, contact_email, status)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'BGC Flagship Hub', 'Taguig', 'Asia/Manila', '+63 2 8888 0101', 'bgc@veyra.local', 'active'),
  ('b0000000-0000-0000-0000-000000000002', 'Makati Financial Hub', 'Makati', 'Asia/Manila', '+63 2 8888 0102', 'makati@veyra.local', 'active'),
  ('b0000000-0000-0000-0000-000000000003', 'NAIA Terminal 3 Hub', 'Pasay', 'Asia/Manila', '+63 2 8888 0103', 'naia@veyra.local', 'active'),
  ('b0000000-0000-0000-0000-000000000004', 'Cebu Mactan Hub', 'Lapu-Lapu City', 'Asia/Manila', '+63 32 888 0104', 'cebu@veyra.local', 'active')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. LOCATIONS (02_branches.sql)
-- Types: airport_terminal, city_center, private_hub
-- ------------------------------------------------------------
INSERT INTO public.locations (id, branch_id, name, type, address, city, operating_hours, pickup_available, return_available, timezone, status)
VALUES
  ('l0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BGC Central Pickup Point', 'private_hub', '5th Ave & 28th St, BGC', 'Taguig', '07:00 - 22:00', true, true, 'Asia/Manila', 'active'),
  ('l0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'Ayala Center Valet Point', 'city_center', 'Ayala Center, Glorietta 3', 'Makati', '08:00 - 21:00', true, true, 'Asia/Manila', 'active'),
  ('l0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'NAIA T3 VIP Counter', 'airport_terminal', 'T3 Arrival Hall Bay 8', 'Pasay', '24/7', true, true, 'Asia/Manila', 'active'),
  ('l0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', 'MCIA Terminal 2 Lounge', 'airport_terminal', 'Terminal 2 Arrivals Counter 12', 'Lapu-Lapu City', '06:00 - 23:00', true, true, 'Asia/Manila', 'active')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 3. USERS (01_identity.sql)
-- ------------------------------------------------------------
INSERT INTO public.users (id, clerk_id, email, email_verified, user_type, status)
VALUES
  ('u0000000-0000-0000-0000-000000000000', 'dev_clerk_system_actor', 'system@veyra.local', true, 'staff', 'active'),
  ('u0000000-0000-0000-0000-000000000001', 'dev_clerk_admin_001', 'admin.dev@veyra.local', true, 'staff', 'active'),
  ('u0000000-0000-0000-0000-000000000002', 'dev_clerk_fleetmgr_001', 'fleet.dev@veyra.local', true, 'staff', 'active'),
  ('u0000000-0000-0000-0000-000000000003', 'dev_clerk_brmgr_mnl', 'brmgr.bgc@veyra.local', true, 'staff', 'active'),
  ('u0000000-0000-0000-0000-000000000004', 'dev_clerk_staff_mnl', 'staff.bgc@veyra.local', true, 'staff', 'active'),
  ('u0000000-0000-0000-0000-000000000005', 'dev_clerk_finance_001', 'finance.dev@veyra.local', true, 'staff', 'active'),
  ('u0000000-0000-0000-0000-000000000006', 'dev_clerk_support_001', 'support.dev@veyra.local', true, 'staff', 'active'),
  ('u0000000-0000-0000-0000-000000000007', 'dev_clerk_customer_001', 'customer.demo@veyra.local', true, 'customer', 'active')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 4. STAFF USERS (01_identity.sql)
-- ------------------------------------------------------------
INSERT INTO public.staff_users (id, user_id, employee_id, role, branch_id, status, joined_date)
VALUES
  ('s0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000001', 'EMP-DEV-001', 'admin', NULL, 'active', '2024-01-01'),
  ('s0000000-0000-0000-0000-000000000002', 'u0000000-0000-0000-0000-000000000002', 'EMP-DEV-002', 'fleet_manager', NULL, 'active', '2024-01-01'),
  ('s0000000-0000-0000-0000-000000000003', 'u0000000-0000-0000-0000-000000000003', 'EMP-DEV-003', 'branch_manager', 'b0000000-0000-0000-0000-000000000001', 'active', '2024-01-15'),
  ('s0000000-0000-0000-0000-000000000004', 'u0000000-0000-0000-0000-000000000004', 'EMP-DEV-004', 'branch_staff', 'b0000000-0000-0000-0000-000000000001', 'active', '2024-02-01'),
  ('s0000000-0000-0000-0000-000000000005', 'u0000000-0000-0000-0000-000000000005', 'EMP-DEV-005', 'finance', NULL, 'active', '2024-01-10'),
  ('s0000000-0000-0000-0000-000000000006', 'u0000000-0000-0000-0000-000000000006', 'EMP-DEV-006', 'support', NULL, 'active', '2024-02-15')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 5. CUSTOMERS (01_identity.sql)
-- ------------------------------------------------------------
INSERT INTO public.customers (id, user_id, first_name, last_name, phone, phone_verified, date_of_birth, preferred_hub_id, membership_tier, membership_number, total_rentals, verification_status)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'u0000000-0000-0000-0000-000000000007', 'Alexander', 'Mercer', '+639171234567', true, '1990-05-15', 'l0000000-0000-0000-0000-000000000001', 'elite', 'VYR-MEM-0001', 3, 'verified')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 6. VEHICLE CLASSES (03_fleet.sql)
-- Categories: sedan, suv, electric, van, luxury, touring
-- ------------------------------------------------------------
INSERT INTO public.vehicle_classes (id, name, category, base_daily_rate, description, sort_order)
VALUES
  ('vc000000-0000-0000-0000-000000000001', 'Executive Sedan', 'sedan', 850000, 'Premium executive saloons with utmost comfort and prestige.', 1),
  ('vc000000-0000-0000-0000-000000000002', 'Grand Touring SUV', 'suv', 1250000, 'Full-size flagship luxury SUVs for effortless city and provincial cruising.', 2),
  ('vc000000-0000-0000-0000-000000000003', 'Electric Performance', 'electric', 1500000, 'Zero-emission high-performance sports and luxury electric vehicles.', 3),
  ('vc000000-0000-0000-0000-000000000004', 'VIP Transporter', 'van', 1400000, 'First-class captain-seat passenger vans for executive travel.', 4),
  ('vc000000-0000-0000-0000-000000000005', 'High Luxury Flagship', 'luxury', 2500000, 'Ultra-luxury tier vehicles offering bespoke craftsmanship.', 5)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 7. VEHICLES (03_fleet.sql)
-- ------------------------------------------------------------
INSERT INTO public.vehicles (
  id, vehicle_class_id, branch_id, make, model, year, plate_number, vin,
  color, transmission, fuel_type, seats, luggage_capacity, doors,
  daily_rate, currency, security_deposit, mileage_allowance_km, excess_mileage_rate,
  fleet_status, condition, odometer_km, fuel_level_pct, acquisition_date, internal_notes
)
VALUES
  (
    'v0000000-0000-0000-0000-000000000001',
    'vc000000-0000-0000-0000-000000000003',
    'b0000000-0000-0000-0000-000000000001',
    'Porsche', 'Taycan 4S Cross Turismo', 2024, 'DEV-TYC-01', 'DEV17PORSCHETY01',
    'Volcano Grey Metallic', 'automatic', 'electric', 4, 3, 4,
    1850000, 'PHP', 5000000, 250, 15000,
    'available', 'excellent', 4200, 95, '2024-01-10', 'Flagship EV; BGC hub primary.'
  ),
  (
    'v0000000-0000-0000-0000-000000000002',
    'vc000000-0000-0000-0000-000000000002',
    'b0000000-0000-0000-0000-000000000001',
    'Toyota', 'Land Cruiser 300 ZX', 2024, 'DEV-LC3-02', 'DEV17TOYOTALC302',
    'Precious White Pearl', 'automatic', 'diesel', 7, 5, 5,
    1450000, 'PHP', 4000000, 300, 12000,
    'available', 'excellent', 8600, 85, '2024-02-15', 'Full tint; armored glass.'
  ),
  (
    'v0000000-0000-0000-0000-000000000001',
    'vc000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000002',
    'BMW', '530i M Sport', 2024, 'DEV-BMW-03', 'DEV17BMWM530I003',
    'Carbon Black', 'automatic', 'petrol', 5, 3, 4,
    950000, 'PHP', 3000000, 250, 10000,
    'available', 'excellent', 6100, 90, '2024-03-01', 'Makati hub executive loaner.'
  ),
  (
    'v0000000-0000-0000-0000-000000000004',
    'vc000000-0000-0000-0000-000000000004',
    'b0000000-0000-0000-0000-000000000003',
    'Toyota', 'Alphard Executive Lounge', 2024, 'DEV-ALP-04', 'DEV17TOYOTALP004',
    'Luxury White Pearl', 'automatic', 'hybrid', 6, 4, 5,
    1550000, 'PHP', 4000000, 200, 12000,
    'available', 'excellent', 11200, 80, '2024-01-20', 'NAIA T3 VIP transfer designated.'
  ),
  (
    'v0000000-0000-0000-0000-000000000005',
    'vc000000-0000-0000-0000-000000000005',
    'b0000000-0000-0000-0000-000000000001',
    'Mercedes-Benz', 'S 500 4MATIC', 2024, 'DEV-MBZ-05', 'DEV17MBZMS500005',
    'Obsidian Black', 'automatic', 'petrol', 5, 4, 4,
    2800000, 'PHP', 8000000, 200, 20000,
    'available', 'excellent', 3500, 100, '2024-04-10', 'Bespoke chauffeur and VIP rental tier.'
  )
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 8. VEHICLE FEATURES (03_fleet.sql)
-- ------------------------------------------------------------
INSERT INTO public.vehicle_features (vehicle_id, feature)
VALUES
  ('v0000000-0000-0000-0000-000000000001', 'All-Wheel Drive'),
  ('v0000000-0000-0000-0000-000000000001', 'Adaptive Air Suspension'),
  ('v0000000-0000-0000-0000-000000000001', 'Panoramic Glass Roof'),
  ('v0000000-0000-0000-0000-000000000001', 'Burmester 3D Surround Sound'),
  ('v0000000-0000-0000-0000-000000000002', 'Full-time 4WD with Multi-Terrain Select'),
  ('v0000000-0000-0000-0000-000000000002', 'Rear Entertainment System'),
  ('v0000000-0000-0000-0000-000000000002', 'Cool Box in Center Console'),
  ('v0000000-0000-0000-0000-000000000003', 'M Sport Aerodynamic Package'),
  ('v0000000-0000-0000-0000-000000000003', 'Harman Kardon Audio'),
  ('v0000000-0000-0000-0000-000000000004', 'Second-Row Ottoman Captain Seats'),
  ('v0000000-0000-0000-0000-000000000004', 'JBL Premium Sound'),
  ('v0000000-0000-0000-0000-000000000005', 'Burmester High-End 4D Audio'),
  ('v0000000-0000-0000-0000-000000000005', 'Executive Rear Lounge with Massage');

-- ------------------------------------------------------------
-- 9. VEHICLE PHOTOS (03_fleet.sql)
-- Uploaded by admin user (u0000000-0000-0000-0000-000000000001)
-- ------------------------------------------------------------
INSERT INTO public.vehicle_photos (vehicle_id, storage_path, bucket, type, sort_order, uploaded_by)
VALUES
  ('v0000000-0000-0000-0000-000000000001', 'marketing/taycan-exterior-front.jpg', 'vehicles-public', 'marketing', 0, 'u0000000-0000-0000-0000-000000000001'),
  ('v0000000-0000-0000-0000-000000000001', 'marketing/taycan-interior-cabin.jpg', 'vehicles-public', 'marketing', 1, 'u0000000-0000-0000-0000-000000000001'),
  ('v0000000-0000-0000-0000-000000000002', 'marketing/lc300-exterior-front.jpg', 'vehicles-public', 'marketing', 0, 'u0000000-0000-0000-0000-000000000001'),
  ('v0000000-0000-0000-0000-000000000003', 'marketing/bmw5-exterior-front.jpg', 'vehicles-public', 'marketing', 0, 'u0000000-0000-0000-0000-000000000001'),
  ('v0000000-0000-0000-0000-000000000004', 'marketing/alphard-exterior-front.jpg', 'vehicles-public', 'marketing', 0, 'u0000000-0000-0000-0000-000000000001'),
  ('v0000000-0000-0000-0000-000000000005', 'marketing/s500-exterior-front.jpg', 'vehicles-public', 'marketing', 0, 'u0000000-0000-0000-0000-000000000001');

-- ------------------------------------------------------------
-- 10. EXTRAS (05_extras_pricing.sql)
-- Categories: protection, convenience, equipment, mileage
-- ------------------------------------------------------------
INSERT INTO public.extras (id, slug, name, description, category, daily_rate, currency, is_active, sort_order)
VALUES
  ('e0000000-0000-0000-0000-000000000001', 'full-protection-waiver', 'Zero-Deductible Full Protection', 'Covers collision damage waiver, tire, and glass damage with zero customer excess.', 'protection', 120000, 'PHP', true, 1),
  ('e0000000-0000-0000-0000-000000000002', 'child-safety-seat', 'ISOFIX Child Safety Seat', 'ECE R129 certified ergonomic child seat suitable for infants to toddlers.', 'equipment', 45000, 'PHP', true, 2),
  ('e0000000-0000-0000-0000-000000000003', 'portable-wifi-hotspot', 'High-Speed 5G Mobile Hotspot', 'Unlimited high-speed 5G connectivity for up to 8 client devices.', 'convenience', 35000, 'PHP', true, 3),
  ('e0000000-0000-0000-0000-000000000004', 'additional-authorized-driver', 'Additional Authorized Driver', 'Adds a second verified driver with complete insurance coverage.', 'protection', 50000, 'PHP', true, 4),
  ('e0000000-0000-0000-0000-000000000005', 'unlimited-mileage-addon', 'Unlimited Mileage Package', 'Removes daily kilometer caps for worry-free long distance journeying.', 'mileage', 150000, 'PHP', true, 5)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 11. RATE PLANS (05_extras_pricing.sql)
-- ------------------------------------------------------------
INSERT INTO public.rate_plans (id, name, vehicle_class_id, min_days, max_days, daily_rate_override, discount_pct, valid_from, valid_to, is_active)
VALUES
  ('rp000000-0000-0000-0000-000000000001', 'Standard Daily Rate', NULL, 1, 6, NULL, 0.00, NULL, NULL, true),
  ('rp000000-0000-0000-0000-000000000002', 'Weekly Explorer Special', NULL, 7, 29, NULL, 12.50, NULL, NULL, true),
  ('rp000000-0000-0000-0000-000000000003', 'Monthly Prestige Plan', NULL, 30, NULL, NULL, 25.00, NULL, NULL, true)
ON CONFLICT (id) DO NOTHING;
