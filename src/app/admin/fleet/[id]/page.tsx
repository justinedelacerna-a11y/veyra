import * as React from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminVehicleById } from "@/features/admin/server/fleet-service"
import { StatusBadge } from "@/components/common/status-badge"
import { Button } from "@/components/ui/button"
import { FleetVehicleStatusControl } from "@/features/admin/components/fleet-vehicle-status-control"
import { VehiclePhotoManager } from "@/features/admin/components/vehicle-photo-manager"
import {
  RiArrowLeftLine, RiCalendarLine, RiToolsLine, RiInformationLine,
} from "@remixicon/react"
import type { StatusType } from "@/components/common/status-badge"
import type { FleetVehicleStatus } from "@/features/admin/types"

const FLEET_STATUS_MAP: Record<FleetVehicleStatus, { badge: StatusType; label: string }> = {
  available: { badge: "success", label: "Available" },
  reserved: { badge: "info", label: "Reserved" },
  rented: { badge: "success", label: "Rented Out" },
  inspection: { badge: "pending", label: "Under Inspection" },
  maintenance: { badge: "warning", label: "In Maintenance" },
  inactive: { badge: "neutral", label: "Inactive" },
  retired: { badge: "neutral", label: "Retired" },
}

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const { vehicle } = await getAdminVehicleById(id)
  return {
    title: vehicle ? `${vehicle.make} ${vehicle.model} — Fleet — Veyra Admin` : "Vehicle Not Found — Veyra Admin",
    robots: { index: false, follow: false },
  }
}

