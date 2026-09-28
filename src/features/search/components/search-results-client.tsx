"use client"

import * as React from "react"
import { Vehicle, VehicleCategory } from "@/types"
import { SearchFilterState, SortOption } from "../types"
import { SearchFilters } from "./search-filters"
import { MobileFilterSheet } from "./mobile-filter-sheet"
import { SortSelect } from "./sort-select"
import { VehicleCard } from "@/features/vehicles/components/vehicle-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import { RiCarLine, RiCloseLine, RiRefreshLine } from "@remixicon/react"

export interface SearchResultsClientProps {
  initialVehicles: Vehicle[]
  initialCategory?: VehicleCategory
  searchParamsString?: string
  headline?: string
  subheadline?: string
  emptyPrompt?: string
}

export function SearchResultsClient({
  initialVehicles,
  initialCategory,
  searchParamsString = "",
  headline,
  subheadline,
  emptyPrompt = "Try loosening your filters or adjusting your budget to see more available cars.",
}: SearchResultsClientProps) {
  // Default filter state
  const defaultFilters: SearchFilterState = {
    categories: initialCategory ? [initialCategory] : [],
    fuelTypes: [],
    transmission: "all",
    minSeats: 0,
    maxPrice: 10000,
    searchQuery: "",
  }

  const [filters, setFilters] = React.useState<SearchFilterState>(defaultFilters)
  const [sortOption, setSortOption] = React.useState<SortOption>("recommended")

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      categories: [],
      fuelTypes: [],
      transmission: "all",
      minSeats: 0,
      maxPrice: 10000,
      searchQuery: "",
    })
  }

  // Calculate category distribution counts
  const categoryCounts = React.useMemo(() => {
    const counts: Record<VehicleCategory, number> = {
      sedan: 0,
      suv: 0,
      electric: 0,
      van: 0,
      luxury: 0,
    }
    for (const v of initialVehicles) {
      if (counts[v.category] !== undefined) {
        counts[v.category]++
      }
    }
    return counts
  }, [initialVehicles])

  // Filter vehicles
  const filteredVehicles = React.useMemo(() => {
    return initialVehicles.filter((v) => {
      // Category filter
      if (
        filters.categories.length > 0 &&
        !filters.categories.includes(v.category)
      ) {
        return false
      }

      // Fuel filter
      if (
        filters.fuelTypes.length > 0 &&
        !filters.fuelTypes.includes(v.fuelType)
      ) {
        return false
      }

      // Seats filter
      if (filters.minSeats > 0 && v.seats < filters.minSeats) {
        return false
      }

      // Max price
      if (v.dailyRate > filters.maxPrice) {
        return false
      }

      // Search query filter (if any)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase()
        const match =
          v.make.toLowerCase().includes(q) ||
          v.model.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q)
        if (!match) return false
      }

      return true
    })
  }, [initialVehicles, filters])

  // Sort vehicles
  const sortedVehicles = React.useMemo(() => {
    const result = [...filteredVehicles]
    switch (sortOption) {
      case "price-asc":
        result.sort((a, b) => a.dailyRate - b.dailyRate)
        break
      case "price-desc":
        result.sort((a, b) => b.dailyRate - a.dailyRate)
        break
      case "rating-desc":
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case "capacity-desc":
        result.sort((a, b) => b.seats - a.seats)
        break
      case "recommended":
      default:
        // Default order
        break
    }
    return result
  }, [filteredVehicles, sortOption])

  // Check if any filters are applied
  const isFiltered =
    filters.categories.length > 0 ||
    filters.fuelTypes.length > 0 ||
    filters.minSeats > 0 ||
    filters.maxPrice < 10000

  return (
    <div className="space-y-6">
      {/* Top Section Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        <div>
          <h2 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {headline ?? "Available Vehicles"}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {subheadline ??
              `Showing ${sortedVehicles.length} of ${initialVehicles.length} premium models`}
          </p>
        </div>

        {/* Desktop & Mobile Control Toolbar */}
        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Mobile Filter Button */}
          <div className="lg:hidden">
            <MobileFilterSheet
              filters={filters}
              onChange={setFilters}
              onReset={handleResetFilters}
              categoryCounts={categoryCounts}
              totalMatching={sortedVehicles.length}
            />
          </div>

          {/* Sort Selector */}
          <SortSelect value={sortOption} onChange={setSortOption} />
        </div>
      </div>

      {/* Active Filter Chips / Pills */}
      {isFiltered && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-muted-foreground font-medium">
            Active Filters:
          </span>

          {filters.categories.map((cat) => (
            <Badge
              key={cat}
              variant="secondary"
              className="gap-1 pl-2 pr-1.5 py-0.5 text-xs capitalize cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() =>
                setFilters({
                  ...filters,
                  categories: filters.categories.filter((c) => c !== cat),
                })
              }
            >
              <span>{cat}</span>
              <RiCloseLine className="size-3" />
            </Badge>
          ))}

          {filters.fuelTypes.map((fuel) => (
            <Badge
              key={fuel}
              variant="secondary"
              className="gap-1 pl-2 pr-1.5 py-0.5 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() =>
                setFilters({
                  ...filters,
                  fuelTypes: filters.fuelTypes.filter((f) => f !== fuel),
                })
              }
            >
              <span>{fuel}</span>
              <RiCloseLine className="size-3" />
            </Badge>
          ))}

          {filters.minSeats > 0 && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2 pr-1.5 py-0.5 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => setFilters({ ...filters, minSeats: 0 })}
            >
              <span>{filters.minSeats}+ seats</span>
              <RiCloseLine className="size-3" />
            </Badge>
          )}

          {filters.maxPrice < 10000 && (
            <Badge
              variant="secondary"
              className="gap-1 pl-2 pr-1.5 py-0.5 text-xs cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
              onClick={() => setFilters({ ...filters, maxPrice: 10000 })}
            >
              <span>Under ₱{filters.maxPrice.toLocaleString()}</span>
              <RiCloseLine className="size-3" />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-6 text-xs text-muted-foreground hover:text-foreground px-2"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Main Layout: Sidebar Filters + Vehicle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Desktop Sticky Filter Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 rounded-2xl border bg-card/60 p-5 shadow-xs backdrop-blur-xs sticky top-24">
          <SearchFilters
            filters={filters}
            onChange={setFilters}
            onReset={handleResetFilters}
            categoryCounts={categoryCounts}
          />
        </aside>

        {/* Results Grid Container */}
        <main className="lg:col-span-9">
          {sortedVehicles.length === 0 ? (
            <div className="rounded-2xl border bg-card/50 p-12 text-center">
              <Empty>
                <EmptyHeader>
                  <div className="flex size-14 items-center justify-center rounded-2xl bg-muted mx-auto text-muted-foreground mb-2">
                    <RiCarLine className="size-7" />
                  </div>
                  <EmptyTitle className="text-lg font-bold">
                    No Matching Vehicles Found
                  </EmptyTitle>
                  <EmptyDescription className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {emptyPrompt}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent className="mt-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleResetFilters}
                    className="gap-1.5"
                  >
                    <RiRefreshLine className="size-4" data-icon="inline-start" />
                    <span>Reset All Filters</span>
                  </Button>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedVehicles.map((vehicle) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  searchParamsString={searchParamsString}
                  actionLabel="View Vehicle"
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
