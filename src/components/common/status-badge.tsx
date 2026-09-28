import * as React from "react"
import { cn } from "@/lib/utils"
import {
  RiCheckboxCircleLine,
  RiAlertLine,
  RiCloseCircleLine,
  RiInformationLine,
  RiTimeLine,
  RiRecordCircleLine,
} from "@remixicon/react"

export type StatusType =
  | "success"
  | "warning"
  | "error"
  | "info"
  | "neutral"
  | "pending"

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType
  label?: string
  showIcon?: boolean
  size?: "sm" | "md"
}

const statusConfig: Record<
  StatusType,
  {
    icon: React.ComponentType<{ className?: string }>
    defaultLabel: string
    classes: string
  }
> = {
  success: {
    icon: RiCheckboxCircleLine,
    defaultLabel: "Confirmed / Active",
    classes:
      "bg-emerald-500/10 text-emerald-700 border-emerald-500/25 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30",
  },
  warning: {
    icon: RiAlertLine,
    defaultLabel: "Attention Needed",
    classes:
      "bg-amber-500/10 text-amber-800 border-amber-500/25 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30",
  },
  error: {
    icon: RiCloseCircleLine,
    defaultLabel: "Failed / Overdue",
    classes:
      "bg-destructive/10 text-destructive border-destructive/25 dark:bg-destructive/20 dark:border-destructive/35",
  },
  info: {
    icon: RiInformationLine,
    defaultLabel: "Info",
    classes:
      "bg-sky-500/10 text-sky-800 border-sky-500/25 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30",
  },
  pending: {
    icon: RiTimeLine,
    defaultLabel: "Pending",
    classes:
      "bg-orange-500/10 text-orange-800 border-orange-500/25 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30",
  },
  neutral: {
    icon: RiRecordCircleLine,
    defaultLabel: "Inactive / Draft",
    classes:
      "bg-muted text-muted-foreground border-border dark:bg-muted/60",
  },
}

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = "md",
  className,
  ...props
}: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const displayText = label ?? config.defaultLabel

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border rounded-full whitespace-nowrap transition-colors",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        config.classes,
        className
      )}
      {...props}
    >
      {showIcon && <Icon className={size === "sm" ? "size-3" : "size-3.5"} />}
      <span>{displayText}</span>
    </span>
  )
}
