# Veyra Reservation State Machine

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document.
**Date:** September 2026

---

## 1. State Definitions

| State | Code | Description |
|---|---|---|
| Draft | `draft` | Customer is building the booking but has not submitted it |
| Quote Created | `quote_created` | Server has generated an authoritative price quote |
| Held | `held` | Inventory temporarily reserved while customer completes payment |
| Payment Pending | `payment_pending` | Payment intent created; awaiting provider confirmation |
| Confirmed | `confirmed` | Payment authorized; reservation is locked |
| Pickup Ready | `pickup_ready` | Staff has acknowledged and prepared the vehicle |
| Active | `active` | Vehicle has been handed over; rental is in progress |
| Return Inspection | `return_inspection` | Vehicle returned; post-trip inspection in progress |
| Completed | `completed` | Inspection passed, deposit released, reservation closed |

**Terminal failure states:**

| State | Code | Description |
|---|---|---|
| Expired | `expired` | Hold or quote elapsed without payment |
| Payment Failed | `payment_failed` | Payment was declined or failed |
| Cancelled | `cancelled` | Cancelled by customer or staff |
| No Show | `no_show` | Customer did not appear for pickup |
| Disputed | `disputed` | Reservation flagged for dispute resolution |

---

## 2. State Transition Diagram

```
                     ┌──────────────────┐
                     │      draft       │
                     └────────┬─────────┘
                              │  createQuote()
                     ┌────────▼─────────┐
                     │  quote_created   │◄─── 30-minute TTL
                     └────────┬─────────┘
                              │  holdInventory()
                    ┌─────────▼────────┐
              ┌─────►      held        │◄─── 15-minute TTL
              │     └─────────┬────────┘
              │               │  createPaymentIntent()
              │     ┌─────────▼──────────┐
              │     │  payment_pending   │◄─── Awaiting webhook
              │     └────┬──────────┬───┘
              │          │          │
              │   webhook │  failure │
              │  payment  │  timeout │
              │    .paid  │          │
              │  ┌────────▼──┐  ┌───▼──────────┐
              └──┤ confirmed │  │payment_failed│
                 └────────┬──┘  └──────────────┘
                          │  staffAcknowledges()
                 ┌────────▼──────────┐
                 │  pickup_ready     │
                 └────────┬──────────┘
                          │  recordPickup()
                 ┌────────▼──────────┐
                 │      active       │
                 └────────┬──────────┘
                          │  recordReturn()
                 ┌────────▼──────────────┐
                 │  return_inspection    │
                 └────────┬──────────────┘
                          │  completeInspection()
                 ┌────────▼──────────┐
                 │    completed      │
                 └───────────────────┘

─── Cancellation paths ─────────────────────────────────────
draft           → cancelled  (customer or timeout)
quote_created   → cancelled  (customer or timeout → expired)
held            → expired    (TTL elapsed)
confirmed       → cancelled  (customer before pickup, within policy)
pickup_ready    → no_show   (customer did not appear)
active          → disputed   (unresolvable issue flagged)
```

---

## 3. Allowed Transitions

| From | To | Triggered By | Side Effects |
|---|---|---|---|
| `draft` | `quote_created` | Customer submits booking request | Server creates quote snapshot; availability check run |
| `quote_created` | `held` | Customer confirms quote | Inventory hold created; hold TTL started (15 min) |
| `quote_created` | `expired` | Hold TTL elapsed | Inventory released; customer notified |
| `held` | `payment_pending` | Customer initiates payment | Payment intent created at provider |
| `held` | `expired` | TTL elapsed without payment initiation | Inventory released |
| `payment_pending` | `confirmed` | PayMongo webhook `payment.paid` | Payment record captured; reservation confirmed; customer notified |
| `payment_pending` | `payment_failed` | PayMongo webhook `payment.failed` | Inventory released; customer notified |
| `confirmed` | `cancelled` | Customer (within policy window) or Admin | Refund initiated; inventory released; customer notified |
| `confirmed` | `pickup_ready` | Branch staff action | Vehicle prep check; customer reminder sent |
| `pickup_ready` | `active` | Branch staff records pickup | Pre-trip inspection created; odometer logged; actual_pickup_at set |
| `pickup_ready` | `no_show` | Branch staff marks no-show | Deposit may be retained per policy; customer notified |
| `active` | `return_inspection` | Branch staff records vehicle return | actual_return_at set; post-trip inspection initiated |
| `return_inspection` | `completed` | Branch staff completes inspection (no new damage) | Deposit released; final invoice generated; customer notified |
| `return_inspection` | `disputed` | Damage found, customer contests charge | Manual review required; deposit held |
| `disputed` | `completed` | Finance/admin resolves dispute | Appropriate charges/releases applied |
| `cancelled` | — | Terminal state | — |
| `completed` | — | Terminal state | — |
| `expired` | — | Terminal state | — |
| `no_show` | — | Terminal state | — |

