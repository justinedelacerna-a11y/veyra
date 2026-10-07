import { NextResponse } from "next/server"
import { getLiveLocations } from "@/features/search/server/locations-repository"

/**
 * GET /api/locations
 *
 * Returns active pickup/return locations from Supabase.
 * Used by client-side booking and search components to
 * populate location selectors with live data.
 */
export async function GET() {
  try {
    const locations = await getLiveLocations()
    return NextResponse.json({ locations })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message, locations: [] }, { status: 500 })
  }
}

