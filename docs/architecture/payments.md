# Veyra Payment Architecture

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document. PayMongo integrated behind feature flag; currently DEFERRED (`PAYMENTS_ENABLED=false`).
**Date:** September 2026 (Updated October 2026)

> [!NOTE]
> **Active Environment Configuration:**
> In the current development and operational environment, online payment gateway calls are inactive (`PAYMENTS_ENABLED=false`). Reservations are created and confirmed with `payment_status = 'pending'`, and payment is deferred to handover or manual settlement. The PayMongo server-side service and webhook endpoints remain intact and are activated by setting `PAYMENTS_ENABLED=true` alongside valid provider credentials.

---

## 1. Provider Boundary

**PayMongo is the candidate payment provider** for the Philippines market. This document treats PayMongo as the provider but intentionally abstracts the integration so the provider can change with minimal application-layer impact.

**The payment provider is responsible for:**
- PCI DSS compliance for card data
- Payment intent creation
- Authorization and capture
- Refund processing
- Webhook event delivery

**Veyra is responsible for:**
- Creating payment intents via the provider API (server-side only)
- Receiving and authenticating provider webhooks
- Storing payment status in its own database
- Reconciling provider records with internal records
- Never storing raw card data

---

## 2. Payment Flow

### 2.1 Rental Payment (Pre-Rental Authorization)

```
1. Customer confirms reservation (held state)
2. Server: createPaymentIntent(amount, currency, metadata)
   → POST to PayMongo API (server-side only, never client-side)
   → Returns payment_intent_id and client_key
3. Server: stores payment record (status = 'pending')
4. Server: returns client_key to browser (safe to expose)
5. Browser: loads PayMongo Elements UI with client_key
6. Customer: enters card details
7. PayMongo: processes payment
8. PayMongo: delivers webhook to /api/webhooks/paymongo
9. Server: validates webhook signature
10. Server: updates payment record (status = 'authorized' or 'captured')
11. Server: transitions reservation to 'confirmed'
12. Server: sends confirmation email
```

### 2.2 Security Deposit (At Pickup)

```
1. Staff at hub initiates deposit authorization via admin panel
2. Server: creates deposit authorization intent
3. Customer: taps/presents card at terminal (or staff enters)
4. PayMongo: authorizes hold (no immediate charge)
5. Webhook: deposit.authorized → deposits record status = 'authorized'
6. Reservation proceeds to 'active'
```

### 2.3 Refund Flow

```
1. Eligible event: cancellation, clean return, dispute resolution
2. Staff/admin initiates refund in admin panel
3. Server: validates refund eligibility (checks cancellation policy)
4. Server: creates refund via PayMongo API
   POST /v1/refunds { payment_id, amount, reason }
5. Server: stores refund record (status = 'pending')
6. PayMongo: processes refund
7. Webhook: refund.succeeded or refund.failed
8. Server: updates refund record accordingly
9. Customer: notified of refund status
```

---

## 3. Webhook Architecture

### 3.1 Webhook Endpoint

```
POST /api/webhooks/paymongo
```

**Signature verification:** Every incoming webhook must be verified using PayMongo's webhook secret. Requests with invalid signatures are rejected with HTTP 400.

### 3.2 Processing Pipeline

```
1. RECEIVE: HTTP POST arrives at /api/webhooks/paymongo
2. AUTHENTICATE: Verify PayMongo-Signature header
   → If invalid: return HTTP 400, log, stop
3. PARSE: Extract event type and payload
4. DEDUPLICATE: Check webhook_events table for provider_event_id
   → If already exists: return HTTP 200 (idempotent acknowledgment), stop
5. PERSIST: Insert webhook_events record (status = 'received')
6. PROCESS: Apply business logic based on event_type
   → payment.paid → confirm reservation, update payment record
   → payment.failed → fail reservation, release inventory
   → refund.succeeded → update refund record, notify customer
   → refund.failed → alert finance team
7. UPDATE: Mark webhook_events record as 'processed'
8. RESPOND: HTTP 200
```

**Critical:** Return HTTP 200 as soon as the webhook is persisted and acknowledged. Business processing failures must not cause webhook retry loops — they should be handled via internal retry/alert mechanisms.

### 3.3 Idempotency

The `webhook_events` table has a unique constraint on `(provider, provider_event_id)`. If PayMongo delivers the same event twice, the second delivery finds the existing record and returns 200 without reprocessing.

---

## 4. Payment State Machine

```
pending
  │
  ├─→ authorized   (pre-auth hold confirmed)
  │     │
  │     └─→ captured     (funds collected)
  │           │
  │           ├─→ refunded          (full refund)
  │           └─→ partially_refunded (partial refund)
  │
  └─→ failed       (payment declined or error)
```

State transitions are always server-side, triggered by webhook events. No client-side payment status is trusted.

---

## 5. Idempotency Keys

Payment intent creation uses idempotency keys to prevent duplicate charges:

```
idempotency_key = sha256(reservation_id + '_payment_' + attempt_number)
```

- Stored in `payments.idempotency_key`
- Passed to PayMongo as `Idempotency-Key` header
- If the server crashes after creating the intent but before storing it, the retry with the same key returns the existing intent without creating a new charge

---

## 6. Failure Recovery

| Failure Scenario | Recovery |
|---|---|
| Server creates payment intent, crashes before storing it | Retry with same idempotency key — PayMongo returns same intent; server stores it |
| PayMongo confirms payment, webhook delivery fails | PayMongo retries webhooks up to 24 hours; Supabase record remains 'pending'; cron reconciliation job detects mismatch and reprocesses |
| Webhook received, database write fails | Webhook remains unprocessed; cron retries failed webhook_events |
| Refund initiated, PayMongo API unavailable | Refund record created as 'pending'; retry job attempts later |
| Payment authorized, reservation creation fails | Payment capture not triggered; authorization expires after 7 days; customer not charged |

---

## 7. Reconciliation

A scheduled reconciliation job (e.g., daily) must:

1. Query PayMongo's transaction ledger for the previous 24 hours
2. Compare against Veyra's `payments` table
3. Flag any discrepancies (amounts, statuses, missing records)
4. Alert the finance team of any unresolvable mismatches

Do not rely solely on webhook delivery for financial accuracy.

---

## 8. Prohibited Practices

- **Never store:** raw card numbers, CVV/CVC, full PANs, magnetic stripe data
- **Never compute payment amounts client-side** and trust them for processing
- **Never trust browser redirects** as proof of payment (redirect can be spoofed)
- **Never skip webhook signature verification**
- **Never mark a reservation as confirmed without a verified webhook** (or explicit staff override with audit trail)

---

## 9. Security Deposit vs Rental Payment

These are distinct payment intents with distinct records:

| | Rental Payment | Security Deposit |
|---|---|---|
| When created | At booking confirmation | At vehicle pickup |
| Amount | `quote.total_rental` | `quote.security_deposit` |
| Intent type | Immediate capture | Authorization hold |
| Database table | `payments` | `deposits` |
| Release | Not released (it's a payment) | Released after clean return |
| Partial | Possible for partial refunds | Possible for damage charges |
