"use client"

import * as React from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

export interface DetailPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  badge?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  size?: "sm" | "md" | "lg"
  className?: string
}

const sizeClasses = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
}

export function DetailPanel({
  open,
  onOpenChange,
  title,
  description,
  badge,
  children,
  footer,
  size = "md",
  className,
}: DetailPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn(
          "w-full flex flex-col p-0 overflow-hidden",
          sizeClasses[size],
          className
        )}
      >
        <SheetHeader className="p-6 pb-4 border-b bg-muted/10">
          <div className="flex items-center gap-2.5">
            <SheetTitle className="text-lg font-semibold tracking-tight">
              {title}
            </SheetTitle>
            {badge && <div>{badge}</div>}
          </div>
          {description && (
            <SheetDescription className="text-xs">
              {description}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {children}
        </div>

        {footer && (
          <SheetFooter className="p-4 border-t bg-muted/20">
            {footer}
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
