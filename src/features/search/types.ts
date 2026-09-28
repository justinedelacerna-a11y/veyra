import { VehicleCategory } from "@/types"

export interface SearchFilterState {
  categories: VehicleCategory[]
  fuelTypes: string[]
  transmission: string
  minSeats: number
  maxPrice: number
  searchQuery: string
}

export type SortOption =
  | "recommended"
  | "price-asc"
  | "price-desc"
  | "rating-desc"
  | "capacity-desc"

export interface SearchQueryCriteria {
  pickupLocationId?: string
  returnLocationId?: string
  pickupDate?: string
  pickupTime?: string
  returnDate?: string
  returnTime?: string
  initialCategory?: VehicleCategory
}
