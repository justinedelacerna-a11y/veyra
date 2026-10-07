"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { LocationHub } from "@/types"
import {
  RiMapPinLine,
  RiCalendarLine,
  RiTimeLine,
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiAlertLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

export interface RentalSearchProps {
  className?: string
  initialLocationId?: string
  locations?: LocationHub[]
}

export function RentalSearch({
  className,
  initialLocationId,
  locations,
}: RentalSearchProps) {
  const router = useRouter()

  const [internalLocations, setInternalLocations] = React.useState<LocationHub[]>(locations || [])
  const [locationsLoading, setLocationsLoading] = React.useState(!locations || locations.length === 0)

  React.useEffect(() => {
    if (locations && locations.length > 0) return

    let cancelled = false
    fetch("/api/locations")
      .then((res) => res.json())
      .then((data: { locations?: LocationHub[] }) => {
        if (!cancelled && data.locations && data.locations.length > 0) {
          setInternalLocations(data.locations)
          setLocationsLoading(false)
        }
      })
      .catch((err) => {
        console.error("[rental-search] error loading locations:", err)
        if (!cancelled) setLocationsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [locations])

  const activeLocations = locations && locations.length > 0 ? locations : internalLocations

  // Form states with sensible defaults
  const [pickupLocation, setPickupLocation] = React.useState(initialLocationId ?? "")
  const [returnLocation, setReturnLocation] = React.useState(initialLocationId ?? "")
  const [sameLocation, setSameLocation] = React.useState(true)

  const effectivePickup = pickupLocation || activeLocations[0]?.id || ""
  const effectiveReturn = sameLocation ? effectivePickup : (returnLocation || activeLocations[0]?.id || "")

  const selectedPickupObj = activeLocations.find((l) => l.id === effectivePickup) || activeLocations[0]
  const selectedReturnObj = activeLocations.find((l) => l.id === effectiveReturn) || selectedPickupObj

  // Default dates: tomorrow to +3 days
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const defaultReturn = new Date(today)
  defaultReturn.setDate(defaultReturn.getDate() + 4)

  const formatDate = (d: Date) => d.toISOString().split("T")[0]

  const [pickupDate, setPickupDate] = React.useState(formatDate(tomorrow))
  const [pickupTime, setPickupTime] = React.useState("10:00")
  const [returnDate, setReturnDate] = React.useState(formatDate(defaultReturn))
  const [returnTime, setReturnTime] = React.useState("10:00")

  const [isSearching, setIsSearching] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const actualPickup = effectivePickup
    const actualReturn = effectiveReturn

    // Validation
    if (!actualPickup) {
      setError("Please select a pickup location.")
      return
    }

    if (!actualReturn) {
      setError("Please select a return location.")
      return
    }

    const start = new Date(`${pickupDate}T${pickupTime}`)
    const end = new Date(`${returnDate}T${returnTime}`)

    if (end <= start) {
      setError("Return date and time must be after the pickup time.")
      return
    }

    setIsSearching(true)

    // Simulate short UI navigation transition
    setTimeout(() => {
      const params = new URLSearchParams({
        pickup: actualPickup,
        returnLoc: actualReturn,
        from: pickupDate,
        fromTime: pickupTime,
        to: returnDate,
        toTime: returnTime,
      })
      router.push(`/search?${params.toString()}`)
    }, 450)
  }

  return (
    <div
      className={cn(
        "w-full rounded-2xl border bg-card/95 p-4 sm:p-6 shadow-xl backdrop-blur-md transition-all duration-200",
        className
      )}
    >
      <form onSubmit={handleSearch} className="space-y-4">
        {/* Top Control Bar: Localized Butuan City Service */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RiMapPinLine className="size-3.5" />
            </span>
            <span className="text-xs font-semibold text-foreground">
              Local Car Rental • Butuan City, Agusan del Norte
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
            <input
              type="checkbox"
              checked={!sameLocation}
              onChange={(e) => setSameLocation(!e.target.checked)}
              className="rounded border-input text-primary focus:ring-primary size-3.5"
            />
            <span>Different return barangay</span>
          </label>
        </div>

        {/* Primary Input Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Pickup Location */}
          <div className={cn("flex flex-col gap-1.5", sameLocation ? "lg:col-span-4" : "lg:col-span-3")}>
            <label
              htmlFor="search-pickup-loc"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <RiMapPinLine className="size-3.5 text-primary" />
              <span>Pickup Location</span>
            </label>
            <div className="relative">
              <select
                id="search-pickup-loc"
                value={effectivePickup}
                onChange={(e) => {
                  setPickupLocation(e.target.value)
                  if (sameLocation) setReturnLocation(e.target.value)
                }}
                className="w-full h-11 rounded-lg border border-input bg-background/80 px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              >
                {activeLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    Barangay {loc.barangay || loc.name}
                  </option>
                ))}
                {activeLocations.length === 0 && (
                  <option value="" disabled>
                    {locationsLoading ? "Loading hubs..." : "Barangay Libertad"}
                  </option>
                )}
              </select>
            </div>
            <span className="text-[11px] text-muted-foreground truncate" title={selectedPickupObj ? `Barangay ${selectedPickupObj.barangay || selectedPickupObj.name}, Butuan City, Agusan del Norte` : ""}>
              Barangay {selectedPickupObj?.barangay || "Libertad"}, Butuan City, Agusan del Norte
            </span>
          </div>

          {/* Return Location (only if different) */}
          {!sameLocation && (
            <div className="flex flex-col gap-1.5 lg:col-span-3">
              <label
                htmlFor="search-return-loc"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <RiMapPinLine className="size-3.5 text-muted-foreground" />
                <span>Return Location</span>
              </label>
              <select
                id="search-return-loc"
                value={effectiveReturn}
                onChange={(e) => setReturnLocation(e.target.value)}
                className="w-full h-11 rounded-lg border border-input bg-background/80 px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              >
                {activeLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    Barangay {loc.barangay || loc.name}
                  </option>
                ))}
                {activeLocations.length === 0 && (
                  <option value="" disabled>
                    {locationsLoading ? "Loading hubs..." : "Barangay Ampayon"}
                  </option>
                )}
              </select>
              <span className="text-[11px] text-muted-foreground truncate" title={selectedReturnObj ? `Barangay ${selectedReturnObj.barangay || selectedReturnObj.name}, Butuan City, Agusan del Norte` : ""}>
                Barangay {selectedReturnObj?.barangay || "Ampayon"}, Butuan City, Agusan del Norte
              </span>
            </div>
          )}

          {/* Pickup Date & Time */}
          <div
            className={cn(
              "flex flex-col gap-1.5",
              sameLocation ? "lg:col-span-3" : "lg:col-span-3"
            )}
          >
            <label
              htmlFor="search-pickup-date"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <RiCalendarLine className="size-3.5 text-primary" />
              <span>Pickup Date & Time</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              <input
                id="search-pickup-date"
                type="date"
                value={pickupDate}
                min={formatDate(today)}
                onChange={(e) => setPickupDate(e.target.value)}
                className="col-span-3 h-11 rounded-lg border border-input bg-background/80 px-2.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              />
              <input
                type="time"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="col-span-2 h-11 rounded-lg border border-input bg-background/80 px-2 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              />
            </div>
          </div>

          {/* Return Date & Time */}
          <div
            className={cn(
              "flex flex-col gap-1.5",
              sameLocation ? "lg:col-span-3" : "lg:col-span-3"
            )}
          >
            <label
              htmlFor="search-return-date"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <RiTimeLine className="size-3.5 text-primary" />
              <span>Return Date & Time</span>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              <input
                id="search-return-date"
                type="date"
                value={returnDate}
                min={pickupDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="col-span-3 h-11 rounded-lg border border-input bg-background/80 px-2.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              />
              <input
                type="time"
                value={returnTime}
                onChange={(e) => setReturnTime(e.target.value)}
                className="col-span-2 h-11 rounded-lg border border-input bg-background/80 px-2 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              />
            </div>
          </div>

          {/* Primary CTA Search Button */}
          <div
            className={cn(
              "flex items-end pt-2 sm:pt-0",
              sameLocation ? "lg:col-span-2" : "lg:col-span-12 lg:justify-end"
            )}
          >
            <Button
              type="submit"
              size="lg"
              disabled={isSearching}
              className={cn(
                "w-full h-11 font-semibold gap-2 shadow-md",
                !sameLocation && "lg:w-auto lg:px-8"
              )}
            >
              {isSearching ? (
                <>
                  <Spinner className="size-4" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Search Cars</span>
                  <RiArrowRightLine className="size-4" data-icon="inline-end" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Validation Error Notice if any */}
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            <RiAlertLine className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Reassurance Micro-Copy */}
        <div className="pt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-muted-foreground border-t border-border/40">
          <div className="flex items-center gap-1.5">
            <RiCheckboxCircleLine className="size-3.5 text-primary" />
            <span>Veyra serves customers in Butuan City, Agusan del Norte</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RiCheckboxCircleLine className="size-3.5 text-primary" />
            <span>Guaranteed exact model & year</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RiCheckboxCircleLine className="size-3.5 text-primary" />
            <span>Free cancellation up to 24h prior</span>
          </div>
        </div>
      </form>
    </div>
  )
}
