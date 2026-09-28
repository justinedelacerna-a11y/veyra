import * as React from "react"
import { Button } from "@/components/ui/button"
import { LoadingState } from "@/components/common/loading-state"
import { EmptyState } from "@/components/common/empty-state"
import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react"
import { cn } from "@/lib/utils"

export interface DataTableWrapperProps {
  children?: React.ReactNode
  isLoading?: boolean
  isEmpty?: boolean
  emptyTitle?: string
  emptyDescription?: string
  totalItems?: number
  currentPage?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  className?: string
}

export function DataTableWrapper({
  children,
  isLoading = false,
  isEmpty = false,
  emptyTitle = "No records found",
  emptyDescription = "There are currently no rows matching your filter criteria.",
  totalItems,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  className,
}: DataTableWrapperProps) {
  if (isLoading) {
    return (
      <div className={cn("rounded-lg border bg-card p-6 shadow-xs", className)}>
        <LoadingState type="table-rows" rows={6} message="Loading operational records..." />
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className={cn("rounded-lg border bg-card p-8 shadow-xs", className)}>
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div className={cn("flex flex-col rounded-lg border bg-card shadow-xs overflow-hidden", className)}>
      <div className="w-full overflow-x-auto">
        {children}
      </div>

      {/* Pagination Footer */}
      {(totalPages > 1 || typeof totalItems === "number") && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t px-4 py-3 bg-muted/20 text-xs text-muted-foreground">
          <div>
            {typeof totalItems === "number" && (
              <span>
                Showing page <strong className="font-semibold text-foreground">{currentPage}</strong> of{" "}
                <strong className="font-semibold text-foreground">{totalPages}</strong> ({totalItems} total)
              </span>
            )}
          </div>

          {totalPages > 1 && onPageChange && (
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <Button
                variant="outline"
                size="xs"
                disabled={currentPage <= 1}
                onClick={() => onPageChange(currentPage - 1)}
                className="gap-1 h-7 px-2"
                aria-label="Go to previous page"
              >
                <RiArrowLeftSLine className="size-3.5" data-icon="inline-start" />
                <span>Previous</span>
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                className="gap-1 h-7 px-2"
                aria-label="Go to next page"
              >
                <span>Next</span>
                <RiArrowRightSLine className="size-3.5" data-icon="inline-end" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
