import * as React from "react"
import { ReservationTimelineStep } from "@/features/account/types"
import { cn } from "@/lib/utils"
import { RiCheckLine, RiRecordCircleLine, RiTimeLine } from "@remixicon/react"

export interface ReservationTimelineProps {
  timeline: ReservationTimelineStep[]
  className?: string
}

export function ReservationTimeline({
  timeline,
  className,
}: ReservationTimelineProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="font-heading text-base font-bold text-foreground">
        Rental Journey & Milestones
      </h3>

      <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
        {timeline.map((item, index) => {
          return (
            <div key={index} className="relative flex flex-col gap-1 text-sm">
              {/* Node Icon */}
              <div
                className={cn(
                  "absolute -left-6 sm:-left-8 top-0.5 flex size-5 sm:size-7 items-center justify-center rounded-full border text-xs transition-colors",
                  item.completed
                    ? "bg-primary text-primary-foreground border-primary"
                    : item.current
                    ? "bg-background border-primary text-primary ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground border-border"
                )}
                aria-hidden="true"
              >
                {item.completed ? (
                  <RiCheckLine className="size-3 sm:size-4" />
                ) : item.current ? (
                  <RiRecordCircleLine className="size-3 sm:size-4 animate-pulse" />
                ) : (
                  <RiTimeLine className="size-3 sm:size-3.5" />
                )}
              </div>

              {/* Step Title & Date */}
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span
                  className={cn(
                    "font-semibold text-sm",
                    item.completed || item.current
                      ? "text-foreground"
                      : "text-muted-foreground"
                  )}
                >
                  {item.title}
                  {item.current && (
                    <span className="ml-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      Current Stage
                    </span>
                  )}
                </span>
                <span className="text-xs text-muted-foreground font-mono">
                  {item.date}
                </span>
              </div>

              {/* Step Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
