/**
 * Supabase Client Index
 *
 * Central export point for client-side Supabase utilities.
 *
 * Usage:
 *   Server-side: import { createClient, createServiceClient } from "@/lib/supabase/server"
 *   Client-side: import { createClient, useSupabase } from "@/lib/supabase/client"
 *
 * Note: Never import server utilities into client components. Keep server and browser imports distinct.
 */

export { createClient, useSupabase } from "./client"