export default async function AdminVehicleDetailPage({ params }: Props) {
  await requireAdminStaff()
  const { id } = await params
  const { vehicle, reservations, maintenances } = await getAdminVehicleById(id)
  if (!vehicle) notFound()

  const statusCfg = FLEET_STATUS_MAP[vehicle.fleetStatus] || {
    badge: "neutral",
    label: vehicle.fleetStatus,
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b">
        <div className="space-y-1.5">
          <Link href="/admin/fleet" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <RiArrowLeftLine className="size-3.5" /> Back to Fleet
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-bold">{vehicle.make} {vehicle.model} {vehicle.year}</h1>
            <StatusBadge status={statusCfg.badge} label={statusCfg.label} />
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {vehicle.plateNumber} · {vehicle.branch}
          </p>
        </div>
        <FleetVehicleStatusControl vehicle={vehicle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Vehicle Photo Management */}
          <VehiclePhotoManager
            vehicleId={vehicle.id}
            vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            initialImages={vehicle.imageRecords || []}
          />

          {/* Vehicle Identity */}
          <section className="rounded-lg border bg-card p-5 space-y-4" aria-labelledby="identity-heading">
            <h2 id="identity-heading" className="font-heading text-sm font-bold text-foreground">Vehicle Identity</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
              {[
                { label: "Category", value: vehicle.category },
                { label: "Transmission", value: vehicle.transmission },
                { label: "Fuel Type", value: vehicle.fuelType },
                { label: "Seats", value: vehicle.seats },
                { label: "Plate Number", value: vehicle.plateNumber, mono: true },
                { label: "VIN / Chassis", value: vehicle.vin, mono: true },
                { label: "Branch Assignment", value: vehicle.branch },
                { label: "Stationed Barangay", value: vehicle.barangay ? `Barangay ${vehicle.barangay}` : "Butuan City Hub" },
                { label: "Handover Hub", value: vehicle.locationName || "Butuan City Operations Hub" },
                { label: "Acquisition Date", value: vehicle.acquisitionDate },
                { label: "Condition", value: vehicle.condition, capitalize: true },
              ].map(({ label, value, mono, capitalize }) => (
                <div key={label}>
                  <div className="text-xs text-muted-foreground mb-0.5">{label}</div>
                  <div className={`font-medium text-foreground ${mono ? "font-mono text-xs" : ""} ${capitalize ? "capitalize" : ""}`}>{value}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Telemetry */}
          <section className="rounded-lg border bg-card p-5 space-y-4" aria-labelledby="telemetry-heading">
            <h2 id="telemetry-heading" className="font-heading text-sm font-bold text-foreground">Operational Telemetry</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Odometer", value: `${vehicle.odometer.toLocaleString()} km` },
                { label: "Fuel / Battery", value: `${vehicle.fuelLevel}%` },
                { label: "Last Inspection", value: vehicle.lastInspectionDate },
                { label: "Next Service Due", value: vehicle.nextMaintenanceDue },
              ].map(({ label, value }) => (
                <div key={label} className="p-3 rounded-lg border bg-background/50 text-center">
                  <div className="font-heading text-lg font-bold text-foreground">{value}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Reservation History */}
          <section className="rounded-lg border bg-card p-5 space-y-3" aria-labelledby="res-hist-heading">
            <h2 id="res-hist-heading" className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
              <RiCalendarLine className="size-4 text-primary" /> Live Reservation History ({reservations.length})
            </h2>
            {reservations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No reservations recorded for this vehicle yet.</p>
            ) : (
              <div className="space-y-2">
                {reservations.map((r) => (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50 text-sm">
                    <div>
                      <span className="font-mono text-xs font-semibold">{r.reference || r.id}</span>
                      <span className="ml-2 text-foreground font-medium">{r.customerName}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{r.pickupDate} → {r.returnDate}</span>
                      <span className="ml-2 text-xs font-semibold text-primary">₱{r.totalAmount.toLocaleString()}</span>
                    </div>
                    <Link href={`/admin/reservations/${r.id}`}>
                      <Button size="xs" variant="ghost" className="text-xs">View</Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Maintenance History */}
          <section className="rounded-lg border bg-card p-5 space-y-3" aria-labelledby="mnt-hist-heading">
            <h2 id="mnt-hist-heading" className="font-heading text-sm font-bold text-foreground flex items-center gap-2">
              <RiToolsLine className="size-4 text-primary" /> Maintenance Records ({maintenances.length})
            </h2>
            {maintenances.length === 0 ? (
              <p className="text-xs text-muted-foreground py-3">No maintenance records recorded for this vehicle.</p>
            ) : (
              <div className="space-y-2">
                {maintenances.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border bg-background/50 text-sm">
                    <div>
                      <span className="font-medium capitalize">{m.type.replace(/_/g, " ")}</span>
                      <span className="ml-2 text-xs text-muted-foreground capitalize">Status: {m.status}</span>
                      <span className="ml-2 text-xs text-muted-foreground">Due: {m.scheduledDate}</span>
                      {m.notes && <span className="ml-2 text-xs text-muted-foreground">({m.notes})</span>}
                    </div>
                    <StatusBadge status={
                      m.status === "overdue" ? "error" :
                      m.status === "due" ? "warning" :
                      m.status === "in_progress" ? "pending" :
                      m.status === "completed" ? "success" : "neutral"
                    } label={m.status} size="sm" />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Current Status & Features */}
          <div className="rounded-lg border bg-card p-5 space-y-3">
            <h2 className="font-heading text-sm font-bold text-foreground">Fleet Status</h2>
            <StatusBadge status={statusCfg.badge} label={statusCfg.label} />
            <div className="text-xs text-muted-foreground pt-3 border-t space-y-1">
              <div className="flex justify-between">
                <span>Daily Rental Rate:</span>
                <span className="font-medium text-foreground">₱{vehicle.dailyRate.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Security Deposit:</span>
                <span className="font-medium text-foreground">₱{(vehicle.securityDeposit ?? 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {vehicle.features && vehicle.features.length > 0 && (
            <div className="rounded-lg border bg-card p-5 space-y-2">
              <h2 className="font-heading text-sm font-bold text-foreground">Installed Features</h2>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {vehicle.features.map((feat) => (
                  <span key={feat} className="text-xs px-2 py-0.5 rounded border bg-muted/30">
                    {feat}
                  </span>
                ))}
              </div>
            </div>
          )}

          {vehicle.internalNotes && (
            <div className="rounded-lg border border-dashed bg-muted/40 p-4 text-xs text-muted-foreground flex gap-2.5">
              <RiInformationLine className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">Operations Note</p>
                <p className="leading-relaxed">{vehicle.internalNotes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
