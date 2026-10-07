"use client"

import * as React from "react"
import { PageHeader, } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { AdminExtra, AdminRatePlan } from "@/features/admin/server/pricing-service"
import type { StatusType } from "@/components/common/status-badge"

const CATEGORY_BADGE: Record<AdminExtra["category"], StatusType> = {
  protection: "success",
  convenience: "info",
  equipment: "neutral",
  mileage: "pending",
}

interface PricingClientProps {
  extras: AdminExtra[]
  ratePlans: AdminRatePlan[]
}

export function PricingClient({ extras, ratePlans }: PricingClientProps) {
  const [tab, setTab] = React.useState<"extras" | "rate_plans">("extras")

  const activeExtras = extras.filter((e) => e.isActive)
  const activeRatePlans = ratePlans.filter((r) => r.isActive)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Rules"
        description="Vehicle add-on extras and rate plan configurations. Prices are in Philippine Peso (₱)."
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {([
          { key: "extras", label: `Add-on Extras (${extras.length})` },
          { key: "rate_plans", label: `Rate Plans (${ratePlans.length})` },
        ] as const).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "extras" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Add-on Extras"
              badge={
                <StatusBadge
                  status="success"
                  label={`${activeExtras.length} Active`}
                  size="sm"
                />
              }
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {(["protection", "convenience", "equipment", "mileage"] as const).map((cat) => {
              const count = extras.filter((e) => e.category === cat).length
              return (
                <div key={cat} className="rounded-lg border bg-card p-3 text-center">
                  <div className="font-heading text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground capitalize">{cat}</div>
                </div>
              )
            })}
          </div>

          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Extra / Add-on</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Daily Rate</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Slug</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {extras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-xs text-muted-foreground">
                      No extras configured. Add extras in the Supabase database.
                    </TableCell>
                  </TableRow>
                ) : (
                  extras.map((e) => (
                    <TableRow key={e.id} className="hover:bg-muted/20">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{e.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[240px]">{e.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={CATEGORY_BADGE[e.category]}
                          label={e.category}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-sm">
                        ₱{e.dailyRate.toLocaleString()}/day
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={e.isActive ? "success" : "neutral"}
                          label={e.isActive ? "Active" : "Inactive"}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-muted-foreground">{e.slug}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      {tab === "rate_plans" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionHeader
              title="Rate Plans"
              badge={
                <StatusBadge
                  status="info"
                  label={`${activeRatePlans.length} Active`}
                  size="sm"
                />
              }
            />
          </div>

          <div className="rounded-lg border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Vehicle Class</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Rate Override</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Validity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ratePlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                      No rate plans configured. Add rate plans in the Supabase database.
                    </TableCell>
                  </TableRow>
                ) : (
                  ratePlans.map((r) => (
                    <TableRow key={r.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium text-sm">{r.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {r.vehicleClassName || "All Classes"}
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {r.minDays}d{r.maxDays ? `–${r.maxDays}d` : "+"}
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        {r.dailyRateOverride ? `₱${r.dailyRateOverride.toLocaleString()}/day` : "—"}
                      </TableCell>
                      <TableCell>
                        {r.discountPct ? (
                          <StatusBadge status="success" label={`${r.discountPct}% off`} size="sm" />
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {r.validFrom || "Any"}
                        {r.validTo ? ` → ${r.validTo}` : ""}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={r.isActive ? "success" : "neutral"}
                          label={r.isActive ? "Active" : "Inactive"}
                          size="sm"
                        />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </section>
      )}

      <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
        <p className="text-xs text-muted-foreground">
          <strong className="text-sky-600 dark:text-sky-400">Pricing Architecture:</strong>{" "}
          All prices are stored in centavos (minor units) in the database and displayed in Philippine Peso (₱).
          Price calculations are always performed server-side — client prices are never trusted.
          To add or modify extras and rate plans, update the Supabase database directly or use the Supabase dashboard.
        </p>
      </div>
    </div>
  )
}
