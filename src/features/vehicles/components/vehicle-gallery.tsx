"use client"

import * as React from "react"
import Image from "next/image"
import {
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiShieldCheckLine,
} from "@remixicon/react"
import { VehicleImage } from "@/components/ui/vehicle-image"
import type { Vehicle } from "@/types"

interface VehicleGalleryProps {
  vehicle: Vehicle
}

export function VehicleGallery({ vehicle }: VehicleGalleryProps) {
  const images = React.useMemo(() => {
    if (vehicle.images && vehicle.images.length > 0) {
      return vehicle.images
    }
    if (vehicle.primaryImage) {
      return [vehicle.primaryImage]
    }
    return []
  }, [vehicle.images, vehicle.primaryImage])

  const [selectedIdx, setSelectedIdx] = React.useState(0)
  const activeIndex = images.length > 0 ? selectedIdx % images.length : 0

  const handlePrev = () => {
    setSelectedIdx((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setSelectedIdx((prev) => (prev + 1) % images.length)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      handlePrev()
    } else if (e.key === "ArrowRight") {
      handleNext()
    }
  }

  const activeImage = images[activeIndex]
  const altText = `${vehicle.year} ${vehicle.make} ${vehicle.model} - Veyra rental vehicle`

  if (images.length === 0) {
    return (
      <div className="rounded-2xl border bg-gradient-to-b from-muted/40 via-muted/10 to-card overflow-hidden shadow-xs">
        <VehicleImage
          src={null}
          alt={altText}
          aspectRatio="16/10"
          category={vehicle.category}
          containerClassName="h-72 sm:h-96"
          fallbackText="Vehicle photo coming soon"
        />
        <div className="border-t border-border/60 bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
          <RiShieldCheckLine className="size-4 text-emerald-500" />
          <span>Vehicle inspected and verified to Veyra standards prior to handover</span>
        </div>
      </div>
    )
  }

  return (
    <div
      className="space-y-3 focus:outline-hidden"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-label="Vehicle photo gallery"
    >
      {/* Main Image Showcase */}
      <div className="relative rounded-2xl border bg-card overflow-hidden shadow-sm aspect-16/10 w-full group">
        <Image
          src={activeImage}
          alt={`${altText} (Image ${activeIndex + 1} of ${images.length})`}
          fill
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
          className="object-cover object-center transition-all duration-300"
        />

        {/* Top Floating Badge */}
        <div className="absolute top-4 left-4 z-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-background/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border shadow-xs text-foreground">
            <RiShieldCheckLine className="size-4 text-emerald-500" />
            <span>Exact Vehicle Model</span>
          </span>
        </div>

        {/* Photo Counter */}
        {images.length > 1 && (
          <div className="absolute top-4 right-4 z-10">
            <span className="text-xs font-mono font-semibold bg-background/90 backdrop-blur-xs px-2.5 py-1 rounded-md border text-foreground shadow-xs">
              {activeIndex + 1} / {images.length}
            </span>
          </div>
        )}

        {/* Prev / Next controls */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous photo"
              className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex size-10 items-center justify-center rounded-full bg-background/80 hover:bg-background text-foreground shadow-md backdrop-blur-xs border transition-all opacity-80 group-hover:opacity-100 hover:scale-105"
            >
              <RiArrowLeftSLine className="size-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next photo"
              className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex size-10 items-center justify-center rounded-full bg-background/80 hover:bg-background text-foreground shadow-md backdrop-blur-xs border transition-all opacity-80 group-hover:opacity-100 hover:scale-105"
            >
              <RiArrowRightSLine className="size-6" />
            </button>
          </>
        )}
      </div>

      {/* Thumbnails row (if multiple images) */}
      {images.length > 1 && (
        <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
          {images.map((imgUrl, idx) => (
            <button
              key={`${imgUrl}-${idx}`}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              aria-label={`View photo ${idx + 1}`}
              className={`relative size-20 sm:size-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                activeIndex === idx
                  ? "border-primary ring-2 ring-primary/30 scale-102"
                  : "border-border/60 hover:border-primary/50 opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={imgUrl}
                alt={`${vehicle.model} thumbnail ${idx + 1}`}
                fill
                sizes="96px"
                className="object-cover object-center"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
