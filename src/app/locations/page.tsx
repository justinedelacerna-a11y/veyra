import * as React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { CustomerShell } from "@/components/shell/customer"
import { PageContainer } from "@/components/layout"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { MOCK_LOCATIONS } from "@/lib/mock/locations"
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
  title: "Pickup Hubs & Locations — Veyra",
  description:
    "Find a Veyra vehicle hub near you. Airport terminal valet bays and city center stations across Mindanao and Visayas with 24/7 contactless handover.",
}

const hubFeatures = [
  {
    icon: RiFlightTakeoffLine,
    title: "Airport Valet Bays",
    description:
      "Dedicated kerbside valet zones at arrivals. Walk out, hand over your documents, drive away — no counter queue required.",
  },
  {
    icon: RiShieldCheckLine,
    title: "Verified Handover Protocol",
    description:
      "Every pickup follows a structured inspection checklist with digital sign-off. Condition recorded before you depart.",
  },
  {
    icon: RiCustomerService2Line,
    title: "24/7 Concierge Line",
    description:
      "Reach a Veyra operations agent at any hour. Breakdown assistance, reservation changes, and remote support included.",
  },
]

export default function LocationsPage() {
  const airportHubs = MOCK_LOCATIONS.filter((l) =>
    l.type.includes("Airport")
  )
  const cityHubs = MOCK_LOCATIONS.filter((l) => !l.type.includes("Airport"))

  return (
    <CustomerShell>
      <div className="py-10 sm:py-14 space-y-16">
        <PageContainer>
          {/* Page Header */}
          <div className="max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge
                status="success"
                label={`${MOCK_LOCATIONS.length} Active Hubs`}
                size="sm"
              />
              <StatusBadge
                status="neutral"
                label="Airport & City Delivery"
                size="sm"
              />
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Pickup Hubs &amp; Locations
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              Veyra operates dedicated pickup bays at major arrival terminals
              and premium city-center locations. Key handover is contactless,
              documented, and takes under three minutes.
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

          {/* Airport Hubs */}
          <section aria-labelledby="airport-hubs-heading" className="space-y-5">
            <div className="flex items-center gap-3">
              <h2
                id="airport-hubs-heading"
                className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2"
              >
                <RiFlightTakeoffLine className="size-5 text-primary" />
                Airport Terminal Hubs
              </h2>
              <StatusBadge
                status="success"
                label="24/7 Continuous Handover"
                size="sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {airportHubs.map((loc) => (
                <LocationCard key={loc.id} loc={loc} />
              ))}
            </div>
          </section>

          {/* City Center Hubs */}
          <section aria-labelledby="city-hubs-heading" className="space-y-5">
            <div className="flex items-center gap-3">
              <h2
                id="city-hubs-heading"
                className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-2"
              >
                <RiBuilding4Line className="size-5 text-primary" />
                City Center Stations
              </h2>
              <StatusBadge status="info" label="Extended Hours" size="sm" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {cityHubs.map((loc) => (
                <LocationCard key={loc.id} loc={loc} />
              ))}
            </div>
          </section>

          {/* CTA Banner */}
          <div className="rounded-2xl border bg-card p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <p className="font-heading text-lg font-semibold text-foreground">
                Need a pickup point not listed?
              </p>
              <p className="text-sm text-muted-foreground">
                Contact our concierge desk to arrange a custom delivery
                location or long-term fleet station assignment.
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
                  <span>Browse Fleet</span>
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}

// ─── Location Card ─────────────────────────────────────────────────────────────

interface LocationCardProps {
  loc: {
    id: string
    name: string
    city: string
    type: string
    address: string
    operatingHours: string
    pickupAvailable: boolean
  }
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
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                {loc.type}
              </p>
              <p className="text-sm font-semibold text-foreground leading-tight">
                {loc.city}
              </p>
            </div>
          </div>
          <StatusBadge
            status={loc.pickupAvailable ? "success" : "neutral"}
            label={loc.pickupAvailable ? "Open" : "Closed"}
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
            aria-label={`Find vehicles at ${loc.name}`}
          >
            <RiCarLine className="size-3.5" data-icon="inline-start" />
            <span>Find Cars Here</span>
            <RiArrowRightLine
              className="size-3.5 ml-auto"
              data-icon="inline-end"
            />
          </Button>
        </Link>
      </div>
    </article>
  )
}
