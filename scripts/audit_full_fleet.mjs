import fs from "node:fs"
import { createClient } from "@supabase/supabase-js"

if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) process.env[match[1].trim()] = match[2].trim()
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ujzaewrcjhlwpxkyfbeb.supabase.co"
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!SUPABASE_KEY) {
  console.error("Missing SUPABASE credentials in environment or .env.local")
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function main() {
  const { data: vehicles, error: vErr } = await supabase
    .from("vehicles")
    .select("id, make, model, year, plate_number, daily_rate, fleet_status")
    .order("id")

  if (vErr) {
    console.error("Error fetching vehicles:", vErr)
    process.exit(1)
  }

  const { data: images, error: iErr } = await supabase
    .from("vehicle_images")
    .select("id, vehicle_id, storage_path, is_primary, alt_text")
    .order("vehicle_id")

  if (iErr) {
    console.error("Error fetching images:", iErr)
    process.exit(1)
  }

  console.log(`\n================== FULL FLEET AUDIT (${vehicles.length} VEHICLES) ==================`)
  console.log(`Total Vehicles: ${vehicles.length}`)
  console.log(`Total Image Rows: ${images.length}\n`)

  const results = []

  for (const v of vehicles) {
    const vImages = images.filter(img => img.vehicle_id === v.id)
    const primaryImg = vImages.find(img => img.is_primary) || vImages[0]
    let httpStatus = "NONE"
    let contentLength = "0"

    if (primaryImg) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/vehicles-marketing/${primaryImg.storage_path}`
      try {
        const headRes = await fetch(publicUrl, { method: "HEAD" })
        httpStatus = headRes.status.toString()
        contentLength = headRes.headers.get("content-length") || "?"
      } catch (e) {
        httpStatus = `ERR: ${e.message}`
      }
    }

    results.push({
      id: v.id,
      name: `${v.year} ${v.make} ${v.model}`,
      plate: v.plate_number,
      rate: `PHP ${(v.daily_rate / 100).toLocaleString()}`,
      status: v.fleet_status,
      hasImageRow: vImages.length > 0 ? "YES" : "NO",
      imageCount: vImages.length,
      storagePath: primaryImg ? primaryImg.storage_path : "NONE",
      httpStatus,
      contentLength
    })
  }

  console.table(results)

  const missingImages = results.filter(r => r.hasImageRow === "NO" || r.httpStatus !== "200")
  if (missingImages.length === 0) {
    console.log("\nALL VEHICLES HAVE VALID, HTTP 200 IMAGES!")
  } else {
    console.log(`\nWARNING: ${missingImages.length} vehicles have missing or broken images:`, missingImages)
  }
}

main().catch(console.error)
