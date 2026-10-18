import * as React from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { CustomerShell } from "@/components/shell/customer"
import { PageContainer } from "@/components/layout"
import { createServiceClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Terms of Service — Veyra Car Rental",
  description:
    "Read Veyra Car Rental's Terms of Service and Customer Agreement before booking a vehicle in Butuan City, Agusan del Norte. Covers eligibility, KYC, pickup addresses, payments, and customer responsibilities.",
  robots: { index: true, follow: true },
}

interface CurrentTermsData {
  version: string
  published_at: string
  summary: string | null
}

async function getPublishedTerms(): Promise<CurrentTermsData> {
  const fallback: CurrentTermsData = {
    version: "v1.0",
    published_at: "2026-10-01T00:00:00.000Z",
    summary: "Initial Terms of Service for Veyra Car Rental, Butuan City.",
  }

  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from("terms_versions")
      .select("version, published_at, summary")
      .eq("is_current", true)
      .maybeSingle()

    if (data) {
      return data as CurrentTermsData
    }
    return fallback
  } catch {
    return fallback
  }
}

const SECTIONS = [
  { id: "1", title: "Introduction and Acceptance of Terms" },
  { id: "2", title: "Customer Eligibility and Driver Requirements" },
  { id: "3", title: "Identity Verification and KYC" },
  { id: "4", title: "Booking and Reservation Confirmation" },
  { id: "5", title: "Rental Duration and Extensions" },
  { id: "6", title: "Pickup and Return Procedures" },
  { id: "7", title: "Customer-Provided Pickup Addresses and Handover" },
  { id: "8", title: "Rental Charges, Deposits, and Payment Methods" },
  { id: "9", title: "Cancellations and Refunds" },
  { id: "10", title: "Late Returns and Additional Charges" },
  { id: "11", title: "Fuel, Vehicle Damage, Traffic Violations, and Penalties" },
  { id: "12", title: "Prohibited Vehicle Use" },
  { id: "13", title: "Customer Responsibilities" },
  { id: "14", title: "Privacy and Handling of Personal Information" },
  { id: "15", title: "Dispute Resolution and Governing Law" },
  { id: "16", title: "Customer Support and Contact Information" },
  { id: "17", title: "Effective Date and Terms Version" },
]

