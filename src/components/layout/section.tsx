import * as React from "react"
import { cn } from "@/lib/utils"

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  spacing?: "none" | "sm" | "md" | "lg" | "xl"
  as?: React.ElementType
}

const spacingClasses = {
  none: "py-0",
  sm: "py-4 sm:py-6",
  md: "py-8 sm:py-12",
  lg: "py-12 sm:py-16 lg:py-20",
  xl: "py-16 sm:py-24 lg:py-28",
}

export function Section({
  spacing = "md",
  as: Component = "section",
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <Component
      className={cn("w-full", spacingClasses[spacing], className)}
      {...props}
    >
      {children}
    </Component>
  )
}
