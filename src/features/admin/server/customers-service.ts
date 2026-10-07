import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { AdminCustomerRecord, AdminCustomerDocument } from "@/features/admin/types"

interface RawCustomerRow {
  id: string
  user_id: string
  first_name: string
  last_name: string
  phone: string | null
  date_of_birth: string | null
  membership_number: string
  membership_tier: string
  total_rentals: number
  verification_status: string
  preferred_hub_id: string | null
  created_at: string
  updated_at: string
  users?: {
    id: string
    email: string
    status: string
  } | null
  reservations?: Array<{
    id: string
    reference?: string | null
    status: string
    total_amount: number
    created_at: string
    pickup_at: string
    return_at?: string
    vehicles?: {
      make: string
      model: string
    } | null
  }> | null
}

function mapRawToAdminCustomer(row: RawCustomerRow): AdminCustomerRecord {
  const firstName = row.first_name || "Customer"
  const lastName = row.last_name || ""
  const fullName = `${firstName} ${lastName}`.trim() || row.users?.email || "Customer"

  const reservations = row.reservations || []
  const reservationCount = row.total_rentals || reservations.length
  const totalSpentCentavos = reservations
    .filter((r) => r.status === "completed" || r.status === "active" || r.status === "confirmed")
    .reduce((sum, r) => sum + Number(r.total_amount || 0), 0)

  const activeRes = reservations.find(
    (r) => r.status === "active" || r.status === "pickup_ready" || r.status === "confirmed"
  )

  const sortedByDate = [...reservations].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )
  const lastRental = sortedByDate[0]

  const hasPhone = Boolean(row.phone)
  const isVerified = row.verification_status === "verified"
  const documentStatus: "complete" | "pending" | "incomplete" =
    isVerified && hasPhone ? "complete" : isVerified ? "pending" : "incomplete"

  return {
    id: row.id,
    userId: row.user_id,
    firstName,
    lastName,
    name: fullName,
    email: row.users?.email || "",
    phone: row.phone || "",
    reservationCount,
    activeReservationId: activeRes?.id,
    lastRentalDate: lastRental ? new Date(lastRental.pickup_at).toLocaleDateString() : undefined,
    lastRentalVehicle: lastRental?.vehicles
      ? `${lastRental.vehicles.make} ${lastRental.vehicles.model}`
      : undefined,
    totalSpent: Math.round(totalSpentCentavos / 100),
    currency: "PHP",
    documentStatus,
    verificationStatus: isVerified ? "verified" : row.verification_status === "pending" ? "pending" : "rejected",
    status: row.users?.status === "suspended" ? "blocked" : "active",
    memberSince: row.created_at ? new Date(row.created_at).toLocaleDateString() : "2024",
    totalRentals: reservationCount,
    membershipNumber: row.membership_number || row.id.slice(0, 8).toUpperCase(),
    preferredHubId: row.preferred_hub_id || "",
    preferredHubName: "Main Hub",
    tier: row.membership_tier || "standard",
  }
}

export async function getAdminCustomersList(options?: {
  search?: string
  status?: string
}): Promise<AdminCustomerRecord[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      phone,
      date_of_birth,
      membership_number,
      membership_tier,
      total_rentals,
      verification_status,
      preferred_hub_id,
      created_at,
      updated_at,
      users (
        id,
        email,
        status
      ),
      reservations (
        id,
        status,
        total_amount,
        created_at,
        pickup_at,
        vehicles!reservations_vehicle_id_fkey (make, model)
      )
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[getAdminCustomersList] Database error:", error)
    throw new Error(`Failed to load customers: ${error.message}`)
  }

  let customers = ((data || []) as unknown as RawCustomerRow[]).map(mapRawToAdminCustomer)

  if (options?.search?.trim()) {
    const q = options.search.toLowerCase()
    customers = customers.filter(
      (c) =>
        (c.name || `${c.firstName} ${c.lastName}`).toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    )
  }

  if (options?.status && options.status !== "all") {
    customers = customers.filter((c) => c.status === options.status)
  }

  return customers
}

export async function getAdminCustomerById(id: string): Promise<{
  customer: AdminCustomerRecord | null
  reservations: Array<{
    id: string
    reference: string
    vehicleName: string
    status: string
    pickupDate: string
    returnDate: string
    totalAmount: number
  }>
  documents: AdminCustomerDocument[]
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("customers")
    .select(`
      id,
      user_id,
      first_name,
      last_name,
      phone,
      date_of_birth,
      membership_number,
      membership_tier,
      total_rentals,
      verification_status,
      preferred_hub_id,
      created_at,
      updated_at,
      users (
        id,
        email,
        status
      ),
      reservations (
        id,
        reference,
        status,
        total_amount,
        created_at,
        pickup_at,
        return_at,
        vehicles!reservations_vehicle_id_fkey (make, model)
      )
    `)
    .eq("id", id)
    .maybeSingle()

  if (error || !data) {
    if (error) console.error("[getAdminCustomerById] Error:", error)
    return { customer: null, reservations: [], documents: [] }
  }

  // Fetch customer documents
  const { data: docRows, error: docError } = await supabase
    .from("customer_documents")
    .select(`
      id,
      customer_id,
      type,
      original_filename,
      mime_type,
      file_size_bytes,
      status,
      rejection_reason,
      expires_at,
      created_at,
      reviewed_at,
      reviewed_by
    `)
    .eq("customer_id", id)
    .order("created_at", { ascending: false })

  if (docError) {
    console.warn("[getAdminCustomerById] Documents query warning:", docError.message)
  }

  const raw = data as unknown as RawCustomerRow
  const customer = mapRawToAdminCustomer(raw)

  const reservations = (raw.reservations || []).map((r) => ({
    id: r.id,
    reference: r.reference || r.id.slice(0, 8),
    vehicleName: r.vehicles ? `${r.vehicles.make} ${r.vehicles.model}` : "Fleet Vehicle",
    status: r.status,
    pickupDate: new Date(r.pickup_at).toLocaleDateString(),
    returnDate: r.return_at ? new Date(r.return_at).toLocaleDateString() : "—",
    totalAmount: Math.round(Number(r.total_amount || 0) / 100),
  }))

  const documents: AdminCustomerDocument[] = (docRows || []).map((d) => ({
    id: d.id,
    customerId: d.customer_id,
    type: d.type as AdminCustomerDocument["type"],
    originalFilename: d.original_filename,
    mimeType: d.mime_type,
    fileSizeBytes: d.file_size_bytes,
    status: d.status as AdminCustomerDocument["status"],
    rejectionReason: d.rejection_reason || undefined,
    expiresAt: d.expires_at || undefined,
    createdAt: d.created_at,
    reviewedAt: d.reviewed_at || undefined,
    reviewedBy: d.reviewed_by || undefined,
  }))

  return { customer, reservations, documents }
}

