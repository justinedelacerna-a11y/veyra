# Veyra Webhook Architecture

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document.
**Date:** September 2026

---

## 1. Principles

- **Never trust browser redirects as financial proof.** A user redirected to `/booking/confirmation` by the payment provider could have manipulated the URL or interrupted the flow. The reservation is only confirmed upon a verified webhook — not a redirect.
- **Webhooks are idempotent.** The same event delivered twice produces the same outcome.
- **Webhooks are persisted before processing.** If processing fails, the raw event is preserved for retry.
- **Provider-signed signatures are verified before any state change.**

---

## 2. Inbound Webhook Providers

| Provider | Purpose | Endpoint |
|---|---|---|
| PayMongo | Payment events | `POST /api/webhooks/paymongo` |
| Clerk | User lifecycle events | `POST /api/webhooks/clerk` |

---

## 3. Processing Pipeline (All Providers)

```
Step 1: RECEIVE
  - Incoming HTTP POST
  - Log provider, timestamp, raw headers

Step 2: AUTHENTICATE
  - Verify provider signature using shared secret
  - PayMongo: HMAC-SHA256 of raw body using webhook secret
  - Clerk: svix signature verification using Clerk webhook secret
  - REJECT with HTTP 400 if signature invalid
  - DO NOT process anything before this step passes

Step 3: PARSE
  - Extract: provider_event_id, event_type, payload
  - Validate JSON structure

Step 4: DEDUPLICATE
  - Query: SELECT id FROM webhook_events
             WHERE provider = $provider
               AND provider_event_id = $event_id
  - If found: return HTTP 200 immediately (already processed)
  - If not found: proceed

Step 5: PERSIST
  - INSERT into webhook_events (status = 'received')
  - This write happens BEFORE any business logic
  - If INSERT fails (db error): return HTTP 500 (provider will retry)

Step 6: PROCESS (within a database transaction)
  - Apply business logic based on event_type
  - On success: UPDATE webhook_events SET status = 'processed'
  - On failure: UPDATE webhook_events SET status = 'failed', failure_reason = ...

Step 7: RESPOND
  - HTTP 200 regardless of processing outcome
  - Never return 4xx/5xx for processing failures (triggers unnecessary retries)
  - Only return non-200 for: signature failure (400), persistence failure (500)
```

---

## 4. PayMongo Event Handlers

### `payment.paid`
```
Business logic:
1. Fetch reservation by provider_payment_id (from payment record)
2. Verify amount matches expected amount in quotes table
3. Transition: payment_pending → confirmed
4. Update payments.status = 'captured'
5. Create audit event: payment.captured
6. Dispatch notification: ReservationConfirmed (email + SMS)
```

### `payment.failed`
```
Business logic:
1. Fetch reservation by provider_payment_id
2. Transition: payment_pending → payment_failed
3. Update payments.status = 'failed', failure_reason = ...
4. Release inventory (reservation no longer blocks)
5. Create audit event: payment.failed
6. Dispatch notification: PaymentFailed (email)
```

### `refund.succeeded`
```
Business logic:
1. Fetch refund record by provider_refund_id
2. Update refunds.status = 'completed'
3. If full refund: update payments.status = 'refunded'
4. If partial: update payments.status = 'partially_refunded'
5. Create audit event: payment.refund_completed
6. Dispatch notification: RefundIssued (email)
```

### `refund.failed`
```
Business logic:
1. Fetch refund record by provider_refund_id
2. Update refunds.status = 'failed'
3. Alert finance team (internal notification)
4. Create audit event: payment.refund_failed
5. Manual investigation required
```

---

## 5. Clerk Event Handlers

### `user.created`
```
Business logic:
1. Extract: clerk_id, email, first_name, last_name from event
2. Create users record (user_type = 'customer' by default)
3. Create customers record with defaults
4. Create audit event: user.created
```

### `user.updated`
```
Business logic:
1. Find users record by clerk_id
2. Sync: email, email_verified
3. Sync to customers: name if changed
4. Create audit event: user.updated (only if meaningful fields changed)
```

### `user.deleted`
```
Business logic:
1. Find users record by clerk_id
2. Set users.deleted_at = NOW()
3. Set users.status = 'deleted'
4. Do NOT delete customers record (needed for historical reservations)
5. Create audit event: user.deleted
```

---

## 6. Retry Strategy

For `status = 'failed'` webhook events, a background cron job retries processing:

```
Every 10 minutes:
  SELECT * FROM webhook_events
  WHERE status = 'failed'
    AND retry_count < 5
    AND created_at > NOW() - INTERVAL '24 hours'
  FOR UPDATE SKIP LOCKED;

  For each: re-run business logic, increment retry_count
```

After 5 failed retries: status = 'dead_lettered', alert engineering team.

---

## 7. Security Requirements

| Requirement | Implementation |
|---|---|
| Signature verification | HMAC-SHA256 (PayMongo); svix (Clerk) |
| Webhook secret storage | Environment variable only — never in code or database |
| Raw body preservation | Read as Buffer before parsing JSON (signature depends on raw body) |
| IP allowlisting | Optional future hardening: restrict to PayMongo/Clerk IP ranges |
| Replay protection | Timestamp check: reject events older than 5 minutes (future) |

---

## 8. Failure Recovery Scenarios

| Scenario | Response | Recovery |
|---|---|---|
| DB down when webhook arrives | Return HTTP 500 | Provider retries; DB recovers; event processed |
| Processing error after persistence | webhook_events.status = failed | Cron retry job |
| Provider sends duplicate event | Deduplication at Step 4 | Return 200, skip processing |
| Event arrives out of order | Process against current DB state | Design idempotent handlers |
| Webhook secret rotated | Old events fail signature check | Rotate in provider dashboard + env var simultaneously |

---

## 9. Monitoring

Alerts should be configured for:
- `webhook_events.status = 'failed'` count > threshold
- `webhook_events.retry_count >= 5` (dead-lettered events)
- PayMongo dashboard webhook delivery failure rate
- Clerk dashboard webhook delivery failure rate
