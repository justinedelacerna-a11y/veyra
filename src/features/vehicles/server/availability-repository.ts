import "server-only"
import { createServiceClient } from "@/lib/supabase/server"

export interface AvailabilityParams {
  vehicleId: string
  pickupAt: Date | string
  returnAt: Date | string
}

export interface AvailabilityResult {
  available: boolean
  conflict: "none" | "reservation_conflict" | "blocked_period" | "invalid_params" | "query_error"
}

/**
 * Server-side availability check for a specific vehicle and date range.
 *
 * Uses the service client to bypass RLS on availability_blocks and reservations,
 * since these tables have no customer READ policy — availability data must be
 * computed server-side and only the boolean result surfaced to the client.
 *
 * Range semantics: half-open [) intervals (inclusive start, exclusive end).
 * This matches the existing PostgreSQL indexes:
 *   - idx_reservations_overlap_btree  (vehicle_id, pickup_at, return_at)
 *   - idx_availability_blocks_gist    (vehicle_id, tstzrange(starts_at, ends_at, '[)'))
 *
 * Overlap condition: existing.start < $return AND existing.end > $pickup
 *
 * @param params - vehicleId, pickupAt, returnAt
 * @returns AvailabilityResult with available boolean and conflict reason
 */
export async function checkVehicleAvailability(
  params: AvailabilityParams
): Promise<AvailabilityResult> {
  const { vehicleId } = params
  const pickupAt = new Date(params.pickupAt)
  const returnAt = new Date(params.returnAt)

  // Validate interval
  if (isNaN(pickupAt.getTime()) || isNaN(returnAt.getTime()) || pickupAt >= returnAt) {
    return { available: false, conflict: "invalid_params" }
  }

  const pickupIso = pickupAt.toISOString()
  const returnIso = returnAt.toISOString()

  try {
    const supabase = createServiceClient()

    // -------------------------------------------------------------------
    // 1. Check active reservations for overlap.
    //    Excludes terminal states: cancelled, no_show, expired,
    //    payment_failed, completed, draft.
    //    Matches the partial index idx_reservations_overlap_btree.
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
      console.error("[availability-repository] reservations error:", resErr.message)
      return { available: false, conflict: "query_error" }
    }

    if (reservationConflicts && reservationConflicts.length > 0) {
      return { available: false, conflict: "reservation_conflict" }
    }

    // -------------------------------------------------------------------
    // 2. Check availability_blocks for maintenance/hold/cleaning overlap.
    //    Uses idx_availability_blocks_gist for efficient range lookup.
    // -------------------------------------------------------------------
    const { data: blockConflicts, error: blockErr } = await supabase
      .from("availability_blocks")
      .select("id")
      .eq("vehicle_id", vehicleId)
      .lt("starts_at", returnIso)
      .gt("ends_at", pickupIso)
      .limit(1)

    if (blockErr) {
      console.error("[availability-repository] blocks error:", blockErr.message)
      return { available: false, conflict: "query_error" }
    }

    if (blockConflicts && blockConflicts.length > 0) {
      return { available: false, conflict: "blocked_period" }
    }

    return { available: true, conflict: "none" }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[availability-repository] unexpected error:", message)
    return { available: false, conflict: "query_error" }
  }
}

/**
 * Filter a list of vehicle IDs to only those available for the given period.
 * Useful for batch availability checks during catalog queries.
 *
 * @param vehicleIds - Array of vehicle UUIDs to check
 * @param pickupAt   - Inclusive start of requested period
 * @param returnAt   - Exclusive end of requested period (half-open [))
 * @returns Array of vehicleIds that are available (no conflicts)
 */
export async function filterAvailableVehicles(
  vehicleIds: string[],
  pickupAt: Date | string,
  returnAt: Date | string
): Promise<string[]> {
  if (vehicleIds.length === 0) return []

  const pickup = new Date(pickupAt)
  const returnD = new Date(returnAt)

  if (isNaN(pickup.getTime()) || isNaN(returnD.getTime()) || pickup >= returnD) {
    return []
  }

  const pickupIso = pickup.toISOString()
  const returnIso = returnD.toISOString()

  try {
    const supabase = createServiceClient()

    // Get all conflicting vehicle IDs from reservations in one query
    const { data: reservationConflicts } = await supabase
      .from("reservations")
      .select("vehicle_id")
      .in("vehicle_id", vehicleIds)
      .not("status", "in", "(cancelled,no_show,expired,payment_failed,completed,draft)")
      .lt("pickup_at", returnIso)
      .gt("return_at", pickupIso)

    const conflictingFromReservations = new Set(
      (reservationConflicts ?? []).map((r) => r.vehicle_id)
    )

    // Get all conflicting vehicle IDs from availability_blocks in one query
    const { data: blockConflicts } = await supabase
      .from("availability_blocks")
      .select("vehicle_id")
      .in("vehicle_id", vehicleIds)
      .lt("starts_at", returnIso)
      .gt("ends_at", pickupIso)

    const conflictingFromBlocks = new Set(
      (blockConflicts ?? []).map((b) => b.vehicle_id)
    )

    // Return only vehicles with no conflicts
    return vehicleIds.filter(
      (id) => !conflictingFromReservations.has(id) && !conflictingFromBlocks.has(id)
    )
  } catch (err) {
    console.error("[availability-repository] filterAvailableVehicles error:", err)
    // On error, return all vehicles (fail-open for catalog display; booking
    // step will re-validate server-side before creating a hold)
    return vehicleIds
  }
}
