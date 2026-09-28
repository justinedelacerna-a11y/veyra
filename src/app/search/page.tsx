import * as React from "react"
import { Metadata } from "next"
import { CustomerShell } from "@/components/shell/customer/customer-shell"
import { PageContainer } from "@/components/layout/page-container"
import { SearchSummary } from "@/features/search/components/search-summary"
import { SearchResultsClient } from "@/features/search/components/search-results-client"
import { MOCK_VEHICLES } from "@/lib/mock/vehicles"
import { MOCK_LOCATIONS } from "@/lib/mock/locations"
import { VehicleCategory } from "@/types"

export const metadata: Metadata = {
  title: "Search Results — Available Vehicles | Veyra",
  description:
    "Explore available executive sedans, luxury SUVs, and electric vehicles ready for pickup at Veyra airport hubs and city stations.",
}

interface SearchPageProps {
  searchParams: Promise<{
    pickup?: string
    returnLoc?: string
    from?: string
    fromTime?: string
    to?: string
    toTime?: string
    category?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams

  const pickupId = resolvedParams.pickup || MOCK_LOCATIONS[0].id
  const returnLocId = resolvedParams.returnLoc || pickupId
  const from = resolvedParams.from
  const fromTime = resolvedParams.fromTime
  const to = resolvedParams.to
  const toTime = resolvedParams.toTime
  const initialCategory = resolvedParams.category as VehicleCategory | undefined

  const pickupLocation =
    MOCK_LOCATIONS.find((loc) => loc.id === pickupId) || MOCK_LOCATIONS[0]

  // Re-encode search params for passing to vehicle cards
  const paramsObj = new URLSearchParams()
  if (pickupId) paramsObj.set("pickup", pickupId)
  if (returnLocId) paramsObj.set("returnLoc", returnLocId)
  if (from) paramsObj.set("from", from)
  if (fromTime) paramsObj.set("fromTime", fromTime)
  if (to) paramsObj.set("to", to)
  if (toTime) paramsObj.set("toTime", toTime)
  const searchParamsString = paramsObj.toString()

  return (
    <CustomerShell>
      <div className="py-8 sm:py-10 space-y-8">
        <PageContainer>
          {/* Top Search Criteria Summary & Quick Modify */}
          <SearchSummary
            pickupId={pickupId}
            returnLocId={returnLocId}
            from={from}
            fromTime={fromTime}
            to={to}
            toTime={toTime}
          />

          {/* Search Results & Filter Hub */}
          <div className="mt-8">
            <SearchResultsClient
              initialVehicles={MOCK_VEHICLES}
              initialCategory={initialCategory}
              searchParamsString={searchParamsString}
              headline={`Vehicles available at ${pickupLocation.city}`}
              subheadline={`Confirmed availability with contactless pickup at ${pickupLocation.name}`}
            />
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}
