import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  badge?: React.ReactNode
  actions?: React.ReactNode
}

export function SectionHeader({
  title,
  description,
  badge,
  actions,
  className,
  ...props
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b",
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2.5">
          <h2 className="font-heading text-base font-semibold tracking-tight text-foreground sm:text-lg">
            {title}
          </h2>
          {badge}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {actions}
        </div>
      )}
    </div>
  )
}
