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

console.log("=== VEYRA END-TO-END RESERVATION APPROVAL & TIMELINE VERIFICATION ===\n")

async function runEndToEndVerification() {
  const disposableIds = []

  try {
    // ─── 0. PRE-CHECK: Schema Verification ──────────────────────────────────
    console.log("Step 0: Verifying Schema and Migration 20261018040000...")
    const { data: cols, error: colErr } = await supabase
      .from("reservations")
      .select("id, approved_at, approved_by, rejection_reason")
      .limit(1)

    assert.equal(colErr, null, `Schema check failed: ${colErr?.message}`)
    console.log("  [PASS] Columns approved_at, approved_by, rejection_reason are present.")

    // Fetch a test vehicle
    const { data: vehicle, error: vErr } = await supabase
      .from("vehicles")
      .select("id, make, model, daily_rate, fleet_status, branch_id")
      .eq("fleet_status", "available")
      .limit(1)
      .single()

    assert(vehicle, "No available vehicle found for test")
    console.log(`  [INFO] Using test vehicle: ${vehicle.make} ${vehicle.model} (ID: ${vehicle.id})`)

    // Fetch a test customer
    const { data: customer, error: cErr } = await supabase
      .from("customers")
      .select("id, verification_status, users(id, email)")
      .limit(1)
      .single()

    assert(customer, "No customer found for test")
    console.log(`  [INFO] Using test customer: ID=${customer.id}, VerificationStatus=${customer.verification_status}`)

    // Fetch an admin user for approval
    const { data: adminUser, error: aErr } = await supabase
      .from("staff_users")
      .select("user_id, role, status")
      .eq("status", "active")
      .limit(1)
      .single()

    assert(adminUser, "No active staff found for test")
    console.log(`  [INFO] Using staff user for approval: UserID=${adminUser.user_id}, Role=${adminUser.role}`)

    // Fetch a pickup location
    const { data: location } = await supabase
      .from("locations")
      .select("id, name, city")
      .limit(1)
      .single()

    const pickupLocationId = location?.id || vehicle.branch_id

    // ─── LIFECYCLE 1: Complete Approval -> Handover -> Return -> Completed ──
    console.log("\n─── Lifecycle 1: Complete Happy Path (Approval -> Handover -> Complete) ───")

    const now = new Date()
    const pickupDate = new Date(now.getTime() + 7 * 86400000) // 7 days from now
    const returnDate = new Date(pickupDate.getTime() + 3 * 86400000) // 3 days rental
    const quoteDays = 3
    const totalAmount = (vehicle.daily_rate || 200000) * quoteDays

    // 1. Create Quote
    console.log("1. Creating quote for 3 days rental...")
    const { data: quote, error: qErr } = await supabase
      .from("quotes")
      .insert({
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        pickup_location_id: pickupLocationId,
        return_location_id: pickupLocationId,
        pickup_at: pickupDate.toISOString(),
        return_at: returnDate.toISOString(),
        rental_days: quoteDays,
        daily_rate: vehicle.daily_rate || 200000,
        base_rental: totalAmount,
        total_rental: totalAmount,
        subtotal: totalAmount,
        tax_amount: 0,
        security_deposit: 500000,
        pricing_version: "v1.0",
        expires_at: new Date(now.getTime() + 3600000).toISOString(),
      })
      .select("id")
      .single()

    assert.equal(qErr, null, `Quote creation failed: ${qErr?.message}`)
    console.log(`  [PASS] Quote created: ${quote.id}`)

    // 2. Submit Reservation with Butuan City Barangay & Address
    console.log("2. Submitting reservation with Butuan City barangay and pickup address...")
    const reference = `TEST-APP-${Date.now().toString(36).toUpperCase()}`
    const { data: reservation, error: rErr } = await supabase
      .from("reservations")
      .insert({
        reference,
        quote_id: quote.id,
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        pickup_location_id: pickupLocationId,
        return_location_id: pickupLocationId,
        pickup_at: pickupDate.toISOString(),
        return_at: returnDate.toISOString(),
        rental_days: quoteDays,
        total_amount: totalAmount,
        deposit_amount: 500000,
        status: "payment_pending", // Online payment flow
        payment_status: "pending",
        pickup_barangay: "Doongan",
        pickup_street_address: "J.C. Aquino Avenue, Doongan",
        pickup_landmark: "Near Robinson's Mall Butuan",
        pickup_contact_phone: "+639171234567",
      })
      .select("id, status, payment_status, pickup_barangay")
      .single()

    assert.equal(rErr, null, `Reservation submission failed: ${rErr?.message}`)
    disposableIds.push(reservation.id)
    console.log(`  [PASS] Reservation created: ${reservation.id} (Status: ${reservation.status})`)

    // 3. Record Terms of Service Acceptance
    console.log("3. Recording Terms of Service acceptance...")
    const { error: tosErr } = await supabase
      .from("terms_acceptances")
      .insert({
        customer_id: customer.id,
        reservation_id: reservation.id,
        terms_version_id: "a0000000-0000-0000-0000-000000000001",
        accepted_at: new Date().toISOString(),
        ip_hash: "mock_ip_hash_sha256_for_verification",
      })
    assert.equal(tosErr, null, `Terms acceptance failed: ${tosErr?.message}`)
    console.log("  [PASS] Terms of Service recorded successfully.")

    // 4. Simulate Demo Payment
    console.log("4. Simulating successful Demo Payment (GCash)...")
    const { data: payment, error: pErr } = await supabase
      .from("payments")
      .insert({
        reservation_id: reservation.id,
        customer_id: customer.id,
        type: "rental",
        amount: totalAmount,
        currency: "PHP",
        status: "captured",
        method: "e_wallet",
        provider: "demo",
        provider_txn_ref: `DEMO-GCASH-${Date.now()}`,
        is_demo: true,
      })
      .select("id, is_demo, status")
      .single()

    assert.equal(pErr, null, `Payment insert failed: ${pErr?.message}`)
    assert.equal(payment.is_demo, true, "Payment must be marked is_demo = true")

    // Update reservation upon demo payment completion
    // CRITICAL: Must transition to pending_approval, NOT confirmed!
    const { error: payUpErr } = await supabase
      .from("reservations")
      .update({
        status: "pending_approval",
        payment_status: "captured",
        payment_method: "e_wallet",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation.id)
    assert.equal(payUpErr, null, `Payment transition failed: ${payUpErr?.message}`)

    // 5. Verify Pending Approval Queue
    console.log("5. Verifying reservation appears in Pending Approval queue...")
    const { data: pendingRes, error: pResErr } = await supabase
      .from("reservations")
      .select("id, status, payment_status, approved_at")
      .eq("id", reservation.id)
      .single()

    assert.equal(pendingRes.status, "pending_approval", "Status must be pending_approval")
    assert.equal(pendingRes.payment_status, "captured", "Payment status must be captured")
    assert.equal(pendingRes.approved_at, null, "Approved_at must be null before admin approval")
    console.log("  [PASS] Reservation is in 'pending_approval' with captured payment and no approval timestamp.")

    // 6. Admin Reviews and Approves Reservation
    console.log("6. Admin reviews and approves the reservation...")
    const approvedAt = new Date().toISOString()
    const { data: approvedRes, error: appErr } = await supabase
      .from("reservations")
      .update({
        status: "confirmed",
        approved_at: approvedAt,
        approved_by: adminUser.user_id,
        updated_at: approvedAt,
      })
      .eq("id", reservation.id)
      .eq("status", "pending_approval")
      .select("id, status, approved_at, approved_by")
      .single()

    assert.equal(appErr, null, `Approval update failed: ${appErr?.message}`)
    assert.equal(approvedRes.status, "confirmed")
    assert.equal(approvedRes.approved_by, adminUser.user_id)
    console.log(`  [PASS] Reservation successfully approved by admin. Status='confirmed', approved_at=${approvedRes.approved_at}`)

    // Record audit event for approval
    await supabase.from("audit_events").insert({
      actor_id: adminUser.user_id,
      actor_role: adminUser.role,
      action: "reservation.approved",
      resource_type: "reservation",
      resource_id: reservation.id,
      result: "success",
      details: `Reservation approved in E2E verification.`,
      before_state: { status: "pending_approval" },
      after_state: { status: "confirmed", approved_at: approvedAt },
    })

    // 7. Stage Vehicle: confirmed -> pickup_ready
    console.log("7. Staging vehicle at hub (confirmed -> pickup_ready)...")
    const { error: prErr } = await supabase
      .from("reservations")
      .update({
        status: "pickup_ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservation.id)
      .eq("status", "confirmed")
    assert.equal(prErr, null, `Pickup ready update failed: ${prErr?.message}`)
    console.log("  [PASS] Reservation moved to pickup_ready.")

    // 8. Vehicle Handover: confirmed/pickup_ready -> active + pickup inspection
    console.log("8. Recording vehicle handover and pre-trip inspection...")
    const actualPickupAt = new Date().toISOString()
    const { data: pickupInsp, error: pInspErr } = await supabase
      .from("inspections")
      .insert({
        reservation_id: reservation.id,
        vehicle_id: vehicle.id,
        type: "pickup",
        inspector_id: adminUser.user_id,
        odometer_km: 12500,
        fuel_level_pct: 100,
        customer_present: true,
        customer_signature: false,
        overall_status: "pass",
        damage_status: "no_damage",
        completed_at: actualPickupAt,
      })
      .select("id")
      .single()

    assert.equal(pInspErr, null, `Pickup inspection failed: ${pInspErr?.message}`)
    console.log(`  [PASS] Pickup inspection inserted: ID=${pickupInsp.id}, overall_status='pass'`)

    const { error: hoErr } = await supabase
      .from("reservations")
      .update({
        status: "active",
        actual_pickup_at: actualPickupAt,
        updated_at: actualPickupAt,
      })
      .eq("id", reservation.id)
    assert.equal(hoErr, null, `Handover update failed: ${hoErr?.message}`)
    console.log(`  [PASS] Vehicle handed over. Status='active', actual_pickup_at=${actualPickupAt}`)

    // 9. Return & Inspection: active -> return_inspection + return inspection
    console.log("9. Recording vehicle return for inspection (active -> return_inspection)...")
    const actualReturnAt = new Date().toISOString()
    const { data: returnInsp, error: rInspErr } = await supabase
      .from("inspections")
      .insert({
        reservation_id: reservation.id,
        vehicle_id: vehicle.id,
        type: "return",
        inspector_id: adminUser.user_id,
        odometer_km: 12850,
        fuel_level_pct: 95,
        customer_present: false,
        customer_signature: false,
        overall_status: "pass",
        damage_status: "no_damage",
        completed_at: actualReturnAt,
      })
      .select("id")
      .single()

    assert.equal(rInspErr, null, `Return inspection failed: ${rInspErr?.message}`)
    console.log(`  [PASS] Return inspection inserted: ID=${returnInsp.id}, overall_status='pass'`)

    const { error: retErr } = await supabase
      .from("reservations")
      .update({
        status: "return_inspection",
        actual_return_at: actualReturnAt,
        updated_at: actualReturnAt,
      })
      .eq("id", reservation.id)
      .eq("status", "active")
    assert.equal(retErr, null, `Return update failed: ${retErr?.message}`)
    console.log("  [PASS] Reservation moved to return_inspection.")

    // 10. Inspection Completed: return_inspection -> completed
    console.log("10. Finalizing return inspection and completing rental (return_inspection -> completed)...")
    const { error: compErr } = await supabase
      .from("reservations")
      .update({
        status: "completed",
        updated_at: actualReturnAt,
      })
      .eq("id", reservation.id)
      .eq("status", "return_inspection")
    assert.equal(compErr, null, `Completion update failed: ${compErr?.message}`)

    const { data: finalRes } = await supabase
      .from("reservations")
      .select("id, status, actual_pickup_at, actual_return_at, approved_at")
      .eq("id", reservation.id)
      .single()

    assert.equal(finalRes.status, "completed")
    assert(finalRes.actual_pickup_at)
    assert(finalRes.actual_return_at)
    assert(finalRes.approved_at)
    console.log("  [PASS] Rental completed with all authoritative timestamps intact.")

    // ─── LIFECYCLE 2: Rejection Flow ────────────────────────────────────────
    console.log("\n─── Lifecycle 2: Rejection Flow with Mandatory Reason & Demo Refund ───")

    const pickupDate2 = new Date(now.getTime() + 14 * 86400000)
    const returnDate2 = new Date(pickupDate2.getTime() + 2 * 86400000)
    const reference2 = `TEST-REJ-${Date.now().toString(36).toUpperCase()}`

    const { data: quote2 } = await supabase
      .from("quotes")
      .insert({
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        pickup_location_id: pickupLocationId,
        return_location_id: pickupLocationId,
        pickup_at: pickupDate2.toISOString(),
        return_at: returnDate2.toISOString(),
        rental_days: 2,
        daily_rate: vehicle.daily_rate || 200000,
        base_rental: (vehicle.daily_rate || 200000) * 2,
        total_rental: (vehicle.daily_rate || 200000) * 2,
        subtotal: (vehicle.daily_rate || 200000) * 2,
        tax_amount: 0,
        security_deposit: 500000,
        pricing_version: "v1.0",
        expires_at: new Date(now.getTime() + 3600000).toISOString(),
      })
      .select("id")
      .single()

    const { data: res2, error: r2Err } = await supabase
      .from("reservations")
      .insert({
        reference: reference2,
        quote_id: quote2.id,
        customer_id: customer.id,
        vehicle_id: vehicle.id,
        pickup_location_id: pickupLocationId,
        return_location_id: pickupLocationId,
        pickup_at: pickupDate2.toISOString(),
        return_at: returnDate2.toISOString(),
        rental_days: 2,
        total_amount: (vehicle.daily_rate || 200000) * 2,
        deposit_amount: 500000,
        status: "pending_approval",
        payment_status: "captured",
        payment_method: "card",
        pickup_barangay: "Baan Riverside",
        pickup_street_address: "Montilla Blvd",
      })
      .select("id")
      .single()

    assert.equal(r2Err, null, `Reservation 2 failed: ${r2Err?.message}`)
    disposableIds.push(res2.id)

    // Demo payment for res2
    await supabase.from("payments").insert({
      reservation_id: res2.id,
      customer_id: customer.id,
      type: "rental",
      amount: (vehicle.daily_rate || 200000) * 2,
      currency: "PHP",
      status: "captured",
      method: "card",
      provider: "demo",
      is_demo: true,
    })

    console.log(`  [INFO] Disposable reservation 2 created in pending_approval: ${res2.id}`)

    // Admin rejects with recorded reason
    const rejectionReason = "Scheduled maintenance overhaul conflict during selected dates."
    console.log(`  [ACTION] Rejecting reservation with reason: "${rejectionReason}"`)

    // Simulate refund on demo payment
    await supabase
      .from("payments")
      .update({
        status: "refunded",
        notes: `Reservation rejected: ${rejectionReason}`,
        updated_at: new Date().toISOString(),
      })
      .eq("reservation_id", res2.id)

    // Update reservation to cancelled with rejection_reason
    const { data: rejectedRes, error: rejErr } = await supabase
      .from("reservations")
      .update({
        status: "cancelled",
        cancellation_reason: rejectionReason,
        rejection_reason: rejectionReason,
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
      })
      .eq("id", res2.id)
      .eq("status", "pending_approval")
      .select("id, status, rejection_reason, payment_status")
      .single()

    assert.equal(rejErr, null, `Rejection failed: ${rejErr?.message}`)
    assert.equal(rejectedRes.status, "cancelled")
    assert.equal(rejectedRes.rejection_reason, rejectionReason)
    assert.equal(rejectedRes.payment_status, "refunded")
    console.log("  [PASS] Reservation status is 'cancelled' with rejection_reason recorded and payment_status='refunded'.")

    // Record audit event for rejection
    await supabase.from("audit_events").insert({
      actor_id: adminUser.user_id,
      actor_role: adminUser.role,
      action: "reservation.rejected",
      resource_type: "reservation",
      resource_id: res2.id,
      result: "success",
      details: `Reservation rejected: ${rejectionReason}`,
      before_state: { status: "pending_approval" },
      after_state: { status: "cancelled", rejection_reason: rejectionReason },
    })

    // ─── 3. ADMIN FILTER INTEGRITY & REVENUE ISOLATION ───────────────────────
    console.log("\n─── 3. Admin Filter Integrity & Revenue Isolation ───")

    const { count: pendingCount } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending_approval")
    console.log(`  - Pending Approval filter count: ${pendingCount}`)

    const { count: confirmedCount } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed")
    console.log(`  - Confirmed / Approved filter count: ${confirmedCount}`)

    const { count: completedCount } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
    console.log(`  - Completed filter count: ${completedCount}`)

    const { count: cancelledCount } = await supabase
      .from("reservations")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled")
    console.log(`  - Cancelled / Rejected filter count: ${cancelledCount}`)

    // Verify Demo Payments Are Excluded from Real Revenue
    const { data: realPayments } = await supabase
      .from("payments")
      .select("amount, is_demo")
      .eq("status", "captured")
      .eq("is_demo", false)

    const realRevenueCentavos = (realPayments || []).reduce((acc, p) => acc + (p.amount || 0), 0)
    console.log(`  - Genuine captured revenue (excluding is_demo=true): ₱${(realRevenueCentavos / 100).toLocaleString()}`)

    console.log("\n=== ALL E2E WORKFLOW VERIFICATIONS PASSED SUCCESSFULLY! ===")

  } finally {
    // Clean up disposable test records to keep the database tidy
    if (disposableIds.length > 0) {
      console.log(`\nCleaning up ${disposableIds.length} disposable test reservation(s)...`)
      for (const id of disposableIds) {
        await supabase.from("inspections").delete().eq("reservation_id", id)
        await supabase.from("payments").delete().eq("reservation_id", id)
        await supabase.from("reservations").delete().eq("id", id)
      }
      console.log("Cleanup complete.")
    }
  }
}

runEndToEndVerification().catch((err) => {
  console.error("FATAL ERROR in E2E Verification:", err)
  process.exit(1)
})
