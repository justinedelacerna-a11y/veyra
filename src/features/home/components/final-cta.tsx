import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { RiArrowRightLine, RiCarLine } from "@remixicon/react"

export function FinalCta() {
  return (
    <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-card via-muted/30 to-background p-8 sm:p-12 lg:p-16 text-center shadow-lg">
      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        <div className="flex justify-center">
          <StatusBadge status="success" label="Immediate Booking Available" size="sm" />
        </div>

        <div className="space-y-3">
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
            Ready to Begin Your Journey?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Select your travel dates, choose your guaranteed vehicle model, and pick up your keys in Butuan City without counter delays.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/vehicles" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto gap-2 shadow-md">
              <RiCarLine className="size-4" data-icon="inline-start" />
              <span>Search Available Cars</span>
              <RiArrowRightLine className="size-4" data-icon="inline-end" />
            </Button>
          </Link>
          <Link href="/locations" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              <span>View Butuan Hub</span>
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border/50 max-w-md mx-auto">
          Veyra serves customers in Butuan City, Agusan del Norte. Need a custom concierge itinerary? Contact our operations desk 24/7.
        </p>
      </div>
    </div>
  )
}
