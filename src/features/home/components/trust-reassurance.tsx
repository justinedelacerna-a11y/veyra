import * as React from "react"
import {
  RiShieldCheckLine,
  RiPriceTag3Line,
  RiCalendarCheckLine,
  RiCustomerServiceLine,
} from "@remixicon/react"

interface TrustPillar {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const trustPillars: TrustPillar[] = [
  {
    icon: RiShieldCheckLine,
    title: "Guaranteed Models",
    description: "You drive the specific model and trim you reserved. No ambiguous 'or similar' substitutions.",
  },
  {
    icon: RiPriceTag3Line,
    title: "All-Inclusive Pricing",
    description: "Upfront daily rates with mandatory liability insurance, local taxes, and basic coverage built in.",
  },
  {
    icon: RiCalendarCheckLine,
    title: "Flexible Scheduling",
    description: "Free cancellation and penalty-free itinerary modifications up to 24 hours prior to handover.",
  },
  {
    icon: RiCustomerServiceLine,
    title: "24/7 Roadside Concierge",
    description: "Direct access to our logistics desk and nationwide recovery assistance whenever you need support.",
  },
]

export function TrustReassurance() {
  return (
    <div className="rounded-2xl border bg-muted/20 p-6 sm:p-8 lg:p-10">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {trustPillars.map((pillar) => {
          const Icon = pillar.icon
          return (
            <div key={pillar.title} className="flex flex-col gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                {pillar.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {pillar.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
