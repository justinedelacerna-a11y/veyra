"use client"

import * as React from "react"
import { PageHeader } from "@/components/layout/page-header"
import { SectionHeader } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import type { AdminLocation, AdminBranch } from "@/features/admin/server/locations-service"
import { RiMapPin2Line, RiBuildingLine } from "@remixicon/react"

interface LocationsClientProps {
  locations: AdminLocation[]
  branches: AdminBranch[]
}

export function LocationsClient({ locations, branches }: LocationsClientProps) {
  const [tab, setTab] = React.useState<"locations" | "branches">("locations")

  const activeLocations = locations.filter((l) => l.status === "active")

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations Management"
        description="Manage Veyra barangay-level pickup and return hubs in Butuan City, Agusan del Norte."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Locations", value: locations.length, icon: RiMapPin2Line },
          { label: "Active Hubs", value: activeLocations.length, icon: RiMapPin2Line },
          { label: "Branches", value: branches.length, icon: RiBuildingLine },
          { label: "Pickup-Enabled", value: locations.filter((l) => l.pickupEnabled && l.status === "active").length, icon: RiMapPin2Line },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border bg-card p-3 text-center">
            <div className="font-heading text-2xl font-bold text-foreground">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {([
          { key: "locations", label: `Butuan Barangay Hubs (${locations.length})` },
          { key: "branches", label: `Operational Branches (${branches.length})` },
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

      {tab === "locations" && (
        <section className="space-y-4">
          <SectionHeader
            title="Butuan City Barangay Pickup & Return Locations"
            badge={<StatusBadge status="success" label={`${activeLocations.length} Active Hubs`} size="sm" />}
          />

          {locations.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <RiMapPin2Line className="size-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No locations configured</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add pickup and return locations in the Supabase database.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Barangay</TableHead>
                    <TableHead>Location Hub</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Pickup Enabled</TableHead>
                    <TableHead>Return Enabled</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.map((l) => {
                    return (
                      <TableRow key={l.id} className="hover:bg-muted/20">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <RiMapPin2Line className="size-3.5 text-primary shrink-0" />
                            <span className="text-sm font-bold text-foreground">
                              {l.barangay ? `Brgy. ${l.barangay}` : l.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-medium text-muted-foreground">{l.name}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={l.address}>
                          {l.address}
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={l.pickupEnabled ? "success" : "neutral"}
                            label={l.pickupEnabled ? "Enabled" : "Disabled"}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            status={l.returnEnabled ? "success" : "neutral"}
                            label={l.returnEnabled ? "Enabled" : "Disabled"}
                            size="sm"
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.operatingHours}</TableCell>
                        <TableCell>
                          <StatusBadge
                            status={l.status === "active" ? "success" : "neutral"}
                            label={l.status === "active" ? "Active" : "Inactive"}
                            size="sm"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Default locations info */}
          <div className="rounded-lg border border-sky-500/20 bg-sky-500/5 p-4">
            <p className="text-xs text-muted-foreground">
              <strong className="text-sky-600 dark:text-sky-400">Veyra Operating Location:</strong>{" "}
              Butuan City, Agusan del Norte, Philippines. Active fleet is stationed and dispatched across verified local barangay hubs.
            </p>
          </div>
        </section>
      )}

      {tab === "branches" && (
        <section className="space-y-4">
          <SectionHeader
            title="Operational Branches"
            badge={<StatusBadge status="info" label={`${branches.length} Branch${branches.length !== 1 ? "es" : ""}`} size="sm" />}
          />

          {branches.length === 0 ? (
            <div className="rounded-lg border bg-card p-8 text-center">
              <RiBuildingLine className="size-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm font-medium text-muted-foreground">No branches configured</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {branches.map((b) => (
                <div key={b.id} className="rounded-lg border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <RiBuildingLine className="size-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{b.name}</span>
                    </div>
                    <StatusBadge
                      status={b.status === "active" ? "success" : "neutral"}
                      label={b.status}
                      size="sm"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{b.city}</p>
                    {b.contactPhone && <p>📞 {b.contactPhone}</p>}
                    {b.contactEmail && <p>✉ {b.contactEmail}</p>}
                    <p className="text-[11px] font-mono">{b.timezone}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium">{b.locationCount}</span> pickup/return hub{b.locationCount !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
