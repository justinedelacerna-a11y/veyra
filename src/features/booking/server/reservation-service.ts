import "server-only"
import { auth, currentUser } from "@clerk/nextjs/server"
import { createServiceClient } from "@/lib/supabase/server"
import { checkVehicleAvailability } from "@/features/vehicles/server"
import { calculateQuote } from "./quote-service"
import { getRentalDurationConfig } from "@/features/admin/server/settings-service"
import { validatePickupLocation } from "@/features/locations/data/butuan-city-data"
import type { DriverDetails } from "../types"

export interface CreateReservationParams {
  vehicleId: string
  pickupLocationId: string
  returnLocationId: string
  pickupAt: string | Date
  returnAt: string | Date
  selectedExtraIds?: string[]
  quoteId?: string
  driver: DriverDetails
  paymentMethod?: "card" | "e-wallet" | "counter"
  initialStatus?: "held" | "confirmed"
  pickupBarangay?: string
  pickupStreetAddress?: string
  pickupLandmark?: string
  pickupContactPhone?: string
  agreedToTerms?: boolean
  ipHash?: string
}

export type ReservationResult =
  | {
      success: true
      reservationId: string
      reference: string
      quoteId: string
      totalAmountCentavos: number
      depositAmountCentavos: number
      status: string
    }
  | {
      success: false
      error:
        | "unauthorized"
        | "customer_not_found"
        | "invalid_dates"
        | "invalid_location"
        | "vehicle_unavailable"
        | "quote_expired"
        | "conflict"
        | "database_error"
        | "kyc_unverified"
        | "terms_required"
      message: string
      conflict?: string
    }

/**
 * In-memory concurrency locks per vehicle ID.
 * Prevents race conditions when two concurrent requests arrive simultaneously
 * for the same physical vehicle on this server node.
 */
class VehicleLockManager {
  private locks = new Map<string, Promise<void>>()

  async acquire<T>(vehicleId: string, fn: () => Promise<T>): Promise<T> {
    while (this.locks.has(vehicleId)) {
      await this.locks.get(vehicleId)
    }

    let resolveLock!: () => void
    const lockPromise = new Promise<void>((resolve) => {
      resolveLock = resolve
    })
    this.locks.set(vehicleId, lockPromise)

    try {
      return await fn()
    } finally {
      this.locks.delete(vehicleId)
      resolveLock()
    }
  }
}

const vehicleLocks = new VehicleLockManager()

/**
 * Generate a unique, professional Veyra booking reference.
 * Format: VYR-YYYY-XXXX (e.g. VYR-2026-K9X2)
 */
function generateBookingReference(): string {
  const year = new Date().getFullYear()
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Exclude ambiguous chars (I, 1, O, 0)
  let code = ""
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `VYR-${year}-${code}`
}

/**
 * Authoritative Server-Side Reservation Creation
 *
 * Security & Integrity Guarantees:
 * 1. Customer must be authenticated via Clerk.
 * 2. Resolves or initializes customer record in public.customers.
 * 3. Atomic double-checked concurrency locking:
 *    - In-process mutex per vehicle serializes simultaneous requests.
 *    - Re-checks availability within the critical section.
 *    - Post-insert overlap verification detects and rolls back any collision.
 * 4. Prices are NEVER accepted from client; always derived from authoritative quote.
 * 5. Uses standard PostgreSQL schemas (quotes, reservations, reservation_extras, reservation_drivers).
 */
