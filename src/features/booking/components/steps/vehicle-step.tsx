"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBooking } from "../../context/booking-context"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { Badge } from "@/components/ui/badge"
import {
  RiSteeringLine,
  RiUserLine,
  RiSuitcaseLine,
  RiGasStationLine,
  RiFlashlightLine,
  RiDoorLine,
  RiCheckDoubleLine,
  RiArrowRightLine,
  RiCarLine,
} from "@remixicon/react"

export function VehicleStep() {
  const router = useRouter()
  const { vehicle } = useBooking()

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

        {/* Visual Silhouette Showcase */}
        <div className="relative flex h-48 w-full items-center justify-center rounded-xl bg-gradient-to-b from-muted/50 via-muted/20 to-card p-6 border border-border/60">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex size-24 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RiSteeringLine className="size-12" />
            </div>
            <div className="mt-2 text-xs font-mono font-bold tracking-wider uppercase text-muted-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </div>
          </div>
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
              <span>Direct airport valet key handover</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <Link href={`/vehicles/${vehicle.id}`}>
          <Button variant="ghost" size="sm">
            Back to Vehicle Overview
          </Button>
        </Link>

        <Button
          size="lg"
          onClick={() => router.push("/booking/options")}
          className="gap-2 font-semibold shadow-md"
        >
          <span>Continue to Options & Extras</span>
          <RiArrowRightLine className="size-4" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
