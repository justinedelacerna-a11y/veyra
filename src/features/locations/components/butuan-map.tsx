"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import type { ButuanMapViewProps } from "./butuan-map-view"
import { RiMapPin2Line } from "@remixicon/react"

const DynamicButuanMapView = dynamic(
  () => import("./butuan-map-view"),
  {
    ssr: false,
    loading: () => (
      <div className="flex flex-col items-center justify-center h-[540px] sm:h-[620px] rounded-2xl border bg-muted/30 animate-pulse text-muted-foreground gap-3">
        <RiMapPin2Line className="size-10 text-amber-500/60 animate-bounce" />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">Loading Interactive Butuan City Map...</p>
          <p className="text-xs text-muted-foreground">Streaming streets, barangays, landmarks, and Veyra stations</p>
        </div>
      </div>
    ),
  }
)

export function ButuanMap(props: ButuanMapViewProps) {
  return <DynamicButuanMapView {...props} />
}
