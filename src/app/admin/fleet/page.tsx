import * as React from "react"
import { Metadata } from "next"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminFleetList } from "@/features/admin/server/fleet-service"
import { FleetClient } from "./fleet-client"

export const metadata: Metadata = {
  title: "Fleet Management — Veyra Operations",
  description: "Live fleet status, vehicle tracking, and maintenance operations.",
  robots: { index: false, follow: false },
}

export default async function AdminFleetPage() {
  await requireAdminStaff()
  const { vehicles, summary } = await getAdminFleetList()

  return <FleetClient initialVehicles={vehicles} summary={summary} />
}
