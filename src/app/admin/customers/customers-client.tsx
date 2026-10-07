"use client"

import * as React from "react"
import Link from "next/link"
import { AdminCustomerRecord } from "@/features/admin/types"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RiArrowRightLine } from "@remixicon/react"
import type { StatusType } from "@/components/common/status-badge"
import { useRealtimeRefresh } from "@/lib/supabase/realtime"
import { RealtimeIndicator } from "@/components/admin/realtime-indicator"

const CUSTOMER_TABLES = [
  { table: "customers" },
  { table: "customer_documents" },
] as const

interface CustomersClientProps {
  initialCustomers: AdminCustomerRecord[]
}

export function CustomersClient({ initialCustomers }: CustomersClientProps) {
  const [search, setSearch] = React.useState("")
  const realtimeStatus = useRealtimeRefresh({
    channelName: "admin-customers",
    tables: CUSTOMER_TABLES as unknown as { table: string }[],
  })

  const filtered = React.useMemo(() => {
    if (!search.trim()) return initialCustomers
    const q = search.toLowerCase()
    return initialCustomers.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    )
  }, [initialCustomers, search])

  const verBadge: Record<string, StatusType> = {
    verified: "success",
    pending: "pending",
    rejected: "error",
  }
  const docBadge: Record<string, StatusType> = {
    complete: "success",
    pending: "pending",
    incomplete: "warning",
  }
  const statusBadge: Record<string, StatusType> = {
    active: "success",
    restricted: "warning",
    blocked: "error",
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Management"
        description="Live customer registry — reservations, driver license records, and account status."
        actions={<RealtimeIndicator status={realtimeStatus} />}
      />
      <FilterBar
        searchPlaceholder="Search by name, email, phone, or UUID…"
        searchValue={search}
        onSearchChange={setSearch}
        onClear={() => setSearch("")}
        totalCount={filtered.length}
      />
      <DataTableWrapper
        isEmpty={filtered.length === 0}
        emptyTitle="No customers found"
        emptyDescription="Customer records registered in Supabase will be displayed here."
        totalItems={filtered.length}
        currentPage={1}
        totalPages={1}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone / Contact</TableHead>
              <TableHead className="text-right">Rentals</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id} className="hover:bg-muted/20">
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{c.firstName} {c.lastName}</span>
                    <span className="text-xs text-muted-foreground">{c.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-xs font-mono">{c.phone || "—"}</span>
                </TableCell>
                <TableCell className="text-right font-semibold text-sm">{c.reservationCount}</TableCell>
                <TableCell className="text-right font-semibold text-sm">
                  {c.totalSpent > 0 ? `₱${c.totalSpent.toLocaleString()}` : "—"}
                </TableCell>
                <TableCell>
                  <StatusBadge status={verBadge[c.verificationStatus] || "neutral"} label={c.verificationStatus} size="sm" />
                </TableCell>
                <TableCell>
                  <StatusBadge status={docBadge[c.documentStatus] || "neutral"} label={c.documentStatus} size="sm" />
                </TableCell>
                <TableCell>
                  <StatusBadge status={statusBadge[c.status] || "neutral"} label={c.status} size="sm" />
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/admin/customers/${c.id}`}>
                    <Button size="xs" variant="ghost" className="gap-1 text-xs">
                      <span>Open</span>
                      <RiArrowRightLine className="size-3" data-icon="inline-end" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableWrapper>
    </div>
  )
}
