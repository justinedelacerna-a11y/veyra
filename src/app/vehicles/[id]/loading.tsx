import * as React from "react"
import { CustomerShell } from "@/components/shell/customer/customer-shell"
import { PageContainer } from "@/components/layout/page-container"
import { Skeleton } from "@/components/ui/skeleton"

export default function VehicleDetailLoading() {
  return (
    <CustomerShell>
      <div className="py-6 sm:py-10 space-y-8">
        <PageContainer>
          {/* Breadcrumb Skeleton */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b">
            <div className="space-y-2">
              <Skeleton className="h-6 w-48 rounded-full" />
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-36" />
            </div>
          </div>

          {/* Main Content Layout Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-96 w-full rounded-2xl" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="rounded-2xl border p-6 space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-12 w-full rounded-lg" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}
