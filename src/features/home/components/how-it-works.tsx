import * as React from "react"
import {
  RiCalendarEventLine,
  RiCarLine,
  RiKeyLine,
  RiArrowRightLine,
} from "@remixicon/react"
import { StatusBadge } from "@/components/common/status-badge"

interface StepItem {
  step: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const steps: StepItem[] = [
  {
    step: "01",
    title: "Select Dates & Pickup Hub",
    description: "Choose your travel window and whether you prefer an airport terminal valet handover or central city branch pickup.",
    icon: RiCalendarEventLine,
  },
  {
    step: "02",
    title: "Pick Your Specific Car",
    description: "Browse verified vehicles with transparent rates. View actual seating, luggage space, and exact equipment before booking.",
    icon: RiCarLine,
  },
  {
    step: "03",
    title: "Inspect & Drive Away",
    description: "Complete key release in under three minutes with digital verification. Drop keys back at the designated valet zone on return.",
    icon: RiKeyLine,
  },
]

export function HowItWorks() {
  return (
    <div className="space-y-8">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <StatusBadge status="info" label="Simple Process" size="sm" />
        <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          How Veyra Works
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          From search to ignition in three frictionless steps. No counter lines, no surprise fees, and no waiting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        {steps.map((item, index) => {
          const Icon = item.icon
          return (
            <div
              key={item.step}
              className="relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl border bg-card/60 shadow-xs hover:border-primary/30 transition-colors"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-primary px-2.5 py-1 rounded-md bg-primary/10">
                    Step {item.step}
                  </span>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                    <Icon className="size-5" />
                  </div>
                </div>

                <h3 className="font-heading text-lg font-semibold text-foreground">
                  {item.title}
                </h3>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-muted-foreground/40">
                  <RiArrowRightLine className="size-5" />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
