"use server"

import { revalidatePath } from "next/cache"
import { createClient, createServiceClient } from "@/lib/supabase/server"
import { requireAdminStaff } from "./admin-auth"
import { recordAuditEvent } from "./audit-service"
import type { AdminReservationStatus, FleetVehicleStatus, StaffRole } from "@/features/admin/types"
import type { Database } from "@/types/database"

/**
 * Formal State Machine Valid Transitions
 * Based on docs/operations/reservation-state-machine.md
 */
const ALLOWED_RESERVATION_TRANSITIONS: Record<AdminReservationStatus, AdminReservationStatus[]> = {
  draft: ["quote_created", "cancelled"],
  quote_created: ["held", "expired", "cancelled"],
  held: ["payment_pending", "expired", "cancelled"],
  payment_pending: ["confirmed", "payment_failed", "cancelled"],
  confirmed: ["pickup_ready", "cancelled"],
  pickup_ready: ["active", "no_show", "cancelled"],
  active: ["return_inspection", "disputed"],
  return_inspection: ["completed", "disputed"],
  disputed: ["completed"],
  completed: [],
  cancelled: [],
  expired: [],
  no_show: [],
  payment_failed: [],
}

/**
 * Role requirements for specific transitions
 */
const TRANSITION_ROLES: Partial<Record<AdminReservationStatus, StaffRole[]>> = {
  pickup_ready: ["branch_staff", "branch_manager", "fleet_manager", "admin", "superadmin"],
  active: ["branch_staff", "branch_manager", "fleet_manager", "admin", "superadmin"],
  no_show: ["branch_staff", "branch_manager", "fleet_manager", "admin", "superadmin"],
  return_inspection: ["branch_staff", "branch_manager", "fleet_manager", "admin", "superadmin"],
  completed: ["branch_staff", "branch_manager", "fleet_manager", "admin", "superadmin"],
  cancelled: ["branch_manager", "fleet_manager", "admin", "superadmin"],
  disputed: ["branch_manager", "fleet_manager", "admin", "superadmin"],
}

export interface ActionResult<T = unknown> {
  success: boolean
  message: string
  data?: T
  error?: string
}

/**
 * Transition a reservation's status according to the Veyra state machine.
 */
export async function transitionReservationStatusAction(
  reservationId: string,
  targetStatus: AdminReservationStatus,
  reason?: string
): Promise<ActionResult> {
  try {
    // 1. Verify staff session
    const staff = await requireAdminStaff()

    // Verify role permissions for this specific target transition
    const requiredRoles = TRANSITION_ROLES[targetStatus]
    if (requiredRoles && !requiredRoles.includes(staff.role)) {
      return {
        success: false,
        message: `Role ${staff.role} is not permitted to transition reservation to ${targetStatus}`,
        error: "FORBIDDEN",
      }
    }

    const supabase = createClient()

    // 2. Query current reservation
    const { data: res, error: fetchErr } = await supabase
      .from("reservations")
      .select("id, reference, status, vehicle_id, customer_id, total_amount, deposit_amount")
      .eq("id", reservationId)
      .single()

    if (fetchErr || !res) {
      return {
        success: false,
        message: `Reservation not found: ${reservationId}`,
        error: "NOT_FOUND",
      }
    }

    const currentStatus = res.status as AdminReservationStatus

    // 3. Verify state transition is valid
    const allowed = ALLOWED_RESERVATION_TRANSITIONS[currentStatus] || []
    if (!allowed.includes(targetStatus)) {
      return {
        success: false,
        message: `Invalid state transition: Cannot change reservation from "${currentStatus}" to "${targetStatus}". Allowed next states: ${allowed.join(", ") || "none (terminal state)"}`,
        error: "CONFLICT",
      }
    }

    // 4. Prepare updates — only operational fields, preserving financial invariants
    const updatePayload: Database["public"]["Tables"]["reservations"]["Update"] = {
      status: targetStatus,
      updated_at: new Date().toISOString(),
    }

    if (targetStatus === "active") {
      updatePayload.actual_pickup_at = new Date().toISOString()
    } else if (targetStatus === "return_inspection" || targetStatus === "completed") {
      updatePayload.actual_return_at = new Date().toISOString()
    }

    if (targetStatus === "cancelled" && reason) {
      updatePayload.cancellation_reason = reason
    }

    // Update reservation
    const { error: updateErr } = await supabase
      .from("reservations")
      .update(updatePayload)
      .eq("id", reservationId)

    if (updateErr) {
      console.error("[transitionReservationStatusAction] Update error:", updateErr)
      return {
        success: false,
        message: `Failed to update reservation: ${updateErr.message}`,
        error: updateErr.message,
      }
    }

    // 5. Synchronize vehicle status based on reservation state machine
    if (res.vehicle_id) {
      let vehicleStatusToSet: FleetVehicleStatus | null = null
      if (targetStatus === "confirmed" || targetStatus === "pickup_ready") {
        vehicleStatusToSet = "reserved"
      } else if (targetStatus === "active") {
        vehicleStatusToSet = "rented"
      } else if (targetStatus === "return_inspection") {
        vehicleStatusToSet = "inspection"
      } else if (["completed", "cancelled", "no_show", "expired"].includes(targetStatus)) {
        vehicleStatusToSet = "available"
      }

      if (vehicleStatusToSet) {
        await supabase
          .from("vehicles")
          .update({ fleet_status: vehicleStatusToSet, updated_at: new Date().toISOString() })
          .eq("id", res.vehicle_id)
      }
    }

    // 6. Audit event logging
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "reservation.status_changed",
      resourceType: "reservation",
      resourceId: reservationId,
      result: "success",
      details: `Reservation ${res.reference || reservationId} transitioned from ${currentStatus} to ${targetStatus}${reason ? ` (${reason})` : ""}`,
      beforeState: { status: currentStatus },
      afterState: { status: targetStatus },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/reservations")
    revalidatePath(`/admin/reservations/${reservationId}`)
    revalidatePath("/admin/fleet")
    revalidatePath("/vehicles")

    return {
      success: true,
      message: `Reservation successfully transitioned to "${targetStatus}"`,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      message: errorMsg,
      error: errorMsg,
    }
  }
}

