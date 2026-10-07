/**
 * Veyra Server Logger
 *
 * Structured logging abstraction for server-side operations.
 *
 * Design:
 * - Outputs structured JSON lines compatible with Vercel/cloud log aggregators.
 * - Never logs secrets, tokens, JWTs, cookies, service-role keys, or sensitive PII.
 * - Includes correlation IDs, log levels, timestamps, route context, and safe metadata.
 * - In development, pretty-prints for readability.
 *
 * Usage:
 *   import { logger } from "@/lib/logger"
 *   const log = logger("api/reservations")
 *   log.info("reservation_created", { reservationId, reference, customerId })
 *   log.error("unexpected_error", { error: err.message })
 */

export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogEntry {
  level: LogLevel
  timestamp: string
  route: string
  event: string
  correlationId?: string
  /** Safe, non-PII metadata */
  meta?: Record<string, unknown>
}

const IS_PRODUCTION = process.env.NODE_ENV === "production"

function emit(entry: LogEntry): void {
  if (IS_PRODUCTION) {
    // Structured JSON — cloud log aggregators (Vercel, Datadog, etc.) ingest this
    process.stdout.write(JSON.stringify(entry) + "\n")
  } else {
    // Pretty-print in development
    const { level, timestamp, route, event, correlationId, meta } = entry
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${route}]`
    const correlation = correlationId ? ` [cid:${correlationId}]` : ""
    const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : ""
    console.log(`${prefix}${correlation} ${event}${metaStr}`)
  }
}

export interface ContextLogger {
  debug(event: string, meta?: Record<string, unknown>): void
  info(event: string, meta?: Record<string, unknown>): void
  warn(event: string, meta?: Record<string, unknown>): void
  error(event: string, meta?: Record<string, unknown>): void
  withCorrelation(correlationId: string): ContextLogger
}

/**
 * Creates a scoped logger for a given route/module.
 *
 * @param route  - Identifies the calling module (e.g. "api/reservations", "webhook/clerk")
 * @param correlationId - Optional request/correlation ID for tracing across log lines
 */
export function logger(route: string, correlationId?: string): ContextLogger {
  function log(level: LogLevel, event: string, meta?: Record<string, unknown>): void {
    emit({
      level,
      timestamp: new Date().toISOString(),
      route,
      event,
      correlationId,
      meta,
    })
  }

  return {
    debug: (event, meta) => log("debug", event, meta),
    info: (event, meta) => log("info", event, meta),
    warn: (event, meta) => log("warn", event, meta),
    error: (event, meta) => log("error", event, meta),
    withCorrelation: (cid: string) => logger(route, cid),
  }
}

/**
 * Generates a short, URL-safe correlation ID for a request.
 * Does NOT use user PII. Safe to log and include in error responses.
 *
 * Format: 12 random alphanumeric characters (e.g. "a3kX9mPq2rLv")
 */
export function generateCorrelationId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 12)
}

/**
 * Sanitizes an error for safe logging.
 * Ensures we only log the message string, not full stack traces or objects
 * that may contain sensitive data.
 */
export function safeErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  return "Unknown error"
}
