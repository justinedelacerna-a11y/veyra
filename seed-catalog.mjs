import fs from "node:fs"
import { createClient } from "@supabase/supabase-js"

const envContent = fs.readFileSync(".env.local", "utf8")
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) {
    process.env[match[1].trim()] = match[2].trim()
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error("Missing Supabase configuration in .env.local")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const BRANCHES = [
  {
    id: "b0000000-0000-0000-0000-000000000001",
    name: "Veyra Butuan City Hub",
    city: "Butuan City",
    timezone: "Asia/Manila",
    contact_phone: "+63 85 888 0101",
    contact_email: "butuan@veyra.ph",
    status: "active",
  },
]

// Barangay hub location IDs (from migration 20261010000000_barangay_locations.sql)
const LOC_LIBERTAD      = "10c00000-0000-0000-0000-000000000001"
const LOC_AMPAYON       = "10c00000-0000-0000-0000-000000000011"
const LOC_VILLA_KANANGA  = "10c00000-0000-0000-0000-000000000012"
const LOC_SAN_VICENTE   = "10c00000-0000-0000-0000-000000000013"
const LOC_JP_RIZAL      = "10c00000-0000-0000-0000-000000000014"
const LOC_BAAN_KM3      = "10c00000-0000-0000-0000-000000000015"
const LOC_DAGOHOY       = "10c00000-0000-0000-0000-000000000016"
const LOC_LEON_KILAT    = "10c00000-0000-0000-0000-000000000017"

const VEHICLE_CLASSES = [
  {
    id: "ec000000-0000-0000-0000-000000000001",
    name: "Compact Sedan",
    category: "sedan",
    base_daily_rate: 150000,
    description: "Reliable and fuel-efficient sedans for city driving and errands in Butuan City.",
    sort_order: 2,
  },
  {
    id: "ec000000-0000-0000-0000-000000000002",
    name: "Midsize SUV",
    category: "suv",
    base_daily_rate: 250000,
    description: "Comfortable 7-seater SUVs suited for family trips and regional provincial travel.",
    sort_order: 6,
  },
  {
    id: "ec000000-0000-0000-0000-000000000003",
    name: "Utility Pickup",
    category: "suv",
    base_daily_rate: 240000,
    description: "Practical pickup trucks suited for cargo, utility, and provincial road conditions.",
    sort_order: 5,
  },
  {
    id: "ec000000-0000-0000-0000-000000000004",
    name: "7-Seater MPV",
    category: "van",
    base_daily_rate: 180000,
    description: "Spacious multi-purpose vehicles for families and barkada trips.",
    sort_order: 3,
  },
  {
    id: "ec000000-0000-0000-0000-000000000005",
    name: "Family MPV",
    category: "van",
    base_daily_rate: 230000,
    description: "Dependable 7-seater diesel MPVs built for larger groups and long distance journeys.",
    sort_order: 4,
  },
  {
    id: "ec000000-0000-0000-0000-000000000006",
    name: "Budget Hatchback",
    category: "sedan",
    base_daily_rate: 130000,
    description: "Compact, economical city hatchbacks ideal for students and everyday errands.",
    sort_order: 1,
  },
]

const VEHICLES = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    vehicle_class_id: "ec000000-0000-0000-0000-000000000006",
    branch_id: "b0000000-0000-0000-0000-000000000001",
    location_id: LOC_LIBERTAD,
    make: "Toyota",
    model: "Wigo",
    year: 2024,
    plate_number: "DEV-WIG-01",
    vin: "DEV17TOYOTAWIG001",
    color: "Silver Metallic",
    transmission: "automatic",
    fuel_type: "petrol",
    seats: 5,
    luggage_capacity: 2,
    doors: 5,
    daily_rate: 130000,
    security_deposit: 500000,
    currency: "PHP",
    mileage_allowance_km: 300,
    excess_mileage_rate: 1500,
    fleet_status: "available",
    condition: "excellent",
    odometer_km: 8200,
    fuel_level_pct: 100,
    acquisition_date: "2024-01-15",
    internal_notes: "Compact hatchback stationed at Barangay Libertad Hub. Popular student daily rental.",
  },
  {
    id: "a0000000-0000-0000-0000-000000000002",
    vehicle_class_id: "ec000000-0000-0000-0000-000000000006",
    branch_id: "b0000000-0000-0000-0000-000000000001",
    location_id: LOC_VILLA_KANANGA,
    make: "Mitsubishi",
    model: "Mirage",
    year: 2024,
    plate_number: "DEV-MRG-02",
    vin: "DEV17MITSMIR002",
    color: "Cool Silver",
    transmission: "automatic",
    fuel_type: "petrol",
    seats: 5,
    luggage_capacity: 2,
    doors: 5,
    daily_rate: 140000,
    security_deposit: 500000,
    currency: "PHP",
    mileage_allowance_km: 300,
    excess_mileage_rate: 1500,
    fleet_status: "available",
    condition: "excellent",
    odometer_km: 12500,
    fuel_level_pct: 100,
    acquisition_date: "2024-02-01",
    internal_notes: "Economical city hatchback stationed at Barangay Villa Kananga Hub.",
  },
  {
    id: "a0000000-0000-0000-0000-000000000003",
    vehicle_class_id: "ec000000-0000-0000-0000-000000000001",
    branch_id: "b0000000-0000-0000-0000-000000000001",
    location_id: LOC_SAN_VICENTE,
    make: "Toyota",
    model: "Vios",
    year: 2024,
    plate_number: "DEV-VIO-03",
    vin: "DEV17TOYOTAVIO003",
    color: "Super Red",
    transmission: "automatic",
    fuel_type: "petrol",
    seats: 5,
    luggage_capacity: 3,
    doors: 4,
    daily_rate: 150000,
    security_deposit: 500000,
    currency: "PHP",
    mileage_allowance_km: 300,
    excess_mileage_rate: 1500,
    fleet_status: "available",
    condition: "excellent",
    odometer_km: 14100,
    fuel_level_pct: 100,
    acquisition_date: "2024-01-20",
    internal_notes: "Reliable sedan stationed at Barangay San Vicente Hub. Ideal for city errands.",
  },
  {
    id: "a0000000-0000-0000-0000-000000000004",
    vehicle_class_id: "ec000000-0000-0000-0000-000000000001",
    branch_id: "b0000000-0000-0000-0000-000000000001",
    location_id: LOC_LIBERTAD,
    make: "Honda",
    model: "City",
    year: 2024,
    plate_number: "DEV-CTY-04",
    vin: "DEV17HONDACITY004",
    color: "Platinum White Pearl",
    transmission: "automatic",
    fuel_type: "petrol",
    seats: 5,
    luggage_capacity: 3,
    doors: 4,
    daily_rate: 160000,
    security_deposit: 500000,
    currency: "PHP",
    mileage_allowance_km: 300,
    excess_mileage_rate: 1500,
    fleet_status: "available",
    condition: "excellent",
    odometer_km: 11200,
    fuel_level_pct: 100,
    acquisition_date: "2024-02-15",
    internal_notes: "Comfortable sedan stationed at Barangay Libertad Hub.",
  },
  {
    id: "a0000000-0000-0000-0000-000000000005",
    vehicle_class_id: "ec000000-0000-0000-0000-000000000004",
    branch_id: "b0000000-0000-0000-0000-000000000001",
    location_id: LOC_AMPAYON,
    make: "Toyota",
    model: "Avanza",
    year: 2024,
    plate_number: "DEV-AVZ-05",
    vin: "DEV17TOYOTAAVZ005",
    color: "Dark Red Mica Metallic",
    transmission: "automatic",
    fuel_type: "petrol",
    seats: 7,
    luggage_capacity: 4,
    doors: 5,
    daily_rate: 180000,
    security_deposit: 600000,
    currency: "PHP",
    mileage_allowance_km: 300,
    excess_mileage_rate: 1500,
    fleet_status: "available",
    condition: "excellent",
    odometer_km: 16800,
    fuel_level_pct: 100,
    acquisition_date: "2024-03-01",
    internal_notes: "7-seater MPV stationed at Barangay Ampayon Hub. Great for family outings.",
  },
  {
    id: "a0000000-0000-0000-0000-000000000006",
    vehicle_class_id: "ec000000-0000-0000-0000-000000000004",
    branch_id: "b0000000-0000-0000-0000-000000000001",
    location_id: LOC_JP_RIZAL,
    make: "Nissan",
    model: "Livina",
    year: 2024,
    plate_number: "DEV-LIV-06",
    vin: "DEV17NISSANLIV006",
    color: "Diamond Pearl White",
    transmission: "automatic",
    fuel_type: "petrol",
    seats: 7,
    luggage_capacity: 4,
    doors: 5,
    daily_rate: 180000,
    security_deposit: 600000,
    currency: "PHP",
    mileage_allowance_km: 300,
    excess_mileage_rate: 1500,
    fleet_status: "available",
    condition: "excellent",
    odometer_km: 15200,
    fuel_level_pct: 100,
    acquisition_date: "2024-03-10",
    internal_notes: "7-seater MPV stationed at Barangay J.P. Rizal Hub.",
  },
  {
    id: "a0000000-0000-0000-0000-000000000007",
    vehicle_class_id: "ec000000-0000-0000-0000-000000000004",
    branch_id: "b0000000-0000-0000-0000-000000000001",
    location_id: LOC_BAAN_KM3,
    make: "Mitsubishi",
    model: "Xpander",
    year: 2024,
    plate_number: "DEV-XPD-07",
    vin: "DEV17MITSXPD007",
    color: "Graphite Gray Metallic",
    transmission: "automatic",
    fuel_type: "petrol",
    seats: 7,
    luggage_capacity: 4,
    doors: 5,
    daily_rate: 200000,
    security_deposit: 700000,
    currency: "PHP",
    mileage_allowance_km: 300,
    excess_mileage_rate: 1500,
    fleet_status: "available",
    condition: "excellent",
    odometer_km: 13900,
    fuel_level_pct: 100,
    acquisition_date: "2024-02-20",
    internal_notes: "Spacious 7-seater MPV stationed at Barangay Baan Km. 3 Hub.",
  },
  {
    id: "a0000000-0000-0000-0000-000000000008",
    vehicle_class_id: "ec000000-0000-0000-0000-000000000005",
    branch_id: "b0000000-0000-0000-0000-000000000001",
    location_id: LOC_DAGOHOY,
    make: "Toyota",
    model: "Innova",
    year: 2024,
    plate_number: "DEV-INV-08",
    vin: "DEV17TOYOTAINV008",
    color: "Attitude Black Mica",
    transmission: "automatic",
    fuel_type: "diesel",
    seats: 7,
    luggage_capacity: 5,
    doors: 5,
    daily_rate: 230000,
    security_deposit: 800000,
    currency: "PHP",
    mileage_allowance_km: 300,
    excess_mileage_rate: 1500,
    fleet_status: "available",
    condition: "excellent",
    odometer_km: 21000,
    fuel_level_pct: 100,
    acquisition_date: "2024-01-10",
    internal_notes: "Dependable diesel 7-seater MPV stationed at Barangay Dagohoy Hub.",
  },
  {
    id: "a0000000-0000-0000-0000-000000000009",
    vehicle_class_id: "ec000000-0000-0000-0000-000000000003",
    branch_id: "b0000000-0000-0000-0000-000000000001",
    location_id: LOC_LEON_KILAT,
    make: "Toyota",
    model: "Hilux",
    year: 2024,
    plate_number: "DEV-HLX-09",
    vin: "DEV17TOYOTAHLX009",
    color: "Super White",
    transmission: "automatic",
    fuel_type: "diesel",
    seats: 5,
    luggage_capacity: 5,
    doors: 4,
    daily_rate: 240000,
    security_deposit: 800000,
    currency: "PHP",
    mileage_allowance_km: 300,
    excess_mileage_rate: 1500,
    fleet_status: "available",
    condition: "excellent",
    odometer_km: 19500,
    fuel_level_pct: 100,
    acquisition_date: "2024-02-05",
    internal_notes: "Utility pickup truck stationed at Barangay Leon Kilat Hub.",
  },
  {
    id: "a0000000-0000-0000-0000-000000000010",
    vehicle_class_id: "ec000000-0000-0000-0000-000000000002",
    branch_id: "b0000000-0000-0000-0000-000000000001",
    location_id: LOC_VILLA_KANANGA,
    make: "Mitsubishi",
    model: "Montero Sport",
    year: 2024,
    plate_number: "DEV-MNT-10",
    vin: "DEV17MITSMON010",
    color: "White Diamond",
    transmission: "automatic",
    fuel_type: "diesel",
    seats: 7,
    luggage_capacity: 5,
    doors: 5,
    daily_rate: 250000,
    security_deposit: 1000000,
    currency: "PHP",
    mileage_allowance_km: 300,
    excess_mileage_rate: 1500,
    fleet_status: "available",
    condition: "excellent",
    odometer_km: 18400,
    fuel_level_pct: 100,
    acquisition_date: "2024-01-25",
    internal_notes: "Midsize 7-seater SUV stationed at Barangay Villa Kananga Hub.",
  },
]

