"use client"

import * as React from "react"
import Link from "next/link"
import { SignOutButton } from "@clerk/nextjs"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  RiShieldCrossLine,
  RiArrowRightLine,
  RiUserLine,
  RiLogoutBoxRLine,
  RiDashboardLine,
} from "@remixicon/react"

interface AdminAccessDeniedProps {
  email: string
  userType: string
}

export function AdminAccessDenied({ email, userType }: AdminAccessDeniedProps) {
  return (
    <div className="min-h-screen bg-muted/20 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="max-w-md w-full border-border/80 shadow-2xl backdrop-blur-sm bg-background/95">
        <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
          {/* Badge / Shield Icon */}
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-8 ring-destructive/5 animate-pulse">
            <RiShieldCrossLine className="size-8" />
          </div>

          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-foreground">
              Operations Access Restricted
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The Veyra Operations Console is reserved exclusively for authorized branch staff, fleet managers, and administrators.
            </p>
          </div>

          {/* User Details Box */}
          <div className="rounded-lg border bg-muted/40 p-4 text-left space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Signed in as:</span>
              <span className="font-medium text-foreground font-mono truncate max-w-[200px]">{email}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Account Classification:</span>
              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 font-medium text-amber-700 dark:text-amber-400 capitalize">
                <RiUserLine className="size-3" />
                {userType}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Authorization Status:</span>
              <span className="font-medium text-destructive">Unauthorized (403)</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Link
              href="/account"
              className={buttonVariants({ variant: "default", className: "w-full gap-2" })}
            >
              <RiDashboardLine className="size-4" />
              <span>Go to Customer Portal</span>
              <RiArrowRightLine className="size-4 ml-auto" />
            </Link>

            <Link
              href="/vehicles"
              className={buttonVariants({ variant: "outline", className: "w-full gap-2" })}
            >
              <span>Browse Fleet Catalog</span>
            </Link>

            <SignOutButton redirectUrl="/sign-in">
              <button
                type="button"
                className={buttonVariants({
                  variant: "ghost",
                  className: "w-full gap-2 text-muted-foreground hover:text-foreground cursor-pointer",
                })}
              >
                <RiLogoutBoxRLine className="size-4" />
                <span>Sign Out / Switch Account</span>
              </button>
            </SignOutButton>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
