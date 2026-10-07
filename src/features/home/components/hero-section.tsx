import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { RentalSearch } from "@/features/search/components/rental-search"
import { PageContainer } from "@/components/layout"
import { Button } from "@/components/ui/button"
import {
  RiCarLine,
  RiArrowRightLine,
  RiSteeringLine,
  RiMapPinLine,
  RiCheckboxCircleFill,
} from "@remixicon/react"

// Real vehicle photograph from Veyra's marketing bucket: 2024 Toyota Vios in Butuan City
const HERO_VEHICLE_IMAGE =
  "https://ujzaewrcjhlwpxkyfbeb.supabase.co/storage/v1/object/public/vehicles-marketing/vehicle-images/a0000000-0000-0000-0000-000000000003/main.jpg"

export function HeroSection() {
  return (
    <section className="relative w-full overflow-hidden bg-zinc-950 text-white">
      {/* 1. Base Layer: Real Vehicle Photograph Edge-to-Edge */}
      <div className="absolute inset-0 z-0">
        <Image
          src={HERO_VEHICLE_IMAGE}
          alt="2024 Toyota Vios sedan available at Veyra Car Rental in Butuan City"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[78%_38%] sm:object-[72%_35%] lg:object-[68%_40%] select-none scale-[1.02] transition-transform duration-700 ease-out"
        />

        {/* 2. Layered Overlays for Optimal Text Readability & Cinematic Depth */}
        {/* Directional Gradient: Dark on left for text contrast, translucent on right to showcase car */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/85 to-zinc-950/65 sm:bg-gradient-to-r sm:from-zinc-950/95 sm:via-zinc-950/80 sm:to-zinc-950/35" />

        {/* Top Vignette for Nav Contrast */}
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-zinc-950/80 via-zinc-950/30 to-transparent" />

        {/* Bottom Smooth Transition into Page Background */}
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-background via-background/70 to-transparent" />
      </div>

      {/* 3. Hero Content Container */}
      <div className="relative z-10 pt-8 pb-16 sm:pt-14 sm:pb-20 lg:pt-20 lg:pb-24">
        <PageContainer>
          <div className="space-y-8 sm:space-y-10">
            {/* Hero Text & Value Props */}
            <div className="max-w-3xl space-y-5 text-left">
              {/* Location & Model Guarantee Badge */}
              <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md">
                <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Guaranteed Models • Zero Substitution</span>
                <span className="hidden sm:inline text-white/40">•</span>
                <span className="hidden sm:inline text-emerald-200/90 flex items-center gap-1">
                  <RiMapPinLine className="size-3 text-emerald-400" />
                  Butuan City, Agusan del Norte
                </span>
              </div>

              {/* Headline */}
              <h1 className="font-heading text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1] text-balance">
                Your Ride Starts{" "}
                <span className="text-emerald-400">in Butuan.</span>
              </h1>

              {/* Supporting Text */}
              <p className="text-sm sm:text-base lg:text-lg text-zinc-200/90 max-w-2xl leading-relaxed text-balance font-normal">
                Reliable cars. Flexible rentals. Convenient pickup across Butuan City.
                Clean, economical sedans, hatchbacks, and MPVs starting at ₱1,300/day with transparent rates and prompt local handover.
              </p>

              {/* Primary & Secondary Call to Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link href="/vehicles" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-11 sm:h-12 px-6 font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg gap-2 cursor-pointer transition-transform active:scale-95"
                  >
                    <RiCarLine className="size-4.5" data-icon="inline-start" />
                    <span>Browse Vehicles</span>
                    <RiArrowRightLine className="size-4" data-icon="inline-end" />
                  </Button>
                </Link>

                <Link href="/locations" className="w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-11 sm:h-12 px-6 font-medium text-white border-white/20 bg-zinc-900/60 hover:bg-zinc-800/80 hover:text-white backdrop-blur-md cursor-pointer transition-transform active:scale-95 gap-2"
                  >
                    <RiMapPinLine className="size-4 text-emerald-400" data-icon="inline-start" />
                    <span>Find a Pickup Location</span>
                  </Button>
                </Link>
              </div>

              {/* Authentic Vehicle Feature Tag */}
              <div className="flex items-center gap-2 pt-1 text-[11px] text-zinc-400">
                <RiCheckboxCircleFill className="size-3.5 text-emerald-400 shrink-0" />
                <span>Featured model: 2024 Toyota Vios • Stationed at Barangay San Vicente Hub</span>
              </div>
            </div>

            {/* The Rental Search Widget */}
            <div className="w-full max-w-5xl pt-2">
              <RentalSearch className="shadow-2xl border-white/10 bg-card/95" />
            </div>

            {/* The Veyra Handover Standard Banner */}
            <div className="max-w-5xl w-full rounded-2xl border border-white/10 bg-zinc-900/85 backdrop-blur-md p-5 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-5 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-emerald-400 border border-primary/30">
                  <RiSteeringLine className="size-6" />
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-sm sm:text-base font-semibold text-white">
                      The Veyra Handover Standard
                    </h3>
                    <span className="text-[10px] font-mono uppercase bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300/80 max-w-xl leading-relaxed">
                    Skip counter paperwork. Fast digital verification delivers prompt key release directly at your selected Butuan City barangay hub.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
                <Link href="/how-it-works" className="w-full sm:w-auto">
                  <Button variant="ghost" size="sm" className="w-full sm:w-auto gap-1 text-zinc-300 hover:text-white hover:bg-white/10 text-xs">
                    <span>How It Works</span>
                    <RiArrowRightLine className="size-3.5" data-icon="inline-end" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </section>
  )
}