---

## 4. Invalid Transitions

The following transitions are explicitly forbidden and must be rejected by the state machine:

- `completed` → any state
- `cancelled` → any state
- `expired` → any state
- `active` → `confirmed` (cannot go backwards)
- `draft` → `active` (steps cannot be skipped)
- Any transition not listed in the allowed table above

The server must validate the current state before applying any transition. Invalid transitions return a 409 Conflict with the current state in the error body.

---

## 5. Who Can Trigger Each Transition

| Transition | Customer | Branch Staff | Branch Manager | Admin | System |
|---|:---:|:---:|:---:|:---:|:---:|
| draft → quote_created | ✅ | ❌ | ❌ | ✅ | ❌ |
| quote_created → held | ✅ | ❌ | ❌ | ✅ | ❌ |
| quote_created → expired | ❌ | ❌ | ❌ | ❌ | ✅ |
| held → payment_pending | ✅ | ❌ | ❌ | ✅ | ❌ |
| held → expired | ❌ | ❌ | ❌ | ❌ | ✅ |
| payment_pending → confirmed | ❌ | ❌ | ❌ | ❌ | ✅ (webhook) |
| payment_pending → payment_failed | ❌ | ❌ | ❌ | ❌ | ✅ (webhook) |
| confirmed → cancelled | ✅ (policy) | ❌ | ✅ | ✅ | ❌ |
| confirmed → pickup_ready | ❌ | ✅ | ✅ | ✅ | ❌ |
| pickup_ready → active | ❌ | ✅ | ✅ | ✅ | ❌ |
| pickup_ready → no_show | ❌ | ✅ | ✅ | ✅ | ❌ |
| active → return_inspection | ❌ | ✅ | ✅ | ✅ | ❌ |
| return_inspection → completed | ❌ | ✅ | ✅ | ✅ | ❌ |
| return_inspection → disputed | ❌ | ✅ | ✅ | ✅ | ❌ |
| disputed → completed | ❌ | ❌ | ❌ | ✅ | ❌ |

**System** = automated process triggered by webhook, cron, or TTL expiry.

---

## 6. Audit Requirements

Every state transition must create an `audit_events` record containing:

- `actor_id` — who triggered it (user ID or system user ID)
- `action` — `reservation.status_changed`
- `resource_type` — `reservation`
- `resource_id` — the reservation ID
- `before_state` — `{ "status": "previous_state" }`
- `after_state` — `{ "status": "new_state" }`
- `result` — `success` or `failure`
- `details` — human-readable explanation

Audit events for financial transitions (`payment_pending → confirmed`, deposit release) must also include relevant payment reference data.

---

## 7. TTL Expiry Strategy

Hold expiry is managed by a background cron job:

```
Every 5 minutes:
  SELECT id FROM reservations
  WHERE status IN ('held', 'quote_created')
    AND updated_at < NOW() - INTERVAL '15 minutes'  -- held TTL
    -- or quote TTL depending on status
  FOR UPDATE SKIP LOCKED;

  For each: transition to expired, release inventory block
```

`FOR UPDATE SKIP LOCKED` prevents concurrent workers from processing the same reservation.
