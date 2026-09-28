"use client"

import * as React from "react"
import { AdminSidebar } from "./admin-sidebar"
import { AdminHeader } from "./admin-header"
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export interface AdminShellProps {
  children: React.ReactNode
  className?: string
}

export function AdminShell({ children, className }: AdminShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [isCollapsed, setIsCollapsed] = React.useState(false)

  return (
    <div className="flex min-h-screen bg-muted/20 text-foreground">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <AdminSidebar
          className="sticky top-0 h-screen"
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Mobile Drawer Sidebar */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 p-0 overflow-hidden" showCloseButton={false}>
          <SheetTitle className="sr-only">Operations Navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Admin sidebar menu for navigating operational management modules.
          </SheetDescription>
          <AdminSidebar
            className="w-full h-full border-r-0"
            onItemClick={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Main Administrative Workspace */}
      <div className="flex flex-1 flex-col min-w-0">
        <AdminHeader onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main
          id="admin-main-content"
          className={cn(
            "flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6",
            className
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
