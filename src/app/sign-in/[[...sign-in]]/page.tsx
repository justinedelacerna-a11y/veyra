import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { SignIn } from "@clerk/nextjs"
import { CustomerShell } from "@/components/shell/customer"

export const metadata: Metadata = {
  title: "Sign In — Veyra",
  description: "Sign in to access your Veyra reservations, documents, and fleet mobility.",
}

interface SignInPageProps {
  searchParams: Promise<{
    redirect_url?: string
    returnUrl?: string
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams
  const returnTarget = params.redirect_url || params.returnUrl

  const postLoginUrl = returnTarget
    ? `/auth/redirect?returnUrl=${encodeURIComponent(returnTarget)}`
    : "/auth/redirect"

  // If user is already authenticated, automatically route through the redirect resolver
  const { userId } = await auth()
  if (userId) {
    redirect(postLoginUrl)
  }

  return (
    <CustomerShell hideFooter>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome back to Veyra
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to manage your luxury car rentals and preferences.
            </p>
          </div>
          <div className="flex justify-center">
            <SignIn
              path="/sign-in"
              routing="path"
              signUpUrl="/sign-up"
              forceRedirectUrl={postLoginUrl}
              fallbackRedirectUrl={postLoginUrl}
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "shadow-xl border border-border/80 bg-card rounded-2xl",
                },
              }}
            />
          </div>
        </div>
      </div>
    </CustomerShell>
  )
}