/**
 * Schedule vehicle maintenance and create an availability block.
 */
export async function scheduleVehicleMaintenanceAction(input: {
  vehicleId: string
  startsAt: string
  endsAt: string
  reason?: string
  priority?: "low" | "normal" | "high" | "urgent"
}): Promise<ActionResult> {
  try {
    const staff = await requireAdminStaff([
      "fleet_manager",
      "branch_manager",
      "admin",
      "superadmin",
    ])

    const startObj = new Date(input.startsAt)
    const endObj = new Date(input.endsAt)

    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      return {
        success: false,
        message: "Invalid dates provided for maintenance block.",
        error: "INVALID_DATE",
      }
    }

    if (endObj <= startObj) {
      return {
        success: false,
        message: "Maintenance end time must be after start time.",
        error: "INVALID_INTERVAL",
      }
    }

    const supabase = createClient()

    // 1. Retrieve vehicle
    const { data: vehicle, error: vErr } = await supabase
      .from("vehicles")
      .select("id, branch_id, plate_number, make, model, fleet_status")
      .eq("id", input.vehicleId)
      .single()

    if (vErr || !vehicle) {
      return {
        success: false,
        message: `Vehicle not found: ${input.vehicleId}`,
        error: "NOT_FOUND",
      }
    }

    // 2. Insert availability block
    const { error: blockErr } = await supabase
      .from("availability_blocks")
      .insert({
        vehicle_id: input.vehicleId,
        type: "maintenance",
        starts_at: startObj.toISOString(),
        ends_at: endObj.toISOString(),
        reason: input.reason || "Scheduled fleet maintenance",
        created_by: staff.userId,
      })

    if (blockErr) {
      console.error("[scheduleVehicleMaintenanceAction] Block insert error:", blockErr)
      return {
        success: false,
        message: `Failed to create availability block: ${blockErr.message}`,
        error: blockErr.message,
      }
    }

    // 3. Update vehicle fleet status
    await supabase
      .from("vehicles")
      .update({
        fleet_status: "maintenance",
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.vehicleId)

    // 4. Create maintenance record
    await supabase.from("maintenance_records").insert({
      vehicle_id: input.vehicleId,
      branch_id: vehicle.branch_id,
      type: "routine_service",
      status: "scheduled",
      priority: input.priority || "normal",
      scheduled_date: startObj.toISOString().split("T")[0],
      notes: input.reason || "Routine vehicle maintenance",
      created_by: staff.userId,
    })

    // 5. Audit event
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "fleet.maintenance_scheduled",
      resourceType: "vehicle",
      resourceId: input.vehicleId,
      result: "success",
      details: `Maintenance scheduled for ${vehicle.make} ${vehicle.model} (${vehicle.plate_number}): ${input.startsAt} to ${input.endsAt}`,
      beforeState: { fleet_status: vehicle.fleet_status },
      afterState: { fleet_status: "maintenance" },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/fleet")
    revalidatePath(`/admin/fleet/${input.vehicleId}`)
    revalidatePath("/vehicles")

    return {
      success: true,
      message: `Maintenance scheduled for ${vehicle.make} ${vehicle.model}. Vehicle availability blocked.`,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      message: errorMsg,
      error: errorMsg,
    }
  }
}

/**
 * Update vehicle fleet status (e.g. back to 'available', 'inspection', etc.)
 */
