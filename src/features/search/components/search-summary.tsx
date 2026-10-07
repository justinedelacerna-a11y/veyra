"use client"

import * as React from "react"
import type { LocationHub } from "@/types"
import { RentalSearch } from "./rental-search"
import { Button } from "@/components/ui/button"
import {
  RiMapPinLine,
  RiCalendarLine,
  RiEditLine,
  RiCloseLine,
} from "@remixicon/react"

export interface SearchSummaryProps {
  pickupId?: string
  returnLocId?: string
  from?: string
  fromTime?: string
  to?: string
  toTime?: string
  locations?: LocationHub[]
}

export function SearchSummary({
  pickupId,
  returnLocId,
  from,
  fromTime,
  to,
  toTime,
  locations,
}: SearchSummaryProps) {
  const [isEditing, setIsEditing] = React.useState(false)
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
        console.error("[search-summary] error fetching locations:", err)
      })

    return () => {
      cancelled = true
    }
  }, [locations])

  const activeLocations = locations && locations.length > 0 ? locations : internalLocations

  const pickupHub =
    activeLocations.find((loc) => loc.id === pickupId) || activeLocations[0] || {
      id: pickupId || "10c00000-0000-0000-0000-000000000001",
      name: "Barangay Libertad Hub",
      barangay: "Libertad",
      city: "Butuan City",
      type: "City Center" as const,
      address: "National Highway, Brgy. Libertad, Butuan City, Agusan del Norte",
      operatingHours: "08:00 - 20:00",
      pickupAvailable: true,
    }

  const returnHub =
    activeLocations.find((loc) => loc.id === returnLocId) || pickupHub

  // Calculate rental duration in days
  const rentalDays = React.useMemo(() => {
    if (!from || !to) return 3
    const start = new Date(`${from}T${fromTime || "10:00"}`)
    const end = new Date(`${to}T${toTime || "10:00"}`)
    const diffMs = end.getTime() - start.getTime()
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 1
  }, [from, fromTime, to, toTime])

  const formatDateDisplay = (dateStr?: string, timeStr?: string) => {
    if (!dateStr) return "Tomorrow, 10:00 AM"
    try {
      const d = new Date(`${dateStr}T${timeStr || "10:00"}`)
      return d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }) + `, ${timeStr || "10:00"}`
    } catch {
      return `${dateStr} ${timeStr || ""}`
    }
  }

  return (
    <div className="rounded-2xl border bg-card/80 p-4 sm:p-5 shadow-xs backdrop-blur-xs transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Itinerary details */}
        <div className="flex flex-wrap items-center gap-y-3 gap-x-6">
          {/* Pickup & Return Locations */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <RiMapPinLine className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                {returnHub.id !== pickupHub.id ? "Pickup Hub" : "Pickup & Return"}
              </span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <span>
                  {pickupHub.barangay ? `Barangay ${pickupHub.barangay}` : pickupHub.name}, Butuan City
                </span>
              </div>
              {returnHub.id !== pickupHub.id && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  Return: {returnHub.barangay ? `Barangay ${returnHub.barangay}` : returnHub.name}, Butuan City
                </div>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="hidden sm:block h-8 w-px bg-border" />

          {/* Dates & Times */}
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
              <RiCalendarLine className="size-5" />
            </div>
            <div>
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider block">
                Rental Period • {rentalDays} {rentalDays === 1 ? "Day" : "Days"}
              </span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <span>{formatDateDisplay(from, fromTime)}</span>
                <span className="text-muted-foreground">→</span>
                <span>{formatDateDisplay(to, toTime)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button: Edit Itinerary */}
        <div className="flex items-center gap-2 self-start lg:self-center">
          <Button
            variant={isEditing ? "secondary" : "outline"}
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-1.5"
          >
            {isEditing ? (
              <>
                <RiCloseLine className="size-4" data-icon="inline-start" />
                <span>Close Editor</span>
              </>
            ) : (
              <>
                <RiEditLine className="size-4" data-icon="inline-start" />
                <span>Modify Search</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Expandable Search Drawer / Form */}
      {isEditing && (
        <div className="mt-5 pt-5 border-t border-border/70">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Update Rental Itinerary
            </h4>
          </div>
          <RentalSearch locations={activeLocations} initialLocationId={pickupHub.id} />
        </div>
      )}
    </div>
  )
}
