import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { DemoPaymentProvider } from "@/features/payment/server/providers/demo-provider"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"

/**
 * POST /api/payments/demo/simulate
 *
 * Dedicated demonstration simulation endpoint.
 * Allows an authenticated customer to simulate success, failure, or cancellation
 * on their own pending demo payment transaction.
 *
 * Security:
 * - Clerk authentication required.
 * - Customer ownership of reservation and payment strictly enforced.
 * - Transaction must be is_demo === true.
 * - Live payments or other customers' records CANNOT be altered.
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
          message: "Authentication is required to simulate payment.",
        },
        { status: 401 }
      )
    }

    const rateLimit = checkRateLimit("checkout", clerkUserId, RATE_LIMITS.checkout)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: "rate_limited",
          message: "Too many payment simulation requests. Please wait a moment.",
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const { reference, sessionId, action, failureReason } = body

    if (!reference) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_reference",
          message: "Reservation reference is required.",
        },
        { status: 400 }
      )
    }

    if (!["success", "failure", "cancel"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: "invalid_action",
          message: "Action must be 'success', 'failure', or 'cancel'.",
        },
        { status: 400 }
      )
    }

    const demoProvider = new DemoPaymentProvider()
    const result = await demoProvider.simulateOutcome({
      reference,
      sessionId,
      clerkUserId,
      action,
      failureReason,
    })

    return NextResponse.json({
      success: true,
      simulation: result,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to execute payment simulation."
    const isUnauthorized = message.toLowerCase().includes("unauthorized")
    const isNotFound = message.toLowerCase().includes("not found")

    return NextResponse.json(
      {
        success: false,
        error: isUnauthorized ? "unauthorized" : isNotFound ? "not_found" : "simulation_error",
        message,
      },
      { status: isUnauthorized ? 403 : isNotFound ? 404 : 500 }
    )
  }
}
