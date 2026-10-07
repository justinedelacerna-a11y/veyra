import "server-only"
import { createClient } from "@/lib/supabase/server"
import { getVehicleImageUrl } from "@/lib/supabase/storage"
import type { Database } from "@/types/database"
import type { Vehicle, VehicleCategory, VehicleImage } from "@/types"

export type VehicleCatalogRow = Database["public"]["Views"]["vehicle_catalog"]["Row"]

export interface CatalogQueryRow extends VehicleCatalogRow {
  vehicle_classes?: {
    name: string
    category: string
  } | null
  branches?: {
    id: string
    name: string
    city: string
  } | null
}

export interface VehicleCatalogFilterOptions {
  category?: VehicleCategory
  branchId?: string
  locationId?: string
  barangay?: string
  searchQuery?: string
  transmission?: string
  fuelTypes?: string[]
  minSeats?: number
  maxPrice?: number
}

export interface VehicleCatalogResult {
  data: Vehicle[]
  count: number
  error: string | null
}

/**
 * Maps a database vehicle_catalog view row (with joined class, branch, and location)
 * into the domain Vehicle interface used by Veyra components.
 */
export function mapCatalogRowToVehicle(row: CatalogQueryRow): Vehicle {
  const rawCategory = (row.vehicle_classes?.category || "sedan").toLowerCase()
  const validCategories: VehicleCategory[] = ["sedan", "suv", "electric", "van", "luxury"]
  const category: VehicleCategory = validCategories.includes(rawCategory as VehicleCategory)
    ? (rawCategory as VehicleCategory)
    : "sedan"

  const rawTrans = (row.transmission || "automatic").toLowerCase()
  const transmission: "Automatic" | "Manual" = rawTrans.includes("man") ? "Manual" : "Automatic"

  const rawFuel = (row.fuel_type || "petrol").toLowerCase()
  let fuelType: "Petrol" | "Diesel" | "Electric" | "Hybrid" = "Petrol"
  if (rawFuel.includes("elec")) fuelType = "Electric"
  else if (rawFuel.includes("dies")) fuelType = "Diesel"
  else if (rawFuel.includes("hyb")) fuelType = "Hybrid"

  // Database rates are stored in minor units (centavos); convert to standard units
  const dailyRate = row.daily_rate ? Math.round(row.daily_rate / 100) : 0
  const securityDeposit = row.security_deposit ? Math.round(row.security_deposit / 100) : 0
  const currencySymbol = row.currency === "PHP" || !row.currency ? "₱" : row.currency

  let mileageAllowance: string | undefined
  if (row.mileage_allowance_km) {
    mileageAllowance = `${row.mileage_allowance_km} km/day included`
    if (row.excess_mileage_rate) {
      const excessRate = Math.round(row.excess_mileage_rate / 100)
      mileageAllowance += ` (${currencySymbol}${excessRate}/km thereafter)`
    }
  }

  const barangayLabel = row.barangay ? `Barangay ${row.barangay}` : "Butuan City"

  return {
    id: row.id || "",
    make: row.make || "Unknown",
    model: row.model || "Fleet Vehicle",
    year: row.year || new Date().getFullYear(),
    category,
    transmission,
    fuelType,
    seats: row.seats ?? 4,
    luggage: row.luggage_capacity ?? 2,
    doors: row.doors ?? 4,
    dailyRate,
    currency: currencySymbol,
    badge: row.vehicle_classes?.name || undefined,
    features: [],
    available: row.fleet_status === "available",
    description: `${row.year ?? ""} ${row.make ?? ""} ${row.model ?? ""}. Stationed at ${row.location_name || barangayLabel}, Butuan City. Maintained to multi-point inspection standards.`.trim(),
    rating: 5.0,
    tripsCount: 0,
    securityDeposit,
    mileageAllowance,
    locationId: row.location_id || undefined,
    locationName: row.location_name || undefined,
    barangay: row.barangay || undefined,
  }
}

/**
 * Server-side Vehicle Repository
 * Reads directly from the live public.vehicle_catalog view via Supabase.
 * Respects RLS and uses standard user/anon permissions.
 */
export async function getVehicleCatalog(
  filters?: VehicleCatalogFilterOptions
): Promise<VehicleCatalogResult> {
  try {
    const supabase = createClient()

    let query = supabase
      .from("vehicle_catalog")
      .select("*, vehicle_classes(name, category), branches(id, name, city)")

    if (filters?.branchId) {
      query = query.eq("branch_id", filters.branchId)
    }

    if (filters?.locationId) {
      query = query.eq("location_id", filters.locationId)
    }

    if (filters?.barangay) {
      query = query.eq("barangay", filters.barangay)
    }

    if (filters?.searchQuery?.trim()) {
      const search = filters.searchQuery.trim()
      query = query.or(`make.ilike.%${search}%,model.ilike.%${search}%`)
    }

    const { data, error } = await query

    if (error) {
      return {
        data: [],
        count: 0,
        error: error.message,
      }
    }

    if (!data) {
      return {
        data: [],
        count: 0,
        error: null,
      }
    }

    let mapped = (data as unknown as CatalogQueryRow[]).map(mapCatalogRowToVehicle)

    // Apply category filter if specified
    if (filters?.category) {
      mapped = mapped.filter((v) => v.category === filters.category)
    }

    await attachVehicleImages(supabase, mapped)

    return {
      data: mapped,
      count: mapped.length,
      error: null,
    }
  } catch (err) {
    return {
      data: [],
      count: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Retrieve a single vehicle by ID from the public.vehicle_catalog view.
 */
export async function getVehicleById(
  id: string
): Promise<{ data: Vehicle | null; error: string | null }> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("vehicle_catalog")
      .select("*, vehicle_classes(name, category), branches(id, name, city)")
      .eq("id", id)
      .maybeSingle()

    if (error) {
      return { data: null, error: error.message }
    }

    if (!data) {
      return { data: null, error: null }
    }

    const vehicle = mapCatalogRowToVehicle(data as unknown as CatalogQueryRow)

    // Attach real photos
    await attachVehicleImages(supabase, [vehicle])

    // Attempt to query any additional public features if available
    try {
      const { data: featureRows } = await supabase
        .from("vehicle_features")
        .select("feature")
        .eq("vehicle_id", id)

      if (featureRows && featureRows.length > 0) {
        vehicle.features = featureRows.map((f) => f.feature)
      }
    } catch {
      // Non-critical: keep empty features if query is unsupported
    }

    return { data: vehicle, error: null }
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Retrieve featured vehicles for landing pages or highlights.
 */
export async function getFeaturedVehicles(
  limit = 4
): Promise<VehicleCatalogResult> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase
      .from("vehicle_catalog")
      .select("*, vehicle_classes(name, category), branches(id, name, city)")
      .limit(limit)

    if (error) {
      return { data: [], count: 0, error: error.message }
    }

    const mapped = ((data || []) as unknown as CatalogQueryRow[]).map(mapCatalogRowToVehicle)
    await attachVehicleImages(supabase, mapped)

    return { data: mapped, count: mapped.length, error: null }
  } catch (err) {
    return {
      data: [],
      count: 0,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Helper to query and attach real vehicle images from vehicle_images table.
 */
async function attachVehicleImages(
  supabase: ReturnType<typeof createClient>,
  vehicles: Vehicle[]
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
    console.error("[attachVehicleImages] Non-fatal image fetch error:", err)
  }
}
