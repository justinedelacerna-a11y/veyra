/**
 * Veyra — Clerk Auth Proxy
 *
 * Next.js 16+ uses proxy.ts (renamed from middleware.ts in ≤15).
 * The exported function must be named `proxy`. Using `export default` satisfies this.
 *
 * Strategy: Public-first
 * - Public routes (homepage, vehicle catalog, auth pages, static pages) are open.
 * - Protected routes (/account, /booking, /admin) require authentication.
 * - Private API routes (/api/private) require authentication.
 *
 * The matcher excludes static assets and Next.js internals to prevent auth
 * logic from running on every CSS/JS/image/font request.
 *
 * @see https://clerk.com/docs/reference/nextjs/clerk-middleware
 * @see node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
  "/account(.*)",
  "/booking(.*)",
  "/admin(.*)",
  "/api/private(.*)",
])

// clerkMiddleware returns a Next.js-compatible handler.
// Default export satisfies Next.js 16's `proxy` function convention.
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const signInUrl = new URL("/sign-in", req.url)
    signInUrl.searchParams.set("redirect_url", req.nextUrl.pathname)
    await auth.protect({ unauthenticatedUrl: signInUrl.toString() })
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
}
