import * as React from "react"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { RiAlertLine, RiRefreshLine } from "@remixicon/react"
import { cn } from "@/lib/utils"

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  variant?: "callout" | "card"
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while loading this section. Please try again.",
  onRetry,
  retryLabel = "Try Again",
  variant = "callout",
  className,
}: ErrorStateProps) {
  if (variant === "callout") {
    return (
      <Alert variant="destructive" className={className}>
        <RiAlertLine className="size-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span>{message}</span>
          {onRetry && (
            <Button
              variant="outline"
              size="xs"
              onClick={onRetry}
              className="w-fit shrink-0 gap-1.5"
            >
              <RiRefreshLine className="size-3" data-icon="inline-start" />
              {retryLabel}
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-destructive/20 bg-destructive/5 gap-4",
        className
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <RiAlertLine className="size-6" />
      </div>
      <div className="flex flex-col gap-1 max-w-md">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2 mt-2"
        >
          <RiRefreshLine className="size-4" data-icon="inline-start" />
          {retryLabel}
        </Button>
      )}
    </div>
  )
}
