"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  RiShieldCheckLine,
  RiCustomerServiceLine,
  RiCloseLine,
  RiCarLine,
} from "@remixicon/react"

export function BookingHeader() {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Security Badge */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="font-heading text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5 focus-visible:outline-hidden"
          >
            <span className="text-primary font-black">VEYRA</span>
          </Link>

          <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
            <RiShieldCheckLine className="size-3.5" />
            <span>Secure Booking</span>
          </span>
        </div>

        {/* Right Actions: Support & Safe Exit */}
        <div className="flex items-center gap-3">
          {/* 24/7 Support Hotline Dialog */}
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RiCustomerServiceLine className="size-4" data-icon="inline-start" />
                  <span className="hidden sm:inline">Concierge Support</span>
                </Button>
              }
            />
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">
                  Fleet Concierge Desk
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Our operational dispatch team is available 24/7 for booking assistance and itinerary questions.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Direct Operations Hotline
                  </span>
                  <p className="font-mono text-sm font-bold text-foreground">
                    +63 (02) 8800-VEYRA
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Toll-free across all Philippine networks
                  </p>
                </div>

                <div className="rounded-lg border bg-muted/30 p-3 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">
                    Airport Valet Dispatch
                  </span>
                  <p className="text-xs text-foreground font-medium">
                    valet-dispatch@veyra-rentals.com
                  </p>
                </div>
              </div>

              <DialogFooter>
                <DialogClose
                  render={
                    <Button variant="outline" className="w-full">
                      Close
                    </Button>
                  }
                />
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Safe Exit / Cancel Booking Dialog */}
          <Dialog>
            <DialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-xs text-muted-foreground hover:text-destructive"
                >
                  <RiCloseLine className="size-4" data-icon="inline-start" />
                  <span>Exit</span>
                </Button>
              }
            />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold">
                  Leave Booking Process?
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Your current selections will remain saved in this browser session. However, the vehicle is not reserved until your booking is completed.
                </DialogDescription>
              </DialogHeader>

              <DialogFooter className="gap-2 sm:gap-0">
                <DialogClose
                  render={
                    <Button variant="outline" size="sm">
                      Continue Booking
                    </Button>
                  }
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => router.push("/vehicles")}
                  className="gap-1.5"
                >
                  <RiCarLine className="size-4" data-icon="inline-start" />
                  <span>Return to Fleet</span>
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  )
}
