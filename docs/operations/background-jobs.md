# Veyra Background Jobs & Asynchronous Processing Architecture

This document defines the architecture, execution engine, retry policy, error-handling mechanisms, and queue semantics for asynchronous background tasks in the Veyra platform.

---

## 1. Background Processing Objectives

Veyra requires background jobs to offload asynchronous, long-running, or time-delayed operations from the critical HTTP request-response path:
1. **Hold Expiry & State Transitions:** Auto-expiring quote reservations in `HELD` or `PAYMENT_PENDING` status past their TTL.
2. **Notification Dispatch:** Sending transactional emails (Resend) and SMS (Twilio / Semaphore PH) without blocking UI responses.
3. **Webhook Processing & Retries:** Replaying failed outgoing or inbound webhooks.
4. **Periodic Financial Reconciliation:** Verifying unsettled payment intents with PayMongo.
5. **Operational Reports & Summaries:** Nightly fleet status snapshots, utilization tracking, and financial reconciliation exports.
6. **Data Retention & Document Purging:** Enforcing compliance purge schedules for expired driver's license photos and audit entries.

---

## 2. Execution Engine Options & Decision

| Mechanism | Suitability for Veyra | Pros | Cons | Recommendation |
|---|---|---|---|---|
| **Postgres pg_cron + Database Functions** | High (for schedule-based jobs) | Runs natively inside Supabase Postgres, zero extra infrastructure, transactional access | Limited to SQL/PLpgSQL or HTTP extensions (`pg_net`), not ideal for complex TypeScript workflows | **Adopt** for scheduled DB state hygiene (TTL expiry, partition management, retention cleanups) |
| **Supabase Edge Functions + Cron (pg_net)** | Medium-High | Deno/TypeScript environment, close to DB, serverless | Cold starts, execution timeout limits (150s), lack of built-in queue persistence | **Adopt** for outbound webhook forwarding and light web calls |
| **Inngest / Quirrel / BullMQ / pgmq** | High (for event-driven reliable workflows) | Durable step execution, built-in retry backoff, dead-lettering, zero Redis overhead if using `pgmq` / Inngest | Requires external service (Inngest) or Postgres extension (`pgmq`) | **Adopt Inngest or pgmq** for durable multi-step workflows (booking confirmation pipeline, payment reconciliation) |

### Recommended Standard Architecture: Hybrid Model
* **Database Maintenance & Expiries:** Supabase `pg_cron` running SQL functions every minute.
* **Complex Transactional Tasks (Email, SMS, Payment Sync):** Event-driven serverless queue (Inngest / Supabase Edge Functions with `pgmq`).

---

## 3. Core Background Job Catalog

### 3.1 Reservation Hold Expiry (`job_expire_stale_holds`)
* **Trigger:** Scheduled every minute via `pg_cron`.
* **SQL Logic:**
  ```sql
  SELECT expire_stale_reservation_holds();
  ```
* **Execution:**
  1. Identifies reservations with `status IN ('HELD', 'PAYMENT_PENDING')` and `hold_expires_at < NOW()`.
  2. Updates reservation status to `'EXPIRED'`.
  3. Releases corresponding `availability_blocks` records associated with the reservation.
  4. Appends entry to `audit_logs` (`action = 'RESERVATION_AUTO_EXPIRED'`).
  5. Emits `reservation.expired` event for telemetry.
* **Idempotency:** Safe to run repeatedly; only rows satisfying `hold_expires_at < NOW()` and active hold status are affected.

---

### 3.2 Transactional Notification Worker (`job_dispatch_notification`)
* **Trigger:** Event-driven upon state machine transition (e.g., `CONFIRMED`, `PICKUP_READY`, `CANCELLED`).
* **Payload:**
  ```json
  {
    "notification_id": "notif_90a82b",
    "recipient_email": "driver@example.ph",
    "recipient_phone": "+639171234567",
    "template": "BOOKING_CONFIRMATION",
    "reservation_id": "res_881923"
  }
  ```
