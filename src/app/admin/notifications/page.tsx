import * as React from "react"
import { Metadata } from "next"
import { requireAdminStaff } from "@/features/admin/server/admin-auth"
import { getAdminNotificationsList } from "@/features/admin/server/notifications-service"
import { NotificationsClient } from "./notifications-client"

export const metadata: Metadata = {
  title: "Notifications — Veyra Operations",
  description: "Outbound notification queue and delivery status.",
  robots: { index: false, follow: false },
}

export default async function AdminNotificationsPage() {
  await requireAdminStaff()
  const notifications = await getAdminNotificationsList({ limit: 200 })

  return <NotificationsClient initialNotifications={notifications} />
}
