"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBooking } from "../../context/booking-context"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { Badge } from "@/components/ui/badge"
import {
  RiUserLine,
  RiSuitcaseLine,
  RiGasStationLine,
  RiFlashlightLine,
  RiDoorLine,
  RiCheckDoubleLine,
  RiArrowRightLine,
  RiCarLine,
  RiMapPinLine,
} from "@remixicon/react"
import { VehicleImage } from "@/components/ui/vehicle-image"

export function VehicleStep() {
  const router = useRouter()
  const {
    vehicle,
    draft,
    updateDraft,
    availableLocations,
    pickupHub,
    returnHub,
  } = useBooking()

  if (!vehicle.available || vehicle.id === "unselected") {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Step 01 of 06
          </span>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Vehicle Selection Required
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Please choose a verified vehicle from the Veyra live catalog to begin your reservation.
          </p>
        </div>

        <div className="rounded-2xl border bg-card/60 p-8 sm:p-12 text-center space-y-4">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <RiCarLine className="size-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-foreground">No Active Vehicle Selected</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              To guarantee zero substitution and exact model handover, select a specific vehicle model from our fleet.
            </p>
          </div>
          <Link href="/vehicles">
            <Button size="default" className="gap-2 font-semibold">
              <RiCarLine className="size-4" />
              <span>Browse Available Fleet</span>
            </Button>
          </Link>
        </div>
      </div>
    )
  }

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

        {/* Visual Showcase */}
        <div className="relative overflow-hidden rounded-xl border border-border/60">
          <VehicleImage
            src={vehicle.primaryImage || vehicle.images?.[0] || null}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Veyra rental vehicle`}
            aspectRatio="16/10"
            category={vehicle.category}
            containerClassName="h-48 sm:h-56 w-full"
          />
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
              <span>Direct key handover at verified barangay hub</span>
            </div>
          </div>
        </div>

        {/* Localized Barangay Handover Stationing */}
        <div className="space-y-3 pt-3 border-t border-border/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <RiMapPinLine className="size-3.5 text-primary" />
              <span>Butuan City Barangay Handover Station</span>
            </h3>
            <span className="text-[11px] text-muted-foreground">
              Veyra operates exclusively in Butuan City
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-xl border bg-muted/30 p-3.5 space-y-1.5">
              <label htmlFor="booking-pickup-loc" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <RiMapPinLine className="size-3 text-primary" />
                <span>Pickup Location</span>
              </label>
              <select
                id="booking-pickup-loc"
                value={draft.pickupLocationId}
                onChange={(e) => updateDraft({ pickupLocationId: e.target.value })}
                className="w-full h-10 rounded-lg border border-input bg-background/80 px-2.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                {availableLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    Barangay {loc.barangay || loc.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground font-medium">
                Barangay {pickupHub.barangay || "Libertad"}, Butuan City, Agusan del Norte
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-3.5 space-y-1.5">
              <label htmlFor="booking-return-loc" className="text-xs font-semibold text-foreground flex items-center gap-1">
                <RiMapPinLine className="size-3 text-muted-foreground" />
                <span>Return Location</span>
              </label>
              <select
                id="booking-return-loc"
                value={draft.returnLocationId}
                onChange={(e) => updateDraft({ returnLocationId: e.target.value })}
                className="w-full h-10 rounded-lg border border-input bg-background/80 px-2.5 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
              >
                {availableLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    Barangay {loc.barangay || loc.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground font-medium">
                Barangay {returnHub.barangay || pickupHub.barangay || "Ampayon"}, Butuan City, Agusan del Norte
              </p>
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
