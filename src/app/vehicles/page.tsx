import * as React from "react"
import { Metadata } from "next"
import { CustomerShell } from "@/components/shell/customer/customer-shell"
import { PageContainer } from "@/components/layout/page-container"
import { SearchResultsClient } from "@/features/search/components/search-results-client"
import { StatusBadge } from "@/components/common/status-badge"
import { getVehicleCatalog } from "@/features/vehicles/server"
import { VehicleCategory } from "@/types"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { RiAlertLine } from "@remixicon/react"

export const metadata: Metadata = {
  title: "Available Vehicles in Butuan City — Executive Fleet | Veyra",
  description:
    "Available vehicles in Butuan City, Agusan del Norte. Explore executive sedans, luxury SUVs, and electric cars with zero ambiguous substitutions.",
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

  const { data: vehicles, error } = await getVehicleCatalog({
    category: initialCategory,
  })

  const count = vehicles.length
  const subheadline =
    count > 0
      ? `Browsing ${count} precision-maintained ${count === 1 ? "vehicle" : "vehicles"} available in Butuan City`
      : "Live catalog connected. No vehicles currently published in the catalog."

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
                Butuan City, Agusan del Norte
              </span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
              Available Vehicles in Butuan City
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Every vehicle in our fleet is based in Butuan City, Agusan del Norte and maintained to multi-point mechanical inspection standards. When you reserve with Veyra, you drive away in the exact make, model, and year specification selected.
            </p>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <RiAlertLine className="size-4" />
              <AlertTitle>Catalog Connection Notice</AlertTitle>
              <AlertDescription>
                Unable to load fleet vehicles at this moment ({error}). Please refresh or contact support if the issue persists.
              </AlertDescription>
            </Alert>
          )}

          {/* Catalog Browser with Client Filters and Sorting */}
          <div className="mt-8">
            <SearchResultsClient
              initialVehicles={vehicles}
              initialCategory={initialCategory}
              headline="All Fleet Models"
              subheadline={subheadline}
              emptyPrompt={
                count === 0 && !error
                  ? "The live vehicle catalog contains 0 records awaiting fleet database seeding. Check back soon for updated inventory."
                  : undefined
              }
            />
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}
