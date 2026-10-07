import * as React from "react"
import { cn } from "@/lib/utils"

export interface VeyraLogoProps {
  /** Controls which elements are shown */
  variant?: "full" | "icon" | "wordmark"
  /** Tailwind size class applied to the icon SVG height (e.g. "h-7", "h-8") */
  iconSize?: string
  /** Tailwind class applied to "VEYRA" text */
  wordmarkClassName?: string
  className?: string
  /** For light-on-dark contexts (hero, dark sidebars) */
  inverted?: boolean
}

/**
 * Veyra brand logo — custom inline SVG icon paired with the VEYRA wordmark.
 *
 * Icon: an abstract forward-motion mark — a sleek chevron arrow fused with
 * converging road/speed lines — rendered in the brand emerald (#10b981).
 *
 * Usage:
 *   <VeyraLogo />                        — full (icon + wordmark)
 *   <VeyraLogo variant="icon" />         — icon badge only
 *   <VeyraLogo variant="wordmark" />     — text only
 *   <VeyraLogo inverted />               — white wordmark on dark backgrounds
 */
export function VeyraLogo({
  variant = "full",
  iconSize = "h-8",
  wordmarkClassName,
  className,
  inverted = false,
}: VeyraLogoProps) {
  const showIcon = variant === "full" || variant === "icon"
  const showWordmark = variant === "full" || variant === "wordmark"

  return (
    <span
      className={cn("inline-flex items-center gap-2 select-none", className)}
      aria-label="Veyra"
    >
      {showIcon && (
        <svg
          className={cn("w-auto shrink-0", iconSize)}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          role="img"
        >
          {/* Rounded square background tile */}
          <rect width="36" height="36" rx="8" fill="#10b981" />

          {/*
            Motion mark: converging speed lines sweeping into a sharp
            forward chevron arrow — reads as "road to destination / velocity".
          */}

          {/* Bottom-left speed streak (wide base) */}
          <path
            d="M6 26 L18.5 13.5 L15.5 13.5 L5 24.5 Z"
            fill="white"
            fillOpacity="0.35"
          />

          {/* Middle speed streak */}
          <path
            d="M9.5 28 L21 15.5 L19 15.5 L8 26.5 Z"
            fill="white"
            fillOpacity="0.55"
          />

          {/* Main arrow / chevron body */}
          <path
            d="M13 29 L28 14 L28 20 L19.5 20 L19.5 29 Z"
            fill="white"
          />

          {/* Arrow tip accent */}
          <path
            d="M22 8 L30 8 L30 16 Z"
            fill="white"
          />
        </svg>
      )}

      {showWordmark && (
        <span
          className={cn(
            "font-heading font-bold tracking-tight leading-none",
            inverted ? "text-white" : "text-foreground",
            wordmarkClassName
          )}
          style={{ fontSize: "inherit" }}
        >
          VEYRA
        </span>
      )}
    </span>
  )
}
