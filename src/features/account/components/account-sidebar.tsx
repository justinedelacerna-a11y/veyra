"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  RiHome5Line,
  RiCalendarLine,
  RiSteering2Line,
  RiFileList3Line,
  RiUserSettingsLine,
  RiShieldKeyholeLine,
  RiShieldCheckLine,
  RiInformationLine,
} from "@remixicon/react"
import { MOCK_CUSTOMER_PROFILE } from "@/lib/mock/customer"

export interface AccountNavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string; "data-icon"?: string }>
  badge?: string
}

export const accountNavItems: AccountNavItem[] = [
  {
    title: "Overview",
    href: "/account",
    icon: RiHome5Line,
  },
  {
    title: "Reservations",
    href: "/account/reservations",
    icon: RiCalendarLine,
    badge: "1 Active",
  },
  {
    title: "Driver Information",
    href: "/account/driver",
    icon: RiSteering2Line,
  },
  {
    title: "Documents",
    href: "/account/documents",
    icon: RiFileList3Line,
    badge: "1 Pending",
  },
  {
    title: "Profile Settings",
    href: "/account/profile",
    icon: RiUserSettingsLine,
  },
  {
    title: "Security & Access",
    href: "/account/security",
    icon: RiShieldKeyholeLine,
  },
]

export function AccountSidebar({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <aside
      className={cn("w-full md:w-64 lg:w-72 shrink-0 flex flex-col gap-6", className)}
      aria-label="Account Navigation"
    >
      {/* Customer Profile Summary Card */}
      <div className="rounded-xl border bg-card p-5 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-base border border-primary/20">
            {MOCK_CUSTOMER_PROFILE.firstName[0]}
            {MOCK_CUSTOMER_PROFILE.lastName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground truncate text-sm">
                {MOCK_CUSTOMER_PROFILE.firstName} {MOCK_CUSTOMER_PROFILE.lastName}
              </span>
              <RiShieldCheckLine className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-label="Verified Customer" />
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {MOCK_CUSTOMER_PROFILE.email}
            </p>
            <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <span>{MOCK_CUSTOMER_PROFILE.tier}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-muted-foreground">
          <span>Member ID</span>
          <span className="font-mono font-medium text-foreground">{MOCK_CUSTOMER_PROFILE.membershipNumber}</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex flex-col gap-1" aria-label="Account Sections">
        {accountNavItems.map((item) => {
          const Icon = item.icon
          // Handle active state: exact match for /account, prefix match for subpaths
          const isActive =
            item.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "size-4 shrink-0 transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                  data-icon="inline-start"
                />
                <span>{item.title}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    "text-[10px] px-2 py-0.5 rounded-full font-medium tracking-tight",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  )}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Prototype Context Banner */}
      <div className="rounded-lg border border-dashed border-border/80 bg-muted/40 p-4 text-xs text-muted-foreground flex gap-2.5 items-start">
        <RiInformationLine className="size-4 text-muted-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-foreground">Frontend Prototype Mode</p>
          <p className="text-[11px] leading-relaxed">
            Customer account and reservation data is modeled using typed mock entities. Full identity persistence will be connected via Clerk.
          </p>
        </div>
      </div>
    </aside>
  )
}
