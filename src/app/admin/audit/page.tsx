import * as React from "react"
import { Metadata } from "next"
import { getAdminAuditLog } from "@/features/admin/server/audit-service"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { AuditClient } from "./audit-client"

export const metadata: Metadata = {
  title: "Audit Log — Veyra Operations",
  description: "Immutable record of all staff and system actions.",
  robots: { index: false, follow: false },
}

export default async function AdminAuditPage() {
  // Audit log is restricted to admins and superadmins
  await requireAdminStaff(["admin", "superadmin"])

  const events = await getAdminAuditLog({ limit: 500 })

  return <AuditClient initialEvents={events} />
}
