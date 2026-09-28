import * as React from "react"
import { cn } from "@/lib/utils"

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12 | "responsive-cards"
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl"
  as?: React.ElementType
}

const colClasses: Record<NonNullable<GridProps["cols"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  12: "grid-cols-12",
  "responsive-cards": "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
}

const gapClasses = {
  none: "gap-0",
  xs: "gap-2",
  sm: "gap-3 sm:gap-4",
  md: "gap-4 sm:gap-6",
  lg: "gap-6 sm:gap-8",
  xl: "gap-8 sm:gap-10",
}

export function Grid({
  cols = 3,
  gap = "md",
  as: Component = "div",
  className,
  children,
  ...props
}: GridProps) {
  return (
    <Component
      className={cn("grid", colClasses[cols], gapClasses[gap], className)}
      {...props}
    >
      {children}
    </Component>
  )
}
