import * as React from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getAdminReservationById } from "@/lib/mock/admin-reservations"
import { RESERVATION_STATUS_CONFIG } from "@/features/admin/types"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import {
  RiArrowLeftLine, RiUserLine, RiCarLine, RiMapPinLine,
  RiCalendarLine, RiTimeLine, RiInformationLine,
} from "@remixicon/react"
import { AdminReservationDetailActions } from "@/features/admin/components/reservation-detail-actions"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const res = getAdminReservationById(id)
  return {
    title: res ? `Reservation ${res.id} — Veyra Admin` : "Reservation Not Found — Veyra Admin",
    robots: { index: false, follow: false },
  }
}

export default async function AdminReservationDetailPage({ params }: Props) {
  const { id } = await params
  const res = getAdminReservationById(id)

  if (!res) notFound()

  const config = RESERVATION_STATUS_CONFIG[res.status]

  const paymentConfig = {
    captured: { status: "success" as const, label: "Captured" },
    authorized: { status: "info" as const, label: "Authorized" },
    pending: { status: "pending" as const, label: "Pending" },
    refunded: { status: "neutral" as const, label: "Refunded" },
    failed: { status: "error" as const, label: "Failed" },
  }[res.paymentStatus] || { status: "neutral" as const, label: res.paymentStatus }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b">
        <div className="space-y-1.5">
          <Link href="/admin/reservations" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <RiArrowLeftLine className="size-3.5" /> Back to Reservations
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">{res.id}</h1>
            <StatusBadge status={config.badgeVariant} label={config.label} />
            <StatusBadge status={paymentConfig.status} label={`Payment: ${paymentConfig.label}`} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground">
            Branch: {res.branch} · Created {new Date(res.createdAt).toLocaleDateString()}
          </p>
        </div>
        <AdminReservationDetailActions reservation={res} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Customer */}
          <section className="rounded-lg border bg-card p-5 space-y-3" aria-labelledby="cust-heading">
            <h2 id="cust-heading" className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
              <RiUserLine className="size-4 text-primary" /> Customer & Driver
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              <div><div className="text-xs text-muted-foreground mb-0.5">Name</div><div className="font-medium">{res.customerName}</div></div>
              <div><div className="text-xs text-muted-foreground mb-0.5">Email</div><div className="font-medium">{res.customerEmail}</div></div>
              <div><div className="text-xs text-muted-foreground mb-0.5">Customer ID</div><div className="font-mono text-xs">{res.customerId}</div></div>
            </div>
            <div className="pt-2 border-t">
              <Link href={`/admin/customers/${res.customerId}`}>
                <Button size="xs" variant="outline" className="text-xs">View Customer Profile</Button>
              </Link>
            </div>
          </section>

          {/* Vehicle */}
          <section className="rounded-lg border bg-card p-5 space-y-3" aria-labelledby="veh-heading">
            <h2 id="veh-heading" className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
              <RiCarLine className="size-4 text-primary" /> Assigned Vehicle
            </h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><div className="text-xs text-muted-foreground mb-0.5">Vehicle</div><div className="font-medium">{res.vehicleName}</div></div>
              <div><div className="text-xs text-muted-foreground mb-0.5">Plate Number</div><div className="font-mono font-medium">{res.vehiclePlate}</div></div>
              <div><div className="text-xs text-muted-foreground mb-0.5">Branch</div><div className="font-medium">{res.branch}</div></div>
              <div><div className="text-xs text-muted-foreground mb-0.5">Vehicle ID</div><div className="font-mono text-xs">{res.vehicleId}</div></div>
            </div>
            {res.assignedVehicleId && (
              <div className="pt-2 border-t">
                <Link href={`/admin/fleet/${res.assignedVehicleId}`}>
                  <Button size="xs" variant="outline" className="text-xs">View Fleet Record</Button>
                </Link>
              </div>
            )}
          </section>

          {/* Itinerary */}
          <section className="rounded-lg border bg-card p-5 space-y-4" aria-labelledby="itin-heading">
            <h2 id="itin-heading" className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
              <RiCalendarLine className="size-4 text-primary" /> Rental Itinerary
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-3 rounded-lg border bg-background/50 space-y-1.5">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Pickup Handover</div>
                <div className="font-semibold">{res.pickupDate} · {res.pickupTime}</div>
                <div className="flex items-start gap-1 text-xs text-muted-foreground">
                  <RiMapPinLine className="size-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>{res.pickupLocationName}</span>
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-background/50 space-y-1.5">
                <div className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Return & Inspection</div>
                <div className="font-semibold">{res.returnDate} · {res.returnTime}</div>
                <div className="flex items-start gap-1 text-xs text-muted-foreground">
                  <RiMapPinLine className="size-3.5 shrink-0 mt-0.5 text-primary" />
                  <span>{res.returnLocationName}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-3">
              <RiTimeLine className="size-3.5" />
              <span>Rental Duration: <strong className="text-foreground">{res.rentalDays} day{res.rentalDays !== 1 ? "s" : ""}</strong></span>
            </div>
          </section>

          {/* Extras */}
          {res.extras.length > 0 && (
            <section className="rounded-lg border bg-card p-5 space-y-3" aria-labelledby="extras-heading">
              <h2 id="extras-heading" className="font-heading text-sm font-bold text-foreground">Add-Ons & Extras</h2>
              <ul className="space-y-1.5">
                {res.extras.map((e) => (
                  <li key={e} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary inline-block shrink-0" aria-hidden="true" />
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Internal Notes */}
          {res.internalNotes && (
            <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-xs text-muted-foreground flex gap-2.5">
              <RiInformationLine className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Internal Operations Note</p>
                <p className="leading-relaxed">{res.internalNotes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Pricing */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="font-heading text-sm font-bold text-foreground">Financial Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rental Amount</span>
                <span className="font-semibold text-foreground">{res.currency}{res.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-muted-foreground">Security Deposit</span>
                <span className="font-medium">{res.currency}{res.depositAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium">{res.paymentMethod}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2">
                <span className="text-muted-foreground">Payment Status</span>
                <StatusBadge status={paymentConfig.status} label={paymentConfig.label} size="sm" />
              </div>
            </div>
            <div className="pt-2 border-t">
              <Link href={`/admin/payments`}>
                <Button size="xs" variant="outline" className="w-full text-xs">View Payment Record</Button>
              </Link>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="font-heading text-sm font-bold text-foreground">Current State</h2>
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2">
                <StatusBadge status={config.badgeVariant} label={config.label} size="sm" />
              </div>
              <p className="text-muted-foreground leading-relaxed">{config.description}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
