import * as React from "react"
import { Spinner } from "@/components/ui/spinner"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

export interface LoadingStateProps {
  type?: "spinner" | "card-grid" | "table-rows" | "detail"
  message?: string
  rows?: number
  cards?: number
  className?: string
}

export function LoadingState({
  type = "spinner",
  message = "Loading...",
  rows = 5,
  cards = 3,
  className,
}: LoadingStateProps) {
  if (type === "spinner") {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-12 text-center gap-3",
          className
        )}
      >
        <Spinner className="size-8 text-primary" />
        {message && (
          <p className="text-sm font-medium text-muted-foreground animate-pulse">
            {message}
          </p>
        )}
      </div>
    )
  }

  if (type === "card-grid") {
    return (
      <div
        className={cn(
          "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6",
          className
        )}
      >
        {Array.from({ length: cards }).map((_, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 rounded-xl border p-4 bg-card"
          >
            <Skeleton className="h-44 w-full rounded-lg" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (type === "table-rows") {
    return (
      <div className={cn("w-full flex flex-col gap-2.5", className)}>
        <Skeleton className="h-10 w-full rounded-md" />
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-md" />
        ))}
      </div>
    )
  }

  // detail
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col gap-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
