import "server-only"
import type { PaymentMethodConfig, PaymentMethodId, PaymentProvider } from "../types"
import { ManualPaymentProvider } from "./providers/manual-provider"
import { PayMongoPaymentProvider } from "./providers/paymongo-provider"
import { DemoPaymentProvider } from "./providers/demo-provider"

/**
 * Checks whether live or sandbox gateway processing is configured in environment.
 * Requires PAYMENTS_ENABLED === "true" and an active secret key.
 */
export function isPaymentGatewayConfigured(): boolean {
  const isEnabled = process.env.PAYMENTS_ENABLED === "true"
  const secretKey = process.env.PAYMONGO_SECRET_KEY
  if (!isEnabled || !secretKey || secretKey.length <= 5) {
    return false
  }
  // Safeguard: Never enable live payment gateway unless ALLOW_LIVE_PAYMENTS is explicitly true
  if (secretKey.startsWith("sk_live_") && process.env.ALLOW_LIVE_PAYMENTS !== "true") {
    return false
  }
  return true
}

/**
 * Checks whether demonstration/simulation mode is active.
 * Defaults to true for classroom/capstone presentation.
 */
export function isDemoMode(): boolean {
  return process.env.DEMO_MODE !== "false"
}

/**
 * Returns available payment methods.
 * Pass { demo: true } for classroom/capstone demonstration mode (simulated GCash, Maya, Card, Bank).
 * When demo is false/omitted, only gateway-active methods or manual pickup are enabled.
 */
export function getAvailablePaymentMethods(options?: { demo?: boolean }): PaymentMethodConfig[] {
  const isDemo = options?.demo === true
  const gatewayActive = isPaymentGatewayConfigured()

  if (isDemo) {
    return [
      {
        id: "pay_at_pickup",
        label: "Pay at Pickup",
        description: "Pay upon key handover at the vehicle branch or valet bay via cash or POS terminal.",
        type: "manual",
        enabled: true,
        badge: "In-Person",
        iconName: "hand-coin",
        isDemo: false,
      },
      {
        id: "gcash",
        label: "GCash (Demo)",
        description: "Instant simulated GCash mobile wallet settlement in Philippine pesos.",
        type: "demo",
        enabled: true,
        badge: "Instant (Demo)",
        iconName: "wallet",
        isDemo: true,
      },
      {
        id: "maya",
        label: "Maya (Demo)",
        description: "Simulated Maya wallet and QR Ph payment verification.",
        type: "demo",
        enabled: true,
        badge: "Fast (Demo)",
        iconName: "qr-code",
        isDemo: true,
      },
      {
        id: "card",
        label: "Credit / Debit Card (Demo)",
        description: "Simulated Visa, Mastercard, or JCB card payment verification.",
        type: "demo",
        enabled: true,
        badge: "Card (Demo)",
        iconName: "bank-card",
        isDemo: true,
      },
      {
        id: "bank_transfer",
        label: "Bank Transfer (Demo)",
        description: "Simulated online bank transfer (BDO, BPI, UnionBank) via InstaPay.",
        type: "demo",
        enabled: true,
        badge: "Transfer (Demo)",
        iconName: "global",
        isDemo: true,
      },
    ]
  }

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
 * In demo mode, all online methods are processed strictly through DemoPaymentProvider.
 */
export function getPaymentProvider(
  methodId: PaymentMethodId,
  options?: { demo?: boolean; forceLive?: boolean }
): PaymentProvider {
  if (methodId === "pay_at_pickup") {
    return new ManualPaymentProvider()
  }

  const isDemo = options?.demo === true

  if (isDemo && !options?.forceLive) {
    return new DemoPaymentProvider()
  }

  switch (methodId) {
    case "card":
    case "gcash":
    case "maya":
    case "online":
    case "bank_transfer":
    default:
      return new PayMongoPaymentProvider()
  }
}


