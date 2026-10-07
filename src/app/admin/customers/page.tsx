import * as React from "react"
import { Metadata } from "next"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminCustomersList } from "@/features/admin/server/customers-service"
import { CustomersClient } from "./customers-client"

export const metadata: Metadata = {
  title: "Customers — Veyra Operations",
  description: "Live customer directory, verification credentials, and booking history.",
  robots: { index: false, follow: false },
}

export default async function AdminCustomersPage() {
  await requireAdminStaff()
  const customers = await getAdminCustomersList()

  return <CustomersClient initialCustomers={customers} />
}
