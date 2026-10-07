import "server-only"
import { createClient } from "@/lib/supabase/server"

export interface AdminLocation {
  id: string
  branchId: string
  branchName: string
  name: string
  barangay?: string
  province: string
  type: "airport_terminal" | "city_center" | "private_hub" | "barangay_hub"
  address: string
  city: string
  operatingHours: string
  pickupAvailable: boolean
  pickupEnabled: boolean
  returnAvailable: boolean
  returnEnabled: boolean
  timezone: string
  status: "active" | "inactive"
  createdAt: string
}

export interface AdminBranch {
  id: string
  name: string
  city: string
  timezone: string
  contactPhone: string | null
  contactEmail: string | null
  status: "active" | "inactive"
  locationCount: number
}

export async function getAdminLocationsList(): Promise<{ locations: AdminLocation[]; branches: AdminBranch[] }> {
  const supabase = createClient()

  const [{ data: locData, error: locErr }, { data: branchData, error: branchErr }] = await Promise.all([
    supabase
      .from("locations")
      .select(`
        id,
        branch_id,
        name,
        barangay,
        type,
        address,
        city,
        province,
        operating_hours,
        pickup_available,
        pickup_enabled,
        return_available,
        return_enabled,
        timezone,
        status,
        created_at,
        branches (id, name, city)
      `)
      .order("name"),
    supabase
      .from("branches")
      .select("id, name, city, timezone, contact_phone, contact_email, status, created_at")
      .order("name"),
  ])

  if (locErr) console.error("[getAdminLocationsList] Locations error:", locErr)
  if (branchErr) console.error("[getAdminLocationsList] Branches error:", branchErr)

  interface RawLocRow {
    id: string
    branch_id: string
    name: string
    barangay?: string | null
    type: string
    address: string
    city: string
    province?: string | null
    operating_hours: string
    pickup_available: boolean
    pickup_enabled?: boolean | null
    return_available: boolean
    return_enabled?: boolean | null
    timezone: string
    status: string
    created_at: string
    branches?: { id: string; name: string; city: string } | null
  }

  const locations: AdminLocation[] = ((locData || []) as unknown as RawLocRow[]).map((l) => ({
    id: l.id,
    branchId: l.branch_id,
    branchName: l.branches?.name || "Main Branch",
    name: l.name,
    barangay: l.barangay || undefined,
    province: l.province || "Agusan del Norte",
    type: l.type as AdminLocation["type"],
    address: l.address,
    city: l.city,
    operatingHours: l.operating_hours,
    pickupAvailable: l.pickup_available ?? l.pickup_enabled ?? true,
    pickupEnabled: l.pickup_enabled ?? l.pickup_available ?? true,
    returnAvailable: l.return_available ?? l.return_enabled ?? true,
    returnEnabled: l.return_enabled ?? l.return_available ?? true,
    timezone: l.timezone,
    status: l.status as AdminLocation["status"],
    createdAt: l.created_at,
  }))

  interface RawBranchRow {
    id: string
    name: string
    city: string
    timezone: string
    contact_phone: string | null
    contact_email: string | null
    status: string
  }

  const locationCountByBranch: Record<string, number> = {}
  locations.forEach((l) => {
    locationCountByBranch[l.branchId] = (locationCountByBranch[l.branchId] || 0) + 1
  })

  const branches: AdminBranch[] = ((branchData || []) as unknown as RawBranchRow[]).map((b) => ({
    id: b.id,
    name: b.name,
    city: b.city,
    timezone: b.timezone,
    contactPhone: b.contact_phone,
    contactEmail: b.contact_email,
    status: b.status as AdminBranch["status"],
    locationCount: locationCountByBranch[b.id] || 0,
  }))

  return { locations, branches }
}
