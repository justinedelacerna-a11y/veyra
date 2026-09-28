"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useBooking } from "../context/booking-context"
import { BookingSummary } from "./booking-summary"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { RiFileList3Line } from "@remixicon/react"

export function MobileSummaryDrawer() {
  const pathname = usePathname()
  const { pricing } = useBooking()

  // Hide on confirmation page
  if (pathname.includes("/booking/confirmation")) {
    return null
  }

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 p-3 bg-background/95 backdrop-blur-md border-t border-border shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
            Estimated Total
          </span>
          <span className="font-heading text-lg font-bold text-primary">
            {pricing.currency}
            {pricing.totalRentalPrice.toLocaleString()}
          </span>
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <RiFileList3Line className="size-4" data-icon="inline-start" />
                <span>View Summary</span>
              </Button>
            }
          />
          <SheetContent side="bottom" className="h-[80vh] p-6 overflow-y-auto">
            <SheetHeader className="p-0 pb-3">
              <SheetTitle className="text-base font-bold">
                Rental Cost Breakdown
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Itemized pricing, selected extras, and deposit details.
              </SheetDescription>
            </SheetHeader>
            <div className="pt-2">
              <BookingSummary hideEditLinks />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
