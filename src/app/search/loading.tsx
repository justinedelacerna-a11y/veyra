import * as React from "react"
import { CustomerShell } from "@/components/shell/customer/customer-shell"
import { PageContainer } from "@/components/layout/page-container"
import { Skeleton } from "@/components/ui/skeleton"

export default function SearchLoading() {
  return (
    <CustomerShell>
      <div className="py-8 sm:py-10 space-y-8">
        <PageContainer>
          {/* Top Search Criteria Summary Skeleton */}
          <div className="rounded-2xl border bg-card/60 p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </div>

          {/* Results Grid Skeleton */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="hidden lg:block lg:col-span-3 rounded-2xl border bg-card/60 p-5 space-y-6">
              <Skeleton className="h-6 w-28" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
              </div>
            </div>

            <div className="lg:col-span-9 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <Skeleton className="h-6 w-40" />
                <Skeleton className="h-9 w-32 rounded-md" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="rounded-2xl border bg-card overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-5 space-y-3">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-10 w-full rounded-lg" />
                    </div>
                    <div className="p-4 border-t flex justify-between items-center">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-8 w-24 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}