export async function createReservation(
  params: CreateReservationParams
): Promise<ReservationResult> {
  // 1. Authenticate customer
  const authState = await auth()
  const clerkUserId = authState.userId

  if (!clerkUserId) {
    return {
      success: false,
      error: "unauthorized",
      message: "You must be signed in to create a vehicle reservation.",
    }
  }

  const supabase = createServiceClient()

  // 2. Resolve internal user and customer
  let { data: dbUser } = await supabase
    .from("users")
    .select("id, email")
    .eq("clerk_id", clerkUserId)
    .single()

  if (!dbUser) {
    // If webhook hasn't synced yet, resolve user details from Clerk SDK and sync
    const clerkUser = await currentUser()
    const email =
      clerkUser?.emailAddresses?.[0]?.emailAddress || "user@veyra.local"

    const { data: newUser, error: uErr } = await supabase
      .from("users")
      .insert({
        clerk_id: clerkUserId,
        email,
        email_verified: true,
        user_type: "customer",
        status: "active",
      })
      .select("id, email")
      .single()

    if (uErr || !newUser) {
      console.error("[reservation-service] user sync error:", uErr?.message)
      return {
        success: false,
        error: "database_error",
        message: "Failed to resolve your customer account.",
      }
    }
    dbUser = newUser
  }

  // Resolve customer record
  let { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", dbUser.id)
    .single()

  if (!customer) {
    const clerkUser = await currentUser()
    const firstName = clerkUser?.firstName || params.driver.firstName || "Customer"
    const lastName = clerkUser?.lastName || params.driver.lastName || "User"

    const membershipNumber = `VYR-CUS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
    const { data: newCustomer, error: cErr } = await supabase
      .from("customers")
      .insert({
        user_id: dbUser.id,
        first_name: firstName,
        last_name: lastName,
        membership_number: membershipNumber,
        membership_tier: "standard",
      })
      .select("id")
      .single()

    if (cErr || !newCustomer) {
      console.error("[reservation-service] customer creation error:", cErr?.message)
      return {
        success: false,
        error: "database_error",
        message: "Failed to initialize customer profile.",
      }
    }
    customer = newCustomer
  }

  const customerId = customer.id
  const { vehicleId } = params

  // 2b. Enforce Terms of Service acceptance server-side
  if (params.agreedToTerms !== true) {
    return {
      success: false,
      error: "terms_required",
      message: "You must read and agree to Veyra's Terms of Service to confirm a reservation.",
    }
  }

  // 2c. Enforce Butuan City service boundary and pickup feasibility
  if (params.pickupStreetAddress || params.pickupBarangay) {
    const locValidation = validatePickupLocation({
      barangay: params.pickupBarangay,
      streetAddress: params.pickupStreetAddress,
    })

    if (!locValidation.isValid || !locValidation.isFeasible) {
      return {
        success: false,
        error: "invalid_location",
        message:
          locValidation.reason ||
          "Requested pickup location is outside Veyra's Butuan City service boundary.",
      }
    }
  }

  // 3. Execute reservation creation within per-vehicle mutex
  return await vehicleLocks.acquire(vehicleId, async (): Promise<ReservationResult> => {
    const pickupAt = new Date(params.pickupAt)
    const returnAt = new Date(params.returnAt)

    if (isNaN(pickupAt.getTime()) || isNaN(returnAt.getTime()) || pickupAt >= returnAt) {
      return {
        success: false,
        error: "invalid_dates",
        message: "Invalid reservation dates provided.",
      }
    }

    // Enforce configured rental duration limits server-side
    const durationConfig = await getRentalDurationConfig()
    const diffMs = returnAt.getTime() - pickupAt.getTime()
    const estimatedDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    if (estimatedDays < durationConfig.minDays) {
      return {
        success: false,
        error: "invalid_dates",
        message: `Minimum rental duration is ${durationConfig.minDays} day${durationConfig.minDays !== 1 ? "s" : ""}.`,
      }
    }

    if (durationConfig.maxDays !== null && estimatedDays > durationConfig.maxDays) {
      return {
        success: false,
        error: "invalid_dates",
        message: `Maximum rental duration is ${durationConfig.maxDays} days.`,
      }
    }

    const pickupIso = pickupAt.toISOString()
    const returnIso = returnAt.toISOString()

    // 4. Critical Section Availability Re-check
    const availability = await checkVehicleAvailability({
      vehicleId,
      pickupAt,
      returnAt,
    })

    if (!availability.available) {
      return {
        success: false,
        error: "vehicle_unavailable",
        message: "This vehicle is no longer available for the selected dates.",
        conflict: availability.conflict,
      }
    }

    // 5. Authoritative Quote Resolution
    let quoteId = params.quoteId
    let totalRentalCentavos = 0
    let depositAmountCentavos = 0
    let rentalDays = 1
    let resolvedExtras: Array<{ id: string; name: string; dailyRateCentavos: number; totalCentavos: number }> = []

    if (quoteId) {
      // Validate existing quote
      const { data: existingQuote } = await supabase
        .from("quotes")
        .select("*")
        .eq("id", quoteId)
        .eq("customer_id", customerId)
        .eq("vehicle_id", vehicleId)
        .single()

      const isExpired =
        existingQuote &&
        (new Date(existingQuote.expires_at).getTime() < Date.now() ||
          existingQuote.status !== "active")

      if (!existingQuote || isExpired) {
        // Fall back to generating a fresh quote
        quoteId = undefined
      } else {
        totalRentalCentavos = Number(existingQuote.total_rental)
        depositAmountCentavos = Number(existingQuote.security_deposit)
        rentalDays = existingQuote.rental_days

        const { data: qExtras } = await supabase
          .from("quote_extras")
          .select("extra_id, extra_name, daily_rate, total")
          .eq("quote_id", quoteId)

        if (qExtras) {
          resolvedExtras = qExtras.map((qe) => ({
            id: qe.extra_id,
            name: qe.extra_name,
            dailyRateCentavos: Number(qe.daily_rate),
            totalCentavos: Number(qe.total),
          }))
        }
      }
    }

    // If no valid quote was provided or it expired, calculate and persist a fresh quote now
    if (!quoteId) {
      const quoteRes = await calculateQuote({
        vehicleId,
        pickupAt,
        returnAt,
        pickupLocationId: params.pickupLocationId,
        returnLocationId: params.returnLocationId,
        selectedExtraIds: params.selectedExtraIds,
        customerId,
        persist: true,
      })

      if (!quoteRes.success) {
        return {
          success: false,
          error: "vehicle_unavailable",
          message: quoteRes.message,
          conflict: quoteRes.conflict,
        }
      }

      quoteId = quoteRes.quote.quoteId!
      totalRentalCentavos = quoteRes.quote.totalRentalCentavos
      depositAmountCentavos = quoteRes.quote.securityDepositCentavos
      rentalDays = quoteRes.quote.rentalDays
      resolvedExtras = quoteRes.quote.selectedExtras.map((e) => ({
        id: e.id,
        name: e.name,
        dailyRateCentavos: e.dailyRateCentavos,
        totalCentavos: e.totalCentavos,
      }))
    }

    // 6. Map payment method to database CHECK constraint enum
    let dbPaymentMethod: "card" | "e_wallet" | "counter" = "card"
    if (params.paymentMethod === "e-wallet") dbPaymentMethod = "e_wallet"
    else if (params.paymentMethod === "counter") dbPaymentMethod = "counter"

    // 7. Generate unique reservation reference
    let reference = generateBookingReference()
    let isUnique = false
    for (let attempts = 0; attempts < 5; attempts++) {
      const { data: existingRef } = await supabase
        .from("reservations")
        .select("id")
        .eq("reference", reference)
        .maybeSingle()

      if (!existingRef) {
        isUnique = true
        break
      }
      reference = generateBookingReference()
    }

    if (!isUnique) {
      reference = `VYR-${Date.now().toString(36).toUpperCase()}`
    }

    const holdExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15-min TTL

    const targetStatus =
      params.initialStatus ||
      (process.env.PAYMENTS_ENABLED === "true" && dbPaymentMethod !== "counter"
        ? "held"
        : "confirmed")

    // 7b. Server-Side KYC Gate: If finalizing a confirmed booking, enforce customer verification
    if (targetStatus === "confirmed") {
      const { data: customerRow } = await supabase
        .from("customers")
        .select("verification_status")
        .eq("id", customerId)
        .single()

      const { data: approvedDl } = await supabase
        .from("customer_documents")
        .select("id")
        .eq("customer_id", customerId)
        .eq("type", "driver_license")
        .eq("status", "approved")
        .maybeSingle()

      const isKycVerified =
        customerRow?.verification_status === "verified" || Boolean(approvedDl)

      if (!isKycVerified) {
        const kycStatus = customerRow?.verification_status || "not_submitted"
        return {
          success: false,
          error: "kyc_unverified",
          message:
            kycStatus === "pending"
              ? "Your driver verification is currently under review by our operations team. You cannot finalize a confirmed rental until approved."
              : kycStatus === "rejected"
              ? "Your driver verification was rejected. Please review feedback and resubmit your documents in your account before confirming."
              : "Driver verification is required before confirming a rental reservation. Please complete identity verification in your account.",
        }
      }
    }

    // 8. Insert Reservation Record
    let { data: reservation, error: rErr } = await supabase
      .from("reservations")
      .insert({
        reference,
        customer_id: customerId,
        quote_id: quoteId,
        vehicle_id: vehicleId,
        pickup_location_id: params.pickupLocationId,
        return_location_id: params.returnLocationId,
        pickup_at: pickupIso,
        return_at: returnIso,
        rental_days: rentalDays,
        hold_expires_at: holdExpiresAt,
        status: targetStatus,
        payment_status: "pending",
        payment_method: dbPaymentMethod,
        total_amount: totalRentalCentavos,
        deposit_amount: depositAmountCentavos,
        currency: "PHP",
        pickup_barangay: params.pickupBarangay || null,
        pickup_street_address: params.pickupStreetAddress || null,
        pickup_landmark: params.pickupLandmark || null,
        pickup_contact_phone: params.pickupContactPhone || null,
      })
      .select("id, reference, status")
      .single()

    // Graceful backward compatibility if remote database has not yet applied the pickup_barangay column migration
    if (rErr && rErr.message?.includes("pickup_barangay")) {
      const fallbackStreetAddress =
        params.pickupBarangay && !params.pickupStreetAddress?.includes(params.pickupBarangay)
          ? `[Barangay: ${params.pickupBarangay}] ${params.pickupStreetAddress || ""}`.trim()
          : params.pickupStreetAddress || null

      const fallbackInsert = await supabase
        .from("reservations")
        .insert({
          reference,
          customer_id: customerId,
          quote_id: quoteId,
          vehicle_id: vehicleId,
          pickup_location_id: params.pickupLocationId,
          return_location_id: params.returnLocationId,
          pickup_at: pickupIso,
          return_at: returnIso,
          rental_days: rentalDays,
          hold_expires_at: holdExpiresAt,
          status: targetStatus,
          payment_status: "pending",
          payment_method: dbPaymentMethod,
          total_amount: totalRentalCentavos,
          deposit_amount: depositAmountCentavos,
          currency: "PHP",
          pickup_street_address: fallbackStreetAddress,
          pickup_landmark: params.pickupLandmark || null,
          pickup_contact_phone: params.pickupContactPhone || null,
        })
        .select("id, reference, status")
        .single()

      reservation = fallbackInsert.data
      rErr = fallbackInsert.error
    }

    if (rErr || !reservation) {
      console.error("[reservation-service] reservation insert error:", rErr?.message)
      return {
        success: false,
        error: "database_error",
        message: "Failed to record reservation in database.",
      }
    }

    // 9. Post-Insert Concurrency Double-Check
    // Verifies no overlapping reservation was committed during this transaction
    const { data: collisions, error: colErr } = await supabase
      .from("reservations")
      .select("id")
      .eq("vehicle_id", vehicleId)
      .neq("id", reservation.id)
      .not("status", "in", "(cancelled,no_show,expired,payment_failed,completed,draft)")
      .lt("pickup_at", returnIso)
      .gt("return_at", pickupIso)
      .limit(1)

    if (colErr || (collisions && collisions.length > 0)) {
      // Overlap collision detected — roll back by deleting newly created reservation
      console.warn(
        `[reservation-service] Overlap collision detected for vehicle ${vehicleId}. Rolling back reservation ${reservation.id}.`
      )
      await supabase.from("reservations").delete().eq("id", reservation.id)

      return {
        success: false,
        error: "conflict",
        message: "Vehicle was reserved by another customer just now. Please select alternative dates or vehicles.",
        conflict: "reservation_conflict",
      }
    }

    // 10. Insert reservation extras
    if (resolvedExtras.length > 0) {
      const extraRows = resolvedExtras.map((ext) => ({
        reservation_id: reservation.id,
        extra_id: ext.id,
        extra_name: ext.name,
        daily_rate: ext.dailyRateCentavos,
        total: ext.totalCentavos,
      }))
      await supabase.from("reservation_extras").insert(extraRows)
    }

    // 11. Insert primary driver details
    if (params.driver && params.driver.firstName) {
      const birthDate = params.driver.birthDate
        ? params.driver.birthDate.split("T")[0]
        : "1995-01-01"

      await supabase.from("reservation_drivers").insert({
        reservation_id: reservation.id,
        first_name: params.driver.firstName,
        last_name: params.driver.lastName,
        email: params.driver.email || null,
        phone: params.driver.phone || null,
        date_of_birth: birthDate,
        license_number: params.driver.licenseNumber || "UNPROVIDED",
        license_country: "PH",
        is_primary: true,
      })
    }

    // 12. Convert quote status
    await supabase
      .from("quotes")
      .update({ status: "converted" })
      .eq("id", quoteId)

    // 13. Record Terms of Service acceptance for this reservation
    try {
      const { data: currentTerms } = await supabase
        .from("terms_versions")
        .select("id")
        .eq("is_current", true)
        .maybeSingle()

      if (currentTerms) {
        await supabase.from("terms_acceptances").insert({
          customer_id: customerId,
          terms_version_id: currentTerms.id,
          reservation_id: reservation.id,
          ip_hash: params.ipHash || null,
          accepted_at: new Date().toISOString(),
        })
      }
    } catch (termsErr) {
      console.warn("[reservation-service] non-critical terms_acceptance record error:", termsErr)
    }

    return {
      success: true,
      reservationId: reservation.id,
      reference: reservation.reference,
      quoteId,
      totalAmountCentavos: totalRentalCentavos,
      depositAmountCentavos,
      status: reservation.status,
    }
  })
}
