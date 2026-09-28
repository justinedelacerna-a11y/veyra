# ADR-001: Application Architecture — Modular Monolith

**Date:** September 2026
**Status:** Accepted

---

## Context

Veyra is a car-rental platform with customer-facing, admin-facing, and operational modules. The engineering team is small. The platform is pre-production. We need to choose between microservices, a modular monolith, or a simple monolith.

## Decision

Adopt a **modular monolith** deployed as a single Next.js application.

Business domains (reservations, pricing, fleet, payments, notifications) are organized as clearly separated feature modules within the monolith, but all run in the same process and share a single PostgreSQL database.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Microservices | Premature operational complexity; small team; no demonstrated scaling need |
| Simple monolith (no module boundaries) | Hard to maintain as features grow; poor separation of concerns |
| Separate API server + Next.js frontend | Extra operational overhead with no current benefit; Next.js Route Handlers and Server Actions are sufficient |

## Consequences

- Single deployment unit (low operational overhead)
- Module boundaries enforced by TypeScript imports and directory structure, not network
- If a domain requires independent scaling later (e.g., notifications become high-volume), it can be extracted to a separate service at that point
- Shared database simplifies transactions (critical for availability and payment atomicity)

---

# ADR-002: Clerk Identity Model

**Date:** September 2026
**Status:** Accepted

---

## Context

Veyra needs authentication for both customers and staff. Building authentication in-house (password hashing, session management, MFA, OAuth) is high-risk and time-consuming for a small team.

## Decision

Delegate all authentication to **Clerk**. Veyra stores application-level authorization data (roles, branch assignments, profile data) in its own PostgreSQL database, keyed by `clerk_id`.

Application roles and permissions are **not** stored in Clerk. Clerk is used exclusively for identity verification and session management.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Supabase Auth | We are using Clerk for richer auth UX; two auth systems would conflict |
| Custom auth | High security risk; significant development time; MFA, OAuth are pre-built in Clerk |
| Full Clerk Organizations for roles | Clerk Orgs map to multi-tenancy; Veyra's branch-scoped model is more nuanced than Clerk Orgs natively supports |

## Consequences

- Clerk user lifecycle events (created, updated, deleted) must be handled via webhooks to keep Veyra's database in sync
- Integration uses **Supabase Native Third-Party Auth** (`[auth.third_party.clerk]` via Clerk Domain). The legacy Clerk JWT-template integration (deprecated as of April 1, 2025) is NOT used.
- Application-level roles, permissions, and branch assignments are stored and evaluated authoritatively in PostgreSQL (`roles`, `staff_profiles`), mapped via `users.clerk_user_id = (auth.jwt() ->> 'sub')`.
- If Clerk is unavailable, authentication fails but no user data is at risk

---

# ADR-003: Supabase as Primary Data Store

**Date:** September 2026
**Status:** Accepted

---

## Context

Veyra needs a durable, relational database for reservations, fleet, payments, and customer data. It also needs private file storage and eventually real-time features.

## Decision

Use **Supabase** as the primary data platform: PostgreSQL database, Supabase Storage, and future real-time subscriptions.

The application uses the **service_role key exclusively on the server**. No client-side Supabase queries are used (even via the anon key) except for the public vehicle photo bucket.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Hosted PostgreSQL (Neon, Railway) | Supabase adds Storage, RLS, and CLI tooling we need |
| PlanetScale / MySQL | Relational needs (FKs, complex joins) are better on PostgreSQL |
| MongoDB | Document model is not well-suited for financial relational data |

## Consequences

- RLS must be carefully designed for Clerk-issued JWTs (not Supabase Auth JWTs)
- Supabase Storage used for private documents (signed URLs required)
- The `anon` key is exposed in `NEXT_PUBLIC_SUPABASE_ANON_KEY` — this is safe IF RLS is enabled and properly tested on every table

---

# ADR-004: Availability Concurrency Strategy

**Date:** September 2026
**Status:** Accepted

---

## Context

Two customers booking the same vehicle at the same time could both see it as available and both create reservations, resulting in a double booking — which is catastrophic for a guaranteed-model rental service.

## Decision

Use **pessimistic locking with `SELECT ... FOR UPDATE`** on the `vehicles` row when creating a reservation hold.

