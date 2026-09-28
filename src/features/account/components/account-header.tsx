import * as React from "react"
import { cn } from "@/lib/utils"

export interface AccountHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function AccountHeader({
  title,
  description,
  action,
  className,
}: AccountHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-6 border-b",
        className
      )}
    >
      <div className="space-y-1">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  )
}
