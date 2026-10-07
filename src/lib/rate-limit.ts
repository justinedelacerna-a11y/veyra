/**
 * Veyra Rate Limiter
 *
 * A lightweight, production-appropriate sliding-window rate limiter.
 *
 * Architecture decision:
 * - Uses a per-process in-memory store keyed by (prefix + identifier).
 * - On serverless/edge deployments (Vercel), each function invocation is isolated.
 *   This is acceptable because:
 *   a) The primary abuse protection is the database-level idempotency key on reservations.
 *   b) The Clerk webhook is protected by signature verification (not rate limiting).
 *   c) Authentication (Clerk) is the strongest per-user protection layer.
 *   d) An external Redis/KV store would add a new dependency and complexity.
 *
 * - For quote and availability endpoints (anonymous), limits are per-IP.
 * - For reservation and authenticated endpoints, limits are per-authenticated user ID.
 * - Limits are intentionally generous to avoid blocking legitimate customers.
 *
 * Upgrade path: Replace the in-memory store with Upstash Redis / Vercel KV
 * when multi-instance rate limiting is required at scale.
 *
 * IMPORTANT: This rate limiter NEVER stores email addresses, names, session tokens,
 * or any sensitive PII. It stores only the opaque identifier (IP or user ID)
 * and a request timestamp list.
 */

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Cleanup interval: remove expired entries every 5 minutes
// to prevent unbounded memory growth on long-running instances.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      // Remove entries where all timestamps are older than 10 minutes
      entry.timestamps = entry.timestamps.filter((ts) => now - ts < 10 * 60 * 1000)
      if (entry.timestamps.length === 0) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  /** Sliding window duration in milliseconds */
  windowMs: number
  /** Maximum requests allowed within the window */
  maxRequests: number
}

export interface RateLimitResult {
  allowed: boolean
  /** Remaining requests in the current window */
  remaining: number
  /** Milliseconds until the oldest request in the window expires */
  retryAfterMs: number
}

/**
 * Check whether an identifier has exceeded the rate limit.
 *
 * @param prefix       - Namespace for the limit (e.g. "quote", "reservation", "availability")
 * @param identifier   - Opaque user/IP identifier (never PII). Use Clerk userId or client IP.
 * @param config       - Window duration and max requests.
 */
export function checkRateLimit(
  prefix: string,
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${prefix}:${identifier}`
  const now = Date.now()
  const windowStart = now - config.windowMs

  let entry = store.get(key)
  if (!entry) {
    entry = { timestamps: [] }
    store.set(key, entry)
  }

  // Slide window: remove timestamps older than windowMs
  entry.timestamps = entry.timestamps.filter((ts) => ts > windowStart)

  if (entry.timestamps.length >= config.maxRequests) {
    // Rate limited: oldest timestamp determines retry window
    const oldest = entry.timestamps[0]
    const retryAfterMs = oldest + config.windowMs - now
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(0, retryAfterMs),
    }
  }

  entry.timestamps.push(now)
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  }
}

// ─── Pre-defined endpoint configurations ─────────────────────────────────────

/**
 * Rate limit configs per endpoint category.
 * These are intentionally conservative to avoid blocking legitimate users
 * while still preventing automated abuse.
 */
export const RATE_LIMITS = {
  /** Quote endpoint — anonymous; keyed by IP */
  quote: { windowMs: 60_000, maxRequests: 20 },

  /** Availability check — anonymous; keyed by IP */
  availability: { windowMs: 60_000, maxRequests: 60 },

  /** Reservation creation — authenticated; keyed by userId */
  reservation: { windowMs: 60_000, maxRequests: 5 },

  /** Document upload — authenticated; keyed by userId */
  documentUpload: { windowMs: 60_000, maxRequests: 10 },

  /** Admin mutations — authenticated staff; keyed by staffId */
  adminMutation: { windowMs: 60_000, maxRequests: 60 },

  /** Checkout session — authenticated; keyed by userId */
  checkout: { windowMs: 60_000, maxRequests: 5 },
} as const satisfies Record<string, RateLimitConfig>

/**
 * Extracts a safe IP identifier from a Next.js request.
 * Falls back to "unknown" if no forwarded IP is present.
 *
 * Never stores the full IP address in logs — callers should use it only
 * as an opaque rate-limit key.
 */
export function getClientIp(request: Request): string {
  const forwarded = request instanceof Request
    ? request.headers.get("x-forwarded-for")
    : null
  if (forwarded) {
    // x-forwarded-for can be comma-separated; take first entry
    return forwarded.split(",")[0].trim()
  }
  return "unknown"
}
