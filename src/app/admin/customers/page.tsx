"use client"

import * as React from "react"
import Link from "next/link"
import { MOCK_ADMIN_CUSTOMERS } from "@/lib/mock/admin-ops"
import { DataTableWrapper, FilterBar } from "@/components/admin/primitives"
import { StatusBadge } from "@/components/common/status-badge"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RiArrowRightLine } from "@remixicon/react"
import type { StatusType } from "@/components/common/status-badge"

export default function AdminCustomersPage() {
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!search.trim()) return MOCK_ADMIN_CUSTOMERS
    const q = search.toLowerCase()
    return MOCK_ADMIN_CUSTOMERS.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.membershipNumber.toLowerCase().includes(q)
    )
  }, [search])

  return (
    <div className="space-y-6">
      <PageHeader title="Customers" description="Customer registry — reservations, verification status, and account health." />
      <FilterBar
        searchPlaceholder="Search by name, email, or membership number…"
        searchValue={search}
        onSearchChange={setSearch}
        onClear={() => setSearch("")}
        totalCount={filtered.length}
      />
      <DataTableWrapper isEmpty={filtered.length === 0} totalItems={filtered.length} currentPage={1} totalPages={1}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Membership</TableHead>
              <TableHead className="text-right">Rentals</TableHead>
              <TableHead className="text-right">Total Spent</TableHead>
              <TableHead>Verification</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => {
              const verBadge: Record<string, StatusType> = {
                verified: "success", pending: "pending", rejected: "error"
              }
              const docBadge: Record<string, StatusType> = {
                complete: "success", pending: "pending", incomplete: "warning"
              }
              const statusBadge: Record<string, StatusType> = {
                active: "success", restricted: "warning", blocked: "error"
              }
              return (
                <TableRow key={c.id} className="hover:bg-muted/20">
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{c.firstName} {c.lastName}</span>
                      <span className="text-xs text-muted-foreground">{c.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{c.membershipNumber}</span>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">{c.reservationCount}</TableCell>
                  <TableCell className="text-right font-semibold text-sm">
                    {c.totalSpent > 0 ? `${c.currency}${c.totalSpent.toLocaleString()}` : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={verBadge[c.verificationStatus]} label={c.verificationStatus} size="sm" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={docBadge[c.documentStatus]} label={c.documentStatus} size="sm" />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={statusBadge[c.status]} label={c.status} size="sm" />
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/customers/${c.id}`}>
                      <Button size="xs" variant="ghost" className="gap-1 text-xs">
                        <span>Open</span>
                        <RiArrowRightLine className="size-3" data-icon="inline-end" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </DataTableWrapper>
    </div>
  )
}
