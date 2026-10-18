"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBooking } from "../../context/booking-context"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { Badge } from "@/components/ui/badge"
import {
  RiUserLine,
  RiSuitcaseLine,
  RiGasStationLine,
  RiFlashlightLine,
  RiDoorLine,
  RiCheckDoubleLine,
  RiArrowRightLine,
  RiCarLine,
  RiCalendarLine,
  RiTimeLine,
  RiAlertLine,
  RiPriceTag3Line,
} from "@remixicon/react"
import { VehicleImage } from "@/components/ui/vehicle-image"
import { PickupAddressPicker } from "../pickup-address-picker"

export function VehicleStep() {
  const router = useRouter()
  const {
    vehicle,
    draft,
    updateDraft,
    rentalDays,
    durationLimits,
    durationError,
    setRentalDuration,
    pricing,
    liveQuote,
    quoteError,
    quoteLoading,
  } = useBooking()

  if (!vehicle.available || vehicle.id === "unselected") {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Step 01 of 06
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Vehicle Selection Required
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Please choose a verified vehicle from the Veyra live catalog to begin your reservation.
          </p>
        </div>

        <div className="rounded-2xl border bg-card/60 p-8 sm:p-12 text-center space-y-4">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <RiCarLine className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">No Active Vehicle Selected</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              To guarantee zero substitution and exact model handover, select a specific vehicle model from our fleet.
            </p>
          </div>
          <Link href="/vehicles">
            <Button size="default" className="gap-2 font-semibold">
              <RiCarLine className="size-4" />
              <span>Browse Available Fleet</span>
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isElectric = vehicle.fuelType === "Electric"

  return (
    <div className="space-y-6">
      {/* Step Title & Context */}
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Step 01 of 06
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Confirm Selected Vehicle
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Review your chosen model specifications and guaranteed handover trim before configuring add-on options.
        </p>
      </div>

      {/* Vehicle Hero Card */}
      <div className="rounded-2xl border bg-card/60 p-5 sm:p-6 space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <StatusBadge status="success" label="Exact Model Guaranteed" size="sm" />
              {vehicle.badge && (
                <Badge variant="secondary" className="text-[11px] font-semibold">
                  {vehicle.badge}
                </Badge>
              )}
            </div>
            <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
            <p className="text-xs text-muted-foreground">
              {vehicle.category.toUpperCase()} • {vehicle.fuelType} Powertrain • {vehicle.transmission}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/vehicles">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <RiCarLine className="size-3.5" data-icon="inline-start" />
                <span>Change Car</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Visual Showcase */}
        <div className="relative overflow-hidden rounded-xl border border-border/60">
          <VehicleImage
            src={vehicle.primaryImage || vehicle.images?.[0] || null}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Veyra rental vehicle`}
            aspectRatio="16/10"
            category={vehicle.category}
            containerClassName="h-48 sm:h-56 w-full"
          />
        </div>

        {/* Key Technical Specifications Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <RiUserLine className="size-3.5 text-primary" />
              <span>Seating</span>
            </div>
            <p className="text-xs font-bold text-foreground">
              {vehicle.seats} Passengers
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <RiSuitcaseLine className="size-3.5 text-primary" />
              <span>Luggage</span>
            </div>
            <p className="text-xs font-bold text-foreground">
              {vehicle.luggage} Large Bags
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              {isElectric ? (
                <RiFlashlightLine className="size-3.5 text-emerald-500" />
              ) : (
                <RiGasStationLine className="size-3.5 text-primary" />
              )}
              <span>Powertrain</span>
            </div>
            <p className="text-xs font-bold text-foreground">
              {vehicle.fuelType}
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <RiDoorLine className="size-3.5 text-primary" />
              <span>Doors</span>
            </div>
            <p className="text-xs font-bold text-foreground">
              {vehicle.doors || 4} Doors
            </p>
          </div>
        </div>

        {/* Included Handover Standards */}
        <div className="space-y-2 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Included Standards
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RiCheckDoubleLine className="size-4 text-primary shrink-0" />
              <span>Zero model substitution policy</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RiCheckDoubleLine className="size-4 text-primary shrink-0" />
              <span>Multi-point technical check & sanitized cabin</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RiCheckDoubleLine className="size-4 text-primary shrink-0" />
              <span>Mandatory third-party liability coverage</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <RiCheckDoubleLine className="size-4 text-primary shrink-0" />
              <span>Direct key handover at verified barangay hub</span>
            </div>
          </div>
        </div>

        {/* Rental Dates & Customer-Editable Duration */}
        <div className="space-y-3 pt-3 border-t border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <RiCalendarLine className="size-3.5 text-primary" />
              <span>Rental Schedule & Duration</span>
            </h3>
            <span className="text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 self-start sm:self-auto">
              Total Duration: {rentalDays} {rentalDays === 1 ? "Day" : "Days"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* 1. Pickup Date & Time */}
            <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5">
              <label htmlFor="vehicle-step-pickup-date" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <RiCalendarLine className="size-3 text-primary" />
                <span>Pickup Date & Time</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                <input
                  id="vehicle-step-pickup-date"
                  type="date"
                  value={draft.pickupDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => updateDraft({ pickupDate: e.target.value })}
                  className="col-span-3 h-10 rounded-lg border border-input bg-background/90 px-2 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                />
                <input
                  type="time"
                  value={draft.pickupTime}
                  onChange={(e) => updateDraft({ pickupTime: e.target.value })}
                  className="col-span-2 h-10 rounded-lg border border-input bg-background/90 px-1.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                />
              </div>
            </div>

            {/* 2. Customer-Editable Rental Duration (Days) */}
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="rental-duration-days-input"
                  className="text-xs font-bold text-foreground flex items-center gap-1"
                >
                  <RiTimeLine className="size-3 text-primary" />
                  <span>Rental Duration (Days)</span>
                </label>
                <span className="text-[10px] text-muted-foreground font-medium">
                  Min: {durationLimits.minDays}d · Max: {durationLimits.maxDays ?? 30}d
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="duration-decrease-btn"
                  onClick={() => setRentalDuration(Math.max(durationLimits.minDays, rentalDays - 1))}
                  disabled={rentalDays <= durationLimits.minDays}
                  className="size-10 rounded-lg border border-input bg-background font-bold text-sm text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors"
                  aria-label="Decrease rental days"
                >
                  −
                </button>
                <input
                  id="rental-duration-days-input"
                  type="number"
                  min={durationLimits.minDays}
                  max={durationLimits.maxDays ?? 30}
                  value={rentalDays || ""}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10)
                    if (!isNaN(val)) {
                      setRentalDuration(val)
                    }
                  }}
                  className="flex-1 h-10 text-center font-heading font-bold text-base rounded-lg border border-input bg-background text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <button
                  type="button"
                  id="duration-increase-btn"
                  onClick={() =>
                    setRentalDuration(
                      durationLimits.maxDays !== null
                        ? Math.min(durationLimits.maxDays, rentalDays + 1)
                        : rentalDays + 1
                    )
                  }
                  disabled={durationLimits.maxDays !== null && rentalDays >= durationLimits.maxDays}
                  className="size-10 rounded-lg border border-input bg-background font-bold text-sm text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 transition-colors"
                  aria-label="Increase rental days"
                >
                  +
                </button>
              </div>
            </div>

            {/* 3. Return Date & Time */}
            <div className="rounded-xl border bg-muted/30 p-3 space-y-1.5">
              <label htmlFor="vehicle-step-return-date" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <RiTimeLine className="size-3 text-primary" />
                <span>Return Date & Time</span>
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                <input
                  id="vehicle-step-return-date"
                  type="date"
                  value={draft.returnDate}
                  min={draft.pickupDate}
                  onChange={(e) => updateDraft({ returnDate: e.target.value })}
                  className="col-span-3 h-10 rounded-lg border border-input bg-background/90 px-2 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                />
                <input
                  type="time"
                  value={draft.returnTime}
                  onChange={(e) => updateDraft({ returnTime: e.target.value })}
                  className="col-span-2 h-10 rounded-lg border border-input bg-background/90 px-1.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* 4. Updated Rental Total Banner */}
          <div className="rounded-xl bg-muted/40 border border-border/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <RiPriceTag3Line className="size-4 text-primary shrink-0" />
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  Updated Rental Total ({rentalDays} {rentalDays === 1 ? "day" : "days"})
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Daily rate: ₱{vehicle.dailyRate.toLocaleString()} · Base: ₱{(vehicle.dailyRate * Math.max(1, rentalDays)).toLocaleString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {quoteLoading ? (
                <span className="text-xs text-muted-foreground animate-pulse">Calculating authoritative quote...</span>
              ) : (
                <div className="text-left sm:text-right">
                  <span className="font-heading text-lg font-bold text-foreground block">
                    ₱{pricing.totalRentalPrice.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {liveQuote ? "Authoritative Server Quote" : "Estimated Total"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Validation Feedback */}
          {(durationError || quoteError) && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2"
            >
              <RiAlertLine className="size-4 shrink-0 text-destructive" />
              <span className="font-medium">{durationError || quoteError}</span>
            </div>
          )}
        </div>

        {/* Localized Barangay Handover Stationing & Manual Address Selection */}
        <PickupAddressPicker />
      </div>

      {/* Navigation Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-border/60">
        <Link href={`/vehicles/${vehicle.id}`}>
          <Button variant="ghost" size="sm">
            Back to Vehicle Overview
          </Button>
        </Link>

        <div className="flex flex-col sm:items-end gap-1 w-full sm:w-auto">
          {quoteError && (
            <span className="text-[11px] text-destructive font-medium text-center sm:text-right">
              Adjust dates to meet rental duration limits
            </span>
          )}
          <Button
            size="lg"
            onClick={() => router.push("/booking/options")}
            disabled={Boolean(quoteError) || quoteLoading}
            className="gap-2 font-semibold shadow-md w-full sm:w-auto"
          >
            <span>Continue to Options & Extras</span>
            <RiArrowRightLine className="size-4" data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  )
}
