import { NextResponse } from "next/server"
import { getAvailablePaymentMethods, isPaymentGatewayConfigured } from "@/features/payment/server"

/**
 * GET /api/payment-methods
 *
 * Returns list of configured and available payment methods.
 * Never leaks server credentials or gateway secrets.
 */
export async function GET() {
  const methods = getAvailablePaymentMethods()
  const gatewayOnline = isPaymentGatewayConfigured()

  return NextResponse.json({
    success: true,
    gatewayOnline,
    methods,
  })
}
