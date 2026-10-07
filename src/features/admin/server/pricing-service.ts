import "server-only"
import { createClient } from "@/lib/supabase/server"

export interface AdminExtra {
  id: string
  name: string
  slug: string
  description: string
  category: "protection" | "convenience" | "equipment" | "mileage"
  dailyRate: number
  currency: string
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

export interface AdminRatePlan {
  id: string
  name: string
  vehicleClassId: string | null
  vehicleClassName: string | null
  minDays: number
  maxDays: number | null
  dailyRateOverride: number | null
  discountPct: number | null
  validFrom: string | null
  validTo: string | null
  isActive: boolean
  createdAt: string
}

export async function getAdminPricingData(): Promise<{
  extras: AdminExtra[]
  ratePlans: AdminRatePlan[]
}> {
  const supabase = createClient()

  const [{ data: extrasData, error: extrasErr }, { data: ratePlansData, error: rateErr }] = await Promise.all([
    supabase
      .from("extras")
      .select("id, name, slug, description, category, daily_rate, currency, is_active, sort_order, created_at, updated_at")
      .order("sort_order"),
    supabase
      .from("rate_plans")
      .select(`
        id,
        name,
        vehicle_class_id,
        min_days,
        max_days,
        daily_rate_override,
        discount_pct,
        valid_from,
        valid_to,
        is_active,
        created_at,
        vehicle_classes (id, name)
      `)
      .order("created_at", { ascending: false }),
  ])

  if (extrasErr) console.error("[getAdminPricingData] Extras error:", extrasErr)
  if (rateErr) console.error("[getAdminPricingData] Rate plans error:", rateErr)

  interface RawExtraRow {
    id: string
    name: string
    slug: string
    description: string
    category: string
    daily_rate: number
    currency: string
    is_active: boolean
    sort_order: number
    created_at: string
    updated_at: string
  }

  const extras: AdminExtra[] = ((extrasData || []) as unknown as RawExtraRow[]).map((e) => ({
    id: e.id,
    name: e.name,
    slug: e.slug,
    description: e.description,
    category: e.category as AdminExtra["category"],
    dailyRate: Math.round(Number(e.daily_rate) / 100),
    currency: e.currency || "PHP",
    isActive: e.is_active,
    sortOrder: e.sort_order,
    createdAt: e.created_at,
    updatedAt: e.updated_at,
  }))

  interface RawRatePlanRow {
    id: string
    name: string
    vehicle_class_id: string | null
    min_days: number
    max_days: number | null
    daily_rate_override: number | null
    discount_pct: number | null
    valid_from: string | null
    valid_to: string | null
    is_active: boolean
    created_at: string
    vehicle_classes?: { id: string; name: string } | null
  }

  const ratePlans: AdminRatePlan[] = ((ratePlansData || []) as unknown as RawRatePlanRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    vehicleClassId: r.vehicle_class_id,
    vehicleClassName: r.vehicle_classes?.name || null,
    minDays: r.min_days,
    maxDays: r.max_days,
    dailyRateOverride: r.daily_rate_override ? Math.round(Number(r.daily_rate_override) / 100) : null,
    discountPct: r.discount_pct ? Number(r.discount_pct) : null,
    validFrom: r.valid_from,
    validTo: r.valid_to,
    isActive: r.is_active,
    createdAt: r.created_at,
  }))

  return { extras, ratePlans }
}
