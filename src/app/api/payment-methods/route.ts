import { NextResponse } from "next/server"
import { getAvailablePaymentMethods, isPaymentGatewayConfigured } from "@/features/payment/server"

/**
 * GET /api/payment-methods
 *
 * Returns list of configured and available payment methods.
 * Never leaks server credentials or gateway secrets.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const demoParam = url.searchParams.get("demo")
  const isDemo = demoParam !== null ? demoParam === "true" : true
  const methods = getAvailablePaymentMethods({ demo: isDemo })
  const gatewayOnline = isPaymentGatewayConfigured()

  return NextResponse.json({
    success: true,
    gatewayOnline,
    demoMode: isDemo,
    methods,
  })
}


