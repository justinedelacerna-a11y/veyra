# Veyra Threat Model

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document.
**Date:** September 2026

---

## Threat Classification

Each threat documents: asset, attack surface, mitigation, enforcement location, and test strategy.

---

## T-001: Broken Object-Level Authorization (BOLA / IDOR)

**Asset:** Customer reservations, payments, documents
**Attack:** Customer A requests `GET /api/reservations/[id]` using Customer B's reservation ID
**Enforcement:**
- Application layer: service functions check `customer_id = authenticated customer's ID`
- RLS: `reservations` SELECT policy requires `customer_id` match
**Mitigation:**
- Never use predictable sequential IDs in URLs (UUIDs mitigate enumeration)
- All resource access checks resource ownership, not just authentication
**Test strategy:** Unit tests for every service function; integration tests with two distinct customer sessions attempting cross-access; RLS regression tests

---

## T-002: Role Escalation

**Asset:** Admin panel functionality, staff roles
**Attack:** A `branch_staff` user manipulates a request to perform a `superadmin` action (e.g., refunding a payment, deleting a user)
**Enforcement:**
- Middleware: validates Clerk session on every request
- Service layer: checks `staff_users.role` from PostgreSQL (not a client claim)
- Role stored in PostgreSQL, not in a modifiable client token
**Mitigation:**
- Roles sourced from database at request time, not from JWT `app_metadata` alone
- JWT `app_metadata` is supplementary — database is authoritative
- Audit trail for all privileged operations
**Test strategy:** Attempt every admin operation with a lower-privileged session; verify 403 responses; verify audit events for failed attempts

---

## T-003: Price Manipulation

**Asset:** Payment amounts
**Attack:** Customer submits a manipulated price in a booking request (e.g., changing `totalAmount: 1` in the request body)
**Enforcement:**
- Server calculates quote independently; never trusts client-submitted amounts
- Payment intent is created by the server using `quotes.total_rental` — the client never provides the amount to charge
- Quote is created and stored server-side; booking references the quote ID
**Mitigation:**
- No client-submitted price field is ever processed
- Quote is immutable after creation
- Payment intent amount = quote amount (server-computed)
**Test strategy:** Submit booking requests with manipulated amounts; verify server ignores client amounts; verify payment intent amount always matches server quote

---

## T-004: Double Booking

**Asset:** Vehicle inventory
**Attack:** Two simultaneous requests both successfully reserve the same vehicle for overlapping dates
**Enforcement:**
- `SELECT ... FOR UPDATE` on the vehicle row during hold creation
- Database transaction encompasses: conflict check + reservation insert
- Concurrent requests for the same vehicle block until the first commits
**Mitigation:**
- Atomic transaction prevents race conditions
- `(vehicle_id, pickup_at, return_at)` indexed for fast conflict detection
- Hold TTL prevents abandoned holds from blocking inventory permanently
**Test strategy:** Concurrent load test: 50 simultaneous requests for the same vehicle and date range; verify only one succeeds; verify no orphaned holds after failures

---

## T-005: Payment Replay / Duplicate Charge

**Asset:** Customer payment
**Attack:** A payment webhook is delivered twice; customer is charged twice
**Enforcement:**
- `webhook_events` table has unique constraint on `(provider, provider_event_id)`
- Duplicate webhooks are detected on receipt and acknowledged without reprocessing
- Payment intents use idempotency keys at the provider level
**Mitigation:**
- Idempotency keys prevent duplicate intents at the provider
- Deduplication in webhook handler prevents duplicate processing
**Test strategy:** Replay the same webhook event twice to `/api/webhooks/paymongo`; verify second request returns 200 without creating a duplicate payment record

---

## T-006: Webhook Authentication Bypass

**Asset:** Reservation status, payment records
**Attack:** Malicious actor sends a forged webhook claiming payment was successful
**Enforcement:**
- Every webhook validated against PayMongo's signature using the webhook secret
- Requests with missing or invalid signatures are rejected with HTTP 400
- Webhook secret is stored as an environment variable (never in code or logs)
**Mitigation:**
- No fallback path that skips signature verification
- Signature check is the first operation, before any state mutation
**Test strategy:** Send forged webhooks with invalid signatures; verify they are rejected with 400 and no state is changed

---

## T-007: Coupon / Promotion Abuse

**Asset:** Discount codes, pricing
**Attack:** Customer uses a single-use coupon multiple times, or uses a coupon before its valid window
**Enforcement:**
- Coupon validation is server-side only
- Single-use coupons: marked as redeemed atomically during quote creation
- Redemption check and marking are within the same database transaction
**Mitigation:**
- Coupon redemption uses a unique constraint on `(coupon_id, customer_id)` for per-customer limits
- Transaction ensures check-then-mark is atomic (no TOCTOU)
**Test strategy:** Attempt to use the same coupon twice concurrently; verify only one succeeds

---

## T-008: Unauthorized Document Access

