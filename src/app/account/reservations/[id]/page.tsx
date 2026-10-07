import * as React from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getCustomerReservationById } from "@/features/account/server"
import { ReservationDetailView } from "@/features/account/components/reservation-detail-view"

interface ReservationDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ReservationDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const reservation = await getCustomerReservationById(id)

  if (!reservation) {
    return {
      title: "Reservation Not Found — Veyra",
    }
  }

  return {
    title: `Reservation ${reservation.id} — Veyra`,
    description: `Details for your ${reservation.vehicle.make} ${reservation.vehicle.model} rental.`,
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function ReservationDetailPage({ params }: ReservationDetailPageProps) {
  const { id } = await params
  const reservation = await getCustomerReservationById(id)

  if (!reservation) {
    notFound()
  }

  return <ReservationDetailView reservation={reservation} />
}