const FEATURES = [
  // Toyota Wigo
  { vehicle_id: "a0000000-0000-0000-0000-000000000001", feature: "Touchscreen Infotainment with Bluetooth" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000001", feature: "Dual SRS Airbags" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000001", feature: "ABS with EBD" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000001", feature: "Ultra Fuel-Efficient 1.0L Engine" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000001", feature: "Keyless Entry & Push Start" },

  // Mitsubishi Mirage
  { vehicle_id: "a0000000-0000-0000-0000-000000000002", feature: "Touchscreen Audio with Smartphone Mirroring" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000002", feature: "Dual Front Airbags" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000002", feature: "Rearview Camera" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000002", feature: "Economical 1.2L MIVEC Engine" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000002", feature: "Cold Dual AC" },

  // Toyota Vios
  { vehicle_id: "a0000000-0000-0000-0000-000000000003", feature: "Apple CarPlay & Android Auto" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000003", feature: "Vehicle Stability Control & Hill-Start Assist" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000003", feature: "Backup Camera with Guide Lines" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000003", feature: "Reliable 1.3L Dual VVT-i Engine" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000003", feature: "Multiple SRS Airbags" },

  // Honda City
  { vehicle_id: "a0000000-0000-0000-0000-000000000004", feature: "8-inch Touchscreen Audio" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000004", feature: "Multi-Angle Rearview Camera" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000004", feature: "Responsive 1.5L DOHC i-VTEC" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000004", feature: "Vehicle Stability Assist" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000004", feature: "Automatic Climate Control" },

  // Toyota Avanza
  { vehicle_id: "a0000000-0000-0000-0000-000000000005", feature: "Flexible 7-Passenger Seating" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000005", feature: "Long Sofa Mode Fold-Flat Seats" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000005", feature: "Rear Cabin Air Conditioning Vents" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000005", feature: "Touchscreen with Apple CarPlay" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000005", feature: "Vehicle Stability Control" },

  // Nissan Livina
  { vehicle_id: "a0000000-0000-0000-0000-000000000006", feature: "Comfortable 7-Passenger 3-Row Cabin" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000006", feature: "Independent Rear Air Conditioning" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000006", feature: "Touchscreen with Smartphone Connectivity" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000006", feature: "Rear Parking Sensors & Camera" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000006", feature: "Smooth Fuel-Efficient Ride" },

  // Mitsubishi Xpander
  { vehicle_id: "a0000000-0000-0000-0000-000000000007", feature: "High 225mm Ground Clearance for Provincial Roads" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000007", feature: "Spacious 7-Passenger Versatile Layout" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000007", feature: "Smartphone-Link Display Audio" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000007", feature: "Electronic Parking Brake with Auto Hold" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000007", feature: "Active Stability Control & Hill Start Assist" },

  // Toyota Innova
  { vehicle_id: "a0000000-0000-0000-0000-000000000008", feature: "Proven 2.8L D-4D Turbo Diesel Engine" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000008", feature: "Dedicated Dual Climate Control with Ceiling Vents" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000008", feature: "Spacious 7-Passenger Capacity with Large Cargo Bed" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000008", feature: "Eco & Power Driving Mode Selector" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000008", feature: "Isofix Anchors & Multi-Point Seatbelts" },

  // Toyota Hilux
  { vehicle_id: "a0000000-0000-0000-0000-000000000009", feature: "Heavy-Duty Cargo Bed for Equipment & Luggage" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000009", feature: "High-Torque 2.4L Turbo Diesel Engine" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000009", feature: "Tough Ladder Frame Chassis with High Clearance" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000009", feature: "Touchscreen Audio with Apple CarPlay & Android Auto" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000009", feature: "Rear Differential Lock & Hill-Start Assist" },

  // Mitsubishi Montero Sport
  { vehicle_id: "a0000000-0000-0000-0000-000000000010", feature: "Refined 2.4L MIVEC Clean Turbo Diesel" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000010", feature: "Smooth 8-Speed Automatic Transmission" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000010", feature: "Comfortable 7-Seater 3-Row Cabin" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000010", feature: "Dual-Zone Climate Control" },
  { vehicle_id: "a0000000-0000-0000-0000-000000000010", feature: "Forward Collision Mitigation & Stability Control" },
]

async function runSeed() {
  console.log("Starting idempotent affordable catalog seed...")

  // 1. Branches
  const { error: bErr } = await supabase
    .from("branches")
    .upsert(BRANCHES, { onConflict: "id" })
  if (bErr) throw new Error(`Branches seed failed: ${bErr.message}`)
  console.log(`BRANCHES SEEDED: ${BRANCHES.length}`)

  // 2. Vehicle Classes
  const { error: vcErr } = await supabase
    .from("vehicle_classes")
    .upsert(VEHICLE_CLASSES, { onConflict: "id" })
  if (vcErr) throw new Error(`Vehicle classes seed failed: ${vcErr.message}`)
  console.log(`VEHICLE CLASSES SEEDED: ${VEHICLE_CLASSES.length}`)

  // 3. Clean up any obsolete vehicle records (e.g. 0011-0013)
  await supabase.from("vehicle_features").delete().in("vehicle_id", [
    "a0000000-0000-0000-0000-000000000011",
    "a0000000-0000-0000-0000-000000000012",
    "a0000000-0000-0000-0000-000000000013",
  ])
  await supabase.from("vehicles").delete().in("id", [
    "a0000000-0000-0000-0000-000000000011",
    "a0000000-0000-0000-0000-000000000012",
    "a0000000-0000-0000-0000-000000000013",
  ])

  // 4. Vehicles
  const { error: vErr } = await supabase
    .from("vehicles")
    .upsert(VEHICLES, { onConflict: "id" })
  if (vErr) throw new Error(`Vehicles seed failed: ${vErr.message}`)
  console.log(`VEHICLES SEEDED: ${VEHICLES.length}`)

  // 5. Vehicle Features
  const { error: fErr } = await supabase
    .from("vehicle_features")
    .upsert(FEATURES, { onConflict: "vehicle_id,feature" })
  if (fErr) {
    console.warn(`Vehicle features notice: ${fErr.message}`)
  } else {
    console.log(`VEHICLE FEATURES SEEDED: ${FEATURES.length}`)
  }

  // 6. Verify public.vehicle_catalog view
  const { data: catalog, error: catErr } = await supabase
    .from("vehicle_catalog")
    .select("id, make, model, year, daily_rate")
  if (catErr) throw new Error(`Catalog verification failed: ${catErr.message}`)

  console.log(`VEHICLE CATALOG ROWS: ${catalog.length}`)
  console.log("Seeding complete successfully!")
}

runSeed().catch((err) => {
  console.error("Seed execution error:", err.message)
  process.exit(1)
})
