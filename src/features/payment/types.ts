export type PaymentMethodId =
  | "pay_at_pickup"
  | "online"
  | "gcash"
  | "maya"
  | "card"
  | "bank_transfer"

export type PaymentState =
  | "unpaid"
  | "pending"
  | "authorized"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_refunded"

export interface PaymentMethodConfig {
  id: PaymentMethodId
  label: string
  description: string
  type: "manual" | "gateway" | "demo"
  enabled: boolean
  badge?: string
  iconName: "hand-coin" | "bank-card" | "wallet" | "qr-code" | "global"
  isDemo?: boolean
}

export interface CreatePaymentParams {
  reservationId: string
  clerkUserId: string
  paymentMethod: PaymentMethodId
  successUrl?: string
  cancelUrl?: string
}

export interface PaymentSessionResult {
  success: boolean
  sessionId?: string
  checkoutUrl?: string
  reference: string
  totalAmountCentavos: number
  currency: string
  status: PaymentState
  isDemo?: boolean
  error?: string
  message?: string
}

export interface PaymentStatusResult {
  status: PaymentState
  providerPaymentId?: string
  amountCentavos?: number
  currency?: string
  reference?: string
  paidAt?: string
  failureReason?: string
  isDemo?: boolean
}

export interface DemoPaymentSimulationParams {
  reservationId?: string
  reference?: string
  paymentId?: string
  sessionId?: string
  action: "success" | "failure" | "cancel"
  failureReason?: string
}

export interface DemoPaymentSimulationResult {
  success: boolean
  status: PaymentState
  reservationStatus: string
  reference: string
  paymentReference: string
  amountCentavos: number
  currency: string
  isDemo: true
  message: string
}

export interface PaymentProvider {
  name: string
  createPayment(params: CreatePaymentParams): Promise<PaymentSessionResult>
  getPaymentStatus(providerPaymentId: string): Promise<PaymentStatusResult>
  cancelPayment(providerPaymentId: string): Promise<{ success: boolean; message?: string }>
  refundPayment?(params: {
    paymentId: string
    amountCentavos: number
    reason: string
  }): Promise<{ success: boolean; message?: string }>
}

