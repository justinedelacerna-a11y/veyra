import * as React from "react"
import { Metadata } from "next"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminReservationsList } from "@/features/admin/server/reservations-service"
import { ReservationsClient } from "./reservations-client"

export const metadata: Metadata = {
  title: "Reservations — Veyra Operations",
  description: "Live reservation management, customer booking details, and state machine controls.",
  robots: { index: false, follow: false },
}

export default async function AdminReservationsPage() {
  await requireAdminStaff()
  const reservations = await getAdminReservationsList()

  return <ReservationsClient initialReservations={reservations} />
}
