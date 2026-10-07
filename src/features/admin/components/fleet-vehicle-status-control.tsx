"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FleetVehicle } from "@/features/admin/types"
import { ConfirmationDialog } from "@/components/admin/primitives"
import { Button } from "@/components/ui/button"
import {
  RiToolsLine,
  RiCheckboxCircleLine,
  RiLoader4Line,
} from "@remixicon/react"
import {
  scheduleVehicleMaintenanceAction,
  updateVehicleFleetStatusAction,
} from "@/features/admin/server/admin-actions"

export function FleetVehicleStatusControl({ vehicle }: { vehicle: FleetVehicle }) {
  const router = useRouter()
  const [maintenanceOpen, setMaintenanceOpen] = React.useState(false)
  const [availableOpen, setAvailableOpen] = React.useState(false)
  const [isPending, setIsPending] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ text: string; error?: boolean } | null>(null)

  const canScheduleMaintenance =
    vehicle.fleetStatus === "available" || vehicle.fleetStatus === "inspection"
  const canReturnToService =
    vehicle.fleetStatus === "maintenance" || vehicle.fleetStatus === "inspection"

  const handleScheduleMaintenance = async () => {
    setIsPending(true)
    setFeedback(null)

    // Schedule for next 3 days by default
    const now = new Date()
    const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    try {
      const res = await scheduleVehicleMaintenanceAction({
        vehicleId: vehicle.id,
        startsAt: now.toISOString(),
        endsAt: threeDaysLater.toISOString(),
        reason: "Scheduled hub maintenance and safety inspection",
      })

      if (res.success) {
        setFeedback({ text: res.message })
        setMaintenanceOpen(false)
        router.refresh()
      } else {
        setFeedback({ text: res.message || "Failed to schedule maintenance", error: true })
      }
    } catch {
      setFeedback({ text: "An unexpected error occurred.", error: true })
    } finally {
      setIsPending(false)
    }
  }

  const handleMarkAvailable = async () => {
    setIsPending(true)
    setFeedback(null)

    try {
      const res = await updateVehicleFleetStatusAction(
        vehicle.id,
        "available",
        "Cleared inspection and returned to service"
      )

      if (res.success) {
        setFeedback({ text: res.message })
        setAvailableOpen(false)
        router.refresh()
      } else {
        setFeedback({ text: res.message || "Failed to update status", error: true })
      }
    } catch {
      setFeedback({ text: "An unexpected error occurred.", error: true })
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
      {feedback && (
        <span
          className={`text-xs px-2 py-1 rounded ${
            feedback.error
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {feedback.text}
        </span>
      )}

      {canScheduleMaintenance && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setMaintenanceOpen(true)}
          className="gap-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
        >
          {isPending ? (
            <RiLoader4Line className="size-4 animate-spin" />
          ) : (
            <RiToolsLine className="size-4" data-icon="inline-start" />
          )}
          <span>Schedule Maintenance</span>
        </Button>
      )}

      {canReturnToService && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setAvailableOpen(true)}
          className="gap-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
        >
          {isPending ? (
            <RiLoader4Line className="size-4 animate-spin" />
          ) : (
            <RiCheckboxCircleLine className="size-4" data-icon="inline-start" />
          )}
          <span>Return to Active Fleet</span>
        </Button>
      )}

      <ConfirmationDialog
        open={maintenanceOpen}
        onOpenChange={setMaintenanceOpen}
        title="Schedule Vehicle for Maintenance"
        description={`This will set ${vehicle.make} ${vehicle.model} (${vehicle.plateNumber}) to Maintenance status, creating an availability block in Supabase and removing it from customer search.`}
        confirmLabel={isPending ? "Scheduling..." : "Confirm — Schedule Maintenance"}
        variant="destructive"
        onConfirm={handleScheduleMaintenance}
      />

      <ConfirmationDialog
        open={availableOpen}
        onOpenChange={setAvailableOpen}
        title="Return Vehicle to Active Service"
        description={`This will set ${vehicle.make} ${vehicle.model} (${vehicle.plateNumber}) to Available status. It will immediately be bookable by customers in the vehicle catalog.`}
        confirmLabel={isPending ? "Updating..." : "Return to Service"}
        variant="default"
        onConfirm={handleMarkAvailable}
      />
    </div>
  )
}
