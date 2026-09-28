import * as React from "react"
import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { CustomerShell } from "@/components/shell/customer/customer-shell"
import { PageContainer } from "@/components/layout/page-container"
import { VehicleBookingCard } from "@/features/vehicles/components/vehicle-booking-card"
import { StatusBadge } from "@/components/common/status-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MOCK_VEHICLES } from "@/lib/mock/vehicles"
import {
  RiUserLine,
  RiSuitcaseLine,
  RiGasStationLine,
  RiFlashlightLine,
  RiSteeringLine,
  RiDoorLine,
  RiSpeedUpLine,
  RiDashboard3Line,
  RiCheckDoubleLine,
  RiStarFill,
  RiShieldCheckLine,
  RiSparklingLine,
  RiArrowLeftLine,
  RiRoadMapLine,
  RiKeyLine,
} from "@remixicon/react"

interface VehicleDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{
    pickup?: string
    returnLoc?: string
    from?: string
    fromTime?: string
    to?: string
    toTime?: string
  }>
}

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const vehicle = MOCK_VEHICLES.find((v) => v.id === id)

  if (!vehicle) {
    return {
      title: "Vehicle Not Found | Veyra",
    }
  }

  return {
    title: `${vehicle.year} ${vehicle.make} ${vehicle.model} — Rental Details | Veyra`,
    description: `Reserve the exact ${vehicle.year} ${vehicle.make} ${vehicle.model}. Guaranteed model, verified condition, with prompt valet handover.`,
  }
}

