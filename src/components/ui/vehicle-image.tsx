"use client"

import * as React from "react"
import Image from "next/image"
import { RiCarLine } from "@remixicon/react"
import { cn } from "@/lib/utils"

export interface VehicleImageProps {
  src?: string | null
  alt?: string
  aspectRatio?: "16/10" | "4/3" | "16/9" | "square" | "none"
  priority?: boolean
  sizes?: string
  className?: string
  containerClassName?: string
  category?: string
  showFallbackBadge?: boolean
  fallbackText?: string
}

export function VehicleImage({
  src,
  alt = "Veyra rental vehicle",
  aspectRatio = "16/10",
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className,
  containerClassName,
  category,
  showFallbackBadge = true,
  fallbackText = "Vehicle photo coming soon",
}: VehicleImageProps) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null)

  const aspectClass =
    aspectRatio === "16/10"
      ? "aspect-16/10"
      : aspectRatio === "4/3"
      ? "aspect-4/3"
      : aspectRatio === "16/9"
      ? "aspect-16/9"
      : aspectRatio === "square"
      ? "aspect-square"
      : ""

  const hasValidPhoto = Boolean(src && failedSrc !== src)

  if (hasValidPhoto && src) {
    return (
      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted/40",
          aspectClass,
          containerClassName
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          onError={() => setFailedSrc(src)}
          className={cn(
            "object-cover object-center transition-transform duration-500",
            className
          )}
        />
      </div>
    )
  }

  // Professional Veyra Fallback
  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-muted/50 via-muted/20 to-card p-6 border-b border-border/50 text-center select-none",
        aspectClass,
        containerClassName
      )}
    >
      {/* Background radial accent */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
        <div className="size-48 rounded-full bg-primary/15 blur-2xl" />
      </div>

      <div className="relative z-1 flex flex-col items-center justify-center transition-transform duration-300">
        <div className="flex size-20 sm:size-24 items-center justify-center rounded-2xl bg-primary/10 text-primary/80 border border-primary/20 shadow-inner">
          <RiCarLine className="size-10 sm:size-12" />
        </div>

        {category && (
          <div className="mt-2 text-[11px] font-mono font-semibold tracking-wider uppercase text-muted-foreground/80">
            {category} Class
          </div>
        )}

        {showFallbackBadge && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-medium text-muted-foreground border shadow-2xs backdrop-blur-xs">
            <span className="size-1.5 rounded-full bg-primary/60 animate-pulse" />
            <span>{fallbackText}</span>
          </div>
        )}
      </div>
    </div>
  )
}
