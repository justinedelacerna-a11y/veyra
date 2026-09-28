"use client"

import * as React from "react"
import { MOCK_LOCATIONS } from "@/lib/mock/locations"
import { RentalSearch } from "./rental-search"
import { Button } from "@/components/ui/button"
import {
  RiMapPinLine,
  RiCalendarLine,
  RiEditLine,
  RiArrowRightLine,
  RiCloseLine,
} from "@remixicon/react"

export interface SearchSummaryProps {
  pickupId?: string
  returnLocId?: string
  from?: string
  fromTime?: string
  to?: string
  toTime?: string
}

export function SearchSummary({
  pickupId,
  returnLocId,
  from,
  fromTime,
  to,
  toTime,
}: SearchSummaryProps) {
  const [isEditing, setIsEditing] = React.useState(false)

  const pickupHub =
    MOCK_LOCATIONS.find((loc) => loc.id === pickupId) || MOCK_LOCATIONS[0]
  const returnHub =
    MOCK_LOCATIONS.find((loc) => loc.id === returnLocId) || pickupHub

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
                Pickup & Return
              </span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <span>{pickupHub.city} ({pickupHub.name.split(" ")[0]})</span>
                {returnHub.id !== pickupHub.id && (
                  <>
                    <RiArrowRightLine className="size-3.5 text-muted-foreground" />
                    <span>{returnHub.city} ({returnHub.name.split(" ")[0]})</span>
                  </>
                )}
              </div>
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
          <RentalSearch initialLocationId={pickupHub.id} />
        </div>
      )}
    </div>
  )
}
