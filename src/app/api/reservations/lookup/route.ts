import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createServiceClient } from "@/lib/supabase/server"

/**
 * GET /api/reservations/lookup?ref=VYR-XXXX-XXXX
 *
 * Authoritatively retrieves customer reservation details and payment status directly
 * from the database ledger. Never trusts frontend messages or redirects.
 *
 * Security:
 * - Requires authenticated Clerk user.
 * - Enforces customer ownership: user can only look up reservations that belong to their customer ID.
 */
export async function GET(request: NextRequest) {
  try {
    const authState = await auth()
    const clerkUserId = authState.userId

    if (!clerkUserId) {
      return NextResponse.json(
        { success: false, error: "unauthorized", message: "Authentication required." },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const reference = searchParams.get("ref")

    if (!reference) {
      return NextResponse.json(
        { success: false, error: "missing_reference", message: "Reservation reference is required." },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // 1. Resolve customer
    const { data: dbUser } = await supabase
      .from("users")
      .select("id, user_type")
      .eq("clerk_id", clerkUserId)
      .maybeSingle()

    if (!dbUser) {
      return NextResponse.json(
        { success: false, error: "user_not_found", message: "User record not found." },
        { status: 404 }
      )
    }

    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", dbUser.id)
      .maybeSingle()

    const isStaff = dbUser.user_type === "staff" || dbUser.user_type === "superadmin"

    // 2. Fetch reservation with vehicle and location relations
    const { data: reservation, error: resErr } = await supabase
      .from("reservations")
      .select(`
        id,
        reference,
        status,
        payment_status,
        payment_method,
        total_amount,
        deposit_amount,
        currency,
        rental_days,
        pickup_at,
        return_at,
        customer_id,
        pickup_street_address,
        pickup_landmark,
        pickup_barangay,
        created_at,
        vehicles (
          id,
          make,
          model,
          year,
          category
        ),
        pickup_location:locations!reservations_pickup_location_id_fkey (
          id,
          name,
          city
        ),
        return_location:locations!reservations_return_location_id_fkey (
          id,
          name,
          city
        )
      `)
      .eq("reference", reference)
      .maybeSingle()

    if (resErr || !reservation) {
      return NextResponse.json(
        { success: false, error: "not_found", message: "Reservation not found." },
        { status: 404 }
      )
    }

    // 3. Ownership security check
    if (!isStaff && (!customer || reservation.customer_id !== customer.id)) {
      return NextResponse.json(
        { success: false, error: "forbidden", message: "You are not authorized to view this reservation." },
        { status: 403 }
      )
    }

    // 4. Fetch latest payment transaction from payments ledger
    const { data: latestPayment } = await supabase
      .from("payments")
      .select("id, status, amount, currency, method, provider, provider_payment_id, provider_txn_ref, updated_at, failure_reason")
      .eq("reservation_id", reservation.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      success: true,
      reservation: {
        id: reservation.id,
        reference: reservation.reference,
        status: reservation.status,
        paymentStatus: reservation.payment_status || latestPayment?.status || "pending",
        paymentMethod: reservation.payment_method || latestPayment?.method || "pay_at_pickup",
        totalAmountCentavos: Number(reservation.total_amount),
        depositAmountCentavos: Number(reservation.deposit_amount || 0),
        currency: reservation.currency || "PHP",
        rentalDays: reservation.rental_days,
        pickupAt: reservation.pickup_at,
        returnAt: reservation.return_at,
        pickupStreetAddress: reservation.pickup_street_address,
        pickupLandmark: reservation.pickup_landmark,
        pickupBarangay: reservation.pickup_barangay,
        createdAt: reservation.created_at,
        vehicle: reservation.vehicles,
        pickupLocation: reservation.pickup_location,
        returnLocation: reservation.return_location,
        payment: latestPayment
          ? {
              id: latestPayment.id,
              status: latestPayment.status,
              amountCentavos: Number(latestPayment.amount),
              currency: latestPayment.currency,
              method: latestPayment.method,
              provider: latestPayment.provider,
              providerTxnRef: latestPayment.provider_txn_ref,
              providerPaymentId: latestPayment.provider_payment_id,
              updatedAt: latestPayment.updated_at,
              failureReason: latestPayment.failure_reason,
            }
          : null,
      },
    })
  } catch (err) {
    console.error("[api/reservations/lookup] Error:", err)
    return NextResponse.json(
      { success: false, error: "internal_error", message: "Failed to look up reservation." },
      { status: 500 }
    )
  }
}
