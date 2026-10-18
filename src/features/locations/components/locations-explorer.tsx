"use client"

import * as React from "react"
import Link from "next/link"
import { ButuanMap } from "./butuan-map"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import type { LocationHub } from "@/types"
import {
  VEYRA_PICKUP_HUBS,
  type VeyraHubLocation,
} from "@/features/locations/data/butuan-city-data"
import {
  RiBuilding4Line,
  RiMapPin2Line,
  RiTimeLine,
  RiCarLine,
  RiArrowRightLine,
  RiFlightTakeoffLine,
  RiRoadMapLine,
  RiCompass3Line,
} from "@remixicon/react"

interface LocationsExplorerProps {
  locations: LocationHub[]
}

export function LocationsExplorer({ locations }: LocationsExplorerProps) {
  const [selectedHubId, setSelectedHubId] = React.useState<string | null>(null)

  // Merge live Supabase status with verified geographic coordinates
  const mappedHubs: VeyraHubLocation[] = React.useMemo(() => {
    return VEYRA_PICKUP_HUBS.map((staticHub) => {
      const live = locations.find(
        (l) => l.id === staticHub.id || (l.barangay && l.barangay.toLowerCase() === staticHub.barangay.toLowerCase())
      )
      if (live) {
        return {
          ...staticHub,
          id: live.id,
          name: live.name,
          address: live.address,
          operatingHours: live.operatingHours,
          pickupAvailable: live.pickupAvailable ?? staticHub.pickupAvailable,
          returnAvailable: live.returnAvailable ?? staticHub.returnAvailable,
        }
      }
      return staticHub
    })
  }, [locations])

  const handleSelectHub = (hub: VeyraHubLocation) => {
    setSelectedHubId(hub.id)
    // Scroll smoothly to corresponding card if present
    const cardEl = document.getElementById(`location-card-${hub.id}`)
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  return (
    <div className="space-y-10">
      {/* ── Interactive Butuan City Map Section ────────────────────────── */}
      <section aria-labelledby="interactive-map-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 animate-ping" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Geographic City Explorer
              </span>
            </div>
            <h2
              id="interactive-map-heading"
              className="font-heading text-2xl font-bold tracking-tight text-foreground flex items-center gap-2 mt-0.5"
            >
              <RiRoadMapLine className="size-6 text-primary" />
              Interactive Map of Butuan City & Pickup Hubs
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Explore city streets, all 86 barangays, regional landmarks, and Veyra&apos;s 8 verified pickup hubs across Butuan City.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border bg-card text-xs font-medium text-muted-foreground">
              <RiCompass3Line className="size-3.5 text-amber-500" />
              <span>Full City Extent</span>
            </span>
          </div>
        </div>

        {/* Map View */}
        <ButuanMap
          hubs={mappedHubs}
          mode="explore"
          initialSelectedHubId={selectedHubId || undefined}
          onSelectHub={handleSelectHub}
          className="h-[520px] sm:h-[600px] shadow-lg"
        />
      </section>

      {/* ── Station Directory Grid ────────────────────────────────────── */}
      <section aria-labelledby="operations-hub-heading" className="space-y-5 pt-4">
        <div className="flex items-center gap-3">
          <h2
            id="operations-hub-heading"
            className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2"
          >
            <RiBuilding4Line className="size-5 text-primary" />
            Butuan City Barangay Stations ({locations.length})
          </h2>
          <StatusBadge status="success" label="Active Hubs" size="sm" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {locations.map((loc) => {
            const isSelected = selectedHubId === loc.id
            const isAirport = loc.type.includes("Airport")
            const Icon = isAirport ? RiFlightTakeoffLine : RiBuilding4Line

            return (
              <article
                id={`location-card-${loc.id}`}
                key={loc.id}
                className={`flex flex-col justify-between rounded-xl border bg-card transition-all gap-5 overflow-hidden ${
                  isSelected
                    ? "ring-2 ring-primary shadow-lg border-primary/40 bg-primary/5"
                    : "hover:shadow-sm"
                }`}
              >
                {/* Card Header */}
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground shrink-0">
                        <Icon className="size-4" />
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-primary uppercase tracking-wider">
                          {loc.barangay ? `Barangay ${loc.barangay}` : loc.type}
                        </p>
                        <p className="text-sm font-semibold text-foreground leading-tight">
                          {loc.city}, {loc.province || "Agusan del Norte"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge
                      status={loc.pickupAvailable ? "success" : "neutral"}
                      label={loc.pickupAvailable ? "Active Hub" : "Closed"}
                      size="sm"
                    />
                  </div>

                  <div>
                    <h3 className="font-heading text-base font-semibold text-foreground leading-snug">
                      {loc.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground flex items-start gap-1.5">
                      <RiMapPin2Line className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{loc.address}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RiTimeLine className="size-3.5 shrink-0" />
                    <span>{loc.operatingHours}</span>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-5 pb-5 pt-0">
                  <Link href={`/search?pickup=${loc.id}`} className="block">
                    <Button
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      className="w-full gap-1.5"
                      aria-label={`Find vehicles in Barangay ${loc.barangay || loc.name}, Butuan City`}
                    >
                      <RiCarLine className="size-3.5" data-icon="inline-start" />
                      <span>View Available Vehicles</span>
                      <RiArrowRightLine className="size-3.5" data-icon="inline-end" />
                    </Button>
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </div>
  )
}
