import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RiArrowLeftLine, RiCalendarLine } from "@remixicon/react"

export default function ReservationNotFound() {
  return (
    <div className="rounded-xl border bg-card p-12 text-center space-y-5">
      <div className="inline-flex size-14 items-center justify-center rounded-full bg-muted mx-auto">
        <RiCalendarLine className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-xl font-bold text-foreground">
          Reservation Not Found
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          The reservation you are looking for does not exist or is not accessible from this account.
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Link href="/account/reservations">
          <Button variant="outline" size="sm" className="gap-1.5">
            <RiArrowLeftLine className="size-4" data-icon="inline-start" />
            <span>Back to Reservations</span>
          </Button>
        </Link>
      </div>
    </div>
  )
}
