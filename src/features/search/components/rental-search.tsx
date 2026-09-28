"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { MOCK_LOCATIONS } from "@/lib/mock/locations"
import {
  RiMapPinLine,
  RiCalendarLine,
  RiTimeLine,
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiAlertLine,
  RiRepeatLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

export interface RentalSearchProps {
  className?: string
  initialLocationId?: string
}

export function RentalSearch({
  className,
  initialLocationId,
}: RentalSearchProps) {
  const router = useRouter()

  // Form states with sensible defaults
  const [pickupLocation, setPickupLocation] = React.useState(
    initialLocationId ?? MOCK_LOCATIONS[0].id
  )
  const [returnLocation, setReturnLocation] = React.useState(
    initialLocationId ?? MOCK_LOCATIONS[0].id
  )
  const [sameLocation, setSameLocation] = React.useState(true)

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

    // Validation
    if (!pickupLocation) {
      setError("Please select a pickup location.")
      return
    }

    if (!sameLocation && !returnLocation) {
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
      const actualReturn = sameLocation ? pickupLocation : returnLocation
      const params = new URLSearchParams({
        pickup: pickupLocation,
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
        {/* Top Control Bar: Trip Type & Return Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
              <RiRepeatLine className="size-3.5" />
            </span>
            <span className="text-xs font-semibold text-foreground">
              Round-Trip / Flexible Rental
            </span>
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground select-none">
            <input
              type="checkbox"
              checked={sameLocation}
              onChange={(e) => {
                setSameLocation(e.target.checked)
                if (e.target.checked) {
                  setReturnLocation(pickupLocation)
                }
              }}
              className="size-4 rounded border-input accent-primary transition-colors cursor-pointer"
            />
            <span>Return to same location</span>
          </label>
        </div>

        {/* Primary Input Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
          {/* Pickup Location */}
          <div
            className={cn(
              "flex flex-col gap-1.5",
              sameLocation ? "lg:col-span-4" : "lg:col-span-3"
            )}
          >
            <label
              htmlFor="search-pickup-loc"
              className="text-xs font-semibold text-foreground flex items-center gap-1.5"
            >
              <RiMapPinLine className="size-3.5 text-primary" />
              <span>Pickup Hub</span>
            </label>
            <div className="relative">
              <select
                id="search-pickup-loc"
                value={pickupLocation}
                onChange={(e) => {
                  setPickupLocation(e.target.value)
                  if (sameLocation) {
                    setReturnLocation(e.target.value)
                  }
                }}
                className="w-full h-11 rounded-lg border border-input bg-background/80 px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              >
                {MOCK_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.city} — {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Return Location (only if different) */}
          {!sameLocation && (
            <div className="flex flex-col gap-1.5 lg:col-span-3">
              <label
                htmlFor="search-return-loc"
                className="text-xs font-semibold text-foreground flex items-center gap-1.5"
              >
                <RiMapPinLine className="size-3.5 text-muted-foreground" />
                <span>Return Hub</span>
              </label>
              <select
                id="search-return-loc"
                value={returnLocation}
                onChange={(e) => setReturnLocation(e.target.value)}
                className="w-full h-11 rounded-lg border border-input bg-background/80 px-3 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
              >
                {MOCK_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.city} — {loc.name}
                  </option>
                ))}
              </select>
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
            <span>Guaranteed exact model & year</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RiCheckboxCircleLine className="size-3.5 text-primary" />
            <span>Free cancellation up to 24h prior</span>
          </div>
          <div className="flex items-center gap-1.5">
            <RiCheckboxCircleLine className="size-3.5 text-primary" />
            <span>All fees & basic insurance included</span>
          </div>
        </div>
      </form>
    </div>
  )
}
