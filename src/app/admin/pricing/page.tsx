import * as React from "react"
import { Metadata } from "next"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminPricingData } from "@/features/admin/server/pricing-service"
import { PricingClient } from "./pricing-client"

export const metadata: Metadata = {
  title: "Pricing Rules — Veyra Operations",
  description: "Manage vehicle extras and rate plan configurations.",
  robots: { index: false, follow: false },
}

export default async function AdminPricingPage() {
  await requireAdminStaff()
  const { extras, ratePlans } = await getAdminPricingData()

  return <PricingClient extras={extras} ratePlans={ratePlans} />
}
