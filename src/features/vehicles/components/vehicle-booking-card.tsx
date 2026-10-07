"use client"

import * as React from "react"
import Link from "next/link"
import { Vehicle, LocationHub } from "@/types"
import { Button } from "@/components/ui/button"
import {
  RiShieldCheckLine,
  RiMapPinLine,
  RiCalendarLine,
  RiCheckDoubleLine,
  RiInformationLine,
  RiArrowRightLine,
} from "@remixicon/react"

export interface VehicleBookingCardProps {
  vehicle: Vehicle
  pickupId?: string
  returnLocId?: string
  from?: string
  fromTime?: string
  to?: string
  toTime?: string
  locations?: LocationHub[]
}

export function VehicleBookingCard({
  vehicle,
  pickupId,
  returnLocId,
  from,
  fromTime = "10:00",
  to,
  toTime = "10:00",
  locations,
}: VehicleBookingCardProps) {
  const [internalLocations, setInternalLocations] = React.useState<LocationHub[]>(locations || [])

  React.useEffect(() => {
    if (locations && locations.length > 0) return

    let cancelled = false
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data: { locations?: LocationHub[] }) => {
        if (!cancelled && data.locations && data.locations.length > 0) {
          setInternalLocations(data.locations)
        }
      })
      .catch((err) => {
        console.error("[vehicle-booking-card] error fetching locations:", err)
      })

    return () => {
      cancelled = true
    }
  }, [locations])

  const activeLocations = locations && locations.length > 0 ? locations : internalLocations

  const [userPickup, setUserPickup] = React.useState<string | null>(null)
  const [userReturn, setUserReturn] = React.useState<string | null>(null)

  const selectedPickup = userPickup || pickupId || "10c00000-0000-0000-0000-000000000001"
  const selectedReturn = userReturn || returnLocId || selectedPickup

  // Resolve locations
  const pickupHub =
    activeLocations.find((l) => l.id === selectedPickup) || activeLocations[0] || {
      id: selectedPickup || "10c00000-0000-0000-0000-000000000001",
      name: "Barangay Libertad Hub",
      barangay: "Libertad",
      city: "Butuan City",
      province: "Agusan del Norte",
      type: "Barangay Hub" as const,
      address: "Barangay Libertad, Butuan City, Agusan del Norte",
      operatingHours: "08:00 - 20:00",
      pickupAvailable: true,
    }

  const returnHub =
    activeLocations.find((l) => l.id === selectedReturn) || pickupHub

  // Calculate rental duration in days
  const rentalDays = React.useMemo(() => {
    if (!from || !to) return 3
    const start = new Date(`${from}T${fromTime}`)
    const end = new Date(`${to}T${toTime}`)
    const diffMs = end.getTime() - start.getTime()
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 1
  }, [from, fromTime, to, toTime])

  const subtotal = vehicle.dailyRate * rentalDays
  const deposit = vehicle.securityDeposit || 10000

  const formatDateLabel = (dStr?: string) => {
    if (!dStr) return "Tomorrow"
    try {
      return new Date(dStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    } catch {
      return dStr
    }
  }

  return (
    <div className="rounded-2xl border bg-card/90 p-6 shadow-lg backdrop-blur-xs sticky top-24 space-y-6">
      {/* Price Header */}
      <div className="flex items-baseline justify-between border-b border-border/60 pb-5">
        <div>
          <span className="text-xs text-muted-foreground font-medium block">
            Daily Rental Rate
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-heading text-3xl font-bold text-foreground">
              {vehicle.currency}
              {vehicle.dailyRate.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">/ day</span>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
          <RiShieldCheckLine className="size-3.5" />
          <span>Guaranteed</span>
        </span>
      </div>

      {/* Selected Itinerary Summary & Barangay Selectors */}
      <div className="space-y-3.5 rounded-xl bg-muted/40 p-4 border border-border/50 text-xs">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="card-pickup-loc" className="font-semibold text-foreground flex items-center gap-1.5">
              <RiMapPinLine className="size-3.5 text-primary shrink-0" />
              <span>Pickup Barangay</span>
            </label>
            <span className="text-[10px] text-muted-foreground">Butuan City</span>
          </div>
          <select
            id="card-pickup-loc"
            value={pickupHub.id}
            onChange={(e) => {
              setUserPickup(e.target.value)
              if (!userReturn || userReturn === selectedPickup) {
                setUserReturn(e.target.value)
              }
            }}
            className="w-full h-9 rounded-md border border-input bg-background/90 px-2.5 text-xs font-medium text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            {activeLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                Barangay {loc.barangay || loc.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            Barangay {pickupHub.barangay || pickupHub.name}, Butuan City, Agusan del Norte
          </p>
        </div>

        <div className="space-y-2 pt-2 border-t border-border/40">
          <div className="flex items-center justify-between">
            <label htmlFor="card-return-loc" className="font-semibold text-foreground flex items-center gap-1.5">
              <RiMapPinLine className="size-3.5 text-muted-foreground shrink-0" />
              <span>Return Barangay</span>
            </label>
            <span className="text-[10px] text-muted-foreground">Butuan City</span>
          </div>
          <select
            id="card-return-loc"
            value={returnHub.id}
            onChange={(e) => setUserReturn(e.target.value)}
            className="w-full h-9 rounded-md border border-input bg-background/90 px-2.5 text-xs font-medium text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring cursor-pointer"
          >
            {activeLocations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                Barangay {loc.barangay || loc.name}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-muted-foreground">
            Barangay {returnHub.barangay || returnHub.name}, Butuan City, Agusan del Norte
          </p>
        </div>

        <div className="flex items-start gap-2.5 pt-2 border-t border-border/40">
          <RiCalendarLine className="size-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold text-foreground block">
              Duration: {rentalDays} {rentalDays === 1 ? "Day" : "Days"}
            </span>
            <span className="text-muted-foreground">
              {formatDateLabel(from)} ({fromTime}) → {formatDateLabel(to)} ({toTime})
            </span>
          </div>
        </div>
      </div>

      {/* Price Breakdown Calculation */}
      <div className="space-y-2.5 text-xs text-muted-foreground pt-1">
        <div className="flex justify-between">
          <span>
            {vehicle.currency}
            {vehicle.dailyRate.toLocaleString()} × {rentalDays}{" "}
            {rentalDays === 1 ? "day" : "days"}
          </span>
          <span className="font-medium text-foreground">
            {vehicle.currency}
            {subtotal.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="flex items-center gap-1">
            <span>Mandatory Third-Party Liability</span>
            <RiInformationLine className="size-3 text-muted-foreground" />
          </span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            Included
          </span>
        </div>

        <div className="flex justify-between">
          <span>Airport Valet Concession Fee</span>
          <span className="font-medium text-emerald-600 dark:text-emerald-400">
            Included
          </span>
        </div>

        <div className="flex justify-between pt-2 border-t border-border/60 text-sm font-semibold text-foreground">
          <span>Estimated Total</span>
          <span className="font-heading text-lg font-bold text-primary">
            {vehicle.currency}
            {subtotal.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Security Deposit & Mileage Notice */}
      <div className="rounded-lg bg-muted/30 p-3 text-[11px] text-muted-foreground space-y-1">
        <div className="flex justify-between">
          <span>Security Deposit (Refundable):</span>
          <span className="font-mono font-medium text-foreground">
            ₱{deposit.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Mileage Allowance:</span>
          <span className="font-medium text-foreground">
            {vehicle.mileageAllowance || "300 km/day included"}
          </span>
        </div>
      </div>

      {/* Primary Booking Action Link */}
      <Link
        href={`/booking?vehicleId=${vehicle.id}&pickup=${pickupHub.id}&returnLoc=${returnHub.id}&from=${from || ""}&fromTime=${fromTime}&to=${to || ""}&toTime=${toTime}`}
        className="block"
      >
        <Button size="lg" className="w-full font-semibold shadow-md gap-2">
          <span>Proceed to Booking</span>
          <RiArrowRightLine className="size-4" data-icon="inline-end" />
        </Button>
      </Link>

      {/* Reassurance Micro-Copy */}
      <div className="space-y-2 pt-2 border-t border-border/40 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <RiCheckDoubleLine className="size-3.5 text-primary shrink-0" />
          <span>Zero ambiguous &apos;or similar&apos; car model swaps</span>
        </div>
        <div className="flex items-center gap-2">
          <RiCheckDoubleLine className="size-3.5 text-primary shrink-0" />
          <span>Free cancellation up to 24 hours prior to handover</span>
        </div>
        <div className="flex items-center gap-2">
          <RiCheckDoubleLine className="size-3.5 text-primary shrink-0" />
          <span>24/7 dedicated fleet logistics concierge</span>
        </div>
      </div>
    </div>
  )
}
