"use client"

import * as React from "react"
import Link from "next/link"
import { BookingStep } from "../types"
import { useBooking } from "../context/booking-context"
import { RiCheckLine } from "@remixicon/react"
import { cn } from "@/lib/utils"

const STEPS: { id: BookingStep; label: string; href: string }[] = [
  { id: "vehicle", label: "Vehicle", href: "/booking" },
  { id: "options", label: "Options", href: "/booking/options" },
  { id: "driver", label: "Driver", href: "/booking/driver" },
  { id: "review", label: "Review", href: "/booking/review" },
  { id: "payment", label: "Payment", href: "/booking/payment" },
  { id: "confirmation", label: "Confirmation", href: "/booking/confirmation" },
]

export function BookingProgress() {
  const { currentStep } = useBooking()

  const currentIndex = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <nav aria-label="Booking Progress" className="w-full">
      {/* Mobile Compact Progress Bar */}
      <div className="sm:hidden space-y-2 py-3 px-4 bg-muted/30 border-b border-border/60">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">
            Step {currentIndex + 1} of {STEPS.length}: {STEPS[currentIndex]?.label}
          </span>
          <span className="text-[11px] font-mono text-muted-foreground">
            {Math.round(((currentIndex + 1) / STEPS.length) * 100)}%
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Stepper */}
      <div className="hidden sm:block py-4 border-b border-border/60 bg-card/40">
        <ol className="mx-auto flex max-w-4xl items-center justify-between px-6">
          {STEPS.map((step, idx) => {
            const isCompleted = idx < currentIndex
            const isCurrent = idx === currentIndex
            const isUpcoming = idx > currentIndex

            const stepNumber = String(idx + 1).padStart(2, "0")

            const content = (
              <div className="flex items-center gap-2 group">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold font-mono transition-colors",
                    isCurrent && "bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/20",
                    isCompleted && "bg-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
                    isUpcoming && "bg-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <RiCheckLine className="size-4" />
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </span>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap transition-colors",
                    isCurrent && "font-bold text-foreground",
                    isCompleted && "text-foreground group-hover:text-primary",
                    isUpcoming && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
            )

            return (
              <li
                key={step.id}
                className="flex items-center gap-3 relative"
                aria-current={isCurrent ? "step" : undefined}
              >
                {/* Allow clicking to return to already completed steps */}
                {isCompleted ? (
                  <Link href={step.href} className="focus-visible:outline-hidden">
                    {content}
                  </Link>
                ) : (
                  <div>{content}</div>
                )}

                {/* Arrow / Line connector between steps */}
                {idx < STEPS.length - 1 && (
                  <div
                    className={cn(
                      "hidden md:block h-px w-6 lg:w-10 ml-2 transition-colors",
                      isCompleted ? "bg-primary/40" : "bg-border/60"
                    )}
                  />
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
