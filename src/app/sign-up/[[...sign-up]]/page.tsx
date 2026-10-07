import type { Metadata } from "next"
import { SignUp } from "@clerk/nextjs"
import { CustomerShell } from "@/components/shell/customer"

export const metadata: Metadata = {
  title: "Create Account — Veyra",
  description: "Create an account to book premium vehicles and manage your trips.",
}

export default function SignUpPage() {
  return (
    <CustomerShell hideFooter>
      <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Experience Veyra
            </h1>
            <p className="text-sm text-muted-foreground">
              Create an account for seamless booking, valet pickup, and exclusive fleet access.
            </p>
          </div>
          <div className="flex justify-center">
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/sign-in"
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
