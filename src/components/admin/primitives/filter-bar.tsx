"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  RiSearchLine,
  RiCloseLine,
  RiRefreshLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

export interface FilterBarProps {
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  onClear?: () => void
  onRefresh?: () => void
  filters?: React.ReactNode
  actions?: React.ReactNode
  totalCount?: number
  className?: string
}

export function FilterBar({
  searchPlaceholder = "Search records...",
  searchValue = "",
  onSearchChange,
  onClear,
  onRefresh,
  filters,
  actions,
  totalCount,
  className,
}: FilterBarProps) {
  const hasActiveFilters = Boolean(searchValue)

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-xs md:flex-row md:items-center md:justify-between",
        className
      )}
    >
      {/* Search & Dynamic Filter Controls */}
      <div className="flex flex-1 flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <RiSearchLine className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-8 h-8 text-xs bg-background"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search input"
            >
              <RiCloseLine className="size-3.5" />
            </button>
          )}
        </div>

        {filters}

        {hasActiveFilters && onClear && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onClear}
            className="text-xs text-muted-foreground hover:text-foreground gap-1"
          >
            <RiCloseLine className="size-3" data-icon="inline-start" />
            <span>Reset</span>
          </Button>
        )}
      </div>

      {/* Right Actions & Record Count */}
      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0">
        {typeof totalCount === "number" && (
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            <strong className="font-semibold text-foreground">{totalCount}</strong> results
          </span>
        )}

        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="outline"
              size="icon-xs"
              onClick={onRefresh}
              aria-label="Refresh table data"
            >
              <RiRefreshLine className="size-3" />
            </Button>
          )}
          {actions}
        </div>
      </div>
    </div>
  )
}
