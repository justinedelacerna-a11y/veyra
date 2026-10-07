import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { RiArrowRightLine, RiCarLine } from "@remixicon/react"

export function FinalCta() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card via-card to-muted/20 p-8 sm:p-12 lg:p-16 text-center shadow-md">
      {/* Subtle background ambient ring */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
        <div className="size-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        <div className="flex justify-center">
          <StatusBadge status="success" label="Immediate Booking Available" size="sm" />
        </div>

        <div className="space-y-3">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Ready to Start Your Drive in Butuan?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Select your travel dates, choose your verified vehicle model, and pick up your keys across Butuan City barangay hubs without counter delays.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/vehicles" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto h-12 px-6 font-semibold gap-2 shadow-sm">
              <RiCarLine className="size-4" data-icon="inline-start" />
              <span>Browse Available Vehicles</span>
              <RiArrowRightLine className="size-4" data-icon="inline-end" />
            </Button>
          </Link>
          <Link href="/locations" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto h-12 px-6 font-medium">
              <span>Explore Barangay Hubs</span>
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border/50 max-w-md mx-auto">
          Stationed locally in Butuan City, Agusan del Norte. Serving students, families, tourists, and daily commuters with transparent rates.
        </p>
      </div>
    </div>
  )
}
