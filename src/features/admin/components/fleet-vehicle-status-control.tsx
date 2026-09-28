"use client"

import * as React from "react"
import { FleetVehicle } from "@/features/admin/types"
import { ConfirmationDialog } from "@/components/admin/primitives"
import { Button } from "@/components/ui/button"
import { RiToolsLine } from "@remixicon/react"

export function FleetVehicleStatusControl({ vehicle }: { vehicle: FleetVehicle }) {
  const [confirmOpen, setConfirmOpen] = React.useState(false)

  const canScheduleMaintenance = vehicle.fleetStatus === "available" || vehicle.fleetStatus === "inspection"

  if (!canScheduleMaintenance) return null

  const handleRequest = () => {
    setConfirmOpen(true)
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleRequest()}
          className="gap-1.5 text-amber-700 hover:bg-amber-500/10"
        >
          <RiToolsLine className="size-4" data-icon="inline-start" />
          <span>Schedule Maintenance</span>
        </Button>
      </div>

      <ConfirmationDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Schedule Vehicle for Maintenance"
        description={`This will set ${vehicle.make} ${vehicle.model} (${vehicle.plateNumber}) to Maintenance status, removing it from available inventory. Any pending reservations using this vehicle will need to be reassigned manually.`}
        confirmLabel="Confirm — Schedule Maintenance"
        variant="destructive"
        onConfirm={() => {
          // Frontend prototype — no real persistence
          setConfirmOpen(false)
        }}
      />
    </>
  )
}
