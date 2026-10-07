import type { NextConfig } from "next"

/**
 * Production security headers for Veyra.
 *
 * CSP is carefully scoped to allow Clerk, Supabase, and Next.js to work
 * without relaxing security unnecessarily.
 *
 * Clerk domains: clerk.accounts.dev (test), clerk.com (production), accounts.google.com
 * Supabase: *.supabase.co for API and Realtime WebSocket connections
 */
const securityHeaders = [
  // Prevents MIME-type sniffing
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Prevents clickjacking
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Controls referrer info sent to external sites
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Disables browser features not needed by Veyra
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
  // Force HTTPS in production (max-age = 1 year)
  // Note: only effective when served over HTTPS (Vercel always does this)
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  /**
   * Content Security Policy
   *
   * Design principles:
   * - 'self' for all default directives
   * - Clerk: requires specific origins for auth UI components and OAuth flows
   * - Supabase: requires *.supabase.co for API calls and wss:// for Realtime
   * - Next.js: requires 'unsafe-inline' for styles (RSC streaming), 'unsafe-eval' blocked
   * - Google Fonts: allowed for typography (Geist, Inter etc.)
   * - No wildcard '*' origins
   *
   * If Clerk or Supabase adds new domains, update this policy accordingly.
   */
  {
    key: "Content-Security-Policy",
    value: [
      // Default: only same-origin
      "default-src 'self'",
      // Scripts: self + Clerk inline scripts (Clerk uses inline handlers)
      "script-src 'self' 'unsafe-inline' https://clerk.accounts.dev https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://challenges.cloudflare.com",
      // Styles: self + inline (Next.js RSC streaming requires this) + Google Fonts
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts: self + Google Fonts CDN
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self + data URIs (inline SVGs/placeholders) + Supabase storage + Clerk avatar CDN
      "img-src 'self' data: blob: https://*.supabase.co https://img.clerk.com https://images.clerk.dev",
      // XHR/fetch: self + Supabase API + Clerk API
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://clerk.accounts.dev https://*.clerk.accounts.dev https://api.clerk.dev https://*.clerk.dev https://api.clerk.com https://*.clerk.com",
      // Frames: Clerk needs to embed iframes for auth flows (MFA, OAuth)
      "frame-src 'self' https://clerk.accounts.dev https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://challenges.cloudflare.com",
      // Workers: none needed
      "worker-src 'self' blob:",
      // No objects/embeds
      "object-src 'none'",
      // Base URI: only self
      "base-uri 'self'",
      // Form submissions: only self
      "form-action 'self'",
    ].join("; "),
  },
]

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
