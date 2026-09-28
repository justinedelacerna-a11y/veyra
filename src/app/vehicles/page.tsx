import * as React from "react"
import { Metadata } from "next"
import { CustomerShell } from "@/components/shell/customer/customer-shell"
import { PageContainer } from "@/components/layout/page-container"
import { SearchResultsClient } from "@/features/search/components/search-results-client"
import { StatusBadge } from "@/components/common/status-badge"
import { MOCK_VEHICLES } from "@/lib/mock/vehicles"
import { VehicleCategory } from "@/types"

export const metadata: Metadata = {
  title: "Our Fleet — Executive Sedans, Luxury SUVs & Electric Cars | Veyra",
  description:
    "Explore the complete Veyra vehicle catalog. Guaranteed makes and models with zero ambiguous substitutions.",
}

interface VehiclesPageProps {
  searchParams: Promise<{
    category?: string
  }>
}

export default async function VehiclesPage({
  searchParams,
}: VehiclesPageProps) {
  const resolvedParams = await searchParams
  const initialCategory = resolvedParams.category as VehicleCategory | undefined

  return (
    <CustomerShell>
      <div className="py-8 sm:py-12 space-y-10">
        <PageContainer>
          {/* Header Banner */}
          <div className="max-w-3xl space-y-4 pb-2">
            <div className="flex items-center gap-2">
              <StatusBadge
                status="success"
                label="Verified Fleet • Guaranteed Models"
                size="sm"
              />
              <span className="text-xs text-muted-foreground">
                Zero Substitution Policy
              </span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Our Complete Fleet Catalog
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every vehicle in our catalog is maintained to multi-point mechanical inspection standards. When you reserve with Veyra, you drive away in the exact make, model, and year specification selected.
            </p>
          </div>

          {/* Catalog Browser with Client Filters and Sorting */}
          <div className="mt-8">
            <SearchResultsClient
              initialVehicles={MOCK_VEHICLES}
              initialCategory={initialCategory}
              headline="All Fleet Models"
              subheadline={`Browsing ${MOCK_VEHICLES.length} precision-maintained vehicles across 5 premium categories`}
            />
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}
