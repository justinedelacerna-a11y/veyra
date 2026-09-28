import * as React from "react"
import Link from "next/link"
import { MOCK_LOCATIONS } from "@/lib/mock/locations"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  RiMapPin2Line,
  RiTimeLine,
  RiFlightTakeoffLine,
  RiBuilding4Line,
  RiArrowRightLine,
} from "@remixicon/react"

export function LocationsSection() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status="neutral" label="Sample Hub Network" size="sm" />
            <span className="text-xs text-muted-foreground">Airport & City Delivery</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Available Hubs & Pickup Points
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Convenient key handover points situated at major arrival terminals and central business districts.
          </p>
        </div>

        <Link href="/locations" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
          <span>View All Locations</span>
          <RiArrowRightLine className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_LOCATIONS.map((loc) => {
          const isAirport = loc.type.includes("Airport")
          const Icon = isAirport ? RiFlightTakeoffLine : RiBuilding4Line

          return (
            <div
              key={loc.id}
              className="flex flex-col justify-between p-5 rounded-xl border bg-card/60 hover:bg-card hover:shadow-xs transition-colors gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-muted text-foreground">
                      <Icon className="size-4" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {loc.city}
                    </span>
                  </div>
                  <StatusBadge
                    status={loc.pickupAvailable ? "success" : "neutral"}
                    label={loc.pickupAvailable ? "Open" : "Closed"}
                    size="sm"
                  />
                </div>

                <div>
                  <h3 className="font-heading text-sm font-semibold text-foreground line-clamp-1">
                    {loc.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-start gap-1.5">
                    <RiMapPin2Line className="size-3.5 text-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{loc.address}</span>
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                <span className="text-muted-foreground flex items-center gap-1">
                  <RiTimeLine className="size-3" />
                  <span>{loc.operatingHours}</span>
                </span>

                <Link href={`/vehicles?pickup=${loc.id}`}>
                  <Button variant="ghost" size="xs" className="gap-1 font-medium">
                    <span>Cars Here</span>
                    <RiArrowRightLine className="size-3" />
                  </Button>
                </Link>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
