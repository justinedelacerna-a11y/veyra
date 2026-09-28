"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { BookingSummary } from "./booking-summary"
import { MobileSummaryDrawer } from "./mobile-summary-drawer"
import { PageContainer } from "@/components/layout/page-container"

export function BookingLayoutClient({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isConfirmation = pathname.includes("/booking/confirmation")

  return (
    <div className="py-6 sm:py-10 pb-24 lg:pb-12">
      <PageContainer>
        {isConfirmation ? (
          <div>{children}</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Main Interactive Step Form Area */}
            <main className="lg:col-span-8">{children}</main>

            {/* Desktop Sticky Summary Sidebar */}
            <aside className="hidden lg:block lg:col-span-4 sticky top-24">
              <BookingSummary />
            </aside>
          </div>
        )}
      </PageContainer>

      {/* Mobile Sticky Summary Drawer Trigger */}
      <MobileSummaryDrawer />
    </div>
  )
}
