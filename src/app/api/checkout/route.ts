import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getPaymentProvider } from "@/features/payment/server"
import type { PaymentMethodId } from "@/features/payment/types"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

/**
 * POST /api/checkout
 *
 * Initiates an authoritative checkout session for an unpaid reservation.
 * In demo mode, routes through DemoPaymentProvider without contacting external gateways.
 *
 * Security:
 * - Customer must be authenticated via Clerk.
 * - Server receives ONLY the reservationId and paymentMethod.
 * - Amount and currency are loaded exclusively from server-side database records.
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

    // Rate limit checkout attempts per customer
    const rateLimit = checkRateLimit("checkout", clerkUserId, RATE_LIMITS.checkout)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "rate_limited",
          message: "Too many checkout requests. Please wait a moment before trying again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.retryAfterMs / 1000)),
          },
        }
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

    const provider = getPaymentProvider(paymentMethod as PaymentMethodId, { demo: true })
    const result = await provider.createPayment({
      reservationId,
      clerkUserId,
      paymentMethod: paymentMethod as PaymentMethodId,
    })

    if (!result.success) {
      const statusMap: Record<string, number> = {
        payments_disabled: 503,
        unauthorized: 403,
        kyc_unverified: 403,
        customer_not_found: 404,
        reservation_not_found: 404,
        quote_expired: 410,
        hold_expired: 410,
        invalid_state: 409,
        provider_error: 502,
        database_error: 500,
      }
      const statusCode = statusMap[result.error || ""] || 400

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
      isDemo: result.isDemo ?? true,
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

