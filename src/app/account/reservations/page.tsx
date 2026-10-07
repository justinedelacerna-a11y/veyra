import * as React from "react"
import Link from "next/link"
import { Metadata } from "next"
import { AccountHeader } from "@/features/account/components/account-header"
import { ReservationsFilterView } from "@/features/account/components/reservations-filter-view"
import { getCustomerReservations } from "@/features/account/server"
import { Button } from "@/components/ui/button"
import { RiCarLine } from "@remixicon/react"

export const metadata: Metadata = {
  title: "My Reservations — Veyra",
  description: "View and manage your upcoming, active, and past vehicle rentals.",
}

export default async function ReservationsPage() {
  const reservations = await getCustomerReservations()

  return (
    <div className="space-y-6">
      <AccountHeader
        title="My Reservations"
        description="Track active trips, review upcoming vehicle handovers, and access past rental receipts."
        action={
          <Link href="/vehicles">
            <Button size="sm" className="gap-2">
              <RiCarLine className="size-4" data-icon="inline-start" />
              <span>Browse Fleet</span>
            </Button>
          </Link>
        }
      />

      <ReservationsFilterView initialReservations={reservations} />
    </div>
  )
}
