import * as React from "react"
import Link from "next/link"
import { StatusBadge } from "@/components/common/status-badge"

export interface FooterLink {
  label: string
  href: string
}

export interface FooterSection {
  title: string
  links: FooterLink[]
}

const footerSections: FooterSection[] = [
  {
    title: "Fleet & Vehicles",
    links: [
      { label: "Executive Sedans", href: "/vehicles?category=sedan" },
      { label: "Luxury SUVs", href: "/vehicles?category=suv" },
      { label: "Performance & Electric", href: "/vehicles?category=electric" },
      { label: "Long-Range Tourers", href: "/vehicles?category=touring" },
      { label: "Full Fleet Catalog", href: "/vehicles" },
    ],
  },
  {
    title: "Rental Experience",
    links: [
      { label: "Airport Valet Pickup", href: "/experience/valet" },
      { label: "Contactless Check-In", href: "/experience/contactless" },
      { label: "Comprehensive Protection", href: "/experience/insurance" },
      { label: "Corporate Mobility", href: "/experience/business" },
      { label: "Chauffeur Service", href: "/experience/chauffeur" },
    ],
  },
  {
    title: "Support & Safety",
    links: [
      { label: "24/7 Roadside Assist", href: "/support/roadside" },
      { label: "Reservation FAQ", href: "/support/faq" },
      { label: "Cancellation Policy", href: "/support/cancellation" },
      { label: "Rental Terms & Deposit", href: "/support/terms" },
      { label: "Customer Concierge", href: "/support/contact" },
    ],
  },
  {
    title: "Company & Trust",
    links: [
      { label: "About Veyra", href: "/company/about" },
      { label: "Clean Fleet Commitment", href: "/company/sustainability" },
      { label: "Operating Hub", href: "/locations" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Terms of Service", href: "/legal/terms" },
    ],
  },
]

export function CustomerFooter() {
  return (
    <footer className="w-full border-t bg-muted/20 text-foreground" aria-label="Site Footer">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Brand & Value Proposition Row */}
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5 pb-12 border-b">
          <div className="lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2.5 group outline-none">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-base tracking-wider">
                V
              </div>
              <span className="font-heading text-xl font-bold tracking-tight text-foreground">
                VEYRA
              </span>
            </Link>
            <p className="max-w-sm text-sm text-muted-foreground leading-relaxed">
              Veyra serves customers in Butuan City, Agusan del Norte. Instant reservation, guaranteed models, and prompt local handover.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <StatusBadge status="success" label="Butuan Hub Live 24/7" size="sm" />
              <StatusBadge status="neutral" label="Verified Clean Fleet" size="sm" />
            </div>
          </div>

          {/* Links Grid */}
          <div className="lg:col-span-3 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerSections.map((section) => (
              <div key={section.title} className="flex flex-col gap-3">
                <h4 className="font-heading text-xs font-semibold uppercase tracking-wider text-foreground">
                  {section.title}
                </h4>
                <ul className="flex flex-col gap-2.5">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>&copy; {new Date().getFullYear()} Veyra Mobility Technologies • Butuan City, Agusan del Norte, Philippines. All rights reserved.</span>
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/legal/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/legal/security" className="hover:text-foreground transition-colors">
              Security
            </Link>
            <Link href="/admin" className="text-primary hover:underline font-medium">
              Staff Portal
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