export default async function TermsPage() {
  const termsData = await getPublishedTerms()

  const formattedEffectiveDate = (() => {
    try {
      return new Date(termsData.published_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    } catch {
      return "October 2026"
    }
  })()

  return (
    <CustomerShell>
      <div className="py-12 sm:py-16">
        <PageContainer>
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Header */}
            <header className="space-y-4 pb-6 border-b">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono bg-primary/10 text-primary px-2.5 py-0.5 rounded font-semibold">
                  {termsData.version}
                </span>
                <span>•</span>
                <span>Effective Date: {formattedEffectiveDate}</span>
                <span>•</span>
                <span>Butuan City, Agusan del Norte, Philippines</span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Terms of Service & Customer Agreement
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                These Terms of Service govern your access to and use of Veyra Car Rental vehicles,
                digital booking platforms, and related mobility services in Butuan City, Agusan del
                Norte. By making a reservation or accepting these terms, you enter into a binding
                contract with Veyra Mobility Technologies.
              </p>

              {/* Legal Draft Notice */}
              <div
                role="note"
                className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1.5"
              >
                <div className="font-bold flex items-center gap-1.5">
                  <span>Draft Legal Document Notice</span>
                </div>
                <p className="leading-relaxed">
                  This document serves as Veyra&apos;s active operational draft and customer agreement.
                  Certain specific operational thresholds, surcharges, and fee schedules marked with{" "}
                  <strong className="underline underline-offset-2">[Pending Business Owner Confirmation]</strong>{" "}
                  represent pending policy reviews awaiting formal executive and legal counsel endorsement.
                  Nothing herein should be construed as legal advice.
                </p>
              </div>
            </header>

            {/* Table of Contents */}
            <nav aria-label="Table of Contents" className="rounded-xl border bg-card/60 p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Table of Contents
              </h2>
              <ol className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-xs">
                {SECTIONS.map((sec) => (
                  <li key={sec.id}>
                    <a
                      href={`#section-${sec.id}`}
                      className="text-primary hover:text-primary/80 hover:underline flex items-start gap-1.5"
                    >
                      <span className="font-mono font-semibold text-muted-foreground shrink-0">
                        {sec.id}.
                      </span>
                      <span>{sec.title}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            {/* Sections Container */}
            <div className="space-y-10 text-sm text-foreground leading-relaxed divide-y divide-border/60">

              {/* Section 1 */}
              <section id="section-1" aria-labelledby="heading-1" className="pt-8 first:pt-0">
                <h2 id="heading-1" className="font-heading text-xl font-bold mb-3 text-foreground">
                  1. Introduction and Acceptance of Terms
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    These Terms of Service constitute a legally enforceable customer rental agreement
                    between you (&ldquo;Customer&rdquo;, &ldquo;Renter&rdquo;, or &ldquo;You&rdquo;) and
                    Veyra Mobility Technologies (&ldquo;Veyra&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;,
                    or &ldquo;our&rdquo;), operating within Butuan City, Agusan del Norte, Philippines.
                  </p>
                  <p>
                    By initiating, completing, or accepting a vehicle booking through our web application,
                    you represent and warrant that you have read, understood, and agreed to be bound by all
                    conditions set forth herein. If you do not agree with any provision of these terms,
                    you must not proceed with vehicle reservation or operation.
                  </p>
                  <p>
                    Acceptance is cryptographically recorded at the time of reservation submission. No
                    booking may be finalized without explicit, un-coerced confirmation by the authenticated
                    primary renter.
                  </p>
                </div>
              </section>

              {/* Section 2 */}
              <section id="section-2" aria-labelledby="heading-2" className="pt-8">
                <h2 id="heading-2" className="font-heading text-xl font-bold mb-3 text-foreground">
                  2. Customer Eligibility and Driver Requirements
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    To qualify as an authorized driver for any Veyra rental vehicle, the following
                    mandatory eligibility requirements must be met:
                  </p>
                  <ul className="space-y-2 list-disc list-inside ml-2">
                    <li>
                      <strong className="text-foreground">Minimum Age:</strong> The primary renter and any
                      permitted additional drivers must be at least <strong>21 years of age</strong> at the
                      time of vehicle pickup.
                    </li>
                    <li>
                      <strong className="text-foreground">Valid Driver&apos;s License:</strong> The driver
                      must possess an original, valid, non-expired driver&apos;s license issued by the Land
                      Transportation Office (LTO) of the Philippines, with appropriate restriction codes
                      authorizing operation of the reserved vehicle category (manual or automatic transmission).
                    </li>
                    <li>
                      <strong className="text-foreground">Physical Verification:</strong> The physical
                      driver&apos;s license must be presented in person at handover. Digital photos,
                      photocopies, or expired renewals are not acceptable.
                    </li>
                    <li>
                      <strong className="text-foreground">Additional Drivers:</strong> Any person other than
                      the primary renter who operates the vehicle must be explicitly registered and undergo
                      identical identity clearance prior to handover.
                    </li>
                  </ul>
                  <div className="rounded-lg bg-muted/40 p-3 text-xs italic text-muted-foreground border">
                    [Pending Business Owner Confirmation: Maximum allowable driver age cap, acceptance
                    criteria and translation rules for foreign/International Driving Permits (IDP), and
                    additional driver registration surcharge.]
                  </div>
                </div>
              </section>

              {/* Section 3 */}
              <section id="section-3" aria-labelledby="heading-3" className="pt-8">
                <h2 id="heading-3" className="font-heading text-xl font-bold mb-3 text-foreground">
                  3. Identity Verification and KYC
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    In compliance with Philippine anti-fraud regulations and fleet security standards,
                    Veyra enforces a mandatory Know Your Customer (KYC) clearance workflow before any
                    reservation can be confirmed.
                  </p>
                  <ul className="space-y-2 list-disc list-inside ml-2">
                    <li>Clear, un-obstructed front and back images of the valid driver&apos;s license.</li>
                    <li>
                      A secondary government-issued photo ID (e.g., PhilSys National ID, Philippine Passport,
                      UMID, PRC ID, or SSS card).
                    </li>
                    <li>A real-time facial verification selfie to prevent identity impersonation.</li>
                  </ul>
                  <p>
                    All identity documentation is stored in encrypted, access-restricted cloud storage
                    backed by Supabase and audited regularly. KYC reviews are completed by Veyra operations
                    staff.
                  </p>
                  <p className="text-destructive dark:text-red-400 font-medium">
                    Submitting forged, digitally altered, or fraudulent identity credentials constitutes a
                    criminal offense under Philippine law. Any such attempt will result in immediate booking
                    cancellation, permanent blacklisting, forfeiture of deposits, and referral to the
                    Philippine National Police (PNP) and LTO.
                  </p>
                </div>
              </section>

              {/* Section 4 */}
              <section id="section-4" aria-labelledby="heading-4" className="pt-8">
                <h2 id="heading-4" className="font-heading text-xl font-bold mb-3 text-foreground">
                  4. Booking and Reservation Confirmation
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    A reservation is finalized and legally binding only upon the fulfillment of all of the
                    following conditions:
                  </p>
                  <ol className="space-y-2 list-decimal list-inside ml-2">
                    <li>Completion and staff approval of customer KYC identity clearance.</li>
                    <li>Explicit acceptance of the current published Terms of Service.</li>
                    <li>Receipt of payment or confirmation under our Pay at Pickup deferred settlement policy.</li>
                    <li>Issuance of an official Veyra reservation reference code (e.g., <code>VYR-2026-XXXX</code>).</li>
                  </ol>
                  <p>
                    <strong className="text-foreground">Guaranteed Model Commitment:</strong> Veyra operates
                    a strict zero-substitution model guarantee. The vehicle year, make, and model confirmed
                    in your reservation is the exact vehicle provided at pickup, barring extraordinary mechanical
                    force majeure.
                  </p>
                  <p>
                    <strong className="text-foreground">Authoritative Pricing:</strong> All quotes, daily rates,
                    add-on charges, and security deposits are calculated exclusively server-side in Philippine
                    Peso (₱ PHP) and are inclusive of standard Value-Added Tax (VAT).
                  </p>
                </div>
              </section>

              {/* Section 5 */}
              <section id="section-5" aria-labelledby="heading-5" className="pt-8">
                <h2 id="heading-5" className="font-heading text-xl font-bold mb-3 text-foreground">
                  5. Rental Duration and Extensions
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    Rental durations are calculated in 24-hour cycles starting from the scheduled pickup
                    handover time. Minimum and maximum booking durations are configured by Veyra system
                    administrators (standard operational range: 1 to 30 days) and enforced authoritatively
                    on quote calculation and booking creation.
                  </p>
                  <p>
                    If you wish to extend an ongoing rental, you must submit an extension request through your
                    customer account or contact Veyra customer concierge prior to the scheduled return time.
                    Extensions are subject to vehicle availability, schedule clearance, and pre-payment of the
                    extended rental period.
                  </p>
                  <div className="rounded-lg bg-muted/40 p-3 text-xs italic text-muted-foreground border">
                    [Pending Business Owner Confirmation: Extension notice window (e.g. minimum 6 or 12 hours
                    before scheduled return), discount schedules for extended rentals, and maximum cumulative rental
                    limit per single booking agreement.]
                  </div>
                </div>
              </section>

              {/* Section 6 */}
              <section id="section-6" aria-labelledby="heading-6" className="pt-8">
                <h2 id="heading-6" className="font-heading text-xl font-bold mb-3 text-foreground">
                  6. Pickup and Return Procedures
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Handover Inspection:</strong> At pickup, a designated
                    Veyra field concierge conducts a multi-point digital inspection alongside the customer.
                    Existing exterior blemishes, odometer reading, and fuel level are logged and signed off on
                    the digital inspection manifest.
                  </p>
                  <p>
                    <strong className="text-foreground">Standard Barangay Hubs:</strong> Veyra maintains eight
                    official operating barangay hubs across Butuan City:
                  </p>
                  <p className="text-xs font-mono bg-muted/30 p-2.5 rounded-lg border">
                    Libertad • Bancasi Airport • Villa Kananga • Doongan • San Vicente • Holy Redeemer • Ambago • Baan KM 3
                  </p>
                  <p>
                    <strong className="text-foreground">Return Check-in:</strong> The vehicle must be returned
                    to the designated return station on or before the agreed return time. Staff will perform a
                    closing inspection comparing odometer, fuel status, and physical condition against the initial
                    manifest.
                  </p>
                </div>
              </section>

              {/* Section 7 */}
              <section id="section-7" aria-labelledby="heading-7" className="pt-8">
                <h2 id="heading-7" className="font-heading text-xl font-bold mb-3 text-foreground">
                  7. Customer-Provided Pickup Addresses and Handover
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    As a convenience to travelers, Veyra supports customer-provided manual pickup addresses
                    within our supported service area across Butuan City, Agusan del Norte.
                  </p>
                  <ul className="space-y-2 list-disc list-inside ml-2">
                    <li>
                      <strong className="text-foreground">Service Boundary:</strong> Handover addresses must be
                      located within recognized barangays of Butuan City, Agusan del Norte. Addresses outside
                      this territory will be rejected during address validation.
                    </li>
                    <li>
                      <strong className="text-foreground">Address Precision:</strong> Customers must provide a
                      complete street address or hotel/residence name, a prominent landmark, and a reachable
                      Philippine contact number.
                    </li>
                    <li>
                      <strong className="text-foreground">Accessibility:</strong> The specified handover point
                      must be safely accessible by standard two-wheel-drive passenger vehicles and compliant with
                      local parking regulations.
                    </li>
                    <li>
                      <strong className="text-foreground">Physical Presence:</strong> The primary driver must be
                      physically present at the requested location with original physical license and ID at the
                      scheduled delivery window.
                    </li>
                  </ul>
                  <div className="rounded-lg bg-muted/40 p-3 text-xs italic text-muted-foreground border">
                    [Pending Business Owner Confirmation: Doorstep delivery fee schedule, remote barangay delivery
                    surcharges, and security clearance protocol for gated subdivisions or private condominium compounds.]
                  </div>
                </div>
              </section>

              {/* Section 8 */}
              <section id="section-8" aria-labelledby="heading-8" className="pt-8">
                <h2 id="heading-8" className="font-heading text-xl font-bold mb-3 text-foreground">
                  8. Rental Charges, Deposits, and Payment Methods
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Rental Fees:</strong> Comprise base daily rate, optional
                    protection packages, equipment add-ons, and applicable taxes.
                  </p>
                  <p>
                    <strong className="text-foreground">Refundable Security Deposit:</strong> A security deposit
                    is mandatory for all rentals. It is held as a guarantee against potential damages, traffic
                    penalties, fuel deficiencies, or extra cleaning fees. The deposit balance is returned to the
                    renter following successful return inspection and reconciliation.
                  </p>
                  <p>
                    <strong className="text-foreground">Payment Methods:</strong> Veyra supports Pay at Pickup
                    (cash or portable card POS terminal upon vehicle handover), credit/debit card, and GCash/Maya
                    digital payments when digital gateway integration is active.
                  </p>
                  <div className="rounded-lg bg-muted/40 p-3 text-xs italic text-muted-foreground border">
                    [Pending Business Owner Confirmation: Explicit security deposit schedule per vehicle category
                    (sedan, SUV, premium), security deposit release turnaround window (e.g. within 24 to 72 business hours),
                    and accepted international card processing fees.]
                  </div>
                </div>
              </section>

              {/* Section 9 */}
              <section id="section-9" aria-labelledby="heading-9" className="pt-8">
                <h2 id="heading-9" className="font-heading text-xl font-bold mb-3 text-foreground">
                  9. Cancellations and Refunds
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    Customers may cancel reservations through their online account portal or by contacting
                    concierge support. The applicable cancellation and refund schedule is outlined below:
                  </p>
                  <ul className="space-y-2 list-disc list-inside ml-2">
                    <li>
                      <strong className="text-foreground">Free Cancellation (24+ Hours Notice):</strong>{" "}
                      Cancellations submitted more than 24 hours prior to the scheduled pickup time receive a full
                      refund of prepaid rental amounts.
                    </li>
                    <li>
                      <strong className="text-foreground">Short Notice Cancellations (&lt;24 Hours):</strong>{" "}
                      Cancellations made within 24 hours of scheduled pickup are subject to administrative fees.
                    </li>
                    <li>
                      <strong className="text-foreground">No-Show Policy:</strong> If a customer fails to arrive
                      within 2 hours of the scheduled pickup time without prior notice, the reservation is marked
                      as No-Show and cancelled.
                    </li>
                  </ul>
                  <div className="rounded-lg bg-muted/40 p-3 text-xs italic text-muted-foreground border">
                    [Pending Business Owner Confirmation: Exact cancellation charge percentage for short-notice
                    cancellations, refund processing timeline for digital card and e-wallet transactions, and no-show
                    fee schedule.]
                  </div>
                </div>
              </section>

              {/* Section 10 */}
              <section id="section-10" aria-labelledby="heading-10" className="pt-8">
                <h2 id="heading-10" className="font-heading text-xl font-bold mb-3 text-foreground">
                  10. Late Returns and Additional Charges
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    Prompt vehicle returns are critical to maintaining reserved schedules for subsequent customers.
                    Vehicles must be returned to the agreed return station at or before the designated return timestamp.
                  </p>
                  <p>
                    Unauthorized late returns that impact subsequent bookings or require staff recovery will incur
                    additional hourly or full-day charges plus operational recovery surcharges.
                  </p>
                  <div className="rounded-lg bg-muted/40 p-3 text-xs italic text-muted-foreground border">
                    [Pending Business Owner Confirmation: Standard late return grace period (e.g. 30 or 60 minutes),
                    hourly penalty rate vs full day rate conversion, and vehicle recovery fee for unreturned units.]
                  </div>
                </div>
              </section>

              {/* Section 11 */}
              <section id="section-11" aria-labelledby="heading-11" className="pt-8">
                <h2 id="heading-11" className="font-heading text-xl font-bold mb-3 text-foreground">
                  11. Fuel, Vehicle Damage, Traffic Violations, and Penalties
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    <strong className="text-foreground">Fuel Policy (Full-to-Full):</strong> The vehicle is
                    provided with a full tank of manufacturer-specified fuel. The renter must return the vehicle
                    with a full tank. If returned with less than a full tank, refueling charges will be deducted from
                    the security deposit.
                  </p>
                  <p>
                    <strong className="text-foreground">Vehicle Damage:</strong> The customer is liable for any
                    loss, dent, collision impact, scratched bodywork, broken glass, wheel curb damage, or interior
                    tear not recorded on the pickup manifest. Damage repair costs will be deducted from the security
                    deposit, and any excess will be invoiced to the renter.
                  </p>
                  <p>
                    <strong className="text-foreground">Traffic Violations & Fines:</strong> The primary renter is
                    solely responsible for all traffic fines, speeding citations, illegal parking tickets, and
                    ordinance violation notices issued by the LTO, MMDA, or Butuan City traffic authorities during
                    the rental window.
                  </p>
                  <div className="rounded-lg bg-muted/40 p-3 text-xs italic text-muted-foreground border">
                    [Pending Business Owner Confirmation: Per-liter refueling service fee, excessive interior detailing
                    surcharge for smoke or pet contamination, and administrative processing fee per unpaid traffic ticket.]
                  </div>
                </div>
              </section>

              {/* Section 12 */}
              <section id="section-12" aria-labelledby="heading-12" className="pt-8">
                <h2 id="heading-12" className="font-heading text-xl font-bold mb-3 text-foreground">
                  12. Prohibited Vehicle Use
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    The vehicle must not be used, operated, or driven in any of the following prohibited manners:
                  </p>
                  <ul className="space-y-2 list-disc list-inside ml-2">
                    <li>
                      Outside the authorized geographic boundaries of Agusan del Norte without prior written consent
                      from Veyra fleet operations.
                    </li>
                    <li>
                      By any individual other than the primary renter or formally approved additional driver.
                    </li>
                    <li>
                      Under the influence of alcohol, drugs, narcotics, or any substance impairing cognitive or
                      motor function (Republic Act No. 10586).
                    </li>
                    <li>
                      For racing, speed trials, drag tests, off-road trails, river crossings, or unpaved mountain roads.
                    </li>
                    <li>
                      For transporting passengers or cargo for commercial compensation (e.g. unlicensed TNVS or courier hire).
                    </li>
                    <li>
                      For towing, pushing, or propelling any trailer, vehicle, or other object.
                    </li>
                    <li>
                      For transporting illegal contraband, hazardous chemicals, firearms, or illegal wildlife.
                    </li>
                    <li>Subleasing, re-renting, pledging, or assigning the vehicle to third parties.</li>
                    <li>Smoking, vaping, or burning substances inside the vehicle cabin.</li>
                  </ul>
                  <p className="text-destructive font-medium">
                    Engaging in prohibited uses constitutes a material breach entitling Veyra to immediately
                    repossess the vehicle without notice, forfeit all security deposits, and pursue full civil and
                    criminal redress.
                  </p>
                </div>
              </section>

              {/* Section 13 */}
              <section id="section-13" aria-labelledby="heading-13" className="pt-8">
                <h2 id="heading-13" className="font-heading text-xl font-bold mb-3 text-foreground">
                  13. Customer Responsibilities
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>During the entire possession period, the renter agrees to:</p>
                  <ul className="space-y-2 list-disc list-inside ml-2">
                    <li>
                      Operate the vehicle in full compliance with Republic Act No. 4136 (Land Transportation and
                      Traffic Code) and local ordinances of Butuan City.
                    </li>
                    <li>
                      Ensure the vehicle is secured, windows closed, and doors locked whenever parked or unattended.
                    </li>
                    <li>
                      Safeguard the vehicle keys, registration documents, and emergency equipment (spare tire, jack,
                      triangles) at all times.
                    </li>
                    <li>
                      Immediately cease driving and contact Veyra roadside support upon any engine warning lamp,
                      abnormal noise, or suspected tire puncture.
                    </li>
                    <li>
                      In the event of an accident or collision, promptly notify Veyra within one (1) hour, secure a
                      formal police investigation report and barangay blotter, and refrain from admitting liability
                      or settling with third parties without Veyra&apos;s authorization.
                    </li>
                  </ul>
                </div>
              </section>

              {/* Section 14 */}
              <section id="section-14" aria-labelledby="heading-14" className="pt-8">
                <h2 id="heading-14" className="font-heading text-xl font-bold mb-3 text-foreground">
                  14. Privacy and Handling of Personal Information
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    Veyra is committed to protecting your personal data in strict compliance with the
                    <strong className="text-foreground"> Data Privacy Act of 2012 (Republic Act No. 10173)</strong>{" "}
                    of the Philippines.
                  </p>
                  <p>
                    <strong className="text-foreground">Data Collected:</strong> Personal identification details,
                    driver&apos;s license photos, contact information, booking itineraries, and cryptographic
                    acceptance tokens are collected solely for customer identity verification, contract execution,
                    fleet security, and regulatory compliance.
                  </p>
                  <p>
                    <strong className="text-foreground">IP Hashing:</strong> To protect customer privacy, our
                    servers do not store full raw IP addresses merely for recording terms acceptance. We record a
                    one-way cryptographic SHA-256 hash of your network address alongside the timestamp.
                  </p>
                  <p>
                    We do not sell, monetize, or disclose your personal information to third-party advertisers.
                    Data is disclosed only to law enforcement or court authorities upon receipt of a lawful subpoena
                    or warrant.
                  </p>
                </div>
              </section>

              {/* Section 15 */}
              <section id="section-15" aria-labelledby="heading-15" className="pt-8">
                <h2 id="heading-15" className="font-heading text-xl font-bold mb-3 text-foreground">
                  15. Dispute Resolution and Governing Law
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    These Terms of Service and any rental contract entered into with Veyra shall be governed by
                    and construed in accordance with the substantive laws of the Republic of the Philippines.
                  </p>
                  <p>
                    In the event of any controversy, claim, or dispute arising out of or relating to these terms,
                    the parties agree to first attempt resolution through good-faith informal negotiations for a
                    period of not less than thirty (30) calendar days.
                  </p>
                  <p>
                    Should informal resolution fail, the dispute shall be submitted to the exclusive jurisdiction
                    of the proper courts of <strong className="text-foreground">Butuan City, Agusan del Norte</strong>,
                    to the exclusion of all other courts and venues.
                  </p>
                </div>
              </section>

              {/* Section 16 */}
              <section id="section-16" aria-labelledby="heading-16" className="pt-8">
                <h2 id="heading-16" className="font-heading text-xl font-bold mb-3 text-foreground">
                  16. Customer Support and Contact Information
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <p>
                    For inquiries, roadside assistance, reservation modifications, or dispute notices, you may reach
                    our 24/7 Butuan Operations Team through the following channels:
                  </p>
                  <div className="rounded-xl border bg-card/60 p-4 space-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block font-medium">Operations Center:</span>
                      <span className="font-semibold text-foreground">
                        Veyra Mobility Technologies • Butuan City, Agusan del Norte, Philippines
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-medium">In-App Support:</span>
                      <Link href="/support" className="text-primary hover:underline font-semibold">
                        Visit Customer Support & FAQ Portal (/support)
                      </Link>
                    </div>
                    <div>
                      <span className="text-muted-foreground block font-medium">Operating Hub Locations:</span>
                      <Link href="/locations" className="text-primary hover:underline font-semibold">
                        View 8 Butuan City Barangay Hubs (/locations)
                      </Link>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 17 */}
              <section id="section-17" aria-labelledby="heading-17" className="pt-8">
                <h2 id="heading-17" className="font-heading text-xl font-bold mb-3 text-foreground">
                  17. Effective Date and Terms Version
                </h2>
                <div className="space-y-3 text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold bg-muted px-2.5 py-1 rounded border">
                      Version: {termsData.version}
                    </span>
                    <span className="text-xs">
                      Effective Date: <strong className="text-foreground">{formattedEffectiveDate}</strong>
                    </span>
                  </div>
                  <p>
                    Veyra reserves the right to revise or amend these Terms of Service at any time. When material
                    updates are published, the version identifier will be incremented.
                  </p>
                  <p>
                    Existing completed reservations remain governed by the terms version in effect at the moment of
                    their acceptance. Customers creating subsequent bookings will be required to review and accept the
                    newest published version.
                  </p>
                </div>
              </section>

            </div>

            {/* Footer Navigation */}
            <footer className="pt-8 border-t space-y-4 text-xs text-muted-foreground">
              <p>
                Version <strong className="font-mono text-foreground">{termsData.version}</strong> — {formattedEffectiveDate}.
                Document draft for operational use.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link href="/booking" className="text-primary hover:underline font-medium">
                  Book a Vehicle
                </Link>
                <Link href="/support" className="hover:text-foreground underline underline-offset-2">
                  Customer Support
                </Link>
                <Link href="/" className="hover:text-foreground underline underline-offset-2">
                  Back to Home
                </Link>
              </div>
            </footer>
          </div>
        </PageContainer>
      </div>
    </CustomerShell>
  )
}