export default async function VehicleDetailPage({
  params,
  searchParams,
}: VehicleDetailPageProps) {
  const { id } = await params
  const resolvedSearchParams = await searchParams

  const vehicle = MOCK_VEHICLES.find((v) => v.id === id)

  if (!vehicle) {
    notFound()
  }

  const isElectric = vehicle.fuelType === "Electric"

  return (
    <CustomerShell>
      <div className="py-6 sm:py-10 space-y-8">
        <PageContainer>
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/vehicles" className="hover:text-foreground transition-colors">
              Fleet Catalog
            </Link>
            <span>/</span>
            <span className="text-foreground font-medium truncate max-w-xs sm:max-w-none">
              {vehicle.make} {vehicle.model}
            </span>
          </nav>

          {/* Vehicle Identity Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/60">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge
                  status="success"
                  label="Guaranteed Exact Model"
                  size="sm"
                />
                {vehicle.badge && (
                  <Badge variant="secondary" className="font-semibold text-xs border">
                    {vehicle.badge}
                  </Badge>
                )}
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground bg-muted/60 px-2 py-0.5 rounded">
                  Year {vehicle.year}
                </span>
              </div>

              <h1 className="font-heading text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                {vehicle.make} {vehicle.model}
              </h1>

              {vehicle.rating && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                  <div className="flex items-center gap-1 text-foreground font-semibold">
                    <RiStarFill className="size-4 text-amber-500 fill-amber-500" />
                    <span>{vehicle.rating.toFixed(2)}</span>
                  </div>
                  <span>•</span>
                  <span>{vehicle.tripsCount || 40}+ completed trips</span>
                  <span>•</span>
                  <span className="capitalize">{vehicle.category} Class</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Link href="/vehicles">
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs">
                  <RiArrowLeftLine className="size-3.5" data-icon="inline-start" />
                  <span>Back to Search</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Two-Column Grid: Left (Media & Details) / Right (Sticky Booking Card) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mt-8 items-start">
            {/* Primary Details Column */}
            <div className="lg:col-span-8 space-y-10">
              {/* Featured Visual Showcase Area */}
              <div className="rounded-2xl border bg-gradient-to-b from-muted/40 via-muted/10 to-card overflow-hidden shadow-xs">
                <div className="relative flex h-72 sm:h-96 w-full items-center justify-center p-8">
                  {/* Subtle Background Glow */}
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="size-64 rounded-full bg-primary/20 blur-3xl" />
                  </div>

                  {/* Stylized Vehicle Silhouette Centerpiece */}
                  <div className="relative flex flex-col items-center justify-center z-10 text-center">
                    <div className="flex size-32 sm:size-40 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
                      <RiSteeringLine className="size-20 sm:size-24" />
                    </div>
                    <div className="mt-4 text-xs font-mono font-bold tracking-widest uppercase text-muted-foreground">
                      {vehicle.year} {vehicle.make} • {vehicle.category}
                    </div>
                  </div>

                  {/* Badges in preview */}
                  <div className="absolute bottom-4 left-4 z-10">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-background/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border shadow-xs text-foreground">
                      <RiShieldCheckLine className="size-4 text-emerald-500" />
                      <span>Cleaned & Sanitized Prior to Release</span>
                    </span>
                  </div>
                </div>

                {/* View angle indicators */}
                <div className="grid grid-cols-3 border-t border-border/60 bg-muted/20 text-center text-xs font-medium text-muted-foreground">
                  <div className="py-2.5 border-r border-border/40 font-semibold text-foreground bg-background/40">
                    Exterior Profile
                  </div>
                  <div className="py-2.5 border-r border-border/40">
                    Driver Cockpit
                  </div>
                  <div className="py-2.5">
                    Passenger Cabin
                  </div>
                </div>
              </div>

              {/* Technical Specifications Grid */}
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                  Key Technical Specifications
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border bg-card/60 p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RiUserLine className="size-4 text-primary" />
                      <span>Capacity</span>
                    </div>
                    <p className="font-heading text-base font-bold text-foreground">
                      {vehicle.seats} Passengers
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card/60 p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RiSuitcaseLine className="size-4 text-primary" />
                      <span>Luggage Space</span>
                    </div>
                    <p className="font-heading text-base font-bold text-foreground">
                      {vehicle.luggage} Large Bags
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card/60 p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RiDashboard3Line className="size-4 text-primary" />
                      <span>Transmission</span>
                    </div>
                    <p className="font-heading text-base font-bold text-foreground">
                      {vehicle.transmission}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card/60 p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      {isElectric ? (
                        <RiFlashlightLine className="size-4 text-emerald-500" />
                      ) : (
                        <RiGasStationLine className="size-4 text-primary" />
                      )}
                      <span>Powertrain</span>
                    </div>
                    <p className="font-heading text-base font-bold text-foreground">
                      {vehicle.fuelType}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card/60 p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RiDoorLine className="size-4 text-primary" />
                      <span>Doors</span>
                    </div>
                    <p className="font-heading text-base font-bold text-foreground">
                      {vehicle.doors || 4} Doors
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card/60 p-3.5 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RiSpeedUpLine className="size-4 text-primary" />
                      <span>Acceleration</span>
                    </div>
                    <p className="font-heading text-base font-bold text-foreground truncate">
                      {vehicle.acceleration || "Factory Spec"}
                    </p>
                  </div>

                  <div className="rounded-xl border bg-card/60 p-3.5 space-y-1 col-span-2">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RiDashboard3Line className="size-4 text-primary" />
                      <span>Power Output</span>
                    </div>
                    <p className="font-heading text-base font-bold text-foreground truncate">
                      {vehicle.power || "Factory Output"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Overview */}
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                  Vehicle Overview
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  <p>
                    {vehicle.description}
                  </p>
                  <p className="mt-3">
                    As part of the Veyra fleet, this vehicle is owned or directly managed under our strict service contracts. It is scheduled for technical inspection before every client handover, ensuring fluids, tire tread, electronic driver assists, and air conditioning operate at optimal factory parameters.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Features & Factory Inclusions */}
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                  Included Factory Equipment & Features
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vehicle.features.map((feature, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 rounded-lg border bg-muted/20 p-3 text-xs"
                    >
                      <RiCheckDoubleLine className="size-4 text-primary shrink-0 mt-0.5" />
                      <span className="font-medium text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Handover & Operating Protocols */}
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold tracking-tight text-foreground">
                  Handover & Return Standards
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2 rounded-xl border bg-card/40 p-4">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <RiKeyLine className="size-5" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      Valet Bay Handover
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Pre-verify your driver profile online. Walk directly to our terminal valet zone for key release.
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border bg-card/40 p-4">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <RiSparklingLine className="size-5" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      Multi-Point Prep
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Every car undergoes technical inspection, fluid verification, and complete cabin sanitization.
                    </p>
                  </div>

                  <div className="space-y-2 rounded-xl border bg-card/40 p-4">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <RiRoadMapLine className="size-5" />
                    </div>
                    <h3 className="font-heading text-sm font-semibold text-foreground">
                      Return Flexibility
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Return to your scheduled hub or coordinate an alternate return location with our 24/7 concierge.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Sticky Reservation Card Column */}
            <aside className="lg:col-span-4">
              <VehicleBookingCard
                vehicle={vehicle}
                pickupId={resolvedSearchParams.pickup}
                returnLocId={resolvedSearchParams.returnLoc}
                from={resolvedSearchParams.from}
                fromTime={resolvedSearchParams.fromTime}
                to={resolvedSearchParams.to}
                toTime={resolvedSearchParams.toTime}
              />
            </aside>
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}
