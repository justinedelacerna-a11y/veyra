import * as React from "react"
import Link from "next/link"
import { RentalSearch } from "@/features/search/components/rental-search"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  RiCarLine,
  RiArrowRightLine,
  RiSteeringLine,
} from "@remixicon/react"

export function HeroSection() {
  return (
    <div className="relative pt-6 pb-12 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-20 -z-10 flex transform-gpu justify-center overflow-hidden blur-3xl">
        <div className="aspect-[1155/678] w-[72.1875rem] bg-gradient-to-tr from-primary/15 via-emerald-500/10 to-transparent opacity-50 dark:opacity-25" />
      </div>

      <div className="space-y-10 sm:space-y-12">
        {/* Top Header & Tagline */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-4">
          <div className="flex items-center gap-2">
            <StatusBadge
              status="success"
              label="Guaranteed Models • Zero Substitution"
              size="sm"
            />
            <span className="hidden sm:inline-flex text-xs text-muted-foreground">
              Butuan City, Agusan del Norte
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground text-balance">
            Local Car Rental <br className="hidden sm:inline" />
            <span className="text-primary">in Butuan City.</span>
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed text-balance">
            Veyra serves customers in Butuan City, Agusan del Norte. Executive sedans, luxury SUVs, and high-performance electric vehicles with transparent pricing, verified vehicle condition, and prompt local handover.
          </p>
        </div>

        {/* The Rental Search Widget: Highest priority, prominent placement */}
        <div className="max-w-5xl mx-auto w-full">
          <RentalSearch />
        </div>

        {/* Featured Visual Architecture Banner */}
        <div className="max-w-5xl mx-auto w-full rounded-2xl border bg-gradient-to-r from-card via-muted/30 to-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <RiSteeringLine className="size-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-semibold text-foreground">
                  The Veyra Handover Standard
                </h3>
                <span className="text-[10px] font-mono uppercase bg-primary/10 text-primary font-bold px-2 py-0.5 rounded">
                  Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                Skip rental counter paperwork. Digital identity check-in delivers prompt key handover directly at our Butuan City Operations Hub.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
            <Link href="/vehicles" className="w-full sm:w-auto">
              <Button variant="outline" size="sm" className="w-full sm:w-auto gap-1.5">
                <RiCarLine className="size-4" data-icon="inline-start" />
                <span>Explore Fleet</span>
              </Button>
            </Link>
            <Link href="/how-it-works" className="w-full sm:w-auto">
              <Button variant="ghost" size="sm" className="w-full sm:w-auto gap-1">
                <span>How It Works</span>
                <RiArrowRightLine className="size-3.5" data-icon="inline-end" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
