import { Metadata } from "next"
import { AccountSecurityView } from "@/features/account/components/account-security-view"

export const metadata: Metadata = {
  title: "Security & Access — Veyra Account",
  description:
    "Manage your account credentials, multi-factor verification, and active authenticated sessions.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function SecurityPage() {
  return <AccountSecurityView />
}
