import * as React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { CustomerShell } from "@/components/shell/customer"
import { PageContainer, Section } from "@/components/layout"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  RiCalendarEventLine,
  RiCarLine,
  RiKeyLine,
  RiArrowRightLine,
  RiCheckboxCircleLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiMapPinLine,
  RiFileListLine,
  RiCameraLine,
  RiSmartphoneLine,
  RiMoneyDollarCircleLine,
} from "@remixicon/react"

export const metadata: Metadata = {
  title: "How Veyra Works — Contactless Car Rental | Veyra",
  description:
    "Learn how Veyra delivers a premium, queue-free car rental experience. Search, book, inspect, and drive away in under three minutes.",
}

const mainSteps = [
  {
    step: "01",
    icon: RiCalendarEventLine,
    title: "Select Your Dates",
    description:
      "Choose your rental dates and pickup time in Butuan City. Veyra matches your exact requirement, guaranteeing the specific vehicle model you choose.",
    details: [
      "Convenient handover at Butuan City Operations Hub",
      "Flexible schedule with prompt customer support",
      "Instant price display with all taxes and insurance included",
    ],
  },
  {
    step: "02",
    icon: RiCarLine,
    title: "Select the Exact Car",
    description:
      "Browse verified vehicles with transparent specifications. You reserve the precise make, model, and year — not a category that could be substituted with any vehicle on the lot.",
    details: [
      "Guaranteed model, not class-level substitution",
      "Full specs: seats, luggage, fuel type, transmission",
      "Verified inspection history before every rental",
    ],
  },
  {
    step: "03",
    icon: RiFileListLine,
    title: "Configure Options & Drivers",
    description:
      "Add optional extras such as comprehensive protection, GPS navigation, child seats, and additional authorized drivers. All charges are shown before you confirm.",
    details: [
      "Comprehensive damage protection available",
      "Add up to 3 authorized additional drivers",
      "No surprise mandatory fees at checkout",
    ],
  },
  {
    step: "04",
    icon: RiMoneyDollarCircleLine,
    title: "Secure Payment & Deposit",
    description:
      "Complete payment with a card or e-wallet. A fully refundable security deposit is authorized at booking and released within 48 hours of clean return.",
    details: [
      "Refundable deposit — released after inspection",
      "Zero damage? Full deposit returned automatically",
      "Immediate confirmation with a digital receipt",
    ],
  },
  {
    step: "05",
    icon: RiKeyLine,
    title: "Inspect & Drive Away",
    description:
      "Arrive at your hub. A Veyra agent will greet you, complete a documented pre-trip walkthrough, record fuel and odometer levels, then hand you the keys.",
    details: [
      "Sub-3-minute contactless handover protocol",
      "Full vehicle condition documented with photos",
      "Digital inspection sign-off — no paper forms",
    ],
  },
  {
    step: "06",
    icon: RiSmartphoneLine,
    title: "Return & Close Out",
    description:
      "Return the vehicle to our Butuan City Operations Hub. Post-trip inspection confirms condition, releases your deposit, and emails your closure receipt.",
    details: [
      "Convenient return in Butuan City",
      "Inspection completed transparently in front of you",
      "Digital receipt and swift deposit closure",
    ],
  },
]

const guarantees = [
  {
    icon: RiCheckboxCircleLine,
    label: "Guaranteed Model",
    description: "Zero substitution policy. You book a specific car, you drive that specific car.",
  },
  {
    icon: RiShieldCheckLine,
    label: "Verified Condition",
    description: "Multi-point inspection before every handover. Full history available on request.",
  },
  {
    icon: RiTimeLine,
    label: "Sub-3-Minute Pickup",
    description: "No counter queue. Contactless handover at a dedicated valet zone.",
  },
  {
    icon: RiMapPinLine,
    label: "Airport & City Hubs",
    description: "Airport valet bays open around the clock. City stations with extended hours.",
  },
  {
    icon: RiCameraLine,
    label: "Photo-Documented",
    description: "Pickup and return condition captured in photos. Protects you and us both.",
  },
  {
    icon: RiMoneyDollarCircleLine,
    label: "Transparent Pricing",
    description: "Full cost breakdown before you confirm. No hidden fees at the counter.",
  },
]

export default function HowItWorksPage() {
  return (
    <CustomerShell>
      <div className="py-10 sm:py-14">
        <PageContainer>
          {/* Page Header */}
          <div className="max-w-3xl space-y-4">
            <StatusBadge status="info" label="Simple Process" size="sm" />
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              How Veyra Works
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              From search to ignition in six frictionless steps. No counter
              lines, no surprise fees, and no substituted vehicles. We designed
              the rental experience to respect your time.
            </p>
          </div>
        </PageContainer>

        {/* Main Steps */}
        <Section spacing="lg" className="border-t mt-12">
          <PageContainer>
            <div className="space-y-0 divide-y">
              {mainSteps.map((step, index) => {
                const Icon = step.icon
                const isEven = index % 2 === 1

                return (
                  <div
                    key={step.step}
                    className={`flex flex-col md:flex-row gap-8 py-12 ${
                      isEven ? "md:flex-row-reverse" : ""
                    }`}
                  >
                    {/* Step Number & Icon */}
                    <div className="md:w-64 shrink-0 flex flex-row md:flex-col items-start gap-4">
                      <div className="flex size-14 items-center justify-center rounded-2xl border-2 border-primary/20 bg-primary/8 text-primary">
                        <Icon className="size-6" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-primary bg-primary/10 rounded-md px-2.5 py-1">
                          Step {step.step}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-4">
                      <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        {step.title}
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">
                        {step.description}
                      </p>
                      <ul className="space-y-2">
                        {step.details.map((detail) => (
                          <li
                            key={detail}
                            className="flex items-start gap-2.5 text-sm"
                          >
                            <RiCheckboxCircleLine className="size-4 text-primary shrink-0 mt-0.5" />
                            <span className="text-foreground">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              })}
            </div>
          </PageContainer>
        </Section>

        {/* Veyra Guarantees */}
        <Section spacing="lg" className="border-t bg-muted/10">
          <PageContainer>
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <StatusBadge status="success" label="What We Guarantee" size="sm" />
                <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                  The Veyra Standard
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Premium rental means consistent, documented, and predictable
                  execution at every handover point.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {guarantees.map((g) => {
                  const Icon = g.icon
                  return (
                    <div
                      key={g.label}
                      className="flex gap-4 p-5 rounded-xl border bg-card"
                    >
                      <div className="shrink-0 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">
                          {g.label}
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {g.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* CTA */}
        <Section spacing="lg" className="border-t">
          <PageContainer>
            <div className="text-center space-y-5 max-w-2xl mx-auto">
              <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Ready to experience it?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Search available cars, configure your options, and book in
                under five minutes. Your vehicle will be ready at your chosen
                hub.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/vehicles">
                  <Button size="lg" className="gap-2">
                    <RiCarLine className="size-4" data-icon="inline-start" />
                    <span>Browse the Fleet</span>
                    <RiArrowRightLine className="size-4" data-icon="inline-end" />
                  </Button>
                </Link>
                <Link href="/locations">
                  <Button variant="outline" size="lg">
                    View Hub Locations
                  </Button>
                </Link>
              </div>
            </div>
          </PageContainer>
        </Section>
      </div>
    </CustomerShell>
  )
}
