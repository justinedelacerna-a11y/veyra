import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { AdminShell } from "@/components/shell/admin"
import { getAdminStaffStatus } from "@/features/admin/server/admin-auth"
import { AdminAccessDenied } from "@/features/admin/components/admin-access-denied"

export const metadata: Metadata = {
  title: "Veyra Operations — Fleet & Reservations Hub",
  description: "Administrative console for Veyra fleet, booking, and customer management.",
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const status = await getAdminStaffStatus()

  if (status.state === "unauthenticated") {
    redirect("/sign-in?redirect_url=/admin")
  }

  if (status.state === "forbidden") {
    return <AdminAccessDenied email={status.email} userType={status.userType} />
  }

  return <AdminShell>{children}</AdminShell>
}
