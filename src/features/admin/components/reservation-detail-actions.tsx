"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AdminReservation } from "@/features/admin/types"
import { ConfirmationDialog } from "@/components/admin/primitives"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  RiCarLine,
  RiCloseLine,
  RiCheckDoubleLine,
  RiKeyLine,
  RiUserUnfollowLine,
  RiAlertLine,
  RiLoader4Line,
  RiGasStationLine,
  RiSpeedLine,
} from "@remixicon/react"
import {
  recordPickupHandoverAction,
  recordVehicleReturnAction,
  completeRentalAction,
  markNoShowAction,
  flagDisputeAction,
  transitionReservationStatusAction,
} from "@/features/admin/server/admin-actions"
import type { ReturnDamageStatus } from "@/features/admin/server/admin-actions"

type DialogType =
  | "pickup_handover"
  | "vehicle_return"
  | "complete"
  | "no_show"
  | "dispute"
  | "cancel"
  | "pickup_ready"
  | "confirmed"
  | null

export function AdminReservationDetailActions({
  reservation,
}: {
  reservation: AdminReservation
}) {
  const router = useRouter()
  const [activeDialog, setActiveDialog] = React.useState<DialogType>(null)
  const [isPending, setIsPending] = React.useState(false)
  const [feedback, setFeedback] = React.useState<{ text: string; error?: boolean } | null>(null)

  // Pickup handover form state
  const [handoverOdometer, setHandoverOdometer] = React.useState("")
  const [handoverFuel, setHandoverFuel] = React.useState("100")
  const [handoverCustomerPresent, setHandoverCustomerPresent] = React.useState(true)
  const [handoverNotes, setHandoverNotes] = React.useState("")

  // Vehicle return form state
  const [returnOdometer, setReturnOdometer] = React.useState("")
  const [returnFuel, setReturnFuel] = React.useState("100")
  const [returnDamageStatus, setReturnDamageStatus] = React.useState<ReturnDamageStatus>("no_damage")
  const [returnNotes, setReturnNotes] = React.useState("")

  // Dispute reason
  const [disputeReason, setDisputeReason] = React.useState("")

  const showFeedback = (text: string, error?: boolean) => {
    setFeedback({ text, error })
    setTimeout(() => setFeedback(null), 5000)
  }

  const handlePickupHandover = async () => {
    const odometerKm = parseInt(handoverOdometer, 10)
    const fuelLevelPct = parseInt(handoverFuel, 10)
    if (isNaN(odometerKm) || odometerKm < 0) {
      showFeedback("Please enter a valid odometer reading.", true)
      return
    }
    if (isNaN(fuelLevelPct) || fuelLevelPct < 0 || fuelLevelPct > 100) {
      showFeedback("Fuel level must be between 0 and 100.", true)
      return
    }
    setIsPending(true)
    try {
      const res = await recordPickupHandoverAction(reservation.id, {
        odometerKm,
        fuelLevelPct,
        customerPresent: handoverCustomerPresent,
        notes: handoverNotes.trim() || undefined,
      })
      if (res.success) {
        showFeedback(res.message)
        setActiveDialog(null)
        router.refresh()
      } else {
        showFeedback(res.message || "Handover failed.", true)
      }
    } catch {
      showFeedback("An unexpected error occurred.", true)
    } finally {
      setIsPending(false)
    }
  }

  const handleVehicleReturn = async () => {
    const odometerKm = parseInt(returnOdometer, 10)
    const fuelLevelPct = parseInt(returnFuel, 10)
    if (isNaN(odometerKm) || odometerKm < 0) {
      showFeedback("Please enter a valid odometer reading.", true)
      return
    }
    if (isNaN(fuelLevelPct) || fuelLevelPct < 0 || fuelLevelPct > 100) {
      showFeedback("Fuel level must be between 0 and 100.", true)
      return
    }
    setIsPending(true)
    try {
      const res = await recordVehicleReturnAction(reservation.id, {
        odometerKm,
        fuelLevelPct,
        damageStatus: returnDamageStatus,
        notes: returnNotes.trim() || undefined,
      })
      if (res.success) {
        showFeedback(res.message)
        setActiveDialog(null)
        router.refresh()
      } else {
        showFeedback(res.message || "Return recording failed.", true)
      }
    } catch {
      showFeedback("An unexpected error occurred.", true)
    } finally {
      setIsPending(false)
    }
  }

  const handleSimpleAction = async (
    action: () => Promise<{ success: boolean; message: string }>
  ) => {
    setIsPending(true)
    try {
      const res = await action()
      if (res.success) {
        showFeedback(res.message)
        setActiveDialog(null)
        router.refresh()
      } else {
        showFeedback(res.message || "Action failed.", true)
      }
    } catch {
      showFeedback("An unexpected error occurred.", true)
    } finally {
      setIsPending(false)
    }
  }

  const { status } = reservation

  return (
    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
      {/* Feedback Banner */}
      {feedback && (
        <span
          className={`text-xs px-2.5 py-1 rounded max-w-xs truncate ${
            feedback.error
              ? "bg-destructive/10 text-destructive border border-destructive/20"
              : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
          }`}
        >
          {feedback.text}
        </span>
      )}

      {/* payment_pending / held → Confirm */}
      {(status === "payment_pending" || status === "held") && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setActiveDialog("confirmed")}
          className="gap-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
        >
          {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : <RiCheckDoubleLine className="size-4" />}
          <span>Confirm Booking</span>
        </Button>
      )}

      {/* confirmed → Pickup Ready */}
      {status === "confirmed" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setActiveDialog("pickup_ready")}
          className="gap-1.5"
        >
          {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : <RiCarLine className="size-4" />}
          <span>Mark Pickup Ready</span>
        </Button>
      )}

      {/* pickup_ready → Handover or No-Show */}
      {status === "pickup_ready" && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setActiveDialog("pickup_handover")}
            className="gap-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : <RiKeyLine className="size-4" />}
            <span>Handover (Start Rental)</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setActiveDialog("no_show")}
            className="gap-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
          >
            {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : <RiUserUnfollowLine className="size-4" />}
            <span>Mark No-Show</span>
          </Button>
        </>
      )}

      {/* active → Record Return */}
      {status === "active" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setActiveDialog("vehicle_return")}
          className="gap-1.5"
        >
          {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : <RiCarLine className="size-4" />}
          <span>Record Return & Inspect</span>
        </Button>
      )}

      {/* return_inspection → Complete or Dispute */}
      {status === "return_inspection" && (
        <>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setActiveDialog("complete")}
            className="gap-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : <RiCheckDoubleLine className="size-4" />}
            <span>Complete Rental</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setActiveDialog("dispute")}
            className="gap-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
          >
            {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : <RiAlertLine className="size-4" />}
            <span>Flag Dispute</span>
          </Button>
        </>
      )}

      {/* disputed → Resolve & Complete */}
      {status === "disputed" && (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => setActiveDialog("complete")}
          className="gap-1.5 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
        >
          {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : <RiCheckDoubleLine className="size-4" />}
          <span>Resolve & Complete</span>
        </Button>
      )}

      {/* Cancellation — pre-active non-terminal states only */}
      {status !== "completed" &&
        status !== "cancelled" &&
        status !== "no_show" &&
        status !== "expired" &&
        status !== "active" &&
        status !== "return_inspection" &&
        status !== "disputed" && (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() => setActiveDialog("cancel")}
            className="gap-1.5 text-destructive hover:bg-destructive/10"
          >
            {isPending ? <RiLoader4Line className="size-4 animate-spin" /> : <RiCloseLine className="size-4" />}
            <span>Cancel</span>
          </Button>
        )}

      {/* ── Simple Dialogs ── */}
      <ConfirmationDialog
        open={activeDialog === "confirmed"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Confirm Reservation"
        description={`Confirm reservation ${reservation.reference || reservation.id} for ${reservation.customerName}. This locks the booking in the system.`}
        confirmLabel={isPending ? "Confirming..." : "Confirm Reservation"}
        variant="default"
        onConfirm={() =>
          handleSimpleAction(() =>
            transitionReservationStatusAction(reservation.id, "confirmed", "Staff manual confirmation")
          )
        }
      />

      <ConfirmationDialog
        open={activeDialog === "pickup_ready"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Mark Reservation Pickup Ready"
        description={`Vehicle ${reservation.vehicleName} (${reservation.vehiclePlate}) has been prepared at the hub. Customer will be notified.`}
        confirmLabel={isPending ? "Updating..." : "Mark Pickup Ready"}
        variant="default"
        onConfirm={() =>
          handleSimpleAction(() =>
            transitionReservationStatusAction(reservation.id, "pickup_ready", "Vehicle staged at hub")
          )
        }
      />

      <ConfirmationDialog
        open={activeDialog === "no_show"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Mark Reservation as No-Show"
        description={`Customer ${reservation.customerName} did not arrive for scheduled pickup. Vehicle will be released to fleet inventory.`}
        confirmLabel={isPending ? "Marking..." : "Confirm No-Show"}
        variant="destructive"
        onConfirm={() =>
          handleSimpleAction(() =>
            markNoShowAction(reservation.id, "Customer failed to appear for pickup")
          )
        }
      />

      <ConfirmationDialog
        open={activeDialog === "complete"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title={status === "disputed" ? "Resolve Dispute & Complete" : "Complete Rental Contract"}
        description={
          status === "disputed"
            ? `Resolve dispute on ${reservation.reference || reservation.id} and close the contract. Vehicle will be released to fleet.`
            : `Inspection cleared for ${reservation.reference || reservation.id}. Close the rental contract and release the vehicle.`
        }
        confirmLabel={isPending ? "Completing..." : status === "disputed" ? "Resolve & Complete" : "Complete Rental"}
        variant="default"
        onConfirm={() => handleSimpleAction(() => completeRentalAction(reservation.id))}
      />

      <ConfirmationDialog
        open={activeDialog === "cancel"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
        title="Cancel Reservation"
        description={`Cancel reservation ${reservation.reference || reservation.id} (${reservation.vehicleName} — ${reservation.customerName}). This releases the vehicle back to fleet inventory.`}
        confirmLabel={isPending ? "Cancelling..." : "Confirm Cancellation"}
        variant="destructive"
        onConfirm={() =>
          handleSimpleAction(() =>
            transitionReservationStatusAction(reservation.id, "cancelled", "Cancelled by authorized staff")
          )
        }
      />

      {/* ── Pickup Handover Form ── */}
      <Dialog
        open={activeDialog === "pickup_handover"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiKeyLine className="size-5 text-primary" />
              Vehicle Handover — Start Rental
            </DialogTitle>
            <DialogDescription>
              Record pre-trip inspection for{" "}
              <strong className="text-foreground">
                {reservation.vehicleName} ({reservation.vehiclePlate})
              </strong>{" "}
              before handing keys to {reservation.customerName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="handover-odometer" className="flex items-center gap-1.5 text-xs">
                  <RiSpeedLine className="size-3.5" />
                  Odometer (km)
                </Label>
                <Input
                  id="handover-odometer"
                  type="number"
                  min={0}
                  placeholder="e.g. 12500"
                  value={handoverOdometer}
                  onChange={(e) => setHandoverOdometer(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="handover-fuel" className="flex items-center gap-1.5 text-xs">
                  <RiGasStationLine className="size-3.5" />
                  Fuel Level (%)
                </Label>
                <Input
                  id="handover-fuel"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0–100"
                  value={handoverFuel}
                  onChange={(e) => setHandoverFuel(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Customer Present at Handover</Label>
              <div className="flex gap-3">
                {[
                  { val: true, label: "Yes — Present" },
                  { val: false, label: "No — Remote" },
                ].map(({ val, label }) => (
                  <button
                    key={String(val)}
                    type="button"
                    onClick={() => setHandoverCustomerPresent(val)}
                    className={`flex-1 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                      handoverCustomerPresent === val
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="handover-notes" className="text-xs">
                Notes (Optional)
              </Label>
              <Textarea
                id="handover-notes"
                rows={2}
                placeholder="Pre-existing condition notes, remarks…"
                value={handoverNotes}
                onChange={(e) => setHandoverNotes(e.target.value)}
                className="text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveDialog(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handlePickupHandover}
              disabled={isPending || !handoverOdometer}
              className="gap-1.5"
            >
              {isPending && <RiLoader4Line className="size-4 animate-spin" />}
              {isPending ? "Processing Handover…" : "Confirm Handover"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Vehicle Return Form ── */}
      <Dialog
        open={activeDialog === "vehicle_return"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiCarLine className="size-5 text-primary" />
              Record Vehicle Return
            </DialogTitle>
            <DialogDescription>
              Record return inspection for{" "}
              <strong className="text-foreground">
                {reservation.vehicleName} ({reservation.vehiclePlate})
              </strong>{" "}
              returned by {reservation.customerName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="return-odometer" className="flex items-center gap-1.5 text-xs">
                  <RiSpeedLine className="size-3.5" />
                  Return Odometer (km)
                </Label>
                <Input
                  id="return-odometer"
                  type="number"
                  min={0}
                  placeholder="e.g. 13250"
                  value={returnOdometer}
                  onChange={(e) => setReturnOdometer(e.target.value)}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="return-fuel" className="flex items-center gap-1.5 text-xs">
                  <RiGasStationLine className="size-3.5" />
                  Fuel Level (%)
                </Label>
                <Input
                  id="return-fuel"
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0–100"
                  value={returnFuel}
                  onChange={(e) => setReturnFuel(e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Vehicle Condition</Label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: "no_damage", label: "No Damage" },
                    { value: "existing_noted", label: "Existing Noted" },
                    { value: "new_damage", label: "New Damage" },
                    { value: "needs_review", label: "Needs Review" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setReturnDamageStatus(opt.value)}
                    className={`py-1.5 rounded-md border text-xs font-medium transition-colors ${
                      returnDamageStatus === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-muted-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="return-notes" className="text-xs">
                Inspection Notes (Optional)
              </Label>
              <Textarea
                id="return-notes"
                rows={3}
                placeholder="Damage description, location, severity…"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                className="text-sm resize-none"
              />
            </div>

            {returnDamageStatus === "new_damage" && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                New damage recorded — reservation moves to return inspection phase. Use &quot;Flag Dispute&quot; to escalate.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveDialog(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleVehicleReturn}
              disabled={isPending || !returnOdometer}
              className="gap-1.5"
            >
              {isPending && <RiLoader4Line className="size-4 animate-spin" />}
              {isPending ? "Recording Return…" : "Record Return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dispute Form ── */}
      <Dialog
        open={activeDialog === "dispute"}
        onOpenChange={(open) => !open && setActiveDialog(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RiAlertLine className="size-5 text-amber-500" />
              Flag Reservation Dispute
            </DialogTitle>
            <DialogDescription>
              Flag {reservation.reference || reservation.id} for dispute review. Vehicle remains in inspection
              until resolved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="dispute-reason" className="text-xs">
                Dispute Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="dispute-reason"
                rows={3}
                placeholder="Describe the damage, discrepancy, or grounds for dispute…"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                className="text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setActiveDialog(null)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isPending || !disputeReason.trim()}
              onClick={() =>
                handleSimpleAction(() => flagDisputeAction(reservation.id, disputeReason.trim()))
              }
              className="gap-1.5"
            >
              {isPending && <RiLoader4Line className="size-4 animate-spin" />}
              {isPending ? "Flagging…" : "Flag Dispute"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


