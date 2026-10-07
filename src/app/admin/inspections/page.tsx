import * as React from "react"
import { Metadata } from "next"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminInspectionsList } from "@/features/admin/server/operations-service"
import { InspectionsClient } from "./inspections-client"

export const metadata: Metadata = {
  title: "Inspections — Veyra Operations",
  description: "Vehicle handover and return condition inspection logs.",
  robots: { index: false, follow: false },
}

export default async function AdminInspectionsPage() {
  await requireAdminStaff()
  const inspections = await getAdminInspectionsList()

  return <InspectionsClient initialInspections={inspections} />
}
