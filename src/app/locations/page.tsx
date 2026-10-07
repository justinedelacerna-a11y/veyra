import * as React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { CustomerShell } from "@/components/shell/customer"
import { PageContainer } from "@/components/layout"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { getLiveLocations } from "@/features/search/server/locations-repository"
import {
  RiMapPin2Line,
  RiTimeLine,
  RiFlightTakeoffLine,
  RiBuilding4Line,
  RiPhoneLine,
  RiArrowRightLine,
  RiCarLine,
  RiShieldCheckLine,
  RiCustomerService2Line,
} from "@remixicon/react"

export const metadata: Metadata = {
  title: "Operating Location — Butuan City, Agusan del Norte | Veyra",
  description:
    "Veyra serves customers in Butuan City, Agusan del Norte, Philippines. Local operations hub with prompt vehicle handover, verified mechanical standards, and transparent rental pricing.",
}

const hubFeatures = [
  {
    icon: RiShieldCheckLine,
    title: "Verified Handover Protocol",
    description:
      "Every pickup in Butuan City follows a structured inspection checklist with digital sign-off. Condition and odometer recorded before departure.",
  },
  {
    icon: RiBuilding4Line,
    title: "Local Operations Hub",
    description:
      "Centrally based in Butuan City, Agusan del Norte. Rapid key release and smooth check-in without counter queues.",
  },
  {
    icon: RiCustomerService2Line,
    title: "24/7 Concierge Hotline",
    description:
      "Reach our local operations desk directly at any hour. Roadside recovery, itinerary updates, and prompt support included.",
  },
]

export default async function LocationsPage() {
  const locations = await getLiveLocations()

  return (
    <CustomerShell>
      <div className="py-10 sm:py-14 space-y-16">
        <PageContainer>
          {/* Page Header */}
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status="success"
                label="Butuan City Barangay Network"
                size="sm"
              />
              <span className="text-xs text-muted-foreground">
                Butuan City, Agusan del Norte, Philippines
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Pickup & Return Stations in Butuan City
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              Veyra operates dedicated car-rental pickup and return stations across official barangays of Butuan City, Agusan del Norte.
              Handover is punctual, fully documented, and inspected before every trip.
            </p>
          </div>

          {/* Hub Feature Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
            {hubFeatures.map((feat) => {
              const Icon = feat.icon
              return (
                <div
                  key={feat.title}
                  className="flex gap-4 p-5 rounded-xl border bg-card/60"
                >
                  <div className="shrink-0 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">
                      {feat.title}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Active Operating Locations */}
          <section aria-labelledby="operations-hub-heading" className="space-y-5">
            <div className="flex items-center gap-3">
              <h2
                id="operations-hub-heading"
                className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2"
              >
                <RiBuilding4Line className="size-5 text-primary" />
                Butuan City Barangay Hubs ({locations.length})
              </h2>
              <StatusBadge
                status="success"
                label="Active Hubs"
                size="sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {locations.map((loc) => (
                <LocationCard key={loc.id} loc={loc} />
              ))}
              {locations.length === 0 && (
                <div className="p-8 text-center border rounded-xl bg-card">
                  <p className="text-sm text-muted-foreground">
                    Butuan City Operations Hub active. Refresh or contact concierge.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* CTA Banner */}
          <div className="rounded-2xl border bg-card p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <p className="font-heading text-lg font-semibold text-foreground">
                Need a specific pickup arrangement in Butuan City?
              </p>
              <p className="text-sm text-muted-foreground">
                Contact our concierge desk to coordinate custom handover timing or long-term vehicle leasing.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 shrink-0">
              <Link href="/support">
                <Button variant="outline" size="sm" className="gap-2">
                  <RiPhoneLine className="size-4" data-icon="inline-start" />
                  <span>Contact Concierge</span>
                </Button>
              </Link>
              <Link href="/vehicles">
                <Button size="sm" className="gap-2">
                  <RiCarLine className="size-4" data-icon="inline-start" />
                  <span>Browse Available Cars</span>
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}

import { LocationHub } from "@/types"

// ─── Location Card ─────────────────────────────────────────────────────────────

interface LocationCardProps {
  loc: LocationHub
}

function LocationCard({ loc }: LocationCardProps) {
  const isAirport = loc.type.includes("Airport")
  const Icon = isAirport ? RiFlightTakeoffLine : RiBuilding4Line

  return (
    <article className="flex flex-col justify-between rounded-xl border bg-card hover:shadow-sm transition-shadow gap-5 overflow-hidden">
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
            variant="outline"
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
}
