"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CustomerMobileNav, customerNavItems } from "./customer-mobile-nav"
import { Show, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs"
import {
  RiUserLine,
  RiCalendarLine,
  RiHeartLine,
  RiDashboardLine,
  RiArrowRightLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"
import { VeyraLogo } from "@/components/brand/veyra-logo"

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
          <Link href="/" className="flex items-center outline-none group">
            <VeyraLogo
              iconSize="h-8"
              className="text-xl transition-transform group-hover:scale-105"
            />
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
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Unauthenticated: Log In & Sign Up buttons */}
          <Show when="signed-out">
            <SignInButton>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
                Log In
              </Button>
            </SignInButton>
            <SignUpButton>
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">
                Sign Up
              </Button>
            </SignUpButton>
          </Show>

          {/* Authenticated: Clerk UserButton with deep links */}
          <Show when="signed-in">
            <div className="hidden sm:flex items-center gap-2">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "size-8 ring-2 ring-primary/20",
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="Account Overview"
                    labelIcon={<RiUserLine className="size-4" />}
                    href="/account"
                  />
                  <UserButton.Link
                    label="My Reservations"
                    labelIcon={<RiCalendarLine className="size-4" />}
                    href="/account/reservations"
                  />
                  <UserButton.Link
                    label="Saved Vehicles"
                    labelIcon={<RiHeartLine className="size-4" />}
                    href="/account/saved"
                  />
                  <UserButton.Link
                    label="Operations Portal"
                    labelIcon={<RiDashboardLine className="size-4 text-primary" />}
                    href="/admin"
                  />
                </UserButton.MenuItems>
              </UserButton>
            </div>
          </Show>

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
