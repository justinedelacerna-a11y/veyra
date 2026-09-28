/**
 * Veyra Database Types — Generated Placeholder
 *
 * This file is a hand-authored stub that satisfies TypeScript imports until the
 * real generated types are available from the hosted Supabase project.
 *
 * TO GENERATE THE REAL TYPES:
 *
 *   1. Ensure SUPABASE_ACCESS_TOKEN is set (or `npx supabase login` completed)
 *   2. Link the project: `npx supabase link --project-ref <your-project-ref>`
 *   3. Generate: `npx supabase gen types typescript --linked > src/types/database.ts`
 *   4. Commit the result; delete this comment block.
 *
 * The real generated file will have a `Database` interface with full table definitions.
 * Until then, this stub allows the Supabase clients to compile correctly.
 */

export type Database = {
  public: {
    Tables: Record<string, {
      Row: Record<string, unknown>
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    }>
    Views: Record<string, {
      Row: Record<string, unknown>
    }>
    Functions: Record<string, unknown>
    Enums: Record<string, string>
  }
  veyra_private: {
    Tables: Record<string, {
      Row: Record<string, unknown>
      Insert: Record<string, unknown>
      Update: Record<string, unknown>
    }>
    Views: Record<string, never>
    Functions: Record<string, unknown>
    Enums: Record<string, string>
  }
}
