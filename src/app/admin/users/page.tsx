import * as React from "react"
import { Metadata } from "next"
import { getAdminStaffList } from "@/features/admin/server/staff-service"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { StaffClient } from "./staff-client"

export const metadata: Metadata = {
  title: "Staff & Roles — Veyra Operations",
  description: "Manage staff accounts, roles, and access permissions.",
  robots: { index: false, follow: false },
}

export default async function AdminStaffPage() {
  // Only admins and superadmins can view staff list
  const user = await requireAdminStaff(["admin", "superadmin"])

  const staff = await getAdminStaffList()

  return <StaffClient initialStaff={staff} currentUserRole={user.role} />
}
