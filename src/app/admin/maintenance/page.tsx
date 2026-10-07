import * as React from "react"
import { Metadata } from "next"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminMaintenanceList } from "@/features/admin/server/operations-service"
import { MaintenanceClient } from "./maintenance-client"

export const metadata: Metadata = {
  title: "Maintenance — Veyra Operations",
  description: "Live fleet maintenance tracking and service bay records.",
  robots: { index: false, follow: false },
}

export default async function AdminMaintenancePage() {
  await requireAdminStaff()
  const maintenances = await getAdminMaintenanceList()

  return <MaintenanceClient initialMaintenances={maintenances} />
}
