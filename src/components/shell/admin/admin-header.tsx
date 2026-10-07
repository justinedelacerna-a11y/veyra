"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { UserButton } from "@clerk/nextjs"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  RiMenuLine,
  RiNotificationLine,
  RiSearchLine,
  RiUserLine,
  RiLogoutBoxRLine,
  RiShieldCheckLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/common/theme-toggle"

export interface AdminHeaderProps {
  onOpenMobileNav: () => void
  className?: string
}

export function AdminHeader({ onOpenMobileNav, className }: AdminHeaderProps) {
  const pathname = usePathname()

  // Generate dynamic breadcrumb segment
  const segments = pathname.split("/").filter(Boolean)
  const currentSection =
    segments.length > 1
      ? segments[1].charAt(0).toUpperCase() + segments[1].slice(1)
      : "Dashboard"

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b bg-background/95 px-4 sm:px-6 backdrop-blur-md",
        className
      )}
    >
      {/* Left Area: Mobile Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onOpenMobileNav}
          aria-label="Open sidebar menu"
        >
          <RiMenuLine className="size-5" />
        </Button>

        <div className="hidden sm:flex items-center">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink render={<Link href="/admin" />}>
                  Operations
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentSection}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="sm:hidden font-heading font-semibold text-sm">
          {currentSection}
        </div>
      </div>

      {/* Right Area: System Status, Search Placeholder, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* System Health Indicator */}
        <div className="hidden md:flex items-center gap-2 rounded-full border bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Hubs Online</span>
        </div>

        {/* Quick Search Trigger Mock */}
        <button
          type="button"
          className="hidden sm:flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted/70 transition-colors"
          aria-label="Search operational records"
        >
          <RiSearchLine className="size-3.5" />
          <span>Quick search...</span>
          <kbd className="rounded border bg-background px-1.5 py-0.5 text-[10px] font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Notifications Popover Placeholder */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="View notifications"
        >
          <RiNotificationLine className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-primary" />
        </Button>

        {/* Theme Switcher */}
        <ThemeToggle variant="dropdown" />

        {/* Staff User Avatar & Menu */}
        <div className="flex items-center">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: "size-8 ring-2 ring-primary/20",
              },
            }}
          >
            <UserButton.MenuItems>
              <UserButton.Link
                label="Shift Profile"
                labelIcon={<RiUserLine className="size-4" />}
                href="/admin/settings"
              />
              <UserButton.Link
                label="Security & Logs"
                labelIcon={<RiShieldCheckLine className="size-4" />}
                href="/admin/audit"
              />
              <UserButton.Link
                label="Exit Operations"
                labelIcon={<RiLogoutBoxRLine className="size-4" />}
                href="/"
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </header>
  )
}