export async function updateVehicleFleetStatusAction(
  vehicleId: string,
  newStatus: FleetVehicleStatus,
  reason?: string
): Promise<ActionResult> {
  try {
    const staff = await requireAdminStaff([
      "fleet_manager",
      "branch_manager",
      "admin",
      "superadmin",
    ])

    const supabase = createClient()

    const { data: vehicle, error: vErr } = await supabase
      .from("vehicles")
      .select("id, plate_number, make, model, fleet_status")
      .eq("id", vehicleId)
      .single()

    if (vErr || !vehicle) {
      return {
        success: false,
        message: `Vehicle not found: ${vehicleId}`,
        error: "NOT_FOUND",
      }
    }

    const beforeStatus = vehicle.fleet_status

    const { error: updateErr } = await supabase
      .from("vehicles")
      .update({
        fleet_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vehicleId)

    if (updateErr) {
      return {
        success: false,
        message: `Failed to update vehicle status: ${updateErr.message}`,
        error: updateErr.message,
      }
    }

    // Audit log
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "vehicle.status_changed",
      resourceType: "vehicle",
      resourceId: vehicleId,
      result: "success",
      details: `Vehicle ${vehicle.make} ${vehicle.model} (${vehicle.plate_number}) status changed from ${beforeStatus} to ${newStatus}${reason ? `: ${reason}` : ""}`,
      beforeState: { fleet_status: beforeStatus },
      afterState: { fleet_status: newStatus },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/fleet")
    revalidatePath(`/admin/fleet/${vehicleId}`)
    revalidatePath("/vehicles")

    return {
      success: true,
      message: `Vehicle status updated to "${newStatus}"`,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      message: errorMsg,
      error: errorMsg,
    }
  }
}

// ─── Pickup Handover ──────────────────────────────────────────────────────────

export interface PickupHandoverInput {
  odometerKm: number
  fuelLevelPct: number
  customerPresent: boolean
  notes?: string
}

/**
 * Phase 2 — Vehicle Handover
 *
 * Records a pickup inspection, sets actual_pickup_at, transitions the reservation
 * to active, and marks the vehicle as rented.
 *
 * Guards:
 * - Requires authenticated staff (branch_staff or above)
 * - Reservation must be in pickup_ready state
 * - Prevents duplicate handover (actual_pickup_at must not already be set)
 */
export async function recordPickupHandoverAction(
  reservationId: string,
  input: PickupHandoverInput
): Promise<ActionResult<{ inspectionId: string }>> {
  try {
    const staff = await requireAdminStaff()

    const requiredRoles: StaffRole[] = ["branch_staff", "branch_manager", "fleet_manager", "admin", "superadmin"]
    if (!requiredRoles.includes(staff.role)) {
      return { success: false, message: "Insufficient role for vehicle handover.", error: "FORBIDDEN" }
    }

    const supabase = createClient()

    // 1. Fetch reservation — must be pickup_ready, and not already handed over
    const { data: res, error: fetchErr } = await supabase
      .from("reservations")
      .select("id, reference, status, vehicle_id, actual_pickup_at")
      .eq("id", reservationId)
      .single()

    if (fetchErr || !res) {
      return { success: false, message: `Reservation not found: ${reservationId}`, error: "NOT_FOUND" }
    }

    if (res.status !== "pickup_ready") {
      return {
        success: false,
        message: `Handover requires pickup_ready status. Current: ${res.status}`,
        error: "CONFLICT",
      }
    }

    // 2. Idempotency guard — prevent duplicate handover
    if (res.actual_pickup_at) {
      return {
        success: false,
        message: "This reservation has already been handed over.",
        error: "DUPLICATE",
      }
    }

    // 3. Validate odometer and fuel
    if (input.odometerKm < 0 || input.fuelLevelPct < 0 || input.fuelLevelPct > 100) {
      return { success: false, message: "Invalid odometer or fuel level values.", error: "INVALID_INPUT" }
    }

    const now = new Date().toISOString()

    // 4. Create pickup inspection record
    const { data: inspection, error: inspErr } = await supabase
      .from("inspections")
      .insert({
        reservation_id: reservationId,
        vehicle_id: res.vehicle_id,
        type: "pickup",
        inspector_id: staff.userId,
        odometer_km: input.odometerKm,
        fuel_level_pct: input.fuelLevelPct,
        customer_present: input.customerPresent,
        customer_signature: false,
        overall_status: "cleared",
        damage_status: "no_damage",
        notes: input.notes || null,
        completed_at: now,
      })
      .select("id")
      .single()

    if (inspErr || !inspection) {
      console.error("[recordPickupHandoverAction] Inspection insert error:", inspErr)
      return { success: false, message: `Failed to create pickup inspection: ${inspErr?.message}`, error: inspErr?.message }
    }

    // 5. Transition reservation → active, stamp actual_pickup_at
    const { error: resErr } = await supabase
      .from("reservations")
      .update({
        status: "active",
        actual_pickup_at: now,
        updated_at: now,
      })
      .eq("id", reservationId)

    if (resErr) {
      console.error("[recordPickupHandoverAction] Reservation update error:", resErr)
      return { success: false, message: `Failed to activate reservation: ${resErr.message}`, error: resErr.message }
    }

    // 6. Update vehicle fleet status → rented
    await supabase
      .from("vehicles")
      .update({ fleet_status: "rented", updated_at: now })
      .eq("id", res.vehicle_id)

    // 7. Audit event
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "reservation.status_changed",
      resourceType: "reservation",
      resourceId: reservationId,
      result: "success",
      details: `Reservation ${res.reference || reservationId} handed over to customer. Odometer: ${input.odometerKm} km, Fuel: ${input.fuelLevelPct}%. Inspection: ${inspection.id}`,
      beforeState: { status: "pickup_ready" },
      afterState: { status: "active", actual_pickup_at: now, inspection_id: inspection.id },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/reservations")
    revalidatePath(`/admin/reservations/${reservationId}`)
    revalidatePath("/admin/inspections")
    revalidatePath("/admin/fleet")

    return {
      success: true,
      message: `Vehicle handed over successfully. Rental is now active. Pickup inspection recorded.`,
      data: { inspectionId: inspection.id },
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: errorMsg, error: errorMsg }
  }
}

// ─── Vehicle Return ───────────────────────────────────────────────────────────

export type ReturnDamageStatus =
  | "no_damage"
  | "existing_noted"
  | "new_damage"
  | "needs_review"

export interface VehicleReturnInput {
  odometerKm: number
  fuelLevelPct: number
  damageStatus: ReturnDamageStatus
  notes?: string
}

/**
 * Phase 4 — Vehicle Return Initiation
 *
 * Creates a return inspection, sets actual_return_at, transitions to
 * return_inspection, and marks the vehicle as inspection.
 *
 * Guards:
 * - Requires authenticated staff
 * - Reservation must be active
 * - Prevents duplicate return (checks for existing return inspection)
 */
export async function recordVehicleReturnAction(
  reservationId: string,
  input: VehicleReturnInput
): Promise<ActionResult<{ inspectionId: string }>> {
  try {
    const staff = await requireAdminStaff()

    const requiredRoles: StaffRole[] = ["branch_staff", "branch_manager", "fleet_manager", "admin", "superadmin"]
    if (!requiredRoles.includes(staff.role)) {
      return { success: false, message: "Insufficient role for return recording.", error: "FORBIDDEN" }
    }

    const supabase = createClient()

    // 1. Fetch reservation — must be active
    const { data: res, error: fetchErr } = await supabase
      .from("reservations")
      .select("id, reference, status, vehicle_id, actual_return_at")
      .eq("id", reservationId)
      .single()

    if (fetchErr || !res) {
      return { success: false, message: `Reservation not found: ${reservationId}`, error: "NOT_FOUND" }
    }

    if (res.status !== "active") {
      return {
        success: false,
        message: `Return recording requires active status. Current: ${res.status}`,
        error: "CONFLICT",
      }
    }

    // 2. Idempotency guard — prevent duplicate return
    if (res.actual_return_at) {
      return {
        success: false,
        message: "A return has already been recorded for this reservation.",
        error: "DUPLICATE",
      }
    }

    // 3. Check for existing return inspection
    const { data: existingReturn } = await supabase
      .from("inspections")
      .select("id")
      .eq("reservation_id", reservationId)
      .eq("type", "return")
      .maybeSingle()

    if (existingReturn) {
      return {
        success: false,
        message: "A return inspection already exists for this reservation.",
        error: "DUPLICATE",
      }
    }

    // 4. Validate inputs
    if (input.odometerKm < 0 || input.fuelLevelPct < 0 || input.fuelLevelPct > 100) {
      return { success: false, message: "Invalid odometer or fuel level values.", error: "INVALID_INPUT" }
    }

    const now = new Date().toISOString()

    // 5. Create return inspection
    const { data: inspection, error: inspErr } = await supabase
      .from("inspections")
      .insert({
        reservation_id: reservationId,
        vehicle_id: res.vehicle_id,
        type: "return",
        inspector_id: staff.userId,
        odometer_km: input.odometerKm,
        fuel_level_pct: input.fuelLevelPct,
        customer_present: false,
        customer_signature: false,
        overall_status: input.damageStatus === "new_damage" ? "flagged" : "cleared",
        damage_status: input.damageStatus,
        notes: input.notes || null,
        completed_at: now,
      })
      .select("id")
      .single()

    if (inspErr || !inspection) {
      console.error("[recordVehicleReturnAction] Inspection insert error:", inspErr)
      return { success: false, message: `Failed to create return inspection: ${inspErr?.message}`, error: inspErr?.message }
    }

    // 6. Transition reservation → return_inspection, stamp actual_return_at
    const { error: resErr } = await supabase
      .from("reservations")
      .update({
        status: "return_inspection",
        actual_return_at: now,
        updated_at: now,
      })
      .eq("id", reservationId)

    if (resErr) {
      console.error("[recordVehicleReturnAction] Reservation update error:", resErr)
      return { success: false, message: `Failed to update reservation: ${resErr.message}`, error: resErr.message }
    }

    // 7. Update vehicle fleet status → inspection
    await supabase
      .from("vehicles")
      .update({ fleet_status: "inspection", updated_at: now })
      .eq("id", res.vehicle_id)

    // 8. Audit event
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "reservation.status_changed",
      resourceType: "reservation",
      resourceId: reservationId,
      result: "success",
      details: `Reservation ${res.reference || reservationId} vehicle returned. Odometer: ${input.odometerKm} km, Fuel: ${input.fuelLevelPct}%, Damage: ${input.damageStatus}. Inspection: ${inspection.id}`,
      beforeState: { status: "active" },
      afterState: { status: "return_inspection", actual_return_at: now, inspection_id: inspection.id },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/reservations")
    revalidatePath(`/admin/reservations/${reservationId}`)
    revalidatePath("/admin/inspections")
    revalidatePath("/admin/fleet")

    return {
      success: true,
      message: `Vehicle return recorded. Return inspection created. Proceeding to inspection phase.`,
      data: { inspectionId: inspection.id },
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: errorMsg, error: errorMsg }
  }
}

// ─── Complete Rental ──────────────────────────────────────────────────────────

/**
 * Phase 5/6 — Inspection Cleared → Completed
 *
 * Finalizes the rental after return inspection passes.
 * Transitions to completed, releases vehicle back to available.
 *
 * Guards:
 * - Requires authenticated staff
 * - Reservation must be return_inspection or disputed
 * - completed is a terminal state — cannot be undone
 */
export async function completeRentalAction(
  reservationId: string,
  finalNotes?: string
): Promise<ActionResult> {
  try {
    const staff = await requireAdminStaff()

    const requiredRoles: StaffRole[] = ["branch_staff", "branch_manager", "fleet_manager", "admin", "superadmin"]
    if (!requiredRoles.includes(staff.role)) {
      return { success: false, message: "Insufficient role for rental completion.", error: "FORBIDDEN" }
    }

    const supabase = createClient()

    const { data: res, error: fetchErr } = await supabase
      .from("reservations")
      .select("id, reference, status, vehicle_id")
      .eq("id", reservationId)
      .single()

    if (fetchErr || !res) {
      return { success: false, message: `Reservation not found: ${reservationId}`, error: "NOT_FOUND" }
    }

    const allowedFromStates = ["return_inspection", "disputed"]
    if (!allowedFromStates.includes(res.status)) {
      return {
        success: false,
        message: `Completion requires return_inspection or disputed status. Current: ${res.status}`,
        error: "CONFLICT",
      }
    }

    const now = new Date().toISOString()

    // Update return inspection overall_status to cleared if completing from return_inspection
    if (res.status === "return_inspection") {
      await supabase
        .from("inspections")
        .update({ overall_status: "cleared" })
        .eq("reservation_id", reservationId)
        .eq("type", "return")
    }

    // Transition → completed
    const { error: resErr } = await supabase
      .from("reservations")
      .update({ status: "completed", updated_at: now })
      .eq("id", reservationId)

    if (resErr) {
      return { success: false, message: `Failed to complete reservation: ${resErr.message}`, error: resErr.message }
    }

    // Release vehicle → available
    await supabase
      .from("vehicles")
      .update({ fleet_status: "available", updated_at: now })
      .eq("id", res.vehicle_id)

    // Audit event
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "reservation.status_changed",
      resourceType: "reservation",
      resourceId: reservationId,
      result: "success",
      details: `Reservation ${res.reference || reservationId} completed. Inspection cleared. Vehicle released.${finalNotes ? ` Notes: ${finalNotes}` : ""}`,
      beforeState: { status: res.status },
      afterState: { status: "completed" },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/reservations")
    revalidatePath(`/admin/reservations/${reservationId}`)
    revalidatePath("/admin/inspections")
    revalidatePath("/admin/fleet")
    revalidatePath("/account/reservations")

    return { success: true, message: `Rental ${res.reference || reservationId} completed. Vehicle is available.` }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: errorMsg, error: errorMsg }
  }
}

