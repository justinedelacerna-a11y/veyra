import "server-only"
import type { PaymentMethodConfig, PaymentMethodId, PaymentProvider } from "../types"
import { ManualPaymentProvider } from "./providers/manual-provider"
import { PayMongoPaymentProvider } from "./providers/paymongo-provider"

/**
 * Checks whether live or sandbox gateway processing is configured in environment.
 * Requires PAYMENTS_ENABLED === "true" and an active secret key.
 */
export function isPaymentGatewayConfigured(): boolean {
  const isEnabled = process.env.PAYMENTS_ENABLED === "true"
  const secretKey = process.env.PAYMONGO_SECRET_KEY
  return isEnabled && Boolean(secretKey && secretKey.length > 5)
}

/**
 * Returns available payment methods.
 * CRITICAL RULE: Never displays a payment method as enabled if it cannot
 * actually process a transaction. When gateway credentials are missing or
 * PAYMENTS_ENABLED=false, only manual Pay at Pickup is active.
 */
export function getAvailablePaymentMethods(): PaymentMethodConfig[] {
  const gatewayActive = isPaymentGatewayConfigured()

  const methods: PaymentMethodConfig[] = [
    {
      id: "pay_at_pickup",
      label: "Pay at Pickup",
      description: "Pay upon key handover at the vehicle branch or valet bay via cash or POS terminal.",
      type: "manual",
      enabled: true,
      badge: "Flexible",
      iconName: "hand-coin",
    },
    {
      id: "card",
      label: "Credit / Debit Card",
      description: "Direct encrypted checkout via Visa, Mastercard, or JCB.",
      type: "gateway",
      enabled: gatewayActive,
      badge: gatewayActive ? "Instant" : "Coming Soon",
      iconName: "bank-card",
    },
    {
      id: "gcash",
      label: "GCash",
      description: "Instant mobile wallet payment with seamless Philippine peso settlement.",
      type: "gateway",
      enabled: gatewayActive,
      badge: gatewayActive ? "Popular" : "Coming Soon",
      iconName: "wallet",
    },
    {
      id: "maya",
      label: "Maya",
      description: "Pay securely via your Maya wallet balance or QR Ph code.",
      type: "gateway",
      enabled: gatewayActive,
      badge: gatewayActive ? "Fast" : "Coming Soon",
      iconName: "qr-code",
    },
  ]

  return methods
}

/**
 * Resolves the appropriate provider abstraction based on selected payment method.
 */
export function getPaymentProvider(methodId: PaymentMethodId): PaymentProvider {
  switch (methodId) {
    case "pay_at_pickup":
      return new ManualPaymentProvider()
    case "card":
    case "gcash":
    case "maya":
    case "online":
    default:
      return new PayMongoPaymentProvider()
  }
}
