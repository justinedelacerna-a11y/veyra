"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { accountNavItems } from "./account-sidebar"

export function AccountMobileNav({ className }: { className?: string }) {
  const pathname = usePathname()

  return (
    <div
      className={cn(
        "md:hidden w-full overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6",
        className
      )}
      aria-label="Account Mobile Navigation"
    >
      <nav className="flex items-center gap-1.5 min-w-max">
        {accountNavItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 border",
                isActive
                  ? "bg-primary text-primary-foreground border-primary font-semibold shadow-xs"
                  : "bg-card text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <Icon className="size-3.5" data-icon="inline-start" />
              <span>{item.title}</span>
              {item.badge && (
                <span
                  className={cn(
                    "text-[9px] px-1.5 py-0.2 rounded-full font-semibold",
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
    </div>
  )
}