// ─── Mark No-Show ─────────────────────────────────────────────────────────────

/**
 * Phase 1 exception — Pickup Ready → No-Show
 *
 * Customer did not appear for pickup. Releases vehicle back to available.
 *
 * Guards:
 * - Requires authenticated staff
 * - Reservation must be pickup_ready
 */
export async function markNoShowAction(
  reservationId: string,
  reason?: string
): Promise<ActionResult> {
  try {
    const staff = await requireAdminStaff()

    const requiredRoles: StaffRole[] = ["branch_staff", "branch_manager", "fleet_manager", "admin", "superadmin"]
    if (!requiredRoles.includes(staff.role)) {
      return { success: false, message: "Insufficient role for no-show marking.", error: "FORBIDDEN" }
    }

    const supabase = createClient()

    const { data: res, error: fetchErr } = await supabase
      .from("reservations")
      .select("id, reference, status, vehicle_id")
      .eq("id", reservationId)
      .single()

    if (fetchErr || !res) {
      return { success: false, message: `Reservation not found: ${reservationId}`, error: "NOT_FOUND" }
    }

    if (res.status !== "pickup_ready") {
      return {
        success: false,
        message: `No-show requires pickup_ready status. Current: ${res.status}`,
        error: "CONFLICT",
      }
    }

    const now = new Date().toISOString()
    const noShowReason = reason || "Customer did not appear for scheduled pickup"

    const { error: resErr } = await supabase
      .from("reservations")
      .update({
        status: "no_show",
        cancellation_reason: noShowReason,
        updated_at: now,
      })
      .eq("id", reservationId)

    if (resErr) {
      return { success: false, message: `Failed to mark no-show: ${resErr.message}`, error: resErr.message }
    }

    // Release vehicle → available
    await supabase
      .from("vehicles")
      .update({ fleet_status: "available", updated_at: now })
      .eq("id", res.vehicle_id)

    // Audit event
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "reservation.status_changed",
      resourceType: "reservation",
      resourceId: reservationId,
      result: "success",
      details: `Reservation ${res.reference || reservationId} marked no-show. Vehicle released. Reason: ${noShowReason}`,
      beforeState: { status: "pickup_ready" },
      afterState: { status: "no_show" },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/reservations")
    revalidatePath(`/admin/reservations/${reservationId}`)
    revalidatePath("/admin/fleet")

    return { success: true, message: `Reservation marked as no-show. Vehicle released to available.` }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: errorMsg, error: errorMsg }
  }
}

