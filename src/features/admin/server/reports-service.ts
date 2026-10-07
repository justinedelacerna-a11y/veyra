import "server-only"
import { createClient } from "@/lib/supabase/server"

export interface RevenueByDay {
  date: string
  revenue: number
  reservations: number
}

export interface VehicleUtilization {
  vehicleId: string
  vehicleName: string
  plateNumber: string
  branch: string
  totalRentals: number
  totalRevenue: number
  totalDays: number
}

export interface ReportSummary {
  totalRevenue: number
  totalReservations: number
  completedReservations: number
  cancelledReservations: number
  totalCustomers: number
  averageRentalDays: number
  revenueByDay: RevenueByDay[]
  topVehicles: VehicleUtilization[]
  cancelledCount: number
  pendingPayments: number
}

export async function getAdminReportPageData(): Promise<{
  summary: ReportSummary
  fromDate: string
  toDate: string
}> {
  const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const toDate = new Date().toISOString().split("T")[0]
  const summary = await getAdminReportSummary({ fromDate, toDate })
  return { summary, fromDate, toDate }
}

export async function getAdminReportSummary(options?: {
  fromDate?: string
  toDate?: string
}): Promise<ReportSummary> {
  const supabase = createClient()

  const fromDate = options?.fromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const toDate = options?.toDate || new Date().toISOString().split("T")[0]

  // Fetch reservations in date range
  const { data: reservations, error: resErr } = await supabase
    .from("reservations")
    .select(`
      id,
      status,
      payment_status,
      total_amount,
      rental_days,
      created_at,
      pickup_at,
      vehicles:vehicles!reservations_vehicle_id_fkey (
        id, make, model, plate_number,
        branches (name)
      )
    `)
    .gte("created_at", `${fromDate}T00:00:00.000Z`)
    .lte("created_at", `${toDate}T23:59:59.999Z`)
    .not("status", "in", '("draft","expired")')

  if (resErr) {
    console.error("[getAdminReportSummary] Reservations error:", resErr)
  }

  const rows = reservations || []

  // Revenue calculation (completed + active = revenue realized)
  const totalRevenueCentavos = rows
    .filter((r) => r.status === "completed" || r.status === "active" || r.status === "return_inspection")
    .reduce((sum, r) => sum + Number(r.total_amount || 0), 0)

  const completed = rows.filter((r) => r.status === "completed").length
  const cancelled = rows.filter((r) => r.status === "cancelled" || r.status === "no_show").length
  const pendingPayments = rows.filter((r) => r.payment_status === "pending").length

  const totalDays = rows.reduce((sum, r) => sum + (Number(r.rental_days) || 0), 0)
  const avgDays = rows.length > 0 ? Math.round((totalDays / rows.length) * 10) / 10 : 0

  // Revenue by day (last 30 days)
  const dayMap: Record<string, { revenue: number; count: number }> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    dayMap[d] = { revenue: 0, count: 0 }
  }

  for (const r of rows) {
    const day = r.created_at?.split("T")[0]
    if (day && dayMap[day] !== undefined) {
      dayMap[day].count += 1
      if (r.status === "completed" || r.status === "active") {
        dayMap[day].revenue += Math.round(Number(r.total_amount || 0) / 100)
      }
    }
  }

  const revenueByDay: RevenueByDay[] = Object.entries(dayMap)
    .map(([date, val]) => ({ date, revenue: val.revenue, reservations: val.count }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Top vehicles by rental count
  interface VehicleRow {
    id: string
    make: string
    model: string
    plate_number: string
    branches?: { name: string } | null
  }

  const vehicleMap: Record<string, { vehicle: VehicleRow; count: number; revenue: number; days: number }> = {}

  for (const r of rows) {
    const v = (r.vehicles as unknown as VehicleRow | null)
    if (!v) continue
    if (!vehicleMap[v.id]) {
      vehicleMap[v.id] = { vehicle: v, count: 0, revenue: 0, days: 0 }
    }
    vehicleMap[v.id].count += 1
    vehicleMap[v.id].days += Number(r.rental_days || 0)
    if (r.status === "completed" || r.status === "active") {
      vehicleMap[v.id].revenue += Math.round(Number(r.total_amount || 0) / 100)
    }
  }

  const topVehicles: VehicleUtilization[] = Object.values(vehicleMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .map((entry) => ({
      vehicleId: entry.vehicle.id,
      vehicleName: `${entry.vehicle.make} ${entry.vehicle.model}`,
      plateNumber: entry.vehicle.plate_number,
      branch: entry.vehicle.branches?.name || "Main Hub",
      totalRentals: entry.count,
      totalRevenue: entry.revenue,
      totalDays: entry.days,
    }))

  // Customer count
  const { count: customerCount } = await supabase
    .from("customers")
    .select("id", { count: "exact", head: true })

  return {
    totalRevenue: Math.round(totalRevenueCentavos / 100),
    totalReservations: rows.length,
    completedReservations: completed,
    cancelledReservations: cancelled,
    totalCustomers: customerCount || 0,
    averageRentalDays: avgDays,
    revenueByDay,
    topVehicles,
    cancelledCount: cancelled,
    pendingPayments,
  }
}
