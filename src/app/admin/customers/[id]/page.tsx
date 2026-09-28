import * as React from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getAdminCustomerById } from "@/lib/mock/admin-ops"
import { MOCK_ADMIN_RESERVATIONS } from "@/lib/mock/admin-reservations"
import { MOCK_DOCUMENTS } from "@/lib/mock/customer"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { RESERVATION_STATUS_CONFIG } from "@/features/admin/types"
import { RiArrowLeftLine, RiCalendarLine, RiFileList3Line } from "@remixicon/react"
import type { StatusType } from "@/components/common/status-badge"

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const c = getAdminCustomerById(id)
  return {
    title: c ? `${c.firstName} ${c.lastName} — Customers — Veyra Admin` : "Customer Not Found — Veyra Admin",
    robots: { index: false, follow: false },
  }
}

export default async function AdminCustomerDetailPage({ params }: Props) {
  const { id } = await params
  const customer = getAdminCustomerById(id)
  if (!customer) notFound()

  const reservations = MOCK_ADMIN_RESERVATIONS.filter((r) => r.customerId === id)

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
            <h1 className="font-heading text-2xl font-bold">{customer.firstName} {customer.lastName}</h1>
            <StatusBadge status={statusBadge[customer.status]} label={customer.status} />
          </div>
          <p className="text-xs text-muted-foreground">{customer.email} · {customer.phone} · {customer.membershipNumber}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Profile */}
          <section className="rounded-lg border bg-card p-5 space-y-4" aria-labelledby="profile-heading">
            <h2 id="profile-heading" className="font-heading text-sm font-bold">Customer Profile</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: "First Name", value: customer.firstName },
                { label: "Last Name", value: customer.lastName },
                { label: "Email", value: customer.email },
                { label: "Phone", value: customer.phone },
                { label: "Member Since", value: customer.memberSince },
                { label: "Tier", value: customer.tier },
                { label: "Preferred Hub", value: customer.preferredHubName },
                { label: "Total Rentals", value: customer.totalRentals },
                { label: "Total Spent", value: customer.totalSpent > 0 ? `${customer.currency}${customer.totalSpent.toLocaleString()}` : "—" },
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
              <RiCalendarLine className="size-4 text-primary" /> Reservation History ({reservations.length})
            </h2>
            {reservations.length === 0 ? (
              <p className="text-xs text-muted-foreground">No reservations on record.</p>
            ) : (
              <div className="space-y-2">
                {reservations.map((r) => {
                  const config = RESERVATION_STATUS_CONFIG[r.status]
                  return (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50">
                      <div className="text-sm">
                        <span className="font-mono text-xs font-semibold">{r.id}</span>
                        <span className="ml-2 text-muted-foreground">{r.vehicleName}</span>
                        <span className="ml-2 text-xs text-muted-foreground">{r.pickupDate} → {r.returnDate}</span>
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

          {/* Documents */}
          <section className="rounded-lg border bg-card p-5 space-y-3" aria-labelledby="docs-heading">
            <h2 id="docs-heading" className="font-heading text-sm font-bold flex items-center gap-2">
              <RiFileList3Line className="size-4 text-primary" /> Document Status
            </h2>
            <div className="space-y-2">
              {MOCK_DOCUMENTS.map((doc) => {
                const badgeStatus: Record<string, StatusType> = {
                  approved: "success",
                  pending_review: "pending",
                  not_uploaded: "neutral",
                  rejected: "error",
                  expired: "warning",
                }
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50 text-sm">
                    <div>
                      <div className="font-medium">{doc.title}</div>
                      {doc.uploadedAt && <div className="text-xs text-muted-foreground">Uploaded {doc.uploadedAt}</div>}
                    </div>
                    <StatusBadge status={badgeStatus[doc.status]} label={doc.statusLabel} size="sm" />
                  </div>
                )
              })}
            </div>
          </section>

          {customer.notes && (
            <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-xs text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Staff Notes</p>
              <p>{customer.notes}</p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="font-heading text-sm font-bold">Account Status</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Account</span>
                <StatusBadge status={statusBadge[customer.status]} label={customer.status} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verification</span>
                <StatusBadge status={verBadge[customer.verificationStatus]} label={customer.verificationStatus} size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Documents</span>
                <StatusBadge status={docBadge[customer.documentStatus]} label={customer.documentStatus} size="sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
