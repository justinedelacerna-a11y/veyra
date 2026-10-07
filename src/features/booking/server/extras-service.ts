import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { ExtraOption } from "../types"

/**
 * Fetch active booking extras from public.extras table.
 *
 * RLS: `extras: anon read active` allows anon and authenticated users
 * to select extras where is_active = true.
 */
export async function getLiveExtras(): Promise<ExtraOption[]> {
  try {
    const supabase = createClient()
    const { data: extras, error } = await supabase
      .from("extras")
      .select("id, slug, name, description, category, daily_rate, sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })

    if (error || !extras) {
      console.error("[extras-service] error fetching extras:", error?.message)
      return []
    }

    return extras.map((e) => ({
      id: e.id,
      name: e.name,
      tagline:
        e.category === "protection"
          ? "Zero Excess Liability"
          : e.category === "mileage"
          ? "No Daily Distance Caps"
          : e.category === "convenience"
          ? "High-Speed Mobile Connectivity"
          : "Certified Safety",
      description: e.description,
      dailyRate: Math.round(Number(e.daily_rate) / 100), // Convert centavos to Pesos
      category: e.category as ExtraOption["category"],
      badge: e.category === "protection" ? "Recommended" : undefined,
    }))
  } catch (err) {
    console.error("[extras-service] unexpected error:", err)
    return []
  }
}
