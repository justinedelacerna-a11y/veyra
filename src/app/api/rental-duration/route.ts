import { NextResponse } from "next/server"
import { getRentalDurationConfig } from "@/features/admin/server/settings-service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const config = await getRentalDurationConfig()
    return NextResponse.json({
      success: true,
      minDays: config.minDays,
      maxDays: config.maxDays,
    })
  } catch (error) {
    console.error("[api/rental-duration] error fetching duration config:", error)
    return NextResponse.json(
      {
        success: true,
        minDays: 1,
        maxDays: null,
      },
      { status: 200 }
    )
  }
}
