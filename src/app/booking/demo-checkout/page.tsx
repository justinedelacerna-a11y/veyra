import * as React from "react"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import { currentUser } from "@clerk/nextjs/server"
import { createServiceClient } from "@/lib/supabase/server"
import { DemoPaymentInterface, DemoPaymentData } from "@/features/payment/components/demo-payment-interface"
import type { PaymentMethodId } from "@/features/payment/types"

export const metadata: Metadata = {
  title: "Demo Payment Simulator — Veyra Car Rental",
  description: "Simulated demonstration payment checkout for capstone evaluation.",
  robots: { index: false, follow: false },
}

interface DemoCheckoutPageProps {
  searchParams: Promise<{
    ref?: string
    method?: string
    session_id?: string
  }>
}

export default async function DemoCheckoutPage({ searchParams }: DemoCheckoutPageProps) {
  const user = await currentUser()
  if (!user) {
    redirect("/sign-in?redirect_url=/booking")
  }

  const { ref, method, session_id } = await searchParams
  const reference = ref || ""

  if (!reference) {
    redirect("/booking")
  }

  const supabase = createServiceClient()

  // 1. Resolve customer
  const { data: dbUser } = await supabase
    .from("users")
    .select("id, email")
    .eq("clerk_id", user.id)
    .single()

  if (!dbUser) {
    redirect("/booking")
  }

  const { data: customer } = await supabase
    .from("customers")
    .select("id, first_name, last_name")
    .eq("user_id", dbUser.id)
    .single()

  if (!customer) {
    redirect("/booking")
  }

  // 2. Fetch reservation
  const { data: reservation } = await supabase
    .from("reservations")
    .select(`
      id,
      reference,
      customer_id,
      total_amount,
      currency,
      status,
      rental_days,
      pickup_at,
      return_at,
      pickup_barangay,
      vehicles (
        make,
        model,
        year,
        transmission,
        fuel_type,
        seats
      ),
      pickup_location:locations!pickup_location_id (
        name,
        barangay,
        address
      ),
      return_location:locations!return_location_id (
        name,
        barangay,
        address
      )
    `)
    .eq("reference", reference)
    .single()

  if (!reservation || reservation.customer_id !== customer.id) {
    redirect("/account/reservations")
  }

  // If already captured/confirmed, redirect to confirmation
  if (reservation.status === "confirmed") {
    redirect(`/booking/confirmation?ref=${encodeURIComponent(reference)}&demo=paid`)
  }

  // 3. Resolve or fetch payment record
  const { data: payment } = await supabase
    .from("payments")
    .select("id, provider_payment_id, provider_txn_ref, is_demo")
    .eq("reservation_id", reservation.id)
    .eq("is_demo", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const validatedMethod: PaymentMethodId =
    method === "gcash" || method === "maya" || method === "card" || method === "bank_transfer"
      ? (method as PaymentMethodId)
      : "gcash"

  const demoTxnRef =
    payment?.provider_txn_ref ||
    `VYR-DEMO-${validatedMethod.toUpperCase()}-${reference.replace("VYR-", "")}`

  const resolvedSessionId =
    session_id || payment?.provider_payment_id || `demo_sess_${reservation.id}`

  const vehicleObj = Array.isArray(reservation.vehicles) ? reservation.vehicles[0] : reservation.vehicles
  const pickupLoc = Array.isArray(reservation.pickup_location) ? reservation.pickup_location[0] : reservation.pickup_location
  const returnLoc = Array.isArray(reservation.return_location) ? reservation.return_location[0] : reservation.return_location

  const initialData: DemoPaymentData = {
    reference: reservation.reference,
    sessionId: resolvedSessionId,
    paymentMethod: validatedMethod,
    amountCentavos: Number(reservation.total_amount),
    currency: reservation.currency || "PHP",
    rentalDays: reservation.rental_days || 1,
    pickupAt: reservation.pickup_at,
    returnAt: reservation.return_at,
    pickupLocation: pickupLoc?.name || "Main Butuan Hub",
    returnLocation: returnLoc?.name || "Main Butuan Hub",
    pickupBarangay: reservation.pickup_barangay,
    vehicle: {
      make: vehicleObj?.make || "Toyota",
      model: vehicleObj?.model || "Vios",
      year: vehicleObj?.year || 2024,
      transmission: vehicleObj?.transmission || "Automatic",
      fuelType: vehicleObj?.fuel_type || "Petrol",
      seats: vehicleObj?.seats || 5,
    },
    customerName: customer.first_name ? `${customer.first_name} ${customer.last_name || ""}`.trim() : user.fullName || "Valued Customer",
    customerEmail: dbUser.email,
    demoTxnRef,
  }

  return <DemoPaymentInterface initialData={initialData} />
}
