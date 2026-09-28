"use client"

import * as React from "react"
import { SearchFilterState } from "../types"
import { VehicleCategory } from "@/types"
import { SearchFilters } from "./search-filters"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RiFilter3Line } from "@remixicon/react"

export interface MobileFilterSheetProps {
  filters: SearchFilterState
  onChange: (filters: SearchFilterState) => void
  onReset: () => void
  categoryCounts: Record<VehicleCategory, number>
  totalMatching: number
}

export function MobileFilterSheet({
  filters,
  onChange,
  onReset,
  categoryCounts,
  totalMatching,
}: MobileFilterSheetProps) {
  const [open, setOpen] = React.useState(false)

  const activeFilterCount =
    filters.categories.length +
    filters.fuelTypes.length +
    (filters.transmission !== "all" ? 1 : 0) +
    (filters.minSeats > 0 ? 1 : 0) +
    (filters.maxPrice < 10000 ? 1 : 0)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="gap-2 relative">
            <RiFilter3Line className="size-4" data-icon="inline-start" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <Badge
                variant="secondary"
                className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground font-mono"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        }
      />
      <SheetContent side="right" className="w-full sm:max-w-md p-6 overflow-y-auto">
        <SheetHeader className="p-0 pb-4">
          <SheetTitle className="text-base font-bold">Filter Vehicles</SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Refine available fleet by vehicle category, powertrain, seating, and daily budget.
          </SheetDescription>
        </SheetHeader>

        <div className="py-2">
          <SearchFilters
            filters={filters}
            onChange={onChange}
            onReset={onReset}
            categoryCounts={categoryCounts}
          />
        </div>

        <SheetFooter className="p-0 pt-4 border-t border-border">
          <SheetClose
            render={
              <Button className="w-full">
                Apply & View {totalMatching} {totalMatching === 1 ? "Vehicle" : "Vehicles"}
              </Button>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
