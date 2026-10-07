import * as React from "react"
import { Metadata } from "next"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminReportPageData } from "@/features/admin/server/reports-service"
import { ReportsClient } from "./reports-client"

export const metadata: Metadata = {
  title: "Analytics & Reports — Veyra Operations",
  description: "Booking analytics, revenue reports, and vehicle utilization.",
  robots: { index: false, follow: false },
}

export default async function AdminReportsPage() {
  await requireAdminStaff()
  const { summary, fromDate, toDate } = await getAdminReportPageData()

  return <ReportsClient summary={summary} fromDate={fromDate} toDate={toDate} />
}
