"use client"

import * as React from "react"
import Link from "next/link"
import { CustomerReservation } from "@/features/account/types"
import { ReservationCard } from "./reservation-card"
import { EmptyState } from "@/components/common/empty-state"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface ReservationsFilterViewProps {
  initialReservations: CustomerReservation[]
}

export function ReservationsFilterView({
  initialReservations,
}: ReservationsFilterViewProps) {
  const [selectedTab, setSelectedTab] = React.useState<string>("all")

  const filteredReservations = React.useMemo(() => {
    if (selectedTab === "all") return initialReservations
    if (selectedTab === "upcoming") {
      return initialReservations.filter((r) => r.status === "upcoming")
    }
    if (selectedTab === "active") {
      return initialReservations.filter((r) => r.status === "active")
    }
    if (selectedTab === "past") {
      return initialReservations.filter((r) => r.status === "completed")
    }
    if (selectedTab === "cancelled") {
      return initialReservations.filter((r) => r.status === "cancelled")
    }
    return initialReservations
  }, [initialReservations, selectedTab])

  const counts = React.useMemo(() => {
    return {
      all: initialReservations.length,
      upcoming: initialReservations.filter((r) => r.status === "upcoming").length,
      active: initialReservations.filter((r) => r.status === "active").length,
      past: initialReservations.filter((r) => r.status === "completed").length,
      cancelled: initialReservations.filter((r) => r.status === "cancelled").length,
    }
  }, [initialReservations])

  return (
    <div className="space-y-6">
      {/* Tabs Filter Bar */}
      <Tabs value={selectedTab} onValueChange={(val) => val && setSelectedTab(val)}>
        <TabsList className="w-full sm:w-auto flex overflow-x-auto justify-start p-1 bg-muted/60">
          <TabsTrigger value="all" className="text-xs sm:text-sm">
            <span>All Trips</span>
            <span className="ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full bg-background/80 text-foreground font-mono">
              {counts.all}
            </span>
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="text-xs sm:text-sm">
            <span>Upcoming</span>
            {counts.upcoming > 0 && (
              <span className="ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full bg-background/80 text-foreground font-mono">
                {counts.upcoming}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="active" className="text-xs sm:text-sm">
            <span>Active</span>
            {counts.active > 0 && (
              <span className="ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-mono">
                {counts.active}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="past" className="text-xs sm:text-sm">
            <span>Completed</span>
            {counts.past > 0 && (
              <span className="ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full bg-background/80 text-foreground font-mono">
                {counts.past}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="text-xs sm:text-sm">
            <span>Cancelled</span>
            {counts.cancelled > 0 && (
              <span className="ml-1.5 text-[11px] px-1.5 py-0.2 rounded-full bg-background/80 text-foreground font-mono">
                {counts.cancelled}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reservation Cards List or Empty State */}
      {filteredReservations.length > 0 ? (
        <div className="space-y-4">
          {filteredReservations.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border bg-card p-12">
          <EmptyState
            preset="reservations"
            title={`No ${selectedTab} reservations`}
            description={
              selectedTab === "cancelled"
                ? "You do not have any cancelled reservations in your rental history."
                : selectedTab === "upcoming"
                ? "You have no upcoming rentals scheduled. Explore our fleet to plan your next journey."
                : "No reservations found matching this category."
            }
            action={
              <Link href="/vehicles">
                <Button size="sm">Browse Vehicles</Button>
              </Link>
            }
          />
        </div>
      )}
    </div>
  )
}
