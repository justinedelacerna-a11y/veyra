import type { Metadata } from "next"
import { AdminShell } from "@/components/shell/admin"

export const metadata: Metadata = {
  title: "Veyra Operations — Fleet & Reservations Hub",
  description: "Administrative console for Veyra fleet, booking, and customer management.",
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
