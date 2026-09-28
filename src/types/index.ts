/**
 * Foundational Shared & Domain Types for Veyra
 */

export interface BaseEntity {
  id: string
  createdAt: string
  updatedAt: string
}

export type AsyncState<T> =
  | { status: "idle"; data: null; error: null }
  | { status: "loading"; data: null; error: null }
  | { status: "success"; data: T; error: null }
  | { status: "error"; data: null; error: Error }

export type VehicleCategory =
  | "sedan"
  | "suv"
  | "electric"
  | "van"
  | "luxury"

export interface Vehicle {
  id: string
  make: string
  model: string
  year: number
  category: VehicleCategory
  transmission: "Automatic" | "Manual"
  fuelType: "Petrol" | "Diesel" | "Electric" | "Hybrid"
  seats: number
  luggage: number
  doors?: number
  dailyRate: number
  currency: string
  badge?: string
  features: string[]
  accentColor?: string
  available: boolean
  description?: string
  rating?: number
  tripsCount?: number
  securityDeposit?: number
  mileageAllowance?: string
  engine?: string
  power?: string
  acceleration?: string
  images?: string[]
}

export interface LocationHub {
  id: string
  name: string
  city: string
  type: "Airport Terminal" | "City Center" | "Private Hub"
  address: string
  operatingHours: string
  pickupAvailable: boolean
}

export interface CategoryCardData {
  id: VehicleCategory
  name: string
  tagline: string
  description: string
  startingPrice: number
  vehicleCount: number
}

export interface RentalSearchState {
  pickupLocation: string
  returnLocation: string
  sameLocation: boolean
  pickupDate: string
  pickupTime: string
  returnDate: string
  returnTime: string
}

export * from "@/features/account/types"

