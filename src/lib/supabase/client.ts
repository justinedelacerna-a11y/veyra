"use client"

import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js"
import { useSession } from "@clerk/nextjs"
import { useMemo } from "react"
import type { Database } from "@/types/database"

/**
 * Supabase Browser Client
 *
 * Use in Client Components ('use client') to query Supabase from the browser.
 *
 * Implements Clerk native third-party authentication:
 * - When authenticated, Clerk provides the session token automatically.
 * - The Supabase client forwards this token via the `accessToken` option.
 * - Supabase verifies the Clerk token natively against the Clerk domain.
 * - For anonymous requests (public vehicle catalog, branches), accessToken returns null,
 *   and Supabase falls back to the publishable key with the `anon` role.
 * - Never manually stores tokens in localStorage or sessionStorage.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!

/**
 * Creates a browser Supabase client configured with Clerk session accessToken.
 *
 * @param getToken - Optional token resolver, e.g. from `useSession().session?.getToken`.
 *   If omitted, attempts to read from `window.Clerk?.session?.getToken()` in browser environment.
 */
export function createClient(getToken?: () => Promise<string | null>): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      accessToken: async () => {
        try {
          if (getToken) {
            return (await getToken()) ?? null
          }
          if (typeof window !== "undefined" && (window as unknown as { Clerk?: { session?: { getToken: () => Promise<string | null> } } }).Clerk?.session) {
            return (await (window as unknown as { Clerk: { session: { getToken: () => Promise<string | null> } } }).Clerk.session.getToken()) ?? null
          }
          return null
        } catch {
          return null
        }
      },
    }
  )
}

/**
 * React hook to obtain a memoized Supabase client tied to the active Clerk session.
 *
 * Usage:
 *   const supabase = useSupabase()
 *   const { data } = await supabase.from('vehicles').select()
 */
export function useSupabase(): SupabaseClient<Database> {
  const { session } = useSession()

  return useMemo(() => {
    return createClient(async () => {
      if (!session) return null
      return (await session.getToken()) ?? null
    })
  }, [session])
}
