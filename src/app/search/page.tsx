import * as React from "react"
import { Metadata } from "next"
import { CustomerShell } from "@/components/shell/customer/customer-shell"
import { PageContainer } from "@/components/layout/page-container"
import { SearchSummary } from "@/features/search/components/search-summary"
import { SearchResultsClient } from "@/features/search/components/search-results-client"
import { getVehicleCatalog } from "@/features/vehicles/server"
import { filterAvailableVehicles } from "@/features/vehicles/server/availability-repository"
import { getLiveLocations } from "@/features/search/server/locations-repository"
import { VehicleCategory } from "@/types"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { RiAlertLine } from "@remixicon/react"

export const metadata: Metadata = {
  title: "Available Vehicles in Butuan City — Search Results | Veyra",
  description:
    "Available vehicles in Butuan City, Agusan del Norte. Real-time availability for executive sedans, luxury SUVs, and electric vehicles ready for pickup at Veyra Butuan City Operations Hub.",
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
  const locations = await getLiveLocations()

  const pickupId = resolvedParams.pickup || locations[0]?.id || ""
  const returnLocId = resolvedParams.returnLoc || pickupId
  const from = resolvedParams.from
  const fromTime = resolvedParams.fromTime || "10:00"
  const to = resolvedParams.to
  const toTime = resolvedParams.toTime || "10:00"
  const initialCategory = resolvedParams.category as VehicleCategory | undefined

  const pickupLocation =
    locations.find((loc) => loc.id === pickupId) || locations[0]

  // Re-encode search params for passing to vehicle cards
  const paramsObj = new URLSearchParams()
  if (pickupId) paramsObj.set("pickup", pickupId)
  if (returnLocId) paramsObj.set("returnLoc", returnLocId)
  if (from) paramsObj.set("from", from)
  if (fromTime) paramsObj.set("fromTime", fromTime)
  if (to) paramsObj.set("to", to)
  if (toTime) paramsObj.set("toTime", toTime)
  const searchParamsString = paramsObj.toString()

  // Query live vehicle catalog from Supabase
  const { data: allVehicles, error } = await getVehicleCatalog({
    category: initialCategory,
  })

  // --- Live availability filtering ---
  // If both pickup and return dates are provided, filter by real availability.
  // Uses server-side range overlap against reservations + availability_blocks.
  let vehicles = allVehicles
  let availabilityFiltered = false

  if (from && to && !error) {
    const pickupAt = new Date(`${from}T${fromTime}:00`)
    const returnAt = new Date(`${to}T${toTime}:00`)

    const isValidRange =
      !isNaN(pickupAt.getTime()) &&
      !isNaN(returnAt.getTime()) &&
      pickupAt < returnAt

    if (isValidRange) {
      const vehicleIds = allVehicles.map((v) => v.id)
      const availableIds = await filterAvailableVehicles(vehicleIds, pickupAt, returnAt)
      const availableSet = new Set(availableIds)
      vehicles = allVehicles.filter((v) => availableSet.has(v.id))
      availabilityFiltered = true
    }
  }

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
            locations={locations}
          />

          {error && (
            <Alert variant="destructive" className="mt-4">
              <RiAlertLine className="size-4" />
              <AlertTitle>Catalog Connection Notice</AlertTitle>
              <AlertDescription>
                Unable to load fleet vehicles at this moment ({error}). Please check back soon or try again.
              </AlertDescription>
            </Alert>
          )}

          {/* Search Results & Filter Hub */}
          <div className="mt-8">
            <SearchResultsClient
              initialVehicles={vehicles}
              initialCategory={initialCategory}
              searchParamsString={searchParamsString}
              headline={
                availabilityFiltered
                  ? `Available vehicles in ${pickupLocation.city}`
                  : `Vehicles available in ${pickupLocation.city}`
              }
              subheadline={
                vehicles.length > 0
                  ? availabilityFiltered
                    ? `${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} confirmed available for your dates`
                    : `Confirmed availability with contactless pickup at ${pickupLocation.name}`
                  : availabilityFiltered
                  ? "No vehicles available for the selected dates. Try adjusting your pickup or return time."
                  : "Live catalog connected. No vehicles currently published in the catalog."
              }
              emptyPrompt={
                vehicles.length === 0 && !error
                  ? availabilityFiltered
                    ? "All vehicles are booked for the selected period. Try different dates or check back later."
                    : "The live vehicle catalog contains 0 records awaiting fleet database seeding. Check back soon for updated inventory."
                  : undefined
              }
            />
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}
