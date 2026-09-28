"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import {
  RiMenuLine,
  RiCarLine,
  RiMapPinLine,
  RiCustomerServiceLine,
  RiUserLine,
  RiArrowRightLine,
  RiShieldCheckLine,
} from "@remixicon/react"
import { cn } from "@/lib/utils"

export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export const customerNavItems: NavItem[] = [
  { label: "Browse Cars", href: "/vehicles", icon: RiCarLine },
  { label: "Locations", href: "/locations", icon: RiMapPinLine },
  { label: "How It Works", href: "/how-it-works", icon: RiShieldCheckLine },
  { label: "Help & Support", href: "/support", icon: RiCustomerServiceLine },
]

export function CustomerMobileNav() {
  const [open, setOpen] = React.useState(false)
  const pathname = usePathname()

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open navigation menu"
          />
        }
      >
        <RiMenuLine className="size-5" />
      </SheetTrigger>

      <SheetContent side="left" className="w-[300px] sm:w-[360px] p-0 flex flex-col justify-between">
        <div className="flex flex-col">
          <SheetHeader className="p-6 pb-4 border-b text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-lg tracking-wider">
                V
              </div>
              <div className="flex flex-col">
                <SheetTitle className="text-xl font-bold tracking-tight">
                  VEYRA
                </SheetTitle>
                <SheetDescription className="text-xs">
                  Premium Vehicle Mobility
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <nav className="flex flex-col p-4 gap-1" aria-label="Mobile Navigation">
            {customerNavItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-muted"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("size-4", isActive ? "text-primary" : "text-muted-foreground")} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-6 border-t flex flex-col gap-4 bg-muted/30">
          <div className="flex flex-col gap-2">
            <Link href="/vehicles" onClick={() => setOpen(false)}>
              <Button className="w-full justify-between" size="lg">
                <span>Book a Vehicle</span>
                <RiArrowRightLine className="size-4" data-icon="inline-end" />
              </Button>
            </Link>

            <Link href="/account" onClick={() => setOpen(false)}>
              <Button variant="outline" className="w-full justify-start gap-2.5">
                <RiUserLine className="size-4 text-muted-foreground" data-icon="inline-start" />
                <span>My Account</span>
              </Button>
            </Link>
          </div>

          <div className="text-[11px] text-muted-foreground text-center">
            24/7 Concierge Support Available
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
