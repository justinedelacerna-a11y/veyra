import "server-only"
import { createClient } from "@/lib/supabase/server"
import type {
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceType,
  InspectionRecord,
  InspectionType,
  InspectionDamageStatus,
  PaymentRecord,
  PaymentStatus,
} from "@/features/admin/types"

interface RawMaintenanceRow {
  id: string
  vehicle_id: string
  type: string
  status: string
  priority: string
  scheduled_date: string
  completed_date?: string | null
  odometer_at_service?: number | null
  estimated_cost?: number | null
  actual_cost?: number | null
  currency?: string | null
  provider?: string | null
  notes?: string | null
  created_at: string
  vehicles?: {
    make: string
    model: string
    plate_number: string
    odometer_km: number
    branches?: { name: string } | null
  } | null
}

export async function getAdminMaintenanceList(): Promise<MaintenanceRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("maintenance_records")
    .select(`
      id,
      vehicle_id,
      branch_id,
      type,
      status,
      priority,
      scheduled_date,
      completed_date,
      odometer_at_service,
      estimated_cost,
      actual_cost,
      currency,
      provider,
      notes,
      created_at,
      vehicles (
        make,
        model,
        plate_number,
        odometer_km,
        branches (name)
      )
    `)
    .order("scheduled_date", { ascending: false })

  if (error) {
    console.error("[getAdminMaintenanceList] Error:", error)
    return []
  }

  return ((data || []) as unknown as RawMaintenanceRow[]).map((m) => {
    const vehicle = m.vehicles || { make: "", model: "", plate_number: "—", odometer_km: 0 }
    const branchName = m.vehicles?.branches?.name || "Main Hub"
    const vehicleName = vehicle.make ? `${vehicle.make} ${vehicle.model}` : "Fleet Vehicle"
    const vehiclePlate = vehicle.plate_number || "—"

    return {
      id: m.id,
      vehicleId: m.vehicle_id,
      vehicleName,
      vehiclePlate,
      branch: branchName,
      type: m.type as MaintenanceType,
      typeLabel: m.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
      status: m.status as MaintenanceStatus,
      priority: m.priority as MaintenancePriority,
      scheduledDate: m.scheduled_date,
      completedDate: m.completed_date || undefined,
      odometer: m.odometer_at_service || vehicle.odometer_km || 0,
      estimatedCost: Math.round(Number(m.estimated_cost || 0) / 100),
      actualCost: m.actual_cost ? Math.round(Number(m.actual_cost) / 100) : undefined,
      currency: m.currency || "PHP",
      provider: m.provider || undefined,
      notes: m.notes || undefined,
      createdAt: m.created_at,
    }
  })
}

export async function getAdminInspectionsList(): Promise<InspectionRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("inspections")
    .select(`
      id,
      reservation_id,
      vehicle_id,
      type,
      customer_present,
      odometer_km,
      fuel_level_pct,
      overall_status,
      damage_status,
      notes,
      completed_at,
      created_at,
      inspector:users!inspector_id (
        email
      ),
      vehicles (
        make,
        model,
        plate_number
      ),
      reservations (
        customers (
          id,
          first_name,
          last_name,
          users (email)
        )
      )
    `)
    .order("created_at", { ascending: false })

interface RawInspectionRow {
  id: string
  reservation_id?: string
  vehicle_id: string
  type: string
  completed_at?: string | null
  created_at: string
  odometer_km?: number | null
  fuel_level_pct?: number | null
  damage_status?: string | null
  notes?: string | null
  inspector?: { email: string } | null
  vehicles?: {
    make: string
    model: string
    plate_number: string
  } | null
  reservations?: {
    customers?: {
      id: string
      first_name?: string | null
      last_name?: string | null
      users?: { email: string } | null
    } | null
  } | null
}

  if (error) {
    console.error("[getAdminInspectionsList] Error:", error)
    return []
  }

  return ((data || []) as unknown as RawInspectionRow[]).map((ins) => {
    const inspectorName = ins.inspector?.email || "Staff Inspector"

    const cust = ins.reservations?.customers
    const customerName = cust?.first_name
      ? `${cust.first_name} ${cust.last_name || ""}`.trim()
      : cust?.users?.email || "Customer"

    const vehicleName = ins.vehicles
      ? `${ins.vehicles.make} ${ins.vehicles.model}`
      : "Fleet Vehicle"

    return {
      id: ins.id,
      reservationId: ins.reservation_id || "",
      vehicleId: ins.vehicle_id,
      vehicleName,
      vehiclePlate: ins.vehicles?.plate_number || "—",
      customerId: ins.reservations?.customers?.id || "",
      customerName,
      type: ins.type as InspectionType,
      inspector: inspectorName,
      date: new Date(ins.completed_at || ins.created_at).toLocaleDateString(),
      startOdometer: ins.odometer_km || 0,
      fuelLevelStart: ins.fuel_level_pct || 100,
      damageStatus: (ins.damage_status || "no_damage") as InspectionDamageStatus,
      checkItems: [],
      notes: ins.notes || undefined,
      completed: true,
    }
  })
}

interface RawPaymentRow {
  id: string
  reservation_id: string
  customer_id: string
  type: string
  amount: number
  currency?: string | null
  status?: string | null
  method?: string | null
  provider?: string | null
  provider_txn_ref?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
  customers?: {
    first_name?: string | null
    last_name?: string | null
    users?: { email: string } | null
  } | null
}

export async function getAdminPaymentsList(): Promise<PaymentRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("payments")
    .select(`
      id,
      reservation_id,
      customer_id,
      type,
      amount,
      currency,
      status,
      method,
      provider,
      provider_txn_ref,
      notes,
      created_at,
      updated_at,
      customers (
        first_name,
        last_name,
        users (email)
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getAdminPaymentsList] Error:", error)
    return []
  }

  return ((data || []) as unknown as RawPaymentRow[]).map((p) => {
    const cust = p.customers
    const customerName = cust?.first_name
      ? `${cust.first_name} ${cust.last_name || ""}`.trim()
      : cust?.users?.email || "Customer"

    return {
      id: p.id,
      reservationId: p.reservation_id,
      customerId: p.customer_id,
      customerName,
      amount: Math.round(Number(p.amount) / 100),
      currency: p.currency || "PHP",
      status: (p.status || "pending") as PaymentStatus,
      method: (p.method || "card") as PaymentRecord["method"],
      provider: p.provider || "paymongo",
      transactionRef: p.provider_txn_ref || p.id.slice(0, 10).toUpperCase(),
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      notes: p.notes || undefined,
    }
  })
}