* **Steps:**
  1. Render dynamic template using sanitized reservation context.
  2. Call Email Provider (Resend) API with idempotency key `res_email_{reservation_id}_{template}`.
  3. Call SMS Provider (Semaphore PH / Twilio) API with idempotency key `res_sms_{reservation_id}_{template}`.
  4. Record delivery status and external message ID in `notifications` table.

---

### 3.3 PayMongo Payment Reconciliation (`job_reconcile_unsettled_payments`)
* **Trigger:** Scheduled every 15 minutes.
* **Purpose:** Detects edge cases where a customer paid successfully on PayMongo checkout, but the webhook delivery failed or was dropped.
* **Logic:**
  1. Queries `payments` records with `status = 'PENDING'` created between 15 minutes and 24 hours ago.
  2. Calls PayMongo REST API `GET /v1/payment_intents/{intent_id}` for each record.
  3. If PayMongo status is `succeeded`:
     * Dispatches internal payment success handler (re-triggering transition to `CONFIRMED`).
     * Logs reconciliation audit entry.
  4. If PayMongo status is `failed` or `cancelled`:
     * Marks payment as `FAILED` and cancels or expires reservation.

---

### 3.4 Nightly Fleet Status Snapshot (`job_nightly_fleet_metrics`)
* **Trigger:** Every night at 00:05 PHT (UTC+8).
* **Purpose:** Computes operational utilization rates across all branches and vehicle categories.
* **Output:** Inserts daily aggregation records into `daily_fleet_metrics` (total fleet, operational, rented, in maintenance, utilization percentage).

---

### 3.5 Document Purge & Retention Enforcer (`job_enforce_retention_policy`)
* **Trigger:** Weekly, Sunday at 02:00 PHT.
* **Purpose:** Ensures compliance with Philippine Data Privacy Act (RA 10173).
* **Logic:**
  1. Scans `customer_documents` where customer account was deleted > 30 days ago OR temporary verification uploads older than policy retention threshold.
  2. Deletes binary objects from Supabase Storage private bucket `customer-documents`.
  3. Overwrites file paths with `PURGED_BY_POLICY` and logs audit entry.

---

## 4. Retry Policies & Dead Letter Queue (DLQ)

All asynchronous job handlers must follow exponential backoff to avoid cascading failures during third-party provider outages.

### Standard Retry Policy Matrix

| Job Type | Initial Delay | Max Retries | Backoff Multiplier | DLQ Behavior |
|---|---|---|---|---|
| **Hold Expiry** | None (runs next cron) | N/A (next cycle) | N/A | Alert if cron fails > 3 consecutive runs |
| **Email Delivery** | 30 seconds | 5 retries | 2.0x (30s, 60s, 120s, 240s, 480s) | Route to `failed_notifications` table, flag in admin UI |
| **SMS Delivery** | 60 seconds | 3 retries | 2.5x | Route to `failed_notifications` table |
| **Payment Reconciliation** | 5 minutes | 4 retries | 2.0x | Alert Finance Ops Slack channel |
| **Webhook Processing** | 10 seconds | 7 retries | 2.0x | Store payload in `dead_letter_webhooks` |

### Dead Letter Handling
1. Jobs that exhaust all retry attempts are written to `background_job_failures` with:
   * `job_name`: Identifier
   * `payload`: Full JSON input
   * `error_message`: Stack trace or API rejection response
   * `failed_at`: Timestamp
   * `resolution_status`: `'PENDING' | 'RESOLVED' | 'IGNORED'`
2. Staff with `SUPERADMIN` or `SUPPORT` role can view and click "Replay Job" from the internal admin tooling.

---

## 5. Concurrency & Locking

To prevent race conditions during distributed job execution:
* **Advisory Locks in Postgres:**
  For critical cron jobs, acquire a session-level Postgres advisory lock:
  ```sql
  SELECT pg_try_advisory_lock(hashtext('job_expire_stale_holds'));
  ```
  If lock acquisition returns `false`, skip execution (another worker instance is already running).
* **Row-Level Locks:**
  Use `FOR UPDATE SKIP LOCKED` when pulling batches from queue tables so multiple background workers never process the same record concurrently.
