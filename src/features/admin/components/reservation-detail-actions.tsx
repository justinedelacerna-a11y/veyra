"use client"

import * as React from "react"
import { AdminReservation } from "@/features/admin/types"
import { ConfirmationDialog } from "@/components/admin/primitives"
import { Button } from "@/components/ui/button"
import { RiCarLine, RiCloseLine } from "@remixicon/react"

export function AdminReservationDetailActions({ reservation }: { reservation: AdminReservation }) {
  const [cancelOpen, setCancelOpen] = React.useState(false)
  const [pickupOpen, setPickupOpen] = React.useState(false)

  const canMarkPickupReady = reservation.status === "confirmed"
  const canCancel = reservation.status !== "completed" && reservation.status !== "cancelled" && reservation.status !== "no_show"

  return (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {canMarkPickupReady && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPickupOpen(true)}
          className="gap-1.5"
        >
          <RiCarLine className="size-4" data-icon="inline-start" />
          <span>Mark Pickup Ready</span>
        </Button>
      )}

      {canCancel && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setCancelOpen(true)}
          className="gap-1.5 text-destructive hover:bg-destructive/10"
        >
          <RiCloseLine className="size-4" data-icon="inline-start" />
          <span>Cancel Reservation</span>
        </Button>
      )}

      <ConfirmationDialog
        open={pickupOpen}
        onOpenChange={setPickupOpen}
        title="Mark Reservation Pickup Ready"
        description={`This will update reservation ${reservation.id} to "Pickup Ready" and notify the customer and hub team that the vehicle is staged and cleared for handover.`}
        confirmLabel="Mark Pickup Ready"
        variant="default"
        onConfirm={() => {
          // Frontend prototype — no real state mutation
          setPickupOpen(false)
        }}
      />

      <ConfirmationDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel Reservation"
        description={`You are about to cancel reservation ${reservation.id} (${reservation.vehicleName} — ${reservation.customerName}). Any payment holds will need to be released manually in the payment portal. This action cannot be undone.`}
        confirmLabel="Confirm Cancellation"
        variant="destructive"
        onConfirm={() => {
          // Frontend prototype — no real state mutation
          setCancelOpen(false)
        }}
      />
    </div>
  )
}
