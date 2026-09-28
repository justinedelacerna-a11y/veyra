import * as React from "react"
import { cn } from "@/lib/utils"

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "row" | "column" | "row-reverse" | "column-reverse" | "responsive"
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl"
  align?: "start" | "center" | "end" | "stretch" | "baseline"
  justify?: "start" | "center" | "end" | "between" | "around"
  wrap?: boolean
  as?: React.ElementType
}

const gapClasses = {
  none: "gap-0",
  xs: "gap-1.5",
  sm: "gap-3",
  md: "gap-4",
  lg: "gap-6",
  xl: "gap-8",
  "2xl": "gap-12",
}

const alignClasses = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
}

const justifyClasses = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
}

export function Stack({
  direction = "column",
  gap = "md",
  align = "stretch",
  justify = "start",
  wrap = false,
  as: Component = "div",
  className,
  children,
  ...props
}: StackProps) {
  const directionClass =
    direction === "column"
      ? "flex flex-col"
      : direction === "row"
        ? "flex flex-row"
        : direction === "column-reverse"
          ? "flex flex-col-reverse"
          : direction === "row-reverse"
            ? "flex flex-row-reverse"
            : "flex flex-col sm:flex-row" // responsive default

  return (
    <Component
      className={cn(
        directionClass,
        gapClasses[gap],
        alignClasses[align],
        justifyClasses[justify],
        wrap && "flex-wrap",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
