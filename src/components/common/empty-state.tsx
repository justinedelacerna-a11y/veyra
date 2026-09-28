import * as React from "react"
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty"
import {
  RiCarLine,
  RiCalendarLine,
  RiNotificationLine,
  RiSearchLine,
  RiInboxLine,
} from "@remixicon/react"

export type EmptyPreset =
  | "vehicles"
  | "reservations"
  | "notifications"
  | "search"
  | "general"

export interface EmptyStateProps {
  preset?: EmptyPreset
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

const presets: Record<
  EmptyPreset,
  {
    icon: React.ComponentType<{ className?: string }>
    title: string
    description: string
  }
> = {
  vehicles: {
    icon: RiCarLine,
    title: "No Vehicles Available",
    description: "Try adjusting your pickup dates, locations, or filter criteria to see available vehicles in our fleet.",
  },
  reservations: {
    icon: RiCalendarLine,
    title: "No Reservations Found",
    description: "You have no upcoming or past trips scheduled. Start exploring available cars to make a booking.",
  },
  notifications: {
    icon: RiNotificationLine,
    title: "All Caught Up",
    description: "You have no new alerts, reminders, or messages at this time.",
  },
  search: {
    icon: RiSearchLine,
    title: "No Matching Results",
    description: "We couldn't find anything matching your search. Please check your spelling or try different keywords.",
  },
  general: {
    icon: RiInboxLine,
    title: "Nothing Here Yet",
    description: "There is currently no data or activity to display in this view.",
  },
}

export function EmptyState({
  preset = "general",
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const currentPreset = presets[preset]
  const Icon = icon ?? currentPreset.icon
  const displayTitle = title ?? currentPreset.title
  const displayDescription = description ?? currentPreset.description

  return (
    <Empty className={className}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-6 text-muted-foreground" />
        </EmptyMedia>
        <EmptyTitle>{displayTitle}</EmptyTitle>
        <EmptyDescription>{displayDescription}</EmptyDescription>
      </EmptyHeader>
      {action && <EmptyContent>{action}</EmptyContent>}
    </Empty>
  )
}