// ─── Flag Dispute ─────────────────────────────────────────────────────────────

/**
 * Phase 5 exception — Return Inspection → Disputed
 *
 * Flags the reservation for dispute review (damage found, customer contests, etc.)
 * Vehicle remains in inspection status until dispute is resolved.
 *
 * Guards:
 * - Requires branch_manager or above
 * - Reservation must be return_inspection
 */
export async function flagDisputeAction(
  reservationId: string,
  reason: string
): Promise<ActionResult> {
  try {
    const staff = await requireAdminStaff([
      "branch_manager",
      "fleet_manager",
      "admin",
      "superadmin",
    ])

    const supabase = createClient()

    const { data: res, error: fetchErr } = await supabase
      .from("reservations")
      .select("id, reference, status, vehicle_id")
      .eq("id", reservationId)
      .single()

    if (fetchErr || !res) {
      return { success: false, message: `Reservation not found: ${reservationId}`, error: "NOT_FOUND" }
    }

    if (res.status !== "return_inspection") {
      return {
        success: false,
        message: `Dispute requires return_inspection status. Current: ${res.status}`,
        error: "CONFLICT",
      }
    }

    const now = new Date().toISOString()

    // Update return inspection to flagged
    await supabase
      .from("inspections")
      .update({ overall_status: "flagged", damage_status: "needs_review" })
      .eq("reservation_id", reservationId)
      .eq("type", "return")

    const { error: resErr } = await supabase
      .from("reservations")
      .update({ status: "disputed", updated_at: now })
      .eq("id", reservationId)

    if (resErr) {
      return { success: false, message: `Failed to flag dispute: ${resErr.message}`, error: resErr.message }
    }

    // Audit event
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "reservation.status_changed",
      resourceType: "reservation",
      resourceId: reservationId,
      result: "success",
      details: `Reservation ${res.reference || reservationId} flagged for dispute. Reason: ${reason}`,
      beforeState: { status: "return_inspection" },
      afterState: { status: "disputed", dispute_reason: reason },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/reservations")
    revalidatePath(`/admin/reservations/${reservationId}`)

    return { success: true, message: `Reservation flagged for dispute review. Manual resolution required.` }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: errorMsg, error: errorMsg }
  }
}

