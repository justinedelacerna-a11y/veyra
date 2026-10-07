import * as React from "react"
import { Metadata } from "next"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminLocationsList } from "@/features/admin/server/locations-service"
import { LocationsClient } from "./locations-client"

export const metadata: Metadata = {
  title: "Locations — Veyra Operations",
  description: "Manage pickup and return hub locations in Butuan City.",
  robots: { index: false, follow: false },
}

export default async function AdminLocationsPage() {
  await requireAdminStaff()
  const { locations, branches } = await getAdminLocationsList()

  return <LocationsClient locations={locations} branches={branches} />
}
