import * as React from "react"
import Link from "next/link"
import { Metadata } from "next"
import { MOCK_CUSTOMER_PROFILE } from "@/lib/mock/customer"
import { getUpcomingReservation, getMockReservations } from "@/lib/mock/reservations"
import { UpcomingHeroCard } from "@/features/account/components/upcoming-hero-card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import {
  RiSteering2Line,
  RiFileList3Line,
  RiShieldKeyholeLine,
  RiCarLine,
  RiArrowRightLine,
  RiHistoryLine,
  RiCheckDoubleLine,
} from "@remixicon/react"

export const metadata: Metadata = {
  title: "Account Overview — Veyra",
  description: "Customer account overview, active reservations, and quick access.",
}

export default function AccountOverviewPage() {
  const upcomingReservation = getUpcomingReservation()
  const allReservations = getMockReservations()
  const pastReservations = allReservations.filter(
    (r) => r.status === "completed" || r.status === "cancelled"
  )

  return (
    <div className="space-y-8">
      {/* Welcome & Member Status Banner */}
      <div className="rounded-xl border bg-linear-to-r from-primary/5 via-card to-background p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-semibold tracking-wider text-primary">
                Customer Account Dashboard
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                Member ID: {MOCK_CUSTOMER_PROFILE.membershipNumber}
              </span>
            </div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Welcome back, {MOCK_CUSTOMER_PROFILE.firstName}
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage your current vehicle itinerary, review rental documentation, and view trip receipts.
            </p>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0">
            <span className="text-xs text-muted-foreground">Membership Status</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20">
              <RiCheckDoubleLine className="size-3.5" />
              <span>{MOCK_CUSTOMER_PROFILE.tier}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Upcoming / Active Reservation Section */}
      <section className="space-y-4" aria-labelledby="upcoming-heading">
        <div className="flex items-center justify-between">
          <h2 id="upcoming-heading" className="font-heading text-lg font-bold text-foreground">
            Current Rental Itinerary
          </h2>
          <Link
            href="/account/reservations"
            className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
          >
            <span>View all ({allReservations.length})</span>
            <RiArrowRightLine className="size-3.5" />
          </Link>
        </div>

        {upcomingReservation ? (
          <UpcomingHeroCard reservation={upcomingReservation} />
        ) : (
          <div className="rounded-xl border bg-card p-8 text-center space-y-3">
            <RiCarLine className="size-8 mx-auto text-muted-foreground" />
            <h3 className="font-heading text-base font-semibold">No Active Rentals</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You do not have any active or upcoming vehicle reservations at this time.
            </p>
            <Link href="/vehicles">
              <Button size="sm" className="mt-2">Browse Available Fleet</Button>
            </Link>
          </div>
        )}
      </section>

      {/* Account Verification & Readiness Grid */}
      <section className="space-y-4" aria-labelledby="readiness-heading">
        <h2 id="readiness-heading" className="font-heading text-lg font-bold text-foreground">
          Handover Readiness
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Driver License */}
          <Link
            href="/account/driver"
            className="rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <RiSteering2Line className="size-4" />
              </div>
              <StatusBadge status="success" label="Verified" size="sm" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Driver Profile
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                License validated with zero demerits.
              </p>
            </div>
            <span className="text-[11px] font-medium text-primary flex items-center gap-1 pt-1">
              <span>Review Details</span>
              <RiArrowRightLine className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          {/* Identity Documents */}
          <Link
            href="/account/documents"
            className="rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <RiFileList3Line className="size-4" />
              </div>
              <StatusBadge status="pending" label="1 Pending" size="sm" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Identity Documents
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                1 document approved, 1 under verification.
              </p>
            </div>
            <span className="text-[11px] font-medium text-primary flex items-center gap-1 pt-1">
              <span>View Documents</span>
              <RiArrowRightLine className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          {/* Security & Access */}
          <Link
            href="/account/security"
            className="rounded-xl border bg-card p-4 hover:border-primary/40 hover:bg-muted/30 transition-all flex flex-col justify-between space-y-3 group"
          >
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <RiShieldKeyholeLine className="size-4" />
              </div>
              <StatusBadge status="neutral" label="Secured" size="sm" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                Security & Access
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                2 active sessions • 2FA enabled.
              </p>
            </div>
            <span className="text-[11px] font-medium text-primary flex items-center gap-1 pt-1">
              <span>Manage Security</span>
              <RiArrowRightLine className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        </div>
      </section>

      {/* Past Rentals Quick Section */}
      {pastReservations.length > 0 && (
        <section className="space-y-4" aria-labelledby="history-heading">
          <div className="flex items-center justify-between">
            <h2 id="history-heading" className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
              <RiHistoryLine className="size-4 text-muted-foreground" />
              <span>Recent Trip History</span>
            </h2>
            <Link
              href="/account/reservations"
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1"
            >
              <span>See full history</span>
              <RiArrowRightLine className="size-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border bg-card divide-y">
            {pastReservations.slice(0, 2).map((res) => (
              <div key={res.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      {res.vehicle.make} {res.vehicle.model} ({res.vehicle.year})
                    </span>
                    <span className="font-mono text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                      {res.id}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {res.pickupLocationName} • {res.pickupDate} → {res.returnDate} ({res.rentalDays} Days)
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="font-semibold text-sm text-foreground block">
                      {res.pricing.currency}{res.pricing.totalRentalPrice.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-muted-foreground capitalize">
                      {res.status}
                    </span>
                  </div>
                  <Link href={`/account/reservations/${res.id}`}>
                    <Button variant="outline" size="sm">View Details</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
