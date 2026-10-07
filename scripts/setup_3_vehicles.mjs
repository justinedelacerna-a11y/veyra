import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ujzaewrcjhlwpxkyfbeb.supabase.co"
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in environment or .env.local")
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const SCRATCH = "C:\\Users\\Niqsy\\.gemini\\antigravity-ide\\brain\\109dc81d-12ce-4695-94f8-c83ec537e68e\\scratch"

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function downloadFile(url, destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 10000) {
    console.log(`Already exists and valid size: ${destPath} (${fs.statSync(destPath).size} bytes)`)
    return
  }
  console.log(`Downloading ${url} -> ${destPath}...`)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'VeyraCarRental/1.0 (educational project; contact@veyra.local)'
    }
  })
  if (!res.ok) {
    throw new Error(`Failed to download ${url}: HTTP ${res.status} ${res.statusText}`)
  }
  const arrayBuffer = await res.arrayBuffer()
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer))
  console.log(`Saved ${destPath} (${fs.statSync(destPath).size} bytes)`)
}

async function main() {
  // Step 1: Download Mirage G4 and Honda City RS
  await sleep(2000)
  await downloadFile(
    "https://upload.wikimedia.org/wikipedia/commons/1/15/Mitsubishi_Mirage_G4_1.2_GLS_2024.jpg",
    path.join(SCRATCH, "mirage_g4_12.jpg")
  )
  await sleep(3000)
  await downloadFile(
    "https://upload.wikimedia.org/wikipedia/commons/b/ba/2024_Honda_City_Hatchback_e-HEV_RS.jpg",
    path.join(SCRATCH, "honda_city_rs_13.jpg")
  )

  // Verify all 3 files exist
  const files = ["vios_xle_11.jpg", "mirage_g4_12.jpg", "honda_city_rs_13.jpg"]
  for (const f of files) {
    const p = path.join(SCRATCH, f)
    if (!fs.existsSync(p) || fs.statSync(p).size < 10000) {
      throw new Error(`File ${f} is missing or too small`)
    }
    console.log(`File ready: ${f} (${fs.statSync(p).size} bytes)`)
  }

  // Step 2: Insert/upsert vehicles
  const newVehicles = [
    {
      id: 'a0000000-0000-0000-0000-000000000011',
      vehicle_class_id: 'ec000000-0000-0000-0000-000000000006',
      branch_id: 'b0000000-0000-0000-0000-000000000001',
      make: 'Toyota',
      model: 'Vios XLE CVT',
      year: 2024,
      plate_number: 'DEV-VIO-11',
      vin: 'DEV17TOYOTAVIO011',
      color: 'Nebula Blue Metallic',
      transmission: 'automatic',
      fuel_type: 'petrol',
      seats: 5,
      luggage_capacity: 3,
      doors: 4,
      daily_rate: 175000,
      currency: 'PHP',
      security_deposit: 500000,
      mileage_allowance_km: 300,
      excess_mileage_rate: 1200,
      fleet_status: 'available',
      condition: 'excellent',
      odometer_km: 3800,
      fuel_level_pct: 95,
      acquisition_date: '2024-06-10',
      internal_notes: 'Economy sedan; Baan Km. 3 barangay hub.',
      location_id: '10c00000-0000-0000-0000-000000000015'
    },
    {
      id: 'a0000000-0000-0000-0000-000000000012',
      vehicle_class_id: 'ec000000-0000-0000-0000-000000000006',
      branch_id: 'b0000000-0000-0000-0000-000000000001',
      make: 'Mitsubishi',
      model: 'Mirage G4 GLS CVT',
      year: 2024,
      plate_number: 'DEV-MRG-12',
      vin: 'DEV17MITSMRG4012',
      color: 'Sterling Silver Metallic',
      transmission: 'automatic',
      fuel_type: 'petrol',
      seats: 5,
      luggage_capacity: 3,
      doors: 4,
      daily_rate: 150000,
      currency: 'PHP',
      security_deposit: 450000,
      mileage_allowance_km: 300,
      excess_mileage_rate: 1000,
      fleet_status: 'available',
      condition: 'excellent',
      odometer_km: 5100,
      fuel_level_pct: 90,
      acquisition_date: '2024-07-01',
      internal_notes: 'Compact economy; Dagohoy barangay hub.',
      location_id: '10c00000-0000-0000-0000-000000000016'
    },
    {
      id: 'a0000000-0000-0000-0000-000000000013',
      vehicle_class_id: 'ec000000-0000-0000-0000-000000000006',
      branch_id: 'b0000000-0000-0000-0000-000000000001',
      make: 'Honda',
      model: 'City RS e:HEV',
      year: 2024,
      plate_number: 'DEV-HCI-13',
      vin: 'DEV17HONDACITY013',
      color: 'Lunar Silver Metallic',
      transmission: 'automatic',
      fuel_type: 'hybrid',
      seats: 5,
      luggage_capacity: 3,
      doors: 4,
      daily_rate: 220000,
      currency: 'PHP',
      security_deposit: 600000,
      mileage_allowance_km: 350,
      excess_mileage_rate: 1500,
      fleet_status: 'available',
      condition: 'excellent',
      odometer_km: 2600,
      fuel_level_pct: 98,
      acquisition_date: '2024-07-15',
      internal_notes: 'Hybrid economy; Leon Kilat barangay hub.',
      location_id: '10c00000-0000-0000-0000-000000000017'
    }
  ]

  console.log("\nUpserting vehicles into public.vehicles...")
  const { data: vData, error: vErr } = await supabase
    .from("vehicles")
    .upsert(newVehicles, { onConflict: 'id' })
    .select()

  if (vErr) {
    console.error("Vehicles upsert error:", vErr)
    process.exit(1)
  }
  console.log(`Upserted ${vData.length} vehicles.`)

  // Step 3: Insert features
  const features = [
    { vehicle_id: 'a0000000-0000-0000-0000-000000000011', feature: 'Apple CarPlay & Android Auto' },
    { vehicle_id: 'a0000000-0000-0000-0000-000000000011', feature: 'Reverse Camera' },
    { vehicle_id: 'a0000000-0000-0000-0000-000000000011', feature: 'Toyota Safety Sense' },
    { vehicle_id: 'a0000000-0000-0000-0000-000000000011', feature: 'Automatic Climate Control' },
    { vehicle_id: 'a0000000-0000-0000-0000-000000000012', feature: 'Apple CarPlay' },
    { vehicle_id: 'a0000000-0000-0000-0000-000000000012', feature: 'Rear Parking Sensors' },
    { vehicle_id: 'a0000000-0000-0000-0000-000000000012', feature: 'MIVEC Efficient Engine' },
    { vehicle_id: 'a0000000-0000-0000-0000-000000000012', feature: 'Automatic Climate Control' },
    { vehicle_id: 'a0000000-0000-0000-0000-000000000013', feature: 'Honda SENSING Safety Suite' },
    { vehicle_id: 'a0000000-0000-0000-0000-000000000013', feature: 'Apple CarPlay & Android Auto' },
    { vehicle_id: 'a0000000-0000-0000-0000-000000000013', feature: 'e:HEV Hybrid System' },
    { vehicle_id: 'a0000000-0000-0000-0000-000000000013', feature: 'Wireless Phone Charging' },
  ]
  console.log("\nUpserting vehicle features...")
  const { error: fErr } = await supabase
    .from("vehicle_features")
    .upsert(features, { onConflict: 'vehicle_id,feature', ignoreDuplicates: true })

  if (fErr) {
    console.error("Features upsert error:", fErr)
  } else {
    console.log("Features inserted successfully.")
  }

  // Step 4: Inspect vehicle_images table structure
  const { data: sampleImg, error: sErr } = await supabase
    .from("vehicle_images")
    .select("*")
    .limit(1)
  console.log("\nSample vehicle_images row:", sampleImg)

  // Step 5: Upload images to Supabase storage bucket `vehicles-marketing`
  const uploadConfigs = [
    {
      vehicle_id: 'a0000000-0000-0000-0000-000000000011',
      file: 'vios_xle_11.jpg',
      storage_path: 'vehicle-images/a0000000-0000-0000-0000-000000000011/main.jpg',
      alt_text: 'Toyota Vios XLE CVT 2024 Sedan in Butuan City'
    },
    {
      vehicle_id: 'a0000000-0000-0000-0000-000000000012',
      file: 'mirage_g4_12.jpg',
      storage_path: 'vehicle-images/a0000000-0000-0000-0000-000000000012/main.jpg',
      alt_text: 'Mitsubishi Mirage G4 GLS CVT 2024 Sedan in Butuan City'
    },
    {
      vehicle_id: 'a0000000-0000-0000-0000-000000000013',
      file: 'honda_city_rs_13.jpg',
      storage_path: 'vehicle-images/a0000000-0000-0000-0000-000000000013/main.jpg',
      alt_text: 'Honda City RS e:HEV 2024 Sedan in Butuan City'
    }
  ]

  for (const cfg of uploadConfigs) {
    const fileBytes = fs.readFileSync(path.join(SCRATCH, cfg.file))
    console.log(`\nUploading ${cfg.file} to bucket 'vehicles-marketing' at ${cfg.storage_path}...`)
    const { error: upErr } = await supabase.storage
      .from('vehicles-marketing')
      .upload(cfg.storage_path, fileBytes, {
        contentType: 'image/jpeg',
        upsert: true
      })
    if (upErr) {
      console.error(`Upload error for ${cfg.storage_path}:`, upErr)
    } else {
      console.log(`Uploaded ${cfg.storage_path} successfully.`)
    }

    // Insert/upsert into vehicle_images
    // Delete existing images for this vehicle first to prevent duplicates
    await supabase.from("vehicle_images").delete().eq("vehicle_id", cfg.vehicle_id)

    // Check columns from sample
    const imgPayload = {
      vehicle_id: cfg.vehicle_id,
      storage_path: cfg.storage_path,
      alt_text: cfg.alt_text,
      is_primary: true
    }
    // If display_order or sort_order exists:
    if (sampleImg && sampleImg[0] && 'display_order' in sampleImg[0]) {
      imgPayload.display_order = 0
    } else if (sampleImg && sampleImg[0] && 'sort_order' in sampleImg[0]) {
      imgPayload.sort_order = 0
    }

    const { data: imgRow, error: imgErr } = await supabase
      .from("vehicle_images")
      .insert(imgPayload)
      .select()

    if (imgErr) {
      console.error(`vehicle_images insert error for ${cfg.vehicle_id}:`, imgErr)
    } else {
      console.log(`vehicle_images row inserted:`, imgRow)
    }
  }

  // Step 6: Test HTTP access for all 3 images
  console.log("\n=== TESTING PUBLIC HTTP URLS ===")
  for (const cfg of uploadConfigs) {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/vehicles-marketing/${cfg.storage_path}`
    const testRes = await fetch(publicUrl, { method: 'HEAD' })
    console.log(`URL: ${publicUrl}`)
    console.log(`HTTP status: ${testRes.status} | Content-Type: ${testRes.headers.get('content-type')} | Content-Length: ${testRes.headers.get('content-length')}`)
  }
}

main().catch(console.error)
