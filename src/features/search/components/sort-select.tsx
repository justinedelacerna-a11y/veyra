"use client"

import * as React from "react"
import { SortOption } from "../types"
import { RiArrowUpDownLine } from "@remixicon/react"

export interface SortSelectProps {
  value: SortOption
  onChange: (value: SortOption) => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-desc", label: "Highest Rated" },
  { value: "capacity-desc", label: "Largest Capacity" },
]

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1">
        <RiArrowUpDownLine className="size-3.5" />
        <span className="hidden sm:inline">Sort by:</span>
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="h-9 rounded-lg border border-input bg-card/80 px-3 pr-8 text-xs font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors cursor-pointer"
        aria-label="Sort vehicles by"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