// ─── Customer Document Verification & Review ──────────────────────────────────

/**
 * Generate a short-lived signed URL for staff to inspect a customer identity document.
 * 
 * Guards:
 * - Requires authenticated staff session
 * - Document must exist in customer_documents
 * - Signed URL expires in 300 seconds (5 minutes)
 */
export async function getAdminDocumentSignedUrlAction(
  documentId: string
): Promise<ActionResult<{ signedUrl: string; originalFilename: string }>> {
  try {
    await requireAdminStaff()
    const supabase = createClient()

    const { data: doc, error: fetchErr } = await supabase
      .from("customer_documents")
      .select("id, storage_path, original_filename")
      .eq("id", documentId)
      .single()

    if (fetchErr || !doc) {
      return { success: false, message: `Document record not found: ${documentId}`, error: "NOT_FOUND" }
    }

    const adminSupabase = createServiceClient()

    const { data: signedData, error: signErr } = await adminSupabase.storage
      .from("customer-documents")
      .createSignedUrl(doc.storage_path, 300)

    if (signErr || !signedData?.signedUrl) {
      return {
        success: false,
        message: `Failed to create secure document link: ${signErr?.message || "Unknown error"}`,
        error: "STORAGE_ERROR",
      }
    }

    return {
      success: true,
      message: "Secure document inspection link generated.",
      data: {
        signedUrl: signedData.signedUrl,
        originalFilename: doc.original_filename,
      },
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: errorMsg, error: errorMsg }
  }
}

/**
 * Review, approve, or reject a customer identity document.
 */
export async function reviewCustomerDocumentAction(
  documentId: string,
  decision: "approved" | "rejected",
  rejectionReason?: string
): Promise<ActionResult> {
  try {
    const staff = await requireAdminStaff([
      "branch_staff",
      "branch_manager",
      "fleet_manager",
      "admin",
      "superadmin",
    ])

    const supabase = createClient()

    // 1. Fetch document record
    const { data: doc, error: fetchErr } = await supabase
      .from("customer_documents")
      .select("id, customer_id, type, status, original_filename")
      .eq("id", documentId)
      .single()

    if (fetchErr || !doc) {
      return { success: false, message: `Document record not found: ${documentId}`, error: "NOT_FOUND" }
    }

    const now = new Date().toISOString()

    // 2. Update customer_documents record
    const { error: updateErr } = await supabase
      .from("customer_documents")
      .update({
        status: decision,
        rejection_reason: decision === "rejected" ? (rejectionReason || "Document does not satisfy requirements") : null,
        reviewed_by: staff.userId,
        reviewed_at: now,
        updated_at: now,
      })
      .eq("id", documentId)

    if (updateErr) {
      console.error("[reviewCustomerDocumentAction] Update error:", updateErr)
      return { success: false, message: `Failed to update document: ${updateErr.message}`, error: updateErr.message }
    }

    // 3. If driver license is approved, verify the customer profile
    if (decision === "approved" && doc.type === "driver_license") {
      await supabase
        .from("customers")
        .update({
          verification_status: "verified",
          updated_at: now,
        })
        .eq("id", doc.customer_id)
    }

    // 4. Record audit event
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "customer.updated",
      resourceType: "customer_document",
      resourceId: documentId,
      result: "success",
      details: `Document ${doc.original_filename} (${doc.type}) was ${decision} by ${staff.email}.${decision === "rejected" && rejectionReason ? ` Reason: ${rejectionReason}` : ""}`,
      beforeState: { status: doc.status },
      afterState: { status: decision, rejection_reason: rejectionReason || null },
    })

    // 5. Revalidate paths
    revalidatePath("/admin/customers")
    revalidatePath(`/admin/customers/${doc.customer_id}`)
    revalidatePath("/account/documents")

    return {
      success: true,
      message: `Document ${decision === "approved" ? "approved and verified" : "rejected"}.`,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: errorMsg, error: errorMsg }
  }
}

