"use client"

import * as React from "react"
import { SearchFilterState } from "../types"
import { VehicleCategory } from "@/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  RiFilter3Line,
  RiRefreshLine,
  RiCarLine,
  RiFlashlightLine,
  RiUserLine,
  RiMoneyDollarCircleLine,
} from "@remixicon/react"

export interface SearchFiltersProps {
  filters: SearchFilterState
  onChange: (filters: SearchFilterState) => void
  onReset: () => void
  categoryCounts: Record<VehicleCategory, number>
  className?: string
}

const CATEGORY_ITEMS: { id: VehicleCategory; label: string }[] = [
  { id: "sedan", label: "Sedans" },
  { id: "suv", label: "SUVs" },
  { id: "electric", label: "Electric" },
  { id: "van", label: "Vans" },
  { id: "luxury", label: "Luxury" },
]

const FUEL_TYPES = [
  { id: "Electric", label: "Electric" },
  { id: "Hybrid", label: "Hybrid" },
  { id: "Petrol", label: "Petrol" },
  { id: "Diesel", label: "Diesel" },
]

const SEAT_OPTIONS = [
  { label: "Any", count: 0 },
  { label: "5+ seats", count: 5 },
  { label: "7+ seats", count: 7 },
  { label: "8+ seats", count: 8 },
]

export function SearchFilters({
  filters,
  onChange,
  onReset,
  categoryCounts,
  className,
}: SearchFiltersProps) {
  const isFiltered =
    filters.categories.length > 0 ||
    filters.fuelTypes.length > 0 ||
    filters.transmission !== "all" ||
    filters.minSeats > 0 ||
    filters.maxPrice < 10000

  const toggleCategory = (cat: VehicleCategory) => {
    const exists = filters.categories.includes(cat)
    const newCategories = exists
      ? filters.categories.filter((c) => c !== cat)
      : [...filters.categories, cat]
    onChange({ ...filters, categories: newCategories })
  }

  const toggleFuel = (fuel: string) => {
    const exists = filters.fuelTypes.includes(fuel)
    const newFuel = exists
      ? filters.fuelTypes.filter((f) => f !== fuel)
      : [...filters.fuelTypes, fuel]
    onChange({ ...filters, fuelTypes: newFuel })
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between pb-4">
        <div className="flex items-center gap-2">
          <RiFilter3Line className="size-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">Filter Fleet</h3>
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
          >
            <RiRefreshLine className="size-3" data-icon="inline-start" />
            <span>Reset All</span>
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Vehicle Category */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <RiCarLine className="size-3.5 text-muted-foreground" />
            <span>Vehicle Class</span>
          </div>

          <div className="space-y-2">
            {CATEGORY_ITEMS.map((item) => {
              const isChecked = filters.categories.includes(item.id)
              const count = categoryCounts[item.id] || 0
              return (
                <label
                  key={item.id}
                  className="flex items-center justify-between text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer select-none py-0.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={isChecked}
                      onCheckedChange={() => toggleCategory(item.id)}
                    />
                    <span className={isChecked ? "text-foreground font-semibold" : ""}>
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    ({count})
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Max Daily Rate Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-foreground">
            <div className="flex items-center gap-1.5">
              <RiMoneyDollarCircleLine className="size-3.5 text-muted-foreground" />
              <span>Max Daily Rate</span>
            </div>
            <span className="font-heading font-bold text-primary">
              ₱{filters.maxPrice.toLocaleString()}
            </span>
          </div>

          <Slider
            value={[filters.maxPrice]}
            min={2500}
            max={10000}
            step={500}
            onValueChange={(val) => {
              const numVal = Array.isArray(val) ? val[0] : val
              onChange({ ...filters, maxPrice: numVal })
            }}
            className="py-1"
          />

          <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
            <span>₱2,500</span>
            <span>₱10,000+</span>
          </div>
        </div>

        <Separator />

        {/* Powertrain / Fuel */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <RiFlashlightLine className="size-3.5 text-muted-foreground" />
            <span>Powertrain & Fuel</span>
          </div>

          <div className="space-y-2">
            {FUEL_TYPES.map((fuel) => {
              const isChecked = filters.fuelTypes.includes(fuel.id)
              return (
                <label
                  key={fuel.id}
                  className="flex items-center gap-2.5 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer select-none py-0.5"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggleFuel(fuel.id)}
                  />
                  <span className={isChecked ? "text-foreground font-semibold" : ""}>
                    {fuel.label}
                  </span>
                </label>
              )
            })}
          </div>
        </div>

        <Separator />

        {/* Minimum Passenger Seats */}
        <div className="space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <RiUserLine className="size-3.5 text-muted-foreground" />
            <span>Minimum Seats</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {SEAT_OPTIONS.map((seat) => {
              const isSelected = filters.minSeats === seat.count
              return (
                <button
                  key={seat.label}
                  type="button"
                  onClick={() => onChange({ ...filters, minSeats: seat.count })}
                  className={`h-8 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 text-primary font-semibold"
                      : "border-input bg-card/60 text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {seat.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
