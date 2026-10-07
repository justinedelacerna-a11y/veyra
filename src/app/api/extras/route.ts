import { NextResponse } from "next/server"
import { getLiveExtras } from "@/features/booking/server/extras-service"

/**
 * GET /api/extras
 * Returns active booking extras from public.extras table.
 */
export async function GET() {
  try {
    const extras = await getLiveExtras()
    return NextResponse.json({ extras })
  } catch (err) {
    console.error("[api/extras] unexpected error:", err)
    return NextResponse.json({ extras: [] }, { status: 500 })
  }
}

