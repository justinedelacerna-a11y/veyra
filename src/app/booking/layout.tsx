import * as React from "react"
import { Metadata } from "next"
import { BookingProvider } from "@/features/booking/context/booking-context"
import { BookingHeader } from "@/features/booking/components/booking-header"
import { BookingProgress } from "@/features/booking/components/booking-progress"
import { BookingLayoutClient } from "@/features/booking/components/booking-layout-client"

export const metadata: Metadata = {
  title: "Complete Your Reservation — Veyra",
  description:
    "Review your guaranteed vehicle specifications, configure options, and complete your rental itinerary.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function BookingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <React.Suspense
        fallback={
          <div className="flex min-h-[60vh] items-center justify-center p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }
      >
        <BookingProvider>
          <BookingHeader />
          <BookingProgress />
          <BookingLayoutClient>{children}</BookingLayoutClient>
        </BookingProvider>
      </React.Suspense>
    </div>
  )
}