**Asset:** Customer identity documents (highly sensitive)
**Attack:** Unauthorized user retrieves a signed URL for another customer's document, or accesses the private bucket directly
**Enforcement:**
- Private Storage buckets have no public policies — no anonymous access
- Signed URLs generated only after server-side authorization check
- Signed URL TTL is 15 minutes maximum
- Storage path is never exposed in API responses
**Mitigation:**
- Direct bucket access returns 403 without a valid signed URL
- Signed URLs are time-limited and path-specific
- Audit trail for every signed URL issuance
**Test strategy:** Attempt to access private bucket without signed URL (expect 403); use expired signed URL (expect 403); attempt to generate signed URL for another customer's document (expect 403 at service layer)

---

## T-009: Sensitive Data Leakage via API Response

**Asset:** Payment details, document paths, internal notes
**Attack:** API response includes fields that should not be exposed (e.g., storage path, internal notes, full payment reference)
**Enforcement:**
- All API responses use explicit serialization (allowlist of fields)
- No ORM `toJSON()` or `SELECT *` in public-facing routes
- Sensitive fields: `storage_path`, `internal_notes`, `provider_payment_id` — excluded from customer-facing responses
**Mitigation:**
- Define explicit response schemas (TypeScript types) for every API route
- Review DTOs (Data Transfer Objects) during code review
**Test strategy:** Inspect all customer-facing API responses for unexpected fields; automated schema validation tests

---

## T-010: File Upload Attack

**Asset:** Server, storage, customers
**Attack:** Customer uploads a malicious file (script, executable, oversized file) disguised as a document
**Enforcement:**
- Server validates MIME type by reading file content (not trusting `Content-Type` header)
- File extension validated against allowlist
- File size enforced at route handler level before storage
- Server-generated filename replaces client-provided filename
- Future: virus scan integration
**Mitigation:**
- Files are stored in private buckets (not web-accessible directories)
- Files are never served with executable content types
- Future: ClamAV or equivalent scanning before accepting uploads
**Test strategy:** Upload files with mismatched MIME types; upload oversized files; upload files with path traversal in filenames; verify all are rejected

---

## T-011: Credential Abuse / Secret Exposure

**Asset:** Supabase service_role key, Clerk secret key, PayMongo keys
**Attack:** A secret is accidentally committed to source code, logged, or exposed in a Next.js `NEXT_PUBLIC_` variable
**Enforcement:**
- `.env.local` in `.gitignore`
- `.env.example` contains only placeholder values
- No secret key is ever assigned to a `NEXT_PUBLIC_` variable
- Application code reviewed for accidental logging of environment variables
**Mitigation:**
- Git pre-commit hook to scan for secret patterns (future)
- Secret scanning in CI pipeline (future)
- Rotation plan: if a key is ever exposed, rotate immediately
**Test strategy:** Review all `NEXT_PUBLIC_` env vars; grep codebase for secret key patterns; verify no secrets in logs

---

## T-012: Rate Abuse / Reservation Flooding

**Asset:** Inventory, server resources
**Attack:** Automated script creates thousands of holds for the same vehicles, exhausting inventory without intent to pay
**Enforcement:**
- Hold creation requires authenticated session (Clerk)
- Per-customer rate limiting on hold creation (future: Redis-based)
- Holds expire after 15 minutes and release inventory automatically
**Mitigation:**
- Authentication requirement raises the cost of abuse
- TTL-based automatic release prevents permanent inventory exhaustion
- Future: CAPTCHA or bot detection on the booking form
**Test strategy:** Attempt rapid hold creation from the same account; verify rate limiting triggers; verify inventory is released after TTL

---

## T-013: Staff Account Compromise

**Asset:** Customer data, financial records, operations
**Attack:** A staff account is compromised; attacker exfiltrates customer data or manipulates reservations
**Enforcement:**
- MFA required for all staff accounts (Clerk MFA configuration)
- Branch-scoped staff cannot access other branches' data
- All staff actions are audited
- Finance operations require `finance` or `admin` role
**Mitigation:**
- Session revocation on suspicious activity
- Anomalous query volume detection (future)
- Audit log review (superadmin responsibility)
**Test strategy:** Verify MFA is enforced for staff accounts; verify audit events are created for all staff operations

---

## T-014: Inspection / Damage Fabrication

**Asset:** Customer deposit, trust
**Attack:** Staff falsely records damage on a vehicle to forfeit a customer's deposit
**Enforcement:**
- Inspection records timestamped at creation (immutable)
- Photo documentation required for damage reports
- Damage charge disputes routed to admin review (`disputed` state)
- Audit trail captures inspector_id on every inspection record
**Mitigation:**
- Customer can contest damage via dispute flow
- Finance/admin must approve damage charges over a threshold
- All inspection records are tied to staff identity via `inspector_id`
**Test strategy:** Verify inspection records cannot be backdated; verify damage charges require approval; verify audit events capture inspector identity
