import * as React from "react"
import {
  RiCheckDoubleLine,
  RiMoneyDollarCircleLine,
  RiTimeLine,
  RiSparklingLine,
  RiCustomerServiceLine,
  RiShieldLine,
} from "@remixicon/react"

interface Benefit {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const benefits: Benefit[] = [
  {
    icon: RiCheckDoubleLine,
    title: "Exact Vehicle Guarantee",
    description: "Unlike conventional fleets that promise a 'similar' class, Veyra confirms your exact make, model, and year specification.",
  },
  {
    icon: RiMoneyDollarCircleLine,
    title: "Zero Hidden Surcharges",
    description: "Mandatory local taxes, airport concession fees, and basic damage waiver are transparently displayed before checkout.",
  },
  {
    icon: RiTimeLine,
    title: "Prompt Valet Handover",
    description: "Pre-verified driver credentials allow for direct key collection in designated airport valet bays without counter queues.",
  },
  {
    icon: RiSparklingLine,
    title: "Multi-Point Inspection & Sanitization",
    description: "Each vehicle undergoes multi-point mechanical inspection and complete interior sanitization prior to every booking.",
  },
  {
    icon: RiCustomerServiceLine,
    title: "Direct Concierge Hotline",
    description: "Reach an operational team member directly via phone or messaging for flight delays, route updates, or extensions.",
  },
  {
    icon: RiShieldLine,
    title: "Flexible Damage Protection",
    description: "Select standard protection or opt for zero-deductible coverage packages during reservation review.",
  },
]

export function WhyChooseVeyra() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl mx-auto text-center space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          The Veyra Standard
        </span>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Built for Predictable, Stress-Free Travel
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Car rental designed around transparent contracts, modern vehicle condition, and responsive support.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit) => {
          const Icon = benefit.icon
          return (
            <div
              key={benefit.title}
              className="flex flex-col gap-3 p-6 rounded-xl border bg-card/40 hover:bg-card hover:shadow-xs transition-colors"
            >
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4.5" />
              </div>
              <h3 className="font-heading text-base font-semibold text-foreground">
                {benefit.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {benefit.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
