"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBooking } from "../../context/booking-context"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import {
  RiSteeringLine,
  RiMapPinLine,
  RiCalendarLine,
  RiUserLine,
  RiCheckDoubleLine,
  RiShieldCheckLine,
  RiEditLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiCheckLine,
} from "@remixicon/react"

export function ReviewStep() {
  const router = useRouter()
  const {
    vehicle,
    pickupLocationName,
    returnLocationName,
    rentalDays,
    draft,
    pricing,
    availableExtras,
  } = useBooking()

  // Format dates for display
  const formatDateDisplay = (dateStr: string, timeStr: string) => {
    try {
      const d = new Date(`${dateStr}T${timeStr}`)
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }) + `, ${timeStr}`
    } catch {
      return `${dateStr} ${timeStr}`
    }
  }

  const selectedExtraObjects = React.useMemo(() => {
    return draft.selectedExtras
      .map((id) => (availableExtras || []).find((e) => e.id === id))
      .filter(Boolean)
  }, [draft.selectedExtras, availableExtras])

  return (
    <div className="space-y-6">
      {/* Step Title & Context */}
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Step 04 of 06
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Review Itinerary & Details
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Please review your booking details, chosen vehicle specifications, and driver details before proceeding to payment.
        </p>
      </div>

      <div className="space-y-4">
        {/* Section 1: Vehicle & Model */}
        <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <RiSteeringLine className="size-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                Vehicle & Guaranteed Model
              </h2>
            </div>
            <Link href="/booking">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                <RiEditLine className="size-3.5" data-icon="inline-start" />
                <span>Edit</span>
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <RiSteeringLine className="size-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase text-primary">
                    {vehicle.make}
                  </span>
                  <StatusBadge status="success" label="Guaranteed" size="sm" />
                </div>
                <h3 className="font-heading text-base font-bold text-foreground">
                  {vehicle.year} {vehicle.model}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {vehicle.category.toUpperCase()} • {vehicle.fuelType} • {vehicle.transmission} • {vehicle.seats} seats
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-muted-foreground block">Daily Base Rate</span>
              <span className="font-heading text-lg font-bold text-foreground">
                {pricing.currency}{vehicle.dailyRate.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">/day</span>
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Rental Itinerary */}
        <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <RiMapPinLine className="size-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                Rental Itinerary & Schedule
              </h2>
            </div>
            <Link href="/booking">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                <RiEditLine className="size-3.5" data-icon="inline-start" />
                <span>Edit</span>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded-xl bg-muted/40 p-3.5 border border-border/50 space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <RiMapPinLine className="size-3.5 text-primary" />
                <span>Pickup Station</span>
              </span>
              <p className="text-foreground font-medium">{pickupLocationName}</p>
              <p className="text-muted-foreground">
                {formatDateDisplay(draft.pickupDate, draft.pickupTime)}
              </p>
            </div>

            <div className="rounded-xl bg-muted/40 p-3.5 border border-border/50 space-y-1">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <RiCalendarLine className="size-3.5 text-primary" />
                <span>Return Station</span>
              </span>
              <p className="text-foreground font-medium">{returnLocationName}</p>
              <p className="text-muted-foreground">
                {formatDateDisplay(draft.returnDate, draft.returnTime)}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Selected Add-ons */}
        <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <RiShieldCheckLine className="size-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                Selected Add-ons & Protection ({selectedExtraObjects.length})
              </h2>
            </div>
            <Link href="/booking/options">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                <RiEditLine className="size-3.5" data-icon="inline-start" />
                <span>Edit</span>
              </Button>
            </Link>
          </div>

          {selectedExtraObjects.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">
              No additional options selected. Basic third-party liability is included.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedExtraObjects.map((extra) => extra && (
                <div
                  key={extra.id}
                  className="flex items-center justify-between rounded-lg bg-muted/30 p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <RiCheckLine className="size-4 text-primary shrink-0" />
                    <div>
                      <span className="font-semibold text-foreground block">
                        {extra.name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {extra.tagline}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-foreground">
                    ₱{(extra.dailyRate * rentalDays).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 4: Driver Information */}
        <div className="rounded-2xl border bg-card/60 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/60">
            <div className="flex items-center gap-2">
              <RiUserLine className="size-4 text-primary" />
              <h2 className="text-sm font-bold text-foreground">
                Primary Driver Profile
              </h2>
            </div>
            <Link href="/booking/driver">
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary">
                <RiEditLine className="size-3.5" data-icon="inline-start" />
                <span>Edit</span>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="rounded-lg bg-muted/30 p-2.5">
              <span className="text-muted-foreground block text-[11px]">Full Name</span>
              <span className="font-semibold text-foreground">
                {draft.driver.firstName || "—"} {draft.driver.lastName || ""}
              </span>
            </div>

            <div className="rounded-lg bg-muted/30 p-2.5">
              <span className="text-muted-foreground block text-[11px]">Email Address</span>
              <span className="font-semibold text-foreground truncate block">
                {draft.driver.email || "—"}
              </span>
            </div>

            <div className="rounded-lg bg-muted/30 p-2.5">
              <span className="text-muted-foreground block text-[11px]">Mobile Phone</span>
              <span className="font-semibold text-foreground">
                {draft.driver.phone || "—"}
              </span>
            </div>

            <div className="rounded-lg bg-muted/30 p-2.5">
              <span className="text-muted-foreground block text-[11px]">Driver License</span>
              <span className="font-mono font-semibold text-foreground">
                {draft.driver.licenseNumber || "—"}
              </span>
            </div>

            <div className="rounded-lg bg-muted/30 p-2.5">
              <span className="text-muted-foreground block text-[11px]">Issuing Country</span>
              <span className="font-semibold text-foreground">
                {draft.driver.licenseCountry || "Philippines"}
              </span>
            </div>

            <div className="rounded-lg bg-muted/30 p-2.5">
              <span className="text-muted-foreground block text-[11px]">Date of Birth</span>
              <span className="font-semibold text-foreground">
                {draft.driver.birthDate || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Cancellation & Handover Guarantee Notice */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <RiCheckDoubleLine className="size-4 text-primary" />
            <span>Veyra Customer Assurance</span>
          </div>
          <p className="leading-relaxed">
            Free cancellation with zero penalty up to 24 hours prior to handover. Digital check-in pre-qualifies your credentials for instant key release at airport valet bays.
          </p>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <Link href="/booking/driver">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <RiArrowLeftLine className="size-4" data-icon="inline-start" />
            <span>Back to Driver Info</span>
          </Button>
        </Link>

        <Button
          size="lg"
          onClick={() => router.push("/booking/payment")}
          className="gap-2 font-semibold shadow-md"
        >
          <span>Continue to Payment</span>
          <RiArrowRightLine className="size-4" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
