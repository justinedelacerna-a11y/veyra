import * as React from "react"
import { Metadata } from "next"
import { CustomerShell } from "@/components/shell/customer/customer-shell"
import { PageContainer } from "@/components/layout/page-container"
import { AccountSidebar } from "@/features/account/components/account-sidebar"
import { AccountMobileNav } from "@/features/account/components/account-mobile-nav"

export const metadata: Metadata = {
  title: "My Account — Veyra",
  description: "Manage your premium reservations, driver profile, documents, and preferences.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CustomerShell>
      <div className="py-6 sm:py-10">
        <PageContainer>
          {/* Mobile Tab Navigation */}
          <AccountMobileNav className="mb-6" />

          {/* Desktop Two-Column Layout */}
          <div className="flex flex-col md:flex-row gap-8 lg:gap-10 items-start">
            <AccountSidebar className="hidden md:flex" />
            <main className="flex-1 min-w-0 w-full" id="account-main">
              {children}
            </main>
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}
