import type { Metadata } from "next"
import { Geist, Geist_Mono, Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

const geistHeading = Geist({ subsets: ["latin"], variable: "--font-heading" })
const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Veyra — Local Car Rental in Butuan City, Agusan del Norte",
  description:
    "Local car rental in Butuan City, Agusan del Norte, Philippines. Luxury SUVs, executive sedans, and high-performance electric vehicles with guaranteed models and prompt local handover.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={cn(
          "h-full antialiased font-sans",
          geistSans.variable,
          geistMono.variable,
          inter.variable,
          geistHeading.variable
        )}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <TooltipProvider>{children}</TooltipProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
