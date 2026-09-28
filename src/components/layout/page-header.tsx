import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageHeaderProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title: React.ReactNode
  description?: string | React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  breadcrumbs?: React.ReactNode
  centered?: boolean
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  centered = false,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 pb-6 md:pb-8",
        centered && "items-center text-center",
        className
      )}
      {...props}
    >
      {breadcrumbs && <div className="mb-1">{breadcrumbs}</div>}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 sm:self-start pt-1">
            {actions}
          </div>
        )}
      </div>
    </header>
  )
}
