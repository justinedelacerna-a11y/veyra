import "server-only"
import { createClient } from "@/lib/supabase/server"
import { getVehicleImageUrl } from "@/lib/supabase/storage"
import type { FleetVehicle, FleetVehicleStatus } from "@/features/admin/types"
import type { VehicleCategory, VehicleImage } from "@/types"

interface RawVehicleRow {
  id: string
  make: string
  model: string
  year: number
  plate_number: string
  vin: string
  color: string | null
  transmission: string
  fuel_type: string
  seats: number
  luggage_capacity: number
  doors: number | null
  daily_rate: number
  security_deposit: number
  currency: string
  fleet_status: string
  condition: string
  odometer_km: number
  fuel_level_pct: number
  last_inspection_date: string | null
  next_maintenance_due: string | null
  next_maintenance_odometer: number | null
  acquisition_date: string
  internal_notes: string | null
  created_at: string
  updated_at: string
  branch_id: string
  vehicle_class_id: string
  location_id?: string | null
  locations?: {
    id: string
    name: string
    barangay: string | null
  } | null
  branches?: {
    id: string
    name: string
    code: string
  } | null
  vehicle_classes?: {
    id: string
    name: string
    category: string
  } | null
  vehicle_features?: Array<{ feature: string }> | null
  vehicle_photos?: Array<{ storage_path: string; bucket: string; type: string }> | null
}

function mapRawToFleetVehicle(row: RawVehicleRow): FleetVehicle {
  const categoryRaw = (row.vehicle_classes?.category || "sedan").toLowerCase()
  const validCategories: VehicleCategory[] = ["sedan", "suv", "electric", "van", "luxury"]
  const category: VehicleCategory = validCategories.includes(categoryRaw as VehicleCategory)
    ? (categoryRaw as VehicleCategory)
    : "sedan"

  const transmission =
    row.transmission.toLowerCase() === "manual" ? "Manual" : "Automatic"
  const fuelRaw = row.fuel_type.toLowerCase()
  const fuelType =
    fuelRaw === "diesel"
      ? "Diesel"
      : fuelRaw === "electric"
      ? "Electric"
      : fuelRaw === "hybrid"
      ? "Hybrid"
      : "Petrol"

  const features = row.vehicle_features?.map((f) => f.feature) ?? []

  const conditionRaw = (row.condition || "good").toLowerCase()
  const condition: "excellent" | "good" | "fair" | "poor" =
    conditionRaw === "excellent" || conditionRaw === "fair" || conditionRaw === "poor"
      ? conditionRaw
      : "good"

  const fleetStatusRaw = (row.fleet_status || "available").toLowerCase() as FleetVehicleStatus

  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    category,
    transmission,
    fuelType,
    seats: row.seats,
    luggage: row.luggage_capacity,
    doors: row.doors ?? 4,
    dailyRate: Math.round(Number(row.daily_rate) / 100), // convert centavos to Pesos
    securityDeposit: Math.round(Number(row.security_deposit) / 100),
    currency: row.currency || "PHP",
    available: fleetStatusRaw === "available",
    features,
    locationId: row.location_id || row.locations?.id,
    locationName: row.locations?.name,
    barangay: row.locations?.barangay || undefined,
    plateNumber: row.plate_number,
    vin: row.vin,
    branch: row.branches?.name || "Main Hub",
    branchId: row.branch_id,
    fleetStatus: fleetStatusRaw,
    odometer: Number(row.odometer_km) || 0,
    fuelLevel: Number(row.fuel_level_pct) || 100,
    lastInspectionDate: row.last_inspection_date || "2026-01-01",
    nextMaintenanceDue: row.next_maintenance_due || "2026-12-31",
    nextMaintenanceOdometer: row.next_maintenance_odometer ?? undefined,
    condition,
    internalNotes: row.internal_notes ?? undefined,
    acquisitionDate: row.acquisition_date || "2024-01-01",
  }
}

export interface FleetSummary {
  total: number
  available: number
  reserved: number
  rented: number
  maintenance: number
  inspection: number
  inactive: number
}

