"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBooking } from "../../context/booking-context"
import { MOCK_BOOKING_EXTRAS } from "../../data/extras"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  RiShieldCheckLine,
  RiUserAddLine,
  RiWifiLine,
  RiParentLine,
  RiSpeedUpLine,
  RiArrowRightLine,
  RiArrowLeftLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

const EXTRA_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "extra-zero-excess": RiShieldCheckLine,
  "extra-add-driver": RiUserAddLine,
  "extra-gps-wifi": RiWifiLine,
  "extra-child-seat": RiParentLine,
  "extra-unlimited-km": RiSpeedUpLine,
}

export function OptionsStep() {
  const router = useRouter()
  const { draft, toggleExtra, rentalDays } = useBooking()

  return (
    <div className="space-y-6">
      {/* Step Title & Context */}
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Step 02 of 06
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Options & Add-ons
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Select optional vehicle protection, equipment, and travel packages. Choices are reflected in your pricing summary immediately.
        </p>
      </div>

      {/* Selectable Extras Cards Grid */}
      <div className="space-y-3.5">
        {MOCK_BOOKING_EXTRAS.map((extra) => {
          const isSelected = draft.selectedExtras.includes(extra.id)
          const IconComponent = EXTRA_ICONS[extra.id] || RiShieldCheckLine
          const extraTripTotal = extra.dailyRate * rentalDays

          return (
            <div
              key={extra.id}
              onClick={() => toggleExtra(extra.id)}
              className={cn(
                "group relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border p-4 sm:p-5 transition-all cursor-pointer select-none",
                isSelected
                  ? "border-primary bg-primary/[0.03] shadow-xs ring-1 ring-primary/30"
                  : "border-border bg-card/60 hover:bg-card hover:border-primary/40"
              )}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault()
                  toggleExtra(extra.id)
                }
              }}
            >
              {/* Left Details */}
              <div className="flex items-start gap-3.5">
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  <IconComponent className="size-5" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-heading text-sm sm:text-base font-bold text-foreground">
                      {extra.name}
                    </span>
                    {extra.badge && (
                      <Badge
                        variant="secondary"
                        className="bg-primary/10 text-primary border-primary/20 text-[10px] font-semibold"
                      >
                        {extra.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs font-medium text-primary">
                    {extra.tagline}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                    {extra.description}
                  </p>
                </div>
              </div>

              {/* Right Selection Control & Pricing */}
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                <div className="text-left sm:text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="font-heading text-base sm:text-lg font-bold text-foreground">
                      ₱{extra.dailyRate.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground">/day</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground block">
                    ₱{extraTripTotal.toLocaleString()} for {rentalDays} {rentalDays === 1 ? "day" : "days"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleExtra(extra.id)}
                    aria-label={`Select ${extra.name}`}
                  />
                  <span className="text-xs font-semibold sm:hidden">
                    {isSelected ? "Included" : "Add"}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <Link href="/booking">
          <Button variant="ghost" size="sm" className="gap-1.5">
            <RiArrowLeftLine className="size-4" data-icon="inline-start" />
            <span>Back to Vehicle</span>
          </Button>
        </Link>

        <Button
          size="lg"
          onClick={() => router.push("/booking/driver")}
          className="gap-2 font-semibold shadow-md"
        >
          <span>Continue to Driver Details</span>
          <RiArrowRightLine className="size-4" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  )
}
