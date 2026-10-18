import { createClient } from "@supabase/supabase-js"
import assert from "node:assert/strict"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE env variables.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

console.log("================================================================================")
console.log("   VEYRA — CAPSTONE PRESENTATION DEMO DATA STAGING & VERIFICATION")
console.log("================================================================================\n")

async function stageDemoData() {
  console.log("1. Inspecting authorized accounts...")
  
  // Verify superadmin account
  const { data: superadmin } = await supabase
    .from("staff_users")
    .select("user_id, role, status, users(email)")
    .eq("role", "superadmin")
    .eq("status", "active")
    .limit(1)
    .single()

  assert(superadmin, "Active superadmin account must exist")
  console.log(`   - Authorized Superadmin: ${superadmin.users?.email} (User ID: ${superadmin.user_id})`)

  // Verify staff admin account
  const { data: adminStaff } = await supabase
    .from("staff_users")
    .select("user_id, role, status, users(email)")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle()
  if (adminStaff) {
    console.log(`   - Authorized Branch Admin: ${adminStaff.users?.email}`)
  }

  // Verify customer accounts
  const { data: customers } = await supabase
    .from("customers")
    .select("id, user_id, first_name, last_name, verification_status, users(email)")
    .limit(3)

  assert(customers && customers.length > 0, "At least one customer account must exist")
  console.log(`   - Primary Customer: ${customers[0].first_name} ${customers[0].last_name} (${customers[0].users?.email}, Status: ${customers[0].verification_status})`)

  console.log("\n2. Checking fleet availability for demonstration...")
  const { data: availableVehicles } = await supabase
    .from("vehicles")
    .select("id, make, model, year, daily_rate, fleet_status")
    .eq("fleet_status", "available")

  assert(availableVehicles && availableVehicles.length > 0, "At least one vehicle must be available for live demonstration")
  console.log(`   - Found ${availableVehicles.length} available vehicle(s) ready for booking demonstration:`)
  availableVehicles.slice(0, 3).forEach((v) => {
    console.log(`     * ${v.year} ${v.make} ${v.model} (₱${(v.daily_rate / 100).toLocaleString()}/day)`)
  })

  console.log("\n3. Verifying Butuan City hubs & locations...")
  const { data: hubs } = await supabase.from("locations").select("id, name, barangay").eq("status", "active")
  assert(hubs && hubs.length === 8, "All 8 Butuan City hubs must be active")
  console.log(`   - Verified 8 active hubs across Butuan City.`)

  console.log("\n4. Checking staging reservations for presentation...")
  const { data: confirmedRes } = await supabase
    .from("reservations")
    .select("id, reference, status, vehicle_id, customer_id")
    .in("status", ["confirmed", "pickup_ready"])
    .limit(1)
    .maybeSingle()

  if (confirmedRes) {
    console.log(`   - Pre-staged Confirmed/Ready reservation for Handover Demo: ${confirmedRes.reference} (Status: ${confirmedRes.status})`)
  } else {
    console.log(`   - Note: Fresh booking during presentation will naturally enter pending_approval for live approval & handover.`)
  }

  console.log("\n================================================================================")
  console.log("   DEMO DATA AND ACCOUNTS READY FOR 10-15 MINUTE CAPSTONE DEFENSE")
  console.log("================================================================================")
}

stageDemoData().catch((err) => {
  console.error("Demo data staging error:", err)
  process.exit(1)
})
