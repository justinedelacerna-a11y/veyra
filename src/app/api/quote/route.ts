import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createServiceClient } from "@/lib/supabase/server"
import { calculateQuote } from "@/features/booking/server"
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/rate-limit"
import { logger, generateCorrelationId, safeErrorMessage } from "@/lib/logger"

/**
 * POST /api/quote
 *
 * Body:
 *   vehicleId: string (UUID)
 *   pickupLocationId: string (UUID)
 *   returnLocationId: string (UUID)
 *   pickupAt: string (ISO)
 *   returnAt: string (ISO)
 *   selectedExtras?: string[] (UUIDs or slugs)
 *
 * Security:
 *   - Rate limited per IP (20 req/min — anonymous endpoint).
 *   - Calculates price strictly on the server in minor units (centavos).
 *   - Re-checks vehicle availability in real time.
 *   - Ignores all client-supplied prices.
 *   - Correlation ID included in error responses for tracing.
 */
export async function POST(request: NextRequest) {
  const correlationId = generateCorrelationId()
  const log = logger("api/quote", correlationId)

  // Rate limit by IP (quote is a public endpoint)
  const ip = getClientIp(request)
  const rateLimitResult = checkRateLimit("quote", ip, RATE_LIMITS.quote)
  if (!rateLimitResult.allowed) {
    log.warn("rate_limited", { retryAfterMs: rateLimitResult.retryAfterMs })
    return NextResponse.json(
      {
        success: false,
        error: "rate_limited",
        message: "Too many quote requests. Please wait a moment before trying again.",
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

  try {
    const body = await request.json()
    const {
      vehicleId,
      pickupLocationId,
      returnLocationId,
      pickupAt,
      returnAt,
      selectedExtras = [],
    } = body

    if (!vehicleId || !pickupLocationId || !returnLocationId || !pickupAt || !returnAt) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_parameters",
          message: "All itinerary parameters (vehicle, locations, dates) are required.",
          correlationId,
        },
        { status: 400, headers: { "X-Correlation-ID": correlationId } }
      )
    }

    // Check if user is authenticated via Clerk to resolve customerId
    let customerId: string | undefined
    try {
      const authState = await auth()
      if (authState.userId) {
        const supabase = createServiceClient()
        const { data: user } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_id", authState.userId)
          .maybeSingle()

        if (user) {
          const { data: customer } = await supabase
            .from("customers")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle()

          if (customer) {
            customerId = customer.id
          }
        }
      }
    } catch {
      // Unauthenticated quotes are fine (e.g. browsing/preview)
    }

    log.info("quote_requested", { vehicleId, customerId: customerId ?? "anonymous" })

    const result = await calculateQuote({
      vehicleId,
      pickupLocationId,
      returnLocationId,
      pickupAt,
      returnAt,
      selectedExtraIds: selectedExtras,
      customerId,
      persist: !!customerId,
    })

    if (!result.success) {
      log.warn("quote_failed", { error: result.error, vehicleId })
      const statusCode =
        result.error === "unavailable"
          ? 409
          : result.error === "invalid_dates"
          ? 422
          : result.error === "vehicle_not_found" || result.error === "location_not_found"
          ? 404
          : 500

      return NextResponse.json(
        { ...result, correlationId },
        { status: statusCode, headers: { "X-Correlation-ID": correlationId } }
      )
    }

    log.info("quote_success", { vehicleId, customerId: customerId ?? "anonymous" })
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
        message: "Failed to process quote calculation.",
        correlationId,
      },
      { status: 500, headers: { "X-Correlation-ID": correlationId } }
    )
  }
}