/**
 * Assign a specific physical vehicle to a reservation.
 * Synchronizes reservation.assigned_vehicle_id and vehicles.fleet_status.
 */
export async function assignVehicleAction(
  reservationId: string,
  vehicleId: string
): Promise<ActionResult> {
  try {
    const staff = await requireAdminStaff([
      "branch_staff",
      "branch_manager",
      "fleet_manager",
      "admin",
      "superadmin",
    ])
    const supabase = createClient()

    // 1. Fetch reservation
    const { data: res, error: rErr } = await supabase
      .from("reservations")
      .select("id, reference, status, vehicle_id, assigned_vehicle_id")
      .eq("id", reservationId)
      .single()

    if (rErr || !res) {
      return { success: false, message: `Reservation not found: ${reservationId}`, error: "NOT_FOUND" }
    }

    if (["completed", "cancelled", "no_show"].includes(res.status)) {
      return { success: false, message: `Cannot reassign vehicle for a ${res.status} reservation.`, error: "CONFLICT" }
    }

    // 2. Fetch target vehicle
    const { data: vehicle, error: vErr } = await supabase
      .from("vehicles")
      .select("id, make, model, plate_number, fleet_status")
      .eq("id", vehicleId)
      .single()

    if (vErr || !vehicle) {
      return { success: false, message: `Vehicle not found: ${vehicleId}`, error: "NOT_FOUND" }
    }

    if (
      vehicle.fleet_status === "maintenance" ||
      vehicle.fleet_status === "inactive" ||
      vehicle.fleet_status === "retired"
    ) {
      return {
        success: false,
        message: `Vehicle ${vehicle.plate_number} is unavailable (${vehicle.fleet_status}).`,
        error: "UNAVAILABLE",
      }
    }

    const now = new Date().toISOString()

    // 3. Update reservation
    const { error: updateErr } = await supabase
      .from("reservations")
      .update({
        vehicle_id: vehicleId,
        assigned_vehicle_id: vehicleId,
        updated_at: now,
      })
      .eq("id", reservationId)

    if (updateErr) {
      return { success: false, message: `Failed to assign vehicle: ${updateErr.message}`, error: updateErr.message }
    }

    // 4. Update vehicle status to reserved if reservation is confirmed or pickup_ready
    if (["confirmed", "pickup_ready"].includes(res.status)) {
      await supabase
        .from("vehicles")
        .update({ fleet_status: "reserved", updated_at: now })
        .eq("id", vehicleId)
    }

    // 5. Release previously assigned vehicle if it differs
    if (res.assigned_vehicle_id && res.assigned_vehicle_id !== vehicleId) {
      await supabase
        .from("vehicles")
        .update({ fleet_status: "available", updated_at: now })
        .eq("id", res.assigned_vehicle_id)
    }

    // 6. Record audit event
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "vehicle.assigned",
      resourceType: "reservation",
      resourceId: reservationId,
      result: "success",
      details: `Assigned vehicle ${vehicle.make} ${vehicle.model} (${vehicle.plate_number}) to reservation ${res.reference || reservationId}.`,
      beforeState: { assigned_vehicle_id: res.assigned_vehicle_id },
      afterState: { assigned_vehicle_id: vehicleId },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/reservations")
    revalidatePath(`/admin/reservations/${reservationId}`)
    revalidatePath("/admin/fleet")

    return {
      success: true,
      message: `Vehicle ${vehicle.plate_number} assigned to reservation.`,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: errorMsg, error: errorMsg }
  }
}

/**
 * Record a payment transaction for a reservation.
 * Updates payment ledger and reservation payment status.
 */
export async function recordPaymentAction(input: {
  reservationId: string
  customerId: string
  amount: number
  method: "card" | "e_wallet" | "counter" | "bank_transfer"
  type: "rental" | "deposit" | "extra_charge" | "late_fee"
  notes?: string
}): Promise<ActionResult<{ paymentId: string }>> {
  try {
    const staff = await requireAdminStaff(["finance", "branch_manager", "admin", "superadmin"])
    const serviceClient = createServiceClient()

    const amountCentavos = Math.round(input.amount * 100)
    if (amountCentavos <= 0) {
      return { success: false, message: "Payment amount must be greater than zero.", error: "INVALID_AMOUNT" }
    }

    const now = new Date().toISOString()
    const txnRef = `MAN-${Date.now().toString(36).toUpperCase()}`

    // Insert payment record via service client
    const { data: payment, error: pErr } = await serviceClient
      .from("payments")
      .insert({
        reservation_id: input.reservationId,
        customer_id: input.customerId,
        type: input.type,
        amount: amountCentavos,
        currency: "PHP",
        status: "captured",
        method: input.method,
        provider: "counter_manual",
        provider_txn_ref: txnRef,
        notes: input.notes || `Recorded by ${staff.email}`,
      })
      .select("id")
      .single()

    if (pErr || !payment) {
      return { success: false, message: `Failed to record payment: ${pErr?.message}`, error: pErr?.message }
    }

    // Update reservation payment status
    await serviceClient
      .from("reservations")
      .update({
        payment_status: "captured",
        payment_method: input.method,
        updated_at: now,
      })
      .eq("id", input.reservationId)

    // Audit event
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "payment.captured",
      resourceType: "payment",
      resourceId: payment.id,
      result: "success",
      details: `Payment of ₱${input.amount.toLocaleString()} (${input.method}) captured for reservation ${input.reservationId}. Ref: ${txnRef}`,
      afterState: { paymentId: payment.id, amountCentavos, status: "captured" },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/payments")
    revalidatePath("/admin/reservations")
    revalidatePath(`/admin/reservations/${input.reservationId}`)

    return {
      success: true,
      message: `Payment of ₱${input.amount.toLocaleString()} successfully recorded (Ref: ${txnRef}).`,
      data: { paymentId: payment.id },
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: errorMsg, error: errorMsg }
  }
}

