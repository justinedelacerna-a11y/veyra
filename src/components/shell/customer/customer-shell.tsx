import * as React from "react"
import { CustomerHeader } from "./customer-header"
import { CustomerFooter } from "./customer-footer"
import { cn } from "@/lib/utils"

export interface CustomerShellProps {
  children: React.ReactNode
  className?: string
  hideFooter?: boolean
}

export function CustomerShell({
  children,
  className,
  hideFooter = false,
}: CustomerShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground overflow-x-clip">
      <CustomerHeader />
      <main id="main-content" className={cn("flex-1 w-full", className)}>
        {children}
      </main>
      {!hideFooter && <CustomerFooter />}
    </div>
  )
}
