import * as React from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  RiArrowUpLine,
  RiArrowDownLine,
  RiSubtractLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

export interface MetricCardProps {
  label: string
  value: string | number
  change?: {
    value: string | number
    trend: "up" | "down" | "neutral"
    period?: string
  }
  icon?: React.ComponentType<{ className?: string }>
  badge?: React.ReactNode
  description?: string
  className?: string
}

export function MetricCard({
  label,
  value,
  change,
  icon: Icon,
  badge,
  description,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("overflow-hidden transition-shadow hover:shadow-xs", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </CardTitle>
        <div className="flex items-center gap-1.5">
          {badge}
          {Icon && (
            <div className="flex size-7 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-1.5 pt-0">
        <div className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {value}
        </div>

        {(change || description) && (
          <div className="flex items-center gap-2 text-xs">
            {change && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 font-medium",
                  change.trend === "up" && "text-emerald-600 dark:text-emerald-400",
                  change.trend === "down" && "text-rose-600 dark:text-rose-400",
                  change.trend === "neutral" && "text-muted-foreground"
                )}
              >
                {change.trend === "up" && <RiArrowUpLine className="size-3" />}
                {change.trend === "down" && <RiArrowDownLine className="size-3" />}
                {change.trend === "neutral" && <RiSubtractLine className="size-3" />}
                <span>{change.value}</span>
              </span>
            )}
            <span className="text-muted-foreground">
              {change?.period ? `vs ${change.period}` : description}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
