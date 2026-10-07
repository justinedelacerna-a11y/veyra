import * as React from "react"
import { Metadata } from "next"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminPaymentsList } from "@/features/admin/server/operations-service"
import { PaymentsClient } from "./payments-client"

export const metadata: Metadata = {
  title: "Payments — Veyra Operations",
  description: "Live transaction ledger and billing records.",
  robots: { index: false, follow: false },
}

export default async function AdminPaymentsPage() {
  await requireAdminStaff()
  const payments = await getAdminPaymentsList()

  return <PaymentsClient initialPayments={payments} />
}
