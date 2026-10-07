"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useBooking } from "../../context/booking-context"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import {
  RiCheckboxCircleLine,
  RiSteeringLine,
  RiMapPinLine,
  RiCalendarLine,
  RiUserLine,
  RiPrinterLine,
  RiHome5Line,
  RiCarLine,
  RiShieldCheckLine,
} from "@remixicon/react"

export function ConfirmationView() {
  const searchParams = useSearchParams()
  const {
    draft,
    vehicle,
    pickupLocationName,
    returnLocationName,
    rentalDays,
    pricing,
    resetBooking,
  } = useBooking()

  const reference =
    searchParams.get("ref") || draft.bookingReference || "VYR-DEMO-1042"

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      {/* Success Hero Card */}
      <div className="rounded-3xl border bg-card/80 p-6 sm:p-10 text-center shadow-lg backdrop-blur-xs space-y-4">
        <div className="flex justify-center">
          <div className="flex size-20 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <RiCheckboxCircleLine className="size-12" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <StatusBadge
              status="success"
              label="Reservation Created"
              size="sm"
            />
            <StatusBadge
              status="warning"
              label="Payment: Pending / Deferred"
              size="sm"
            />
          </div>
          <h1 className="font-heading text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Reservation Created
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
            Your vehicle reservation has been successfully recorded in Veyra. Payment processing is deferred and can be completed later at vehicle handover or via concierge.
          </p>
        </div>

        {/* Reference Code Box */}
        <div className="inline-flex flex-col items-center justify-center rounded-2xl border bg-muted/40 px-6 py-3.5 space-y-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Booking Reference
          </span>
          <span className="font-mono text-xl sm:text-2xl font-bold text-primary tracking-widest">
            {reference}
          </span>
        </div>
      </div>

      {/* Confirmation Summary Card */}
      <div className="rounded-2xl border bg-card/60 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-border/60">
          <h2 className="text-sm font-bold text-foreground">
            Itinerary & Handover Details
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {rentalDays} {rentalDays === 1 ? "Day Rental" : "Days Rental"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Vehicle info */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <RiSteeringLine className="size-4 text-primary" />
              <span>Assigned Vehicle</span>
            </div>
            <p className="font-heading text-base font-bold text-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <p className="text-muted-foreground">
              {vehicle.category.toUpperCase()} • {vehicle.fuelType} • {vehicle.transmission}
            </p>
          </div>

          {/* Primary Driver */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <RiUserLine className="size-4 text-primary" />
              <span>Primary Driver</span>
            </div>
            <p className="font-heading text-base font-bold text-foreground">
              {draft.driver.firstName
                ? `${draft.driver.firstName} ${draft.driver.lastName}`
                : "Maria Santos"}
            </p>
            <p className="text-muted-foreground truncate">
              {draft.driver.email || "client@example.com"} •{" "}
              {draft.driver.phone || "+63 917 123 4567"}
            </p>
          </div>

          {/* Pickup */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-1">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <RiMapPinLine className="size-4 text-primary" />
              <span>Pickup & Handover</span>
            </div>
            <p className="text-foreground font-medium">{pickupLocationName}</p>
            <p className="text-muted-foreground">
              {draft.pickupDate} at {draft.pickupTime}
            </p>
            <span className="text-[11px] text-primary font-medium block pt-1">
              Valet Bay: Terminal Arrival Zone Bay 4
            </span>
          </div>

          {/* Return */}
          <div className="rounded-xl border bg-muted/30 p-4 space-y-1">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <RiCalendarLine className="size-4 text-primary" />
              <span>Scheduled Return</span>
            </div>
            <p className="text-foreground font-medium">{returnLocationName}</p>
            <p className="text-muted-foreground">
              {draft.returnDate} at {draft.returnTime}
            </p>
            <span className="text-[11px] text-muted-foreground block pt-1">
              Concierge hotline available for itinerary extensions
            </span>
          </div>
        </div>

        {/* Pricing & Payment Summary */}
        <div className="rounded-xl border bg-muted/40 p-4 space-y-2 text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Payment Status:</span>
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Pending / Deferred (Pay at Handover)
            </span>
          </div>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Total Rental Amount:</span>
            <span className="font-heading text-sm font-bold text-foreground">
              {pricing.currency}
              {pricing.totalRentalPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center text-muted-foreground">
            <span>Security Deposit:</span>
            <span className="font-mono font-medium text-foreground">
              ₱{pricing.refundableSecurityDeposit.toLocaleString()} (Pre-authorized at Handover)
            </span>
          </div>
        </div>

        {/* Next Steps Card */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Handover Checklist
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <RiShieldCheckLine className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                Present your physical driver license ({draft.driver.licenseNumber || "registered license"}) and valid credit card upon arrival at the airport valet bay.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <RiShieldCheckLine className="size-4 text-primary shrink-0 mt-0.5" />
              <span>
                Your vehicle has been pre-inspected, sanitized, and parked in the terminal valet bay for key handover.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <Button
          variant="outline"
          onClick={() => window.print()}
          className="w-full sm:w-auto gap-2 text-xs"
        >
          <RiPrinterLine className="size-4" data-icon="inline-start" />
          <span>Print Summary</span>
        </Button>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <Link href="/account/reservations" className="w-full sm:w-auto">
            <Button
              variant="default"
              onClick={resetBooking}
              className="w-full sm:w-auto gap-2 text-xs font-semibold shadow-xs"
            >
              <RiCarLine className="size-4" data-icon="inline-start" />
              <span>View in My Reservations</span>
            </Button>
          </Link>

          <Link href="/vehicles" className="w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={resetBooking}
              className="w-full sm:w-auto gap-2 text-xs"
            >
              <span>Browse Fleet</span>
            </Button>
          </Link>

          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={resetBooking}
              className="w-full sm:w-auto gap-2 text-xs"
            >
              <RiHome5Line className="size-4" data-icon="inline-start" />
              <span>Return Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
