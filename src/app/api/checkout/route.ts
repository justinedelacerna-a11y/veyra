import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createCheckoutSession } from "@/features/payment/server"

/**
 * POST /api/checkout
 *
 * Initiates an authoritative PayMongo checkout session for an unpaid reservation.
 *
 * Security:
 * - Customer must be authenticated via Clerk.
 * - Server receives ONLY the reservationId and paymentMethod.
 * - Amount and currency are loaded exclusively from the server-side quote snapshot.
 * - Client cannot tamper with prices, fees, taxes, deposits, or totals.
 */
export async function POST(request: NextRequest) {
  try {
    const authState = await auth()
    const clerkUserId = authState.userId

    if (!clerkUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "unauthorized",
          message: "Authentication required to checkout.",
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { reservationId, paymentMethod = "card" } = body

    if (!reservationId) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_reservation_id",
          message: "A valid reservation identifier is required.",
        },
        { status: 400 }
      )
    }

    const result = await createCheckoutSession({
      reservationId,
      clerkUserId,
      paymentMethod,
    })

    if (!result.success) {
      const statusMap: Record<string, number> = {
        payments_disabled: 503,
        unauthorized: 403,
        customer_not_found: 404,
        reservation_not_found: 404,
        quote_expired: 410,
        hold_expired: 410,
        invalid_state: 409,
        provider_error: 502,
        database_error: 500,
      }
      const statusCode = statusMap[result.error] || 400

      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
        },
        { status: statusCode }
      )
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      checkoutUrl: result.checkoutUrl,
      reference: result.reference,
      amountCentavos: result.totalAmountCentavos,
      currency: result.currency,
    })
  } catch (err) {
    console.error("[api/checkout] Unhandled error:", err)
    return NextResponse.json(
      {
        success: false,
        error: "internal_error",
        message: "An unexpected error occurred while creating checkout session.",
      },
      { status: 500 }
    )
  }
}
