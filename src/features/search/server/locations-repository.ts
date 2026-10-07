import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { LocationHub } from "@/types"

/**
 * Fetch all active pickup/return locations from Supabase.
 *
 * RLS: `locations: anon read active` allows anon and authenticated users
 * to select locations where status = 'active'.
 */
export async function getLiveLocations(): Promise<LocationHub[]> {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("locations")
      .select("id, name, barangay, city, province, type, address, operating_hours, pickup_available, pickup_enabled, return_available, return_enabled")
      .eq("status", "active")
      .order("name", { ascending: true })

    if (error || !data) {
      console.error("[locations-repository] error fetching locations:", error?.message)
      return []
    }

    return data.map((loc) => ({
      id: loc.id,
      name: loc.name,
      barangay: loc.barangay || undefined,
      city: loc.city,
      province: loc.province || "Agusan del Norte",
      type: (loc.type === "airport_terminal"
        ? "Airport Terminal"
        : loc.type === "city_center"
        ? "City Center"
        : "Barangay Hub") as LocationHub["type"],
      address: loc.address,
      operatingHours: loc.operating_hours || "08:00 - 20:00",
      pickupAvailable: loc.pickup_available ?? loc.pickup_enabled ?? true,
      pickupEnabled: loc.pickup_enabled ?? loc.pickup_available ?? true,
      returnAvailable: loc.return_available ?? loc.return_enabled ?? true,
      returnEnabled: loc.return_enabled ?? loc.return_available ?? true,
    }))
  } catch (err) {
    console.error("[locations-repository] unexpected error:", err)
    return []
  }
}
