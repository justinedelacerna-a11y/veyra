import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { AdminReservation, AdminReservationStatus } from "@/features/admin/types"

interface RawReservationRow {
  id: string
  reference: string
  customer_id: string
  quote_id: string
  vehicle_id: string
  assigned_vehicle_id: string | null
  pickup_location_id: string
  return_location_id: string
  pickup_at: string
  return_at: string
  actual_pickup_at: string | null
  actual_return_at: string | null
  rental_days: number
  status: string
  payment_status: string
  payment_method: string | null
  total_amount: number
  deposit_amount: number
  currency: string
  internal_notes: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
  customers?: {
    id: string
    first_name?: string | null
    last_name?: string | null
    users?: {
      id: string
      email: string
    } | null
  } | null
  vehicles?: {
    id: string
    make: string
    model: string
    plate_number: string
    branches?: {
      name: string
    } | null
  } | null
  pickup_locations?: {
    id: string
    name: string
    barangay?: string
    city: string
  } | null
  return_locations?: {
    id: string
    name: string
    barangay?: string
    city: string
  } | null
}

function mapRawToAdminReservation(r: RawReservationRow): AdminReservation {
  const customerName = r.customers?.first_name
    ? `${r.customers.first_name} ${r.customers.last_name || ""}`.trim()
    : r.customers?.users?.email || "Guest Customer"

  const vehicleName = r.vehicles
    ? `${r.vehicles.make} ${r.vehicles.model}`
    : "Unassigned Fleet Vehicle"

  const pickupDateObj = new Date(r.pickup_at)
  const returnDateObj = new Date(r.return_at)

  const paymentStatusRaw = (r.payment_status || "pending").toLowerCase()
  const paymentStatus: "pending" | "authorized" | "captured" | "refunded" | "failed" =
    paymentStatusRaw === "authorized" ||
    paymentStatusRaw === "captured" ||
    paymentStatusRaw === "refunded" ||
    paymentStatusRaw === "failed"
      ? paymentStatusRaw
      : "pending"

  return {
    id: r.id,
    reference: r.reference,
    status: r.status as AdminReservationStatus,
    customerId: r.customer_id,
    customerName,
    customerEmail: r.customers?.users?.email || "",
    vehicleId: r.vehicle_id,
    vehicleName,
    vehiclePlate: r.vehicles?.plate_number || "—",
    branch: r.vehicles?.branches?.name || "Main Hub",
    pickupLocationId: r.pickup_location_id,
    pickupLocationName: r.pickup_locations?.name || "Barangay Libertad Hub",
    pickupBarangay: r.pickup_locations?.barangay || "Libertad",
    pickupDate: pickupDateObj.toISOString().split("T")[0],
    pickupTime: pickupDateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    returnLocationId: r.return_location_id,
    returnLocationName: r.return_locations?.name || "Barangay Libertad Hub",
    returnBarangay: r.return_locations?.barangay || "Libertad",
    returnDate: returnDateObj.toISOString().split("T")[0],
    returnTime: returnDateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    rentalDays: r.rental_days || 1,
    totalAmount: Math.round(Number(r.total_amount) / 100),
    depositAmount: Math.round(Number(r.deposit_amount) / 100),
    currency: r.currency || "PHP",
    paymentStatus,
    paymentMethod: r.payment_method || "counter",
    extras: [],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    assignedVehicleId: r.assigned_vehicle_id || undefined,
    internalNotes: r.internal_notes || undefined,
  }
}

export async function getAdminReservationsList(options?: {
  status?: string
  search?: string
  date?: string
}): Promise<AdminReservation[]> {
  const supabase = createClient()

  let query = supabase
    .from("reservations")
    .select(`
      id,
      reference,
      customer_id,
      quote_id,
      vehicle_id,
      assigned_vehicle_id,
      pickup_location_id,
      return_location_id,
      pickup_at,
      return_at,
      actual_pickup_at,
      actual_return_at,
      rental_days,
      status,
      payment_status,
      payment_method,
      total_amount,
      deposit_amount,
      currency,
      internal_notes,
      cancellation_reason,
      created_at,
      updated_at,
      customers (
        id,
        first_name,
        last_name,
        users (id, email)
      ),
      vehicles:vehicles!reservations_vehicle_id_fkey (
        id,
        make,
        model,
        plate_number,
        branches (name)
      ),
      pickup_locations:locations!pickup_location_id (
        id,
        name,
        barangay,
        city
      ),
      return_locations:locations!return_location_id (
        id,
        name,
        barangay,
        city
      )
    `)
    .order("created_at", { ascending: false })

  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status)
  }

  const { data, error } = await query

  if (error) {
    console.error("[getAdminReservationsList] Database query error:", error)
    throw new Error(`Failed to load reservations: ${error.message}`)
  }

  let reservations = ((data || []) as unknown as RawReservationRow[]).map(mapRawToAdminReservation)

  if (options?.search?.trim()) {
    const q = options.search.toLowerCase()
    reservations = reservations.filter(
      (r) =>
        r.reference?.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        r.customerName.toLowerCase().includes(q) ||
        r.customerEmail.toLowerCase().includes(q) ||
        r.vehicleName.toLowerCase().includes(q) ||
        r.vehiclePlate.toLowerCase().includes(q)
    )
  }

  if (options?.date?.trim()) {
    reservations = reservations.filter(
      (r) => r.pickupDate === options.date || r.returnDate === options.date
    )
  }

  return reservations
}

export async function getAdminReservationById(idOrRef: string): Promise<AdminReservation | null> {
  const supabase = createClient()

  let query = supabase
    .from("reservations")
    .select(`
      id,
      reference,
      customer_id,
      quote_id,
      vehicle_id,
      assigned_vehicle_id,
      pickup_location_id,
      return_location_id,
      pickup_at,
      return_at,
      actual_pickup_at,
      actual_return_at,
      rental_days,
      status,
      payment_status,
      payment_method,
      total_amount,
      deposit_amount,
      currency,
      internal_notes,
      cancellation_reason,
      created_at,
      updated_at,
      customers (
        id,
        first_name,
        last_name,
        users (id, email)
      ),
      vehicles:vehicles!reservations_vehicle_id_fkey (
        id,
        make,
        model,
        plate_number,
        branches (name)
      ),
      pickup_locations:locations!pickup_location_id (
        id,
        name,
        barangay,
        city
      ),
      return_locations:locations!return_location_id (
        id,
        name,
        barangay,
        city
      )
    `)

  // Check if idOrRef is UUID or Reference
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrRef)
  if (isUUID) {
    query = query.eq("id", idOrRef)
  } else {
    query = query.eq("reference", idOrRef)
  }

  const { data, error } = await query.maybeSingle()

  if (error || !data) {
    if (error) console.error("[getAdminReservationById] Error:", error)
    return null
  }

  return mapRawToAdminReservation(data as unknown as RawReservationRow)
}
