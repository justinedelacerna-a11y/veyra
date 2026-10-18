"use client"

import * as React from "react"
import { useActionState } from "react"
import { updateRentalDurationAction, UpdateRentalDurationState } from "@/features/admin/server/settings-actions"
import { Button } from "@/components/ui/button"
import { RiCalendarLine, RiCheckLine, RiAlertLine } from "@remixicon/react"

interface Props {
  initialMinDays: number
  initialMaxDays: number | null
}

export function RentalDurationSettingsForm({ initialMinDays, initialMaxDays }: Props) {
  const initialState: UpdateRentalDurationState = {}
  const [state, formAction, isPending] = useActionState(updateRentalDurationAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Minimum days */}
        <div className="space-y-1.5">
          <label htmlFor="settings-min-days" className="text-xs font-semibold text-foreground">
            Minimum Rental Duration (days)
          </label>
          <input
            id="settings-min-days"
            name="min_days"
            type="number"
            min={1}
            max={365}
            required
            defaultValue={initialMinDays}
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-describedby="min-days-help"
          />
          <p id="min-days-help" className="text-[11px] text-muted-foreground">
            Customers must rent for at least this many days.
          </p>
        </div>

        {/* Maximum days */}
        <div className="space-y-1.5">
          <label htmlFor="settings-max-days" className="text-xs font-semibold text-foreground">
            Maximum Rental Duration (days)
          </label>
          <input
            id="settings-max-days"
            name="max_days"
            type="number"
            min={1}
            defaultValue={initialMaxDays ?? ""}
            placeholder="No limit"
            className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-describedby="max-days-help"
          />
          <p id="max-days-help" className="text-[11px] text-muted-foreground">
            Leave blank for no upper limit.
          </p>
        </div>
      </div>

      {/* Feedback */}
      {state.message && (
        <div
          role="status"
          aria-live="polite"
          className={`flex items-start gap-2 rounded-lg border p-3 text-xs ${
            state.success
              ? "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
              : "border-red-500/30 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
          }`}
        >
          {state.success ? (
            <RiCheckLine className="size-4 shrink-0 mt-0.5" />
          ) : (
            <RiAlertLine className="size-4 shrink-0 mt-0.5" />
          )}
          <span>{state.message}</span>
        </div>
      )}

      <Button
        type="submit"
        size="sm"
        disabled={isPending}
        className="gap-2"
      >
        <RiCalendarLine className="size-3.5" />
        {isPending ? "Saving…" : "Save Duration Settings"}
      </Button>
    </form>
  )
}
