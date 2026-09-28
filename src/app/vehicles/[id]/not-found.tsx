import * as React from "react"
import Link from "next/link"
import { CustomerShell } from "@/components/shell/customer/customer-shell"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/common/status-badge"
import { RiCarLine, RiArrowLeftLine } from "@remixicon/react"

export default function VehicleNotFound() {
  return (
    <CustomerShell>
      <div className="py-20 sm:py-28">
        <PageContainer>
          <div className="max-w-md mx-auto text-center space-y-6">
            <div className="flex justify-center">
              <div className="flex size-20 items-center justify-center rounded-3xl bg-muted text-muted-foreground shadow-xs">
                <RiCarLine className="size-10" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-center">
                <StatusBadge status="neutral" label="404 — Not Found" size="sm" />
              </div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Vehicle Not Found
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The requested vehicle is unavailable or does not exist in our active fleet catalog.
              </p>
            </div>

            <div className="pt-2 flex justify-center">
              <Link href="/vehicles">
                <Button variant="outline" className="gap-2">
                  <RiArrowLeftLine className="size-4" data-icon="inline-start" />
                  <span>Browse Vehicles</span>
                </Button>
              </Link>
            </div>
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}
