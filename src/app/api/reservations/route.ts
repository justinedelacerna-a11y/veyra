import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createReservation } from "@/features/booking/server"
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { logger, generateCorrelationId, safeErrorMessage } from "@/lib/logger"

/**
 * POST /api/reservations
 *
 * Creates a verified vehicle reservation in Supabase.
 *
 * Requirements:
 * - Customer must be authenticated through Clerk.
 * - Rate limited per authenticated user ID (5 req/min).
 * - Re-checks availability atomically inside per-vehicle concurrency lock.
 * - Prices are derived authoritatively from server quote.
 * - Records reservation, extras, and driver details in database.
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId()
  const log = logger("api/reservations", correlationId)

  try {
    const authState = await auth()
    if (!authState.userId) {
      log.warn("unauthenticated_attempt")
      return NextResponse.json(
        {
          success: false,
          error: "unauthorized",
          message: "Authentication required to create a reservation.",
          correlationId,
        },
        { status: 401, headers: { "X-Correlation-ID": correlationId } }
      )
    }

    // Rate limit per authenticated user
    const rateLimitResult = checkRateLimit("reservation", authState.userId, RATE_LIMITS.reservation)
    if (!rateLimitResult.allowed) {
      log.warn("rate_limited", { retryAfterMs: rateLimitResult.retryAfterMs })
      return NextResponse.json(
        {
          success: false,
          error: "rate_limited",
          message: "Too many reservation attempts. Please wait a moment before trying again.",
          correlationId,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimitResult.retryAfterMs / 1000)),
            "X-Correlation-ID": correlationId,
          },
        }
      )
    }

    const body = await request.json()
    const {
      vehicleId,
      pickupLocationId,
      returnLocationId,
      pickupAt,
      returnAt,
      selectedExtras = [],
      quoteId,
      driver,
      paymentMethod = "card",
    } = body

    if (!vehicleId || !pickupLocationId || !returnLocationId || !pickupAt || !returnAt) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_parameters",
          message: "Missing required reservation details.",
          correlationId,
        },
        { status: 400, headers: { "X-Correlation-ID": correlationId } }
      )
    }

    if (!driver || !driver.firstName || !driver.lastName) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_driver",
          message: "Driver details are required to complete reservation.",
          correlationId,
        },
        { status: 400, headers: { "X-Correlation-ID": correlationId } }
      )
    }

    log.info("reservation_attempt", { vehicleId, quoteId })

    const result = await createReservation({
      vehicleId,
      pickupLocationId,
      returnLocationId,
      pickupAt,
      returnAt,
      selectedExtraIds: selectedExtras,
      quoteId,
      driver,
      paymentMethod,
    })

    if (!result.success) {
      log.warn("reservation_failed", { error: result.error, vehicleId })
      const statusCode =
        result.error === "unauthorized"
          ? 401
          : result.error === "conflict" || result.error === "vehicle_unavailable"
          ? 409
          : result.error === "invalid_dates"
          ? 422
          : 500

      return NextResponse.json(
        { ...result, correlationId },
        { status: statusCode, headers: { "X-Correlation-ID": correlationId } }
      )
    }

    log.info("reservation_created", {
      reservationId: result.reservationId,
      reference: result.reference,
      vehicleId,
    })

    return NextResponse.json(
      { ...result, correlationId },
      { headers: { "X-Correlation-ID": correlationId } }
    )
  } catch (err) {
    log.error("unexpected_error", { error: safeErrorMessage(err) })
    return NextResponse.json(
      {
        success: false,
        error: "internal_error",
        message: "Failed to record your reservation. Please try again.",
        correlationId,
      },
      { status: 500, headers: { "X-Correlation-ID": correlationId } }
    )
  }
}
