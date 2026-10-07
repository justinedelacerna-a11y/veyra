import "server-only"
import { createClient } from "@/lib/supabase/server"
import { getAdminFleetList, FleetSummary } from "./fleet-service"
import { getAdminReservationsList } from "./reservations-service"
import type { AdminReservation, FleetVehicle } from "@/features/admin/types"

export interface AdminDashboardData {
  fleetSummary: FleetSummary
  todayPickups: AdminReservation[]
  todayReturns: AdminReservation[]
  activeRentals: AdminReservation[]
  needsAttention: AdminReservation[]
  pendingApprovals: AdminReservation[]
  recentReservations: AdminReservation[]
  maintenanceAlertCount: number
  totalRevenue: number
  utilizationRate: number
  lowFuelVehicles: FleetVehicle[]
  serviceDueVehicles: FleetVehicle[]
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = createClient()

  // 1. Live fleet list & summary
  const { vehicles: allVehicles, summary: fleetSummary } = await getAdminFleetList()

  // 2. Live reservations
  const allReservations = await getAdminReservationsList()

  const todayStr = new Date().toISOString().split("T")[0]

  const todayPickups = allReservations.filter(
    (r) =>
      r.pickupDate === todayStr ||
      r.status === "pickup_ready" ||
      r.status === "confirmed"
  )

  const todayReturns = allReservations.filter(
    (r) =>
      r.returnDate === todayStr ||
      r.status === "return_inspection"
  )

  const activeRentals = allReservations.filter((r) => r.status === "active")

  const pendingApprovals = allReservations.filter(
    (r) => r.status === "held" || r.status === "payment_pending"
  )

  const needsAttention = allReservations.filter(
    (r) =>
      r.status === "payment_pending" ||
      r.status === "return_inspection" ||
      r.status === "disputed"
  )

  const recentReservations = allReservations.slice(0, 8)

  // 3. Revenue calculation (completed, active, confirmed reservations)
  const totalRevenue = allReservations
    .filter((r) => ["confirmed", "pickup_ready", "active", "completed"].includes(r.status))
    .reduce((sum, r) => sum + (r.totalAmount || 0), 0)

  // 4. Fleet Utilization Rate
  const totalFleetCount = fleetSummary.total || 1
  const inUseCount = fleetSummary.rented + fleetSummary.reserved
  const utilizationRate = Math.min(100, Math.round((inUseCount / totalFleetCount) * 100))

  // 5. Low fuel & service due vehicle alerts
  const lowFuelVehicles = allVehicles.filter(
    (v) => typeof v.fuelLevel === "number" && v.fuelLevel <= 25
  )

  const serviceDueVehicles = allVehicles.filter(
    (v) =>
      v.fleetStatus === "maintenance" ||
      (v.nextMaintenanceDue && v.nextMaintenanceDue <= todayStr)
  )

  // 6. Maintenance alerts count
  const { count: maintenanceAlertCount } = await supabase
    .from("maintenance_records")
    .select("id", { count: "exact", head: true })
    .in("status", ["overdue", "due", "in_progress"])

  return {
    fleetSummary,
    todayPickups,
    todayReturns,
    activeRentals,
    needsAttention,
    pendingApprovals,
    recentReservations,
    maintenanceAlertCount: maintenanceAlertCount || serviceDueVehicles.length || 0,
    totalRevenue,
    utilizationRate,
    lowFuelVehicles,
    serviceDueVehicles,
  }
}
