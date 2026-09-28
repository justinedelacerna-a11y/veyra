import * as React from "react"
import Link from "next/link"
import { MOCK_CATEGORIES } from "@/lib/mock/categories"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import {
  RiCarLine,
  RiCompass3Line,
  RiFlashlightLine,
  RiBusLine,
  RiArrowRightLine,
} from "@remixicon/react"

const categoryIcons = {
  sedan: RiCarLine,
  suv: RiCompass3Line,
  electric: RiFlashlightLine,
  van: RiBusLine,
  luxury: RiCarLine,
}

export function PopularCategories() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Vehicle Classes
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Explore by Category
          </h2>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Choose the right vehicle category configured for your route, passenger capacity, and luggage needs.
          </p>
        </div>

        <Link href="/vehicles" className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
          <span>Browse All Categories</span>
          <RiArrowRightLine className="size-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
        {MOCK_CATEGORIES.map((cat) => {
          const Icon = categoryIcons[cat.id] ?? RiCarLine

          return (
            <Card
              key={cat.id}
              className="flex flex-col justify-between group hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                    <Icon className="size-6" />
                  </div>
                  <span className="text-[11px] font-mono font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    {cat.vehicleCount} vehicles
                  </span>
                </div>
                <CardTitle className="text-base font-bold tracking-tight text-foreground pt-3">
                  {cat.name}
                </CardTitle>
                <span className="text-xs font-medium text-primary">
                  {cat.tagline}
                </span>
              </CardHeader>

              <CardContent className="pb-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {cat.description}
                </p>
              </CardContent>

              <CardFooter className="pt-3 border-t border-border/50 flex items-center justify-between text-xs bg-muted/10">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Starting from
                  </span>
                  <span className="font-heading font-bold text-foreground text-sm">
                    ₱{cat.startingPrice.toLocaleString()} <span className="text-[11px] font-normal text-muted-foreground">/day</span>
                  </span>
                </div>

                <Link
                  href={`/vehicles?category=${cat.id}`}
                  className="font-medium text-primary flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Select</span>
                  <RiArrowRightLine className="size-3.5" />
                </Link>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
