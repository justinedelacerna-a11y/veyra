import "server-only"
import { createClient as createSupabaseClient } from "@supabase/supabase-js"
import { auth } from "@clerk/nextjs/server"
import type { Database } from "@/types/database"

/**
 * Supabase Server Client
 *
 * Use in Server Components, Route Handlers, and Server Actions.
 *
 * Implements Clerk native third-party authentication with Supabase:
 * - Clerk issues session tokens natively.
 * - Supabase verifies the Clerk token via its configured Clerk third-party auth provider.
 * - The Supabase client automatically attaches the token via the `accessToken` option.
 * - PostgreSQL RLS evaluates `auth.jwt() ->> 'sub'` mapping to `users.clerk_id`.
 *
 * Two clients are provided:
 * 1. createClient()
 *    - Uses publishable key + Clerk session token via accessToken().
 *    - RLS is fully enforced.
 *    - Automatically handles anonymous access when user is unauthenticated.
 *
 * 2. createServiceClient()
 *    - Uses SUPABASE_SERVICE_ROLE_KEY.
 *    - Bypasses RLS.
 *    - Reserved for trusted backend/webhook/admin operations.
 *    - Server-side only; never import into client components.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!

/**
 * Creates an RLS-enforced Supabase client for server execution.
 * Conceptually follows:
 *   createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
 *     accessToken: async () => (await auth()).getToken()
 *   })
 */
export function createClient() {
  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      accessToken: async () => {
        try {
          const authState = await auth()
          const token = await authState.getToken()
          return token ?? null
        } catch {
          // If auth() fails or context is not an active request, return null for anonymous access
          return null
        }
      },
    }
  )
}

/**
 * Creates a Supabase server client using the service role key.
 *
 * BYPASSES RLS. Use ONLY for:
 * - Clerk webhook handler: syncing user lifecycle events into public.users.
 * - PayMongo webhook handler: recording verified payment events.
 * - Vercel Cron jobs: scheduled system maintenance operations.
 * - Trusted admin scripts.
 *
 * ⚠️ NEVER import this into client components or expose the service role key.
 */
export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. " +
        "This is required for service-role operations. " +
        "Set it in .env.local (server-side only — never NEXT_PUBLIC_)."
    )
  }

  return createSupabaseClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
