"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { CustomerMobileNav, customerNavItems } from "./customer-mobile-nav"
import {
  RiUserLine,
  RiCalendarLine,
  RiHeartLine,
  RiDashboardLine,
  RiArrowRightLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

export interface CustomerHeaderProps {
  className?: string
}

export function CustomerHeader({ className }: CustomerHeaderProps) {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = React.useState(false)

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 12)
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-200",
        isScrolled
          ? "bg-background/90 backdrop-blur-md shadow-xs border-b"
          : "bg-background/60 backdrop-blur-sm border-b border-transparent",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Left Navigation */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group outline-none">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base tracking-wider transition-transform group-hover:scale-105">
              V
            </div>
            <span className="font-heading text-xl font-bold tracking-tight text-foreground">
              VEYRA
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden md:flex items-center gap-1"
            aria-label="Main Navigation"
          >
            {customerNavItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "text-primary font-semibold bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/70"
                  )}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right Actions & CTAs */}
        <div className="flex items-center gap-3">
          {/* Mock Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex gap-2"
                  aria-label="Account options"
                />
              }
            >
              <RiUserLine className="size-4 text-muted-foreground" data-icon="inline-start" />
              <span>Account</span>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Guest Account (Mock)</DropdownMenuLabel>
                <DropdownMenuItem render={<Link href="/account" />}>
                  <RiUserLine className="size-4 mr-2" />
                  <span>Account Overview</span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/reservations" />}>
                  <RiCalendarLine className="size-4 mr-2" />
                  <span>My Reservations</span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/saved" />}>
                  <RiHeartLine className="size-4 mr-2" />
                  <span>Saved Vehicles</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                <DropdownMenuLabel>Administration</DropdownMenuLabel>
                <DropdownMenuItem render={<Link href="/admin" />}>
                  <RiDashboardLine className="size-4 mr-2 text-primary" />
                  <span className="font-medium text-primary">Operations Portal</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Primary Action Button */}
          <Link href="/vehicles">
            <Button size="sm" className="hidden sm:inline-flex gap-1.5">
              <span>Find a Car</span>
              <RiArrowRightLine className="size-3.5" data-icon="inline-end" />
            </Button>
          </Link>

          {/* Mobile Navigation Drawer */}
          <CustomerMobileNav />
        </div>
      </div>
    </header>
  )
}