/**
 * Update staff role and/or status.
 * RESTRICTED: superadmin (Veyra Owner) only!
 */
export async function updateStaffRoleAction(input: {
  staffUserId: string
  newRole: StaffRole
  newStatus?: "active" | "inactive" | "suspended"
}): Promise<ActionResult> {
  try {
    const staff = await requireAdminStaff(["superadmin"])
    const serviceClient = createServiceClient()

    const { data: currentStaff, error: fetchErr } = await serviceClient
      .from("staff_users")
      .select("id, user_id, role, status, first_name, last_name, employee_id")
      .eq("id", input.staffUserId)
      .single()

    if (fetchErr || !currentStaff) {
      return { success: false, message: "Staff user not found.", error: "NOT_FOUND" }
    }

    const now = new Date().toISOString()
    const updatePayload: { role: StaffRole; status?: "active" | "inactive" | "suspended"; updated_at: string } = {
      role: input.newRole,
      updated_at: now,
    }

    if (input.newStatus) {
      updatePayload.status = input.newStatus
    }

    const { error: updateErr } = await serviceClient
      .from("staff_users")
      .update(updatePayload)
      .eq("id", input.staffUserId)

    if (updateErr) {
      return { success: false, message: `Failed to update staff role: ${updateErr.message}`, error: updateErr.message }
    }

    // Audit event
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "user.role_changed",
      resourceType: "staff_user",
      resourceId: input.staffUserId,
      result: "success",
      details: `Role for ${currentStaff.first_name} ${currentStaff.last_name} (${currentStaff.employee_id}) changed from ${currentStaff.role} to ${input.newRole} by ${staff.email}.`,
      beforeState: { role: currentStaff.role, status: currentStaff.status },
      afterState: { role: input.newRole, status: input.newStatus || currentStaff.status },
    })

    revalidatePath("/admin/users")
    revalidatePath("/admin")

    return {
      success: true,
      message: `Staff member updated to ${input.newRole}.`,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: errorMsg, error: errorMsg }
  }
}

/**
 * Complete maintenance for a vehicle and restore it to available status.
 */
export async function completeMaintenanceAction(input: {
  maintenanceId: string
  vehicleId: string
  actualCost?: number
  notes?: string
}): Promise<ActionResult> {
  try {
    const staff = await requireAdminStaff(["fleet_manager", "branch_manager", "admin", "superadmin"])
    const supabase = createClient()
    const now = new Date().toISOString()

    // 1. Update maintenance record
    const { error: mErr } = await supabase
      .from("maintenance_records")
      .update({
        status: "completed",
        completed_date: now.split("T")[0],
        actual_cost: input.actualCost ? Math.round(input.actualCost * 100) : null,
        notes: input.notes || "Completed by staff",
        updated_at: now,
      })
      .eq("id", input.maintenanceId)

    if (mErr) {
      return { success: false, message: `Failed to complete maintenance: ${mErr.message}`, error: mErr.message }
    }

    // 2. Restore vehicle to available
    await supabase
      .from("vehicles")
      .update({
        fleet_status: "available",
        last_inspection_date: now.split("T")[0],
        updated_at: now,
      })
      .eq("id", input.vehicleId)

    // 3. Close open availability block for this vehicle
    await supabase
      .from("availability_blocks")
      .delete()
      .eq("vehicle_id", input.vehicleId)
      .eq("type", "maintenance")

    // 4. Audit event
    await recordAuditEvent({
      actorId: staff.userId,
      actorRole: staff.role,
      action: "vehicle.status_changed",
      resourceType: "maintenance_record",
      resourceId: input.maintenanceId,
      result: "success",
      details: `Maintenance record ${input.maintenanceId} completed. Vehicle restored to available status.`,
      beforeState: { fleet_status: "maintenance" },
      afterState: { fleet_status: "available" },
    })

    revalidatePath("/admin")
    revalidatePath("/admin/fleet")
    revalidatePath(`/admin/fleet/${input.vehicleId}`)
    revalidatePath("/admin/maintenance")
    revalidatePath("/vehicles")

    return {
      success: true,
      message: "Maintenance completed. Vehicle returned to available fleet.",
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return { success: false, message: errorMsg, error: errorMsg }
  }
}