The full atomicity sequence: lock vehicle row → check overlapping reservations → insert hold reservation → commit. Concurrent requests for the same vehicle block until the first transaction commits.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Optimistic locking (version counter) | Results in retry loops under contention; poor UX; complex client |
| Separate "holds" table with unique constraint | Correct, but adds complexity; the reservation row itself serves as the hold |
| Eventual consistency | Unacceptable for inventory blocking in a paid service |

## Consequences

- Under high contention on a single vehicle, requests queue at the database
- For Veyra's expected initial volume (tens/day, not thousands/second), this is acceptable
- TTL expiry (15-minute hold) prevents inventory starvation
- If load scales dramatically, consider a distributed lock (Redis Redlock) — revisit then

---

# ADR-005: Server-Authoritative Pricing

**Date:** September 2026
**Status:** Accepted

---

## Context

The current frontend computes prices in `src/features/booking/lib/pricing.ts`. This is a prototype design. In production, trusting client-computed prices creates a trivial price manipulation attack surface.

## Decision

All authoritative pricing is computed by the **server's quote engine**. The client sends selections; the server returns a quote with prices. The client displays the server's numbers without modification. Payment amounts are taken from the server-stored quote — never from client input.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Trust client-computed price | Trivially exploitable; non-negotiable security violation |
| Compute price at payment time (no quote) | Cannot show customer the price before payment; bad UX |

## Consequences

- A `quotes` table is required to store the price snapshot
- Quote has a 30-minute TTL to prevent stale pricing
- Reservation creation references the quote — not a client-submitted amount
- Historical reservations always have a quote record preserving the agreed price

---

# ADR-006: Reservation State Machine

**Date:** September 2026
**Status:** Accepted

---

## Context

A reservation progresses through many stages: creation, payment, pickup, rental, return. Without an explicit state machine, invalid transitions (e.g., completing a reservation that was never picked up) can occur.

## Decision

Implement an explicit reservation state machine with:
- Defined states and allowed transitions
- Enforcement at the service layer (not just the database)
- Every transition creates an audit event
- Invalid transitions return HTTP 409

States: `draft → quote_created → held → payment_pending → confirmed → pickup_ready → active → return_inspection → completed` (plus terminal failure states).

## Consequences

- Every state transition must be through the designated service function
- Direct SQL updates to `reservations.status` bypass the state machine and must not occur in application code
- Background processes (TTL expiry) transition via the same service function interface

---

# ADR-007: PayMongo as Payment Provider

**Date:** September 2026
**Status:** Proposed (not yet implemented)

---

## Context

Veyra operates in the Philippines. A payment provider with PHP support, local payment methods (GCash, Maya, card), and a Philippine-facing regulatory stance is needed.

## Decision

**Propose PayMongo** as the primary payment provider for the initial launch.

The integration is abstracted behind a payment service layer so the provider can be replaced if needed.

## Alternatives Considered

| Option | Notes |
|---|---|
| Stripe | Strong globally; PHP supported; less Philippine-specific optimization |
| Maya Business | Philippine-specific; limited API flexibility |
| Xendit | Philippine-focused alternative; viable second choice |

## Consequences

- PayMongo webhook integration required (design: `docs/architecture/webhooks.md`)
- Veyra never stores card data — PayMongo Elements handles cardholder data
- PayMongo's PCI DSS scope covers card processing

---

# ADR-008: Private Document Storage

**Date:** September 2026
**Status:** Accepted

---

## Context

Customer identity documents (licenses, government IDs) and inspection photos are highly sensitive. They must be stored securely and not accessible without explicit authorization.

## Decision

Store private documents in **Supabase Storage private buckets**. Access is exclusively via **server-generated signed URLs** with a 15-minute TTL.

The browser never receives raw storage paths. The server generates a signed URL only after verifying the requestor's authorization.

## Alternatives Considered

| Option | Rejected Because |
|---|---|
| Public Supabase Storage | Completely unacceptable for identity documents |
| External encrypted file service | Extra vendor dependency; Supabase Storage with signed URLs is sufficient |
| Base64 in database | Impractical for large files; database performance impact |

## Consequences

- All document uploads go through a Server Action/Route Handler (not direct browser → Storage)
- MIME type validation required server-side
- File virus scanning should be added before launch (not yet implemented)
- Signed URL issuance is audited
