import * as React from "react"
import Link from "next/link"
import { CustomerReservation } from "@/features/account/types"
import { StatusBadge, StatusType } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  RiCalendarLine,
  RiMapPinLine,
  RiTimeLine,
  RiArrowRightLine,
  RiShieldCheckLine,
  RiSteeringLine,
  RiGasStationLine,
  RiUser3Line,
} from "@remixicon/react"

export interface UpcomingHeroCardProps {
  reservation: CustomerReservation
}

export function UpcomingHeroCard({ reservation }: UpcomingHeroCardProps) {
  const { vehicle, pricing } = reservation

  // Map status to StatusBadge type
  const statusTypeMap: Record<string, StatusType> = {
    upcoming: "info",
    active: "success",
    completed: "neutral",
    cancelled: "error",
  }

  const badgeStatus = statusTypeMap[reservation.status] || "info"

  return (
    <div className="rounded-xl border bg-card overflow-hidden shadow-xs hover:border-primary/30 transition-colors">
      {/* Top Banner with Reference & Status */}
      <div className="bg-muted/40 px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">
            {reservation.status === "active" ? "Current Active Rental" : "Next Upcoming Rental"}
          </span>
          <span className="font-mono text-xs font-medium text-foreground bg-background px-2 py-0.5 rounded border">
            {reservation.id}
          </span>
        </div>
        <StatusBadge
          status={badgeStatus}
          label={reservation.statusLabel}
          size="sm"
        />
      </div>

      {/* Main Content Area */}
      <div className="p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Vehicle Info & Specs */}
        <div className="lg:col-span-7 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-primary uppercase tracking-wider mb-1">
              <span>{vehicle.category}</span>
              <span>•</span>
              <span>Model Year {vehicle.year}</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {vehicle.make} {vehicle.model}
            </h2>
          </div>

          {/* Quick Specs Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-md text-muted-foreground font-medium">
              <RiSteeringLine className="size-3.5 text-foreground" />
              <span>{vehicle.transmission}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-md text-muted-foreground font-medium">
              <RiGasStationLine className="size-3.5 text-foreground" />
              <span>{vehicle.fuelType}</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-muted px-2.5 py-1 rounded-md text-muted-foreground font-medium">
              <RiUser3Line className="size-3.5 text-foreground" />
              <span>{vehicle.seats} Seats</span>
            </span>
            <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md font-medium border border-emerald-500/20">
              <RiShieldCheckLine className="size-3.5" />
              <span>Multi-point Inspected</span>
            </span>
          </div>

          {/* Schedule Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-xs">
            <div className="p-3 rounded-lg border bg-background/50 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <RiCalendarLine className="size-3.5 text-primary" />
                <span>Pickup Handover</span>
              </div>
              <p className="font-semibold text-foreground text-sm">
                {reservation.pickupDate} • {reservation.pickupTime}
              </p>
              <p className="text-muted-foreground truncate flex items-center gap-1">
                <RiMapPinLine className="size-3 shrink-0" />
                <span className="truncate">{reservation.pickupLocationName}</span>
              </p>
            </div>

            <div className="p-3 rounded-lg border bg-background/50 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                <RiTimeLine className="size-3.5 text-primary" />
                <span>Return & Inspection</span>
              </div>
              <p className="font-semibold text-foreground text-sm">
                {reservation.returnDate} • {reservation.returnTime}
              </p>
              <p className="text-muted-foreground truncate flex items-center gap-1">
                <RiMapPinLine className="size-3 shrink-0" />
                <span className="truncate">{reservation.returnLocationName}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right: Pricing Callout & Action */}
        <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l pt-5 lg:pt-0 lg:pl-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-xs text-muted-foreground">Total Rental Price ({reservation.rentalDays} Days)</span>
              <span className="font-heading text-2xl font-bold text-foreground">
                {pricing.currency}{pricing.totalRentalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-dashed">
              <span>Security Deposit (Hold)</span>
              <span className="font-medium text-foreground">
                {pricing.currency}{pricing.refundableSecurityDeposit.toLocaleString()} (Refundable)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Link href={`/account/reservations/${reservation.id}`} className="block">
              <Button className="w-full gap-2" size="lg">
                <span>View Full Reservation Details</span>
                <RiArrowRightLine className="size-4" data-icon="inline-end" />
              </Button>
            </Link>

            <p className="text-[11px] text-center text-muted-foreground">
              Physical driver&apos;s license and credit card required at handover bay.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
