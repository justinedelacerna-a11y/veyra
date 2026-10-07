import { NextRequest, NextResponse } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"
import { checkRateLimit, RATE_LIMITS, getClientIp } from "@/lib/rate-limit"
import { logger, generateCorrelationId, safeErrorMessage } from "@/lib/logger"

/**
 * GET /api/availability
 *
 * Query params:
 *   vehicleId  - UUID of the physical vehicle
 *   pickupAt   - ISO 8601 datetime string (inclusive start)
 *   returnAt   - ISO 8601 datetime string (exclusive end, half-open [) semantics)
 *
 * Returns:
 *   { available: boolean, conflict?: string }
 *
 * Security:
 *   - Rate limited per IP (60 req/min).
 *   - Uses service client to read availability_blocks and reservations.
 *     These tables have no customer READ policy — availability must be
 *     computed server-side and only the boolean result exposed to the client.
 *   - vehicleId must be a valid UUID; malformed IDs are rejected.
 *   - Dates are validated: pickupAt must be strictly before returnAt.
 *   - No blocked period details are exposed in the response.
 */
export async function GET(request: NextRequest) {
  const correlationId = generateCorrelationId()
  const log = logger("api/availability", correlationId)

  // Rate limit by IP (availability is a public endpoint)
  const ip = getClientIp(request)
  const rateLimitResult = checkRateLimit("availability", ip, RATE_LIMITS.availability)
  if (!rateLimitResult.allowed) {
    log.warn("rate_limited", { retryAfterMs: rateLimitResult.retryAfterMs })
    return NextResponse.json(
      { available: false, conflict: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rateLimitResult.retryAfterMs / 1000)) },
      }
    )
  }

  const { searchParams } = request.nextUrl

  const vehicleId = searchParams.get("vehicleId")
  const pickupAtStr = searchParams.get("pickupAt")
  const returnAtStr = searchParams.get("returnAt")

  // --- Input validation ---
  if (!vehicleId || !pickupAtStr || !returnAtStr) {
    return NextResponse.json(
      { available: false, conflict: "missing_params" },
      { status: 400 }
    )
  }

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(vehicleId)) {
    return NextResponse.json(
      { available: false, conflict: "invalid_vehicle_id" },
      { status: 400 }
    )
  }

  const pickupAt = new Date(pickupAtStr)
  const returnAt = new Date(returnAtStr)

  if (isNaN(pickupAt.getTime()) || isNaN(returnAt.getTime())) {
    return NextResponse.json(
      { available: false, conflict: "invalid_dates" },
      { status: 400 }
    )
  }

  // Requirement: pickup_at < return_at (half-open [) interval)
  if (pickupAt >= returnAt) {
    return NextResponse.json(
      { available: false, conflict: "invalid_date_range" },
      { status: 422 }
    )
  }

  // Minimum booking: at least 1 hour
  const diffHours = (returnAt.getTime() - pickupAt.getTime()) / (1000 * 60 * 60)
  if (diffHours < 1) {
    return NextResponse.json(
      { available: false, conflict: "duration_too_short" },
      { status: 422 }
    )
  }

  try {
    const supabase = createServiceClient()

    const pickupIso = pickupAt.toISOString()
    const returnIso = returnAt.toISOString()

    // -------------------------------------------------------------------
    // 1. Check reservations for overlapping active bookings.
    //
    //    Half-open [) interval overlap condition:
    //      existing.pickup_at < $return AND existing.return_at > $pickup
    //
    //    This matches the existing idx_reservations_overlap_btree partial index
    //    which excludes terminal states (cancelled, no_show, expired,
    //    payment_failed, completed, draft).
    //
    //    We exclude those same terminal states here to match the index.
    // -------------------------------------------------------------------
    const { data: reservationConflicts, error: resErr } = await supabase
      .from("reservations")
      .select("id")
      .eq("vehicle_id", vehicleId)
      .not("status", "in", "(cancelled,no_show,expired,payment_failed,completed,draft)")
      .lt("pickup_at", returnIso)
      .gt("return_at", pickupIso)
      .limit(1)

    if (resErr) {
      log.error("reservation_query_error", { error: safeErrorMessage(resErr) })
      return NextResponse.json(
        { available: false, conflict: "query_error" },
        { status: 500 }
      )
    }

    if (reservationConflicts && reservationConflicts.length > 0) {
      return NextResponse.json({ available: false, conflict: "reservation_conflict" })
    }

    // -------------------------------------------------------------------
    // 2. Check availability_blocks for maintenance / holds / cleaning.
    //
    //    Same half-open [) overlap condition using the existing schema
    //    structure (starts_at inclusive, ends_at exclusive):
    //      block.starts_at < $return AND block.ends_at > $pickup
    //
    //    Uses idx_availability_blocks_gist for efficient range queries.
    // -------------------------------------------------------------------
    const { data: blockConflicts, error: blockErr } = await supabase
      .from("availability_blocks")
      .select("id, type")
      .eq("vehicle_id", vehicleId)
      .lt("starts_at", returnIso)
      .gt("ends_at", pickupIso)
      .limit(1)

    if (blockErr) {
      log.error("blocks_query_error", { error: safeErrorMessage(blockErr) })
      return NextResponse.json(
        { available: false, conflict: "query_error" },
        { status: 500 }
      )
    }

    if (blockConflicts && blockConflicts.length > 0) {
      return NextResponse.json({ available: false, conflict: "blocked_period" })
    }

    // 3. No conflicts found — vehicle is available
    return NextResponse.json({ available: true })
  } catch (err) {
    log.error("unexpected_error", { error: safeErrorMessage(err) })
    return NextResponse.json(
      { available: false, conflict: "server_error" },
      { status: 500 }
    )
  }
}
