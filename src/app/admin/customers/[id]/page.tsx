import * as React from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminCustomerById } from "@/features/admin/server/customers-service"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { CustomerDocumentsReview } from "@/features/admin/components/customer-documents-review"
import { RESERVATION_STATUS_CONFIG } from "@/features/admin/types"
import { RiArrowLeftLine, RiCalendarLine } from "@remixicon/react"
import type { StatusType } from "@/components/common/status-badge"

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { customer } = await getAdminCustomerById(id)
  return {
    title: customer ? `${customer.name} — Customer Profile — Veyra Admin` : "Customer Not Found — Veyra Admin",
    robots: { index: false, follow: false },
  }
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  await requireAdminStaff()
  const { id } = await params
  const { customer, reservations, documents } = await getAdminCustomerById(id)
  if (!customer) notFound()

  const verBadge: Record<string, StatusType> = { verified: "success", pending: "pending", rejected: "error" }
  const docBadge: Record<string, StatusType> = { complete: "success", pending: "pending", incomplete: "warning" }
  const statusBadge: Record<string, StatusType> = { active: "success", restricted: "warning", blocked: "error" }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b">
        <div className="space-y-1.5">
          <Link href="/admin/customers" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <RiArrowLeftLine className="size-3.5" /> Back to Customers
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">{customer.name}</h1>
            <StatusBadge status={statusBadge[customer.status] || "neutral"} label={customer.status} />
          </div>
          <p className="text-xs text-muted-foreground">
            {customer.email} · {customer.phone || "No phone on file"} · UUID: {customer.id}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Profile */}
          <section className="rounded-lg border bg-card p-5 space-y-4" aria-labelledby="profile-heading">
            <h2 id="profile-heading" className="font-heading text-sm font-bold">Customer Identity & Profile</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: "First Name", value: customer.firstName },
                { label: "Last Name", value: customer.lastName || "—" },
                { label: "Email", value: customer.email },
                { label: "Phone", value: customer.phone || "—" },
                { label: "Driver License", value: customer.driverLicenseNumber || "Not on file" },
                { label: "License Expiry", value: customer.driverLicenseExpiry || "—" },
                { label: "Member Since", value: customer.memberSince },
                { label: "Total Bookings", value: customer.reservationCount },
                { label: "Total Spent", value: customer.totalSpent > 0 ? `₱${customer.totalSpent.toLocaleString()}` : "—" },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                  <div className="font-medium text-foreground">{value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Reservation History */}
          <section className="rounded-lg border bg-card p-5 space-y-3" aria-labelledby="res-heading">
            <h2 id="res-heading" className="font-heading text-sm font-bold flex items-center gap-2">
              <RiCalendarLine className="size-4 text-primary" /> Live Booking History ({reservations.length})
            </h2>
            {reservations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No reservation history recorded for this customer.</p>
            ) : (
              <div className="space-y-2">
                {reservations.map((r) => {
                  const config = RESERVATION_STATUS_CONFIG[r.status as keyof typeof RESERVATION_STATUS_CONFIG] || {
                    badgeVariant: "neutral",
                    label: r.status,
                  }
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                      <div className="text-sm">
                        <span className="font-mono text-xs font-semibold">{r.reference}</span>
                        <span className="ml-2 text-foreground font-medium">{r.vehicleName}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{r.pickupDate} → {r.returnDate}</span>
                        <span className="ml-2 text-xs font-semibold text-primary">₱{r.totalAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={config.badgeVariant} label={config.label} size="sm" />
                        <Link href={`/admin/reservations/${r.id}`}>
                          <Button size="xs" variant="ghost" className="text-xs">View</Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {/* Verification Documents Review Console */}
          <CustomerDocumentsReview customerId={customer.id} documents={documents} />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="font-heading text-sm font-bold">Account Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account</span>
                <StatusBadge status={statusBadge[customer.status] || "neutral"} label={customer.status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Driver License</span>
                <StatusBadge status={verBadge[customer.verificationStatus] || "neutral"} label={customer.verificationStatus} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Profile Documents</span>
                <StatusBadge status={docBadge[customer.documentStatus] || "neutral"} label={customer.documentStatus} size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
