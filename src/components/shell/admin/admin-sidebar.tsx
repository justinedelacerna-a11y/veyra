"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  RiDashboardLine,
  RiCalendarLine,
  RiCarLine,
  RiUserStarLine,
  RiToolsLine,
  RiScanLine,
  RiMoneyDollarCircleLine,
  RiPriceTag3Line,
  RiBarChartLine,
  RiGroupLine,
  RiShieldCheckLine,
  RiSettings4Line,
  RiArrowRightLine,
  RiArrowLeftRightLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

export interface AdminNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  badgeVariant?: "default" | "warning" | "error"
}

export interface AdminNavGroup {
  title: string
  items: AdminNavItem[]
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: "Operations",
    items: [
      { label: "Dashboard", href: "/admin", icon: RiDashboardLine },
      { label: "Reservations", href: "/admin/reservations", icon: RiCalendarLine, badge: 14 },
      { label: "Fleet Management", href: "/admin/fleet", icon: RiCarLine },
      { label: "Maintenance", href: "/admin/maintenance", icon: RiToolsLine, badge: 3, badgeVariant: "warning" },
      { label: "Inspections", href: "/admin/inspections", icon: RiScanLine },
    ],
  },
  {
    title: "Customers & Commercial",
    items: [
      { label: "Customers", href: "/admin/customers", icon: RiUserStarLine },
      { label: "Payments & Invoicing", href: "/admin/payments", icon: RiMoneyDollarCircleLine },
      { label: "Pricing Rules", href: "/admin/pricing", icon: RiPriceTag3Line },
    ],
  },
  {
    title: "System & Governance",
    items: [
      { label: "Analytics & Reports", href: "/admin/reports", icon: RiBarChartLine },
      { label: "Staff & Roles", href: "/admin/users", icon: RiGroupLine },
      { label: "Audit Logs", href: "/admin/audit", icon: RiShieldCheckLine },
      { label: "Settings", href: "/admin/settings", icon: RiSettings4Line },
    ],
  },
]

export interface AdminSidebarProps {
  className?: string
  onItemClick?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function AdminSidebar({
  className,
  onItemClick,
  isCollapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        "flex h-full flex-col justify-between border-r bg-sidebar text-sidebar-foreground transition-all duration-200",
        isCollapsed ? "w-16" : "w-64",
        className
      )}
      aria-label="Admin Sidebar"
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Brand Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-4">
          <Link
            href="/admin"
            className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring rounded-md"
            onClick={onItemClick}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-bold text-base">
              V
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-heading text-sm font-bold tracking-tight text-sidebar-foreground">
                  VEYRA
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  Operations Hub
                </span>
              </div>
            )}
          </Link>

          {onToggleCollapse && !isCollapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="text-muted-foreground hover:text-foreground hidden lg:flex size-6 items-center justify-center rounded hover:bg-sidebar-accent"
              aria-label="Collapse sidebar"
            >
              <RiArrowLeftRightLine className="size-3.5" />
            </button>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {adminNavGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              {!isCollapsed && (
                <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
                  {group.title}
                </div>
              )}
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    item.href === "/admin"
                      ? pathname === "/admin"
                      : pathname.startsWith(item.href)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onItemClick}
                      title={isCollapsed ? item.label : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-2.5 py-2 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs"
                          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        isCollapsed && "justify-center px-2"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          isActive
                            ? "text-sidebar-primary"
                            : "text-muted-foreground group-hover:text-sidebar-foreground"
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              className={cn(
                                "flex size-5 items-center justify-center rounded-full text-[10px] font-bold shrink-0",
                                item.badgeVariant === "warning"
                                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                                  : item.badgeVariant === "error"
                                    ? "bg-destructive/15 text-destructive"
                                    : "bg-muted text-muted-foreground"
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer / Customer Portal Link */}
      <div className="shrink-0 border-t p-3 bg-sidebar/50">
        {!isCollapsed ? (
          <Link
            href="/"
            className="flex items-center justify-between rounded-md p-2 text-xs font-medium text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <span className="truncate">Exit to Customer Site</span>
            <RiArrowRightLine className="size-3.5" />
          </Link>
        ) : (
          <Link
            href="/"
            title="Exit to Customer Site"
            className="flex size-9 mx-auto items-center justify-center rounded-md text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <RiArrowRightLine className="size-4" />
          </Link>
        )}
      </div>
    </aside>
  )
}
