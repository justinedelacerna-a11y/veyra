import * as React from "react"
import Link from "next/link"
import { MOCK_FEATURED_VEHICLES } from "@/lib/mock/vehicles"
import { VehicleCard } from "./vehicle-card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { RiArrowRightLine } from "@remixicon/react"

export function FeaturedVehicles() {
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <StatusBadge status="success" label="Guaranteed Models" size="sm" />
            <span className="text-xs text-muted-foreground">Clean & Sanitized Fleet</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Featured Fleet Selection
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Reserve the exact car you drive away. Every vehicle in our fleet is fully serviced, verified, and pre-prepped before key release.
          </p>
        </div>

        <Link href="/vehicles" className="shrink-0">
          <Button variant="outline" size="sm" className="gap-2">
            <span>View All Fleet</span>
            <RiArrowRightLine className="size-4" data-icon="inline-end" />
          </Button>
        </Link>
      </div>

      {/* Grid of Vehicles */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_FEATURED_VEHICLES.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  )
}
