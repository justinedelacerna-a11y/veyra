import { NextRequest, NextResponse } from "next/server"
import { getVehicleById } from "@/features/vehicles/server"

/**
 * GET /api/vehicles/[id]
 *
 * Public vehicle lookup by ID from the vehicle_catalog view.
 * Used by the booking context to resolve live vehicle data
 * without SSR (client-side fetch after hydration).
 *
 * Security:
 *   - Reads from vehicle_catalog view which is granted to anon + authenticated.
 *   - No sensitive vehicle fields (VIN, plate, odometer) are exposed by the view.
 *   - Vehicle ID is validated as a UUID before querying.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  // Validate UUID format to avoid unnecessary DB queries
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!id || !uuidRegex.test(id)) {
    return NextResponse.json({ error: "Invalid vehicle ID" }, { status: 400 })
  }

  const { data: vehicle, error } = await getVehicleById(id)

  if (error) {
    return NextResponse.json({ error }, { status: 500 })
  }

  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
  }

  return NextResponse.json({ vehicle })
}
