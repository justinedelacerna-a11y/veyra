import type { Metadata } from "next"
import { SignIn } from "@clerk/nextjs"
import { CustomerShell } from "@/components/shell/customer"

export const metadata: Metadata = {
  title: "Sign In — Veyra",
  description: "Sign in to access your Veyra reservations, documents, and fleet mobility.",
}

export default function SignInPage() {
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
              fallbackRedirectUrl="/"
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
