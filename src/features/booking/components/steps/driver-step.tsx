"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useBooking } from "../../context/booking-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field"
import {
  RiUserLine,
  RiMailLine,
  RiIdCardLine,
  RiShieldCheckLine,
  RiArrowRightLine,
  RiArrowLeftLine,
} from "@remixicon/react"

export function DriverStep() {
  const router = useRouter()
  const {
    draft,
    updateDriver,
    validateDriverStep,
    driverErrors,
  } = useBooking()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateDriverStep()) {
      router.push("/booking/review")
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Step Title & Context */}
      <div className="space-y-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          Step 03 of 06
        </span>
        <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          Primary Driver Information
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Enter driver credentials required for valet handover and insurance policy scheduling.
        </p>
      </div>

      {/* Reassurance Notice */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex items-start gap-3 text-xs text-muted-foreground">
        <RiShieldCheckLine className="size-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-foreground block">
            Direct Handover Verification
          </span>
          <span>
            Presenting the physical driver license corresponding to these details allows airport valet staff to release keys directly with zero counter paperwork.
          </span>
        </div>
      </div>

      <FieldGroup className="space-y-6">
        {/* Section 1: Personal Details */}
        <div className="space-y-4 rounded-2xl border bg-card/60 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <RiUserLine className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Personal Information
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field data-invalid={!!driverErrors.firstName || undefined}>
              <FieldLabel htmlFor="driver-first-name">First Name *</FieldLabel>
              <Input
                id="driver-first-name"
                placeholder="e.g. Maria"
                value={draft.driver.firstName}
                onChange={(e) => updateDriver("firstName", e.target.value)}
                aria-invalid={!!driverErrors.firstName}
              />
              {driverErrors.firstName && (
                <FieldError>{driverErrors.firstName}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!driverErrors.lastName || undefined}>
              <FieldLabel htmlFor="driver-last-name">Last Name *</FieldLabel>
              <Input
                id="driver-last-name"
                placeholder="e.g. Santos"
                value={draft.driver.lastName}
                onChange={(e) => updateDriver("lastName", e.target.value)}
                aria-invalid={!!driverErrors.lastName}
              />
              {driverErrors.lastName && (
                <FieldError>{driverErrors.lastName}</FieldError>
              )}
            </Field>

            <Field
              className="sm:col-span-2"
              data-invalid={!!driverErrors.birthDate || undefined}
            >
              <FieldLabel htmlFor="driver-birthdate">
                Date of Birth (Must be at least 21 years old) *
              </FieldLabel>
              <Input
                id="driver-birthdate"
                type="date"
                value={draft.driver.birthDate}
                onChange={(e) => updateDriver("birthDate", e.target.value)}
                aria-invalid={!!driverErrors.birthDate}
              />
              {driverErrors.birthDate && (
                <FieldError>{driverErrors.birthDate}</FieldError>
              )}
            </Field>
          </div>
        </div>

        {/* Section 2: Contact Details */}
        <div className="space-y-4 rounded-2xl border bg-card/60 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <RiMailLine className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Contact Details
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field data-invalid={!!driverErrors.email || undefined}>
              <FieldLabel htmlFor="driver-email">Email Address *</FieldLabel>
              <Input
                id="driver-email"
                type="email"
                placeholder="maria.santos@example.com"
                value={draft.driver.email}
                onChange={(e) => updateDriver("email", e.target.value)}
                aria-invalid={!!driverErrors.email}
              />
              {driverErrors.email && (
                <FieldError>{driverErrors.email}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!driverErrors.phone || undefined}>
              <FieldLabel htmlFor="driver-phone">Mobile Phone *</FieldLabel>
              <Input
                id="driver-phone"
                type="tel"
                placeholder="+63 917 123 4567"
                value={draft.driver.phone}
                onChange={(e) => updateDriver("phone", e.target.value)}
                aria-invalid={!!driverErrors.phone}
              />
              {driverErrors.phone && (
                <FieldError>{driverErrors.phone}</FieldError>
              )}
            </Field>
          </div>
        </div>

        {/* Section 3: Driver License Credentials */}
        <div className="space-y-4 rounded-2xl border bg-card/60 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-2 pb-2 border-b border-border/60">
            <RiIdCardLine className="size-4 text-primary" />
            <h2 className="text-sm font-bold text-foreground">
              Driver License Credentials
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field data-invalid={!!driverErrors.licenseNumber || undefined}>
              <FieldLabel htmlFor="driver-license-no">
                Driver License Number *
              </FieldLabel>
              <Input
                id="driver-license-no"
                placeholder="e.g. N01-12-123456"
                value={draft.driver.licenseNumber}
                onChange={(e) => updateDriver("licenseNumber", e.target.value)}
                aria-invalid={!!driverErrors.licenseNumber}
              />
              {driverErrors.licenseNumber && (
                <FieldError>{driverErrors.licenseNumber}</FieldError>
              )}
            </Field>

            <Field data-invalid={!!driverErrors.licenseCountry || undefined}>
              <FieldLabel htmlFor="driver-license-country">
                Issuing Country / Region *
              </FieldLabel>
              <Input
                id="driver-license-country"
                placeholder="Philippines"
                value={draft.driver.licenseCountry}
                onChange={(e) => updateDriver("licenseCountry", e.target.value)}
                aria-invalid={!!driverErrors.licenseCountry}
              />
              {driverErrors.licenseCountry && (
                <FieldError>{driverErrors.licenseCountry}</FieldError>
              )}
            </Field>

            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="driver-special-requests">
                Special Handover Requests (Optional)
              </FieldLabel>
              <Textarea
                id="driver-special-requests"
                rows={3}
                placeholder="Flight number, terminal arrival details, or preferred child seat positioning..."
                value={draft.driver.specialRequests || ""}
                onChange={(e) => updateDriver("specialRequests", e.target.value)}
              />
            </Field>
          </div>
        </div>
      </FieldGroup>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between pt-4 border-t border-border/60">
        <Link href="/booking/options">
          <Button type="button" variant="ghost" size="sm" className="gap-1.5">
            <RiArrowLeftLine className="size-4" data-icon="inline-start" />
            <span>Back to Options</span>
          </Button>
        </Link>

        <Button
          type="submit"
          size="lg"
          className="gap-2 font-semibold shadow-md"
        >
          <span>Continue to Itinerary Review</span>
          <RiArrowRightLine className="size-4" data-icon="inline-end" />
        </Button>
      </div>
    </form>
  )
}