export async function getAdminFleetList(options?: {
  status?: string
  search?: string
}): Promise<{ vehicles: FleetVehicle[]; summary: FleetSummary }> {
  const supabase = createClient()

  let query = supabase
    .from("vehicles")
    .select(`
      id,
      make,
      model,
      year,
      plate_number,
      vin,
      color,
      transmission,
      fuel_type,
      seats,
      luggage_capacity,
      doors,
      daily_rate,
      security_deposit,
      currency,
      fleet_status,
      condition,
      odometer_km,
      fuel_level_pct,
      last_inspection_date,
      next_maintenance_due,
      next_maintenance_odometer,
      acquisition_date,
      internal_notes,
      created_at,
      updated_at,
      branch_id,
      vehicle_class_id,
      location_id,
      locations (id, name, barangay),
      branches (id, name, city),
      vehicle_classes (id, name, category),
      vehicle_features (feature)
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })

  if (options?.status && options.status !== "all") {
    query = query.eq("fleet_status", options.status)
  }

  const { data, error } = await query

  if (error) {
    console.error("[getAdminFleetList] Database error:", error)
    throw new Error(`Failed to load fleet data: ${error.message}`)
  }

  const rawVehicles = (data || []) as unknown as RawVehicleRow[]
  let vehicles = rawVehicles.map(mapRawToFleetVehicle)

  // Attach real images from vehicle_images table
  await attachFleetVehicleImages(supabase, vehicles)

  if (options?.search?.trim()) {
    const q = options.search.toLowerCase()
    vehicles = vehicles.filter(
      (v) =>
        `${v.make} ${v.model}`.toLowerCase().includes(q) ||
        v.plateNumber.toLowerCase().includes(q) ||
        v.branch.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q)
    )
  }

  // Summary counts across all active vehicles in fleet
  const summary: FleetSummary = {
    total: rawVehicles.length,
    available: rawVehicles.filter((v) => v.fleet_status === "available").length,
    reserved: rawVehicles.filter((v) => v.fleet_status === "reserved").length,
    rented: rawVehicles.filter((v) => v.fleet_status === "rented").length,
    maintenance: rawVehicles.filter((v) => v.fleet_status === "maintenance").length,
    inspection: rawVehicles.filter((v) => v.fleet_status === "inspection").length,
    inactive: rawVehicles.filter((v) => v.fleet_status === "inactive" || v.fleet_status === "retired").length,
  }

  return { vehicles, summary }
}

export async function getAdminVehicleById(id: string): Promise<{
  vehicle: FleetVehicle | null
  reservations: Array<{
    id: string
    reference: string
    customerName: string
    pickupDate: string
    returnDate: string
    status: string
    totalAmount: number
  }>
  maintenances: Array<{
    id: string
    type: string
    status: string
    scheduledDate: string
    estimatedCost: number
    notes?: string
  }>
}> {
  const supabase = createClient()

  // 1. Fetch vehicle with relations
  const { data: vData, error: vErr } = await supabase
    .from("vehicles")
    .select(`
      id,
      make,
      model,
      year,
      plate_number,
      vin,
      color,
      transmission,
      fuel_type,
      seats,
      luggage_capacity,
      doors,
      daily_rate,
      security_deposit,
      currency,
      fleet_status,
      condition,
      odometer_km,
      fuel_level_pct,
      last_inspection_date,
      next_maintenance_due,
      next_maintenance_odometer,
      acquisition_date,
      internal_notes,
      created_at,
      updated_at,
      branch_id,
      vehicle_class_id,
      location_id,
      locations (id, name, barangay),
      branches (id, name, city),
      vehicle_classes (id, name, category),
      vehicle_features (feature)
    `)
    .eq("id", id)
    .maybeSingle()

  if (vErr || !vData) {
    if (vErr) console.error("[getAdminVehicleById] Error:", vErr)
    return { vehicle: null, reservations: [], maintenances: [] }
  }

  const vehicle = mapRawToFleetVehicle(vData as unknown as RawVehicleRow)
  await attachFleetVehicleImages(supabase, [vehicle])

  // 2. Fetch reservations for this vehicle
  const { data: rData } = await supabase
    .from("reservations")
    .select(`
      id,
      reference,
      pickup_at,
      return_at,
      status,
      total_amount,
      customers (
        first_name,
        last_name,
        users (email)
      )
    `)
    .eq("vehicle_id", id)
    .order("pickup_at", { ascending: false })
    .limit(10)

  interface VehicleReservationRow {
    id: string
    reference: string
    pickup_at: string
    return_at: string
    status: string
    total_amount: number
    customers?: {
      first_name: string | null
      last_name: string | null
      users?: { email: string } | null
    } | null
  }

  const reservations = ((rData || []) as unknown as VehicleReservationRow[]).map((r) => ({
    id: r.id,
    reference: r.reference,
    customerName:
      r.customers?.first_name
        ? `${r.customers.first_name} ${r.customers.last_name || ""}`.trim()
        : r.customers?.users?.email || "Valued Customer",
    pickupDate: new Date(r.pickup_at).toLocaleDateString(),
    returnDate: new Date(r.return_at).toLocaleDateString(),
    status: r.status,
    totalAmount: Math.round(Number(r.total_amount) / 100),
  }))

  // 3. Fetch maintenance records
  const { data: mData } = await supabase
    .from("maintenance_records")
    .select("id, type, status, scheduled_date, estimated_cost, notes")
    .eq("vehicle_id", id)
    .order("scheduled_date", { ascending: false })
    .limit(10)

  interface VehicleMaintenanceRow {
    id: string
    type: string
    status: string
    scheduled_date: string
    estimated_cost: number | null
    notes: string | null
  }

  const maintenances = ((mData || []) as unknown as VehicleMaintenanceRow[]).map((m) => ({
    id: m.id,
    type: m.type,
    status: m.status,
    scheduledDate: m.scheduled_date,
    estimatedCost: Math.round(Number(m.estimated_cost || 0) / 100),
    notes: m.notes || undefined,
  }))

  return { vehicle, reservations, maintenances }
}

/**
 * Query and attach real vehicle images from vehicle_images table to FleetVehicle instances.
 */
async function attachFleetVehicleImages(
  supabase: ReturnType<typeof createClient>,
  vehicles: FleetVehicle[]
): Promise<void> {
  if (vehicles.length === 0) return

  const vehicleIds = vehicles.map((v) => v.id).filter(Boolean)
  if (vehicleIds.length === 0) return

  try {
    const { data: imageRows } = await supabase
      .from("vehicle_images")
      .select("id, vehicle_id, storage_path, alt_text, sort_order, is_primary, created_at")
      .in("vehicle_id", vehicleIds)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (!imageRows || imageRows.length === 0) return

    const imageMap = new Map<string, VehicleImage[]>()
    for (const raw of imageRows) {
      const row = raw as {
        id: string
        vehicle_id: string
        storage_path: string
        alt_text: string | null
        sort_order: number
        is_primary: boolean
        created_at: string
      }
      const vId = row.vehicle_id
      if (!imageMap.has(vId)) imageMap.set(vId, [])
      imageMap.get(vId)!.push({
        id: row.id,
        vehicleId: row.vehicle_id,
        storagePath: row.storage_path,
        altText: row.alt_text,
        sortOrder: row.sort_order,
        isPrimary: Boolean(row.is_primary),
        createdAt: row.created_at,
        url: getVehicleImageUrl(row.storage_path),
      })
    }

    for (const v of vehicles) {
      const images = imageMap.get(v.id) || []
      v.imageRecords = images
      v.images = images.map((img) => img.url)
      const primary = images.find((img) => img.isPrimary) || images[0]
      v.primaryImage = primary?.url || undefined
    }
  } catch (err) {
    console.error("[attachFleetVehicleImages] Non-fatal image fetch error:", err)
  }
}
