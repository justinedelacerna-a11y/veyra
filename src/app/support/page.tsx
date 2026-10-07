import * as React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { CustomerShell } from "@/components/shell/customer"
import { PageContainer, Section } from "@/components/layout"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  RiPhoneLine,
  RiMailLine,
  RiMapPinLine,
  RiArrowRightLine,
  RiQuestionLine,
  RiCarLine,
  RiToolsLine,
  RiShieldCheckLine,
  RiTimeLine,
  RiMoneyDollarCircleLine,
  RiCalendarEventLine,
  RiFileListLine,
  RiCheckboxCircleLine,
} from "@remixicon/react"

export const metadata: Metadata = {
  title: "Help & Support — Veyra Butuan City",
  description:
    "Get answers to reservation questions, roadside assistance, and contact Veyra's 24/7 concierge desk in Butuan City, Agusan del Norte.",
}

const faqItems = [
  {
    question: "Can I change my reservation after booking?",
    answer:
      "Yes. You may modify pickup date, time, or location up to 24 hours before your scheduled handover at no charge. Changes within 24 hours may incur an administration fee depending on availability.",
    icon: RiCalendarEventLine,
  },
  {
    question: "What is the security deposit?",
    answer:
      "A fully refundable authorization hold is placed on your card at booking. The exact amount depends on the vehicle category and rental duration. After a clean return and completed inspection, the hold is released within 24–48 hours.",
    icon: RiMoneyDollarCircleLine,
  },
  {
    question: "What happens if I return the car late?",
    answer:
      "Late returns are charged at the standard daily rate prorated by hour after the first 30-minute grace window. If you anticipate a delay, contact our concierge line to extend your reservation before the agreed return time.",
    icon: RiTimeLine,
  },
  {
    question: "How does the damage protection work?",
    answer:
      "Veyra's Comprehensive Protection reduces your financial liability in the event of accidental damage or theft. It does not cover deliberate acts, driving under influence, or off-road use. Full terms available at booking.",
    icon: RiShieldCheckLine,
  },
  {
    question: "Can I add an additional driver?",
    answer:
      "Yes. Up to 3 additional authorized drivers can be added at the options step. Each driver must present a valid license at pickup. Unauthorized drivers void your protection coverage.",
    icon: RiCarLine,
  },
  {
    question: "What documents do I need for pickup?",
    answer:
      "A valid government-issued photo ID, your driver's license, the credit or debit card used for booking, and your booking confirmation code. Digital copies accepted on the Veyra app.",
    icon: RiFileListLine,
  },
  {
    question: "How do I cancel my reservation?",
    answer:
      "Cancellations made more than 48 hours before pickup are fully refunded. Between 24–48 hours: one day's rate is retained. Within 24 hours: up to 50% of the rental total may be retained. No-shows are non-refundable.",
    icon: RiToolsLine,
  },
  {
    question: "What if the car breaks down?",
    answer:
      "Call our 24/7 roadside assistance line. We will dispatch technical support or arrange an emergency replacement vehicle at no additional cost to you for mechanical failures unrelated to driver actions.",
    icon: RiCarLine,
  },
]

const contactChannels = [
  {
    icon: RiPhoneLine,
    label: "Concierge Hotline",
    value: "+63 (2) 8 VEYRA-1",
    subtext: "24/7 — airport emergency line priority",
    action: "tel:+6328839721",
    actionLabel: "Call Now",
  },
  {
    icon: RiMailLine,
    label: "Email Support",
    value: "concierge@veyra.ph",
    subtext: "Responses within 2 business hours",
    action: "mailto:concierge@veyra.ph",
    actionLabel: "Send Email",
  },
  {
    icon: RiMapPinLine,
    label: "Operating Hub",
    value: "Butuan City Hub",
    subtext: "Butuan City, Agusan del Norte",
    action: "/locations",
    actionLabel: "View Operating Hub",
  },
]

export default function SupportPage() {
  return (
    <CustomerShell>
      <div className="py-10 sm:py-14">
        <PageContainer>
          {/* Page Header */}
          <div className="max-w-3xl space-y-4">
            <StatusBadge status="info" label="Help & Support" size="sm" />
            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              How can we help you?
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-2xl">
              Find answers to common questions below, or reach our concierge
              team directly. We&apos;re available around the clock for active
              rentals and airport emergencies.
            </p>
          </div>

          {/* Contact Channels */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {contactChannels.map((ch) => {
              const Icon = ch.icon
              const isInternal = ch.action.startsWith("/")
              return (
                <div
                  key={ch.label}
                  className="flex flex-col justify-between rounded-xl border bg-card p-5 gap-5"
                >
                  <div className="space-y-3">
                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        {ch.label}
                      </p>
                      <p className="text-base font-bold text-foreground mt-0.5">
                        {ch.value}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ch.subtext}
                      </p>
                    </div>
                  </div>
                  {isInternal ? (
                    <Link href={ch.action}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                      >
                        <span>{ch.actionLabel}</span>
                        <RiArrowRightLine
                          className="size-3.5"
                          data-icon="inline-end"
                        />
                      </Button>
                    </Link>
                  ) : (
                    <a href={ch.action}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-1.5"
                      >
                        <span>{ch.actionLabel}</span>
                        <RiArrowRightLine
                          className="size-3.5"
                          data-icon="inline-end"
                        />
                      </Button>
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </PageContainer>

        {/* FAQ Section */}
        <Section spacing="lg" className="border-t mt-16">
          <PageContainer>
            <div className="space-y-8">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <RiQuestionLine className="size-5 text-primary" />
                  <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                    Frequently Asked Questions
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Answers to the most common questions about Veyra reservations,
                  deposits, and policies.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {faqItems.map((item) => (
                  <div
                    key={item.question}
                    className="rounded-xl border bg-card p-5 space-y-2"
                  >
                    <div className="flex items-start gap-3">
                      <RiCheckboxCircleLine className="size-4 text-primary shrink-0 mt-0.5" />
                      <h3 className="font-heading text-sm font-semibold text-foreground leading-snug">
                        {item.question}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-7">
                      {item.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </PageContainer>
        </Section>

        {/* Escalation CTA */}
        <Section spacing="lg" className="border-t bg-muted/10">
          <PageContainer>
            <div className="text-center space-y-5 max-w-xl mx-auto">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Still need help?
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our concierge team handles everything from last-minute
                reservation changes to active-rental emergencies. We&apos;re
                reachable around the clock.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="tel:+6328839721">
                  <Button size="lg" className="gap-2">
                    <RiPhoneLine
                      className="size-4"
                      data-icon="inline-start"
                    />
                    <span>Call Concierge</span>
                  </Button>
                </a>
                <Link href="/how-it-works">
                  <Button variant="outline" size="lg">
                    How Veyra Works
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
