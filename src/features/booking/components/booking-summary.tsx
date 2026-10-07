"use client"

import * as React from "react"
import Link from "next/link"
import { useBooking } from "../context/booking-context"
import {
  RiMapPinLine,
  RiCalendarLine,
  RiShieldCheckLine,
  RiInformationLine,
  RiCheckLine,
} from "@remixicon/react"
import { VehicleImage } from "@/components/ui/vehicle-image"
import { cn } from "@/lib/utils"

export interface BookingSummaryProps {
  className?: string
  hideEditLinks?: boolean
}

export function BookingSummary({
  className,
  hideEditLinks = false,
}: BookingSummaryProps) {
  const {
    vehicle,
    pickupLocationName,
    returnLocationName,
    rentalDays,
    pricing,
    draft,
    liveQuote,
    quoteLoading,
    quoteError,
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
      }) + `, ${timeStr}`
    } catch {
      return `${dateStr} ${timeStr}`
    }
  }

  const selectedExtraObjects = React.useMemo(() => {
    const allExtras = availableExtras || []
    return draft.selectedExtras
      .map((id) => allExtras.find((e) => e.id === id || (e as { slug?: string }).slug === id))
      .filter(Boolean)
  }, [draft.selectedExtras, availableExtras])

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card/90 p-5 sm:p-6 shadow-md backdrop-blur-xs space-y-6",
        className
      )}
    >
      {/* Header & Vehicle Overview */}
      <div className="space-y-3 pb-4 border-b border-border/60">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wider text-primary">
            Rental Summary
          </span>
          <span className="font-mono text-muted-foreground">
            {rentalDays} {rentalDays === 1 ? "Day" : "Days"}
          </span>
        </div>

        <div className="flex items-start gap-3">
          <div className="relative size-16 shrink-0 rounded-xl overflow-hidden border border-border/80 bg-muted/30">
            <VehicleImage
              src={vehicle.primaryImage || vehicle.images?.[0] || null}
              alt={`${vehicle.make} ${vehicle.model}`}
              aspectRatio="none"
              category={vehicle.category}
              containerClassName="size-16"
              showFallbackBadge={false}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium uppercase">
                {vehicle.make}
              </span>
              {!hideEditLinks && (
                <Link
                  href="/booking"
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Change
                </Link>
              )}
            </div>
            <h3 className="font-heading text-sm sm:text-base font-bold text-foreground truncate">
              {vehicle.model}
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {vehicle.year} • {vehicle.category} • {vehicle.transmission} • {vehicle.seats} seats
            </p>
          </div>
        </div>
      </div>

      {/* Itinerary Schedule Details */}
      <div className="space-y-3 rounded-xl bg-muted/40 p-3.5 border border-border/50 text-xs">
        <div className="flex items-start gap-2.5">
          <RiMapPinLine className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground block">
              Pickup Station
            </span>
            <span className="text-muted-foreground">{pickupLocationName}</span>
            <span className="text-[11px] text-foreground font-medium block">
              {formatDateDisplay(draft.pickupDate, draft.pickupTime)}
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 pt-2 border-t border-border/40">
          <RiCalendarLine className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground block">
              Return Station
            </span>
            <span className="text-muted-foreground">{returnLocationName}</span>
            <span className="text-[11px] text-foreground font-medium block">
              {formatDateDisplay(draft.returnDate, draft.returnTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Selected Add-ons / Extras */}
      {selectedExtraObjects.length > 0 && (
        <div className="space-y-2 pt-1 border-t border-border/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Selected Extras</span>
            {!hideEditLinks && (
              <Link
                href="/booking/options"
                className="text-xs text-primary hover:underline font-medium"
              >
                Edit
              </Link>
            )}
          </div>

          <div className="space-y-1.5">
            {selectedExtraObjects.map((extra) => extra && (
              <div
                key={extra.id}
                className="flex items-center justify-between text-xs text-muted-foreground"
              >
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <RiCheckLine className="size-3.5 text-primary shrink-0" />
                  <span className="truncate">{extra.name}</span>
                </div>
                <span className="font-medium text-foreground whitespace-nowrap">
                  ₱{(extra.dailyRate * rentalDays).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itemized Price Breakdown */}
      <div className="space-y-2.5 pt-2 border-t border-border/60 text-xs">
        <div className="flex justify-between text-muted-foreground">
          <span>
            Base rate ({pricing.currency}
            {pricing.dailyRate.toLocaleString()} × {rentalDays}{" "}
            {rentalDays === 1 ? "day" : "days"})
          </span>
          <span className="font-medium text-foreground">
            {pricing.currency}
            {pricing.baseRental.toLocaleString()}
          </span>
        </div>

        {pricing.extrasSubtotal > 0 && (
          <div className="flex justify-between text-muted-foreground">
            <span>Add-ons & protection</span>
            <span className="font-medium text-foreground">
              {pricing.currency}
              {pricing.extrasSubtotal.toLocaleString()}
            </span>
          </div>
        )}

        <div className="flex justify-between text-muted-foreground">
          <span className="flex items-center gap-1">
            <span>Third-Party Liability Insurance</span>
            <RiInformationLine className="size-3 text-muted-foreground" />
          </span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            Included
          </span>
        </div>

        <div className="flex justify-between text-muted-foreground">
          <span>Airport Valet Concession Fee</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            Included
          </span>
        </div>

        {/* Quote Error or Loading State */}
        {quoteLoading && (
          <div className="flex items-center gap-1.5 text-[11px] text-primary animate-pulse pt-1">
            <span className="inline-block size-2 rounded-full bg-primary" />
            <span>Calculating live server quote...</span>
          </div>
        )}

        {quoteError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-[11px] text-destructive font-medium">
            ⚠️ {quoteError}
          </div>
        )}

        {/* Total Rental Cost */}
        <div className="flex items-baseline justify-between pt-3 border-t border-border/60">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-foreground">
              Total Rental Price
            </span>
            <span className="text-[11px] text-muted-foreground">
              {liveQuote ? "Authoritative live quote" : "All mandatory fees included"}
            </span>
          </div>
          <span className="font-heading text-xl font-bold text-primary">
            {pricing.currency}
            {pricing.totalRentalPrice.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Security Deposit Note: Kept strictly distinct! */}
      <div className="rounded-xl border border-border/60 bg-muted/30 p-3 space-y-1 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground font-medium">
            Refundable Security Deposit:
          </span>
          <span className="font-mono font-bold text-foreground">
            ₱{pricing.refundableSecurityDeposit.toLocaleString()}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-normal">
          Authorized on card at handover; automatically released after return inspection.
        </p>
      </div>

      {/* Prototype / Demo Mode Disclaimer */}
      <div className="flex items-start gap-2 text-[11px] text-muted-foreground pt-1">
        <RiShieldCheckLine className="size-3.5 text-primary shrink-0 mt-0.5" />
        <span>
          Demo Mode: All rates reflect Veyra prototype fleet schedule. No live payment transactions occur.
        </span>
      </div>
    </div>
  )
}
