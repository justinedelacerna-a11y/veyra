import * as React from "react"
import Link from "next/link"
import { Vehicle } from "@/types"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  RiUserLine,
  RiSuitcaseLine,
  RiGasStationLine,
  RiFlashlightLine,
  RiArrowRightLine,
  RiCheckLine,
  RiStarFill,
  RiMapPinLine,
} from "@remixicon/react"
import { VehicleImage } from "@/components/ui/vehicle-image"
import { cn } from "@/lib/utils"

export interface VehicleCardProps {
  vehicle: Vehicle
  className?: string
  searchParamsString?: string
  actionLabel?: string
}

export function VehicleCard({
  vehicle,
  className,
  searchParamsString,
  actionLabel = "View Vehicle",
}: VehicleCardProps) {
  const isElectric = vehicle.fuelType === "Electric"
  const detailHref = `/vehicles/${vehicle.id}${
    searchParamsString ? `?${searchParamsString}` : ""
  }`

  const primaryPhoto = vehicle.primaryImage || vehicle.images?.[0] || null

  return (
    <Card
      className={cn(
        "group flex flex-col justify-between overflow-hidden border transition-all duration-200 hover:shadow-lg hover:border-primary/40 bg-card",
        className
      )}
    >
      <div>
        {/* Visual Vehicle Showcase Area */}
        <Link href={detailHref} className="block relative focus-visible:outline-hidden">
          <div className="relative h-48 w-full overflow-hidden border-b border-border/60">
            {/* Category / Badge overlay */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
              {vehicle.badge && (
                <Badge
                  variant="secondary"
                  className="bg-background/90 backdrop-blur-xs font-semibold text-[11px] shadow-2xs border"
                >
                  {vehicle.badge}
                </Badge>
              )}
            </div>

            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
              {vehicle.rating && (
                <span className="flex items-center gap-1 text-[11px] font-medium bg-background/90 backdrop-blur-xs px-2 py-0.5 rounded border text-foreground">
                  <RiStarFill className="size-3 text-amber-500 fill-amber-500" />
                  <span>{vehicle.rating.toFixed(1)}</span>
                </span>
              )}
              <span className="text-[11px] font-mono font-medium text-muted-foreground uppercase tracking-wider bg-background/80 px-2 py-0.5 rounded border">
                {vehicle.year}
              </span>
            </div>

            <VehicleImage
              src={primaryPhoto}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} - Veyra rental vehicle`}
              aspectRatio="none"
              category={vehicle.category}
              containerClassName="h-48 w-full"
              className="group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        </Link>

        {/* Identity & Specs Header */}
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold uppercase tracking-wider text-primary">
              {vehicle.make}
            </span>
            <span className="capitalize">{vehicle.category}</span>
          </div>
          <Link href={detailHref} className="hover:text-primary transition-colors focus-visible:outline-hidden">
            <CardTitle className="text-lg font-bold tracking-tight text-foreground line-clamp-1">
              {vehicle.model}
            </CardTitle>
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
            <RiMapPinLine className="size-3 text-primary shrink-0" />
            <span className="truncate">Stationed at Brgy. {vehicle.barangay || "Libertad"}, Butuan City</span>
          </div>
        </CardHeader>

        {/* Specs Grid */}
        <CardContent className="px-5 pb-4 space-y-4">
          <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-lg bg-muted/40 text-xs text-muted-foreground border border-border/50">
            <div className="flex items-center gap-1.5" title="Passenger Capacity">
              <RiUserLine className="size-3.5 text-foreground shrink-0" />
              <span className="truncate">{vehicle.seats} seats</span>
            </div>
            <div className="flex items-center gap-1.5" title="Luggage Allowance">
              <RiSuitcaseLine className="size-3.5 text-foreground shrink-0" />
              <span className="truncate">{vehicle.luggage} bags</span>
            </div>
            <div className="flex items-center gap-1.5" title="Powertrain">
              {isElectric ? (
                <RiFlashlightLine className="size-3.5 text-emerald-500 shrink-0" />
              ) : (
                <RiGasStationLine className="size-3.5 text-foreground shrink-0" />
              )}
              <span className="truncate">{vehicle.fuelType}</span>
            </div>
          </div>

          {/* Key Inclusions */}
          <div className="space-y-1.5 pt-1">
            {vehicle.features.slice(0, 2).map((feat, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                <RiCheckLine className="size-3.5 text-primary shrink-0" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      {/* Pricing & Reservation CTA */}
      <CardFooter className="flex items-center justify-between border-t border-border/60 bg-muted/20 px-5 py-3.5">
        <div className="flex flex-col">
          <span className="text-[11px] text-muted-foreground font-medium">Daily Rate</span>
          <div className="flex items-baseline gap-1">
            <span className="font-heading text-xl font-bold text-foreground">
              {vehicle.currency}
              {vehicle.dailyRate.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">/day</span>
          </div>
        </div>

        <Link href={detailHref}>
          <Button size="sm" className="gap-1.5 font-medium shadow-xs">
            <span>{actionLabel}</span>
            <RiArrowRightLine className="size-3.5" data-icon="inline-end" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
