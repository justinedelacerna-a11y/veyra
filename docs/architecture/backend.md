# Veyra Backend Architecture

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document. No production backend is implemented yet.
**Date:** September 2026

---

## 1. Architectural Overview

Veyra is a **modular monolith** deployed on the Next.js application layer, backed by Supabase (PostgreSQL + Storage), with identity delegated to Clerk and payments to an external provider (PayMongo, candidate).

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser / App)                  │
│  React Server Components · Client Components · Forms        │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
┌─────────────────────────▼───────────────────────────────────┐
│              NEXT.JS APPLICATION LAYER (Server)             │
│  Route Handlers · Server Actions · Middleware               │
│  Auth enforcement · Business logic · Domain services        │
│  Quote engine · Availability checks · Webhook handlers      │
└──────┬──────────────────┬──────────────────┬────────────────┘
       │                  │                  │
┌──────▼──────┐  ┌────────▼───────┐  ┌──────▼──────────────┐
│   CLERK     │  │   SUPABASE     │  │  EXTERNAL PROVIDERS  │
│ Identity &  │  │ PostgreSQL DB  │  │  PayMongo (payments) │
│ Sessions    │  │ Storage        │  │  SMTP / SMS / push   │
│ JWT tokens  │  │ RLS policies   │  │  Background workers  │
└─────────────┘  └────────────────┘  └─────────────────────┘
```

---

## 2. Layer Responsibilities

### 2.1 Client (Browser)

**Responsible for:**
- Rendering UI components (Server and Client React)
- Collecting user input (forms, selections)
- Displaying server-computed data
- Optimistic UI updates where safe
- Local transient state (booking wizard navigation, filter state)

**Must NOT be responsible for:**
- Calculating authoritative prices
- Determining vehicle availability
- Enforcing role-based access
- Processing payments
- Storing sensitive credentials (payment details, secret keys)
- Deciding whether a reservation is valid

### 2.2 Next.js Application Layer

**Responsible for:**
- Authenticating every protected request via Clerk middleware
- Authorizing every operation (role + resource ownership + branch scope)
- Enforcing all business rules server-side
- Running the pricing/quote engine
- Enforcing availability checks and inventory holds
- Orchestrating external provider calls (payment, email, SMS)
- Receiving and processing payment webhooks
- Creating and managing audit log entries
- Serving signed URLs for private document access
- Validating all incoming data before writing to the database

**Key principle:** The Next.js server is the **sole source of business truth**. The browser is a display terminal.

### 2.3 Supabase / PostgreSQL

**Responsible for:**
- Durable storage of all business data
- Relational integrity (foreign keys, constraints, unique indexes)
- Row-Level Security as a defense-in-depth layer
- Supabase Storage for documents, photos, and assets
- Atomic database transactions for critical operations
- Full-text search (pg_trgm or tsvector where appropriate)

**Not responsible for:**
- Business logic (kept in the application layer)
- Authentication (delegated to Clerk)
- Pricing calculation (application layer)
- Sending notifications (application layer triggers workers)

### 2.4 Clerk

**Responsible for:**
- Identity verification (who is this user?)
- Session management and JWT issuance
- Multi-factor authentication
- OAuth provider integrations (future)
- Passwordless flows
- Webhook delivery for user lifecycle events (created, updated, deleted)

**Not responsible for:**
- Application-level authorization (what is this user allowed to do?)
- Business data (profile details stored in PostgreSQL)
- Roles beyond what Clerk Organizations supports (application roles stored in PostgreSQL)

**Data split:**
```
Clerk stores:           PostgreSQL stores:
─────────────────       ──────────────────────────────
clerk_user_id           users.clerk_id (FK to Clerk)
email address           users.email (synced via webhook)
password hash           customers.* (profile, tier, etc.)
OAuth tokens            staff_users.* (role, branch, etc.)
MFA config              roles, permissions
session state           branch assignments
```

### 2.5 Payment Provider (PayMongo — candidate)

**Responsible for:**
- Payment intent creation
- Card authorization and capture
- Refund processing
- Webhook delivery of payment events

**Not responsible for:**
- Storing payment state (stored in Veyra's payments table)
- Pricing calculation
- Business validation

**Critical rule:** Veyra never stores raw card numbers, CVVs, or full PANs. Only provider-issued transaction references and token identifiers are stored.

### 2.6 Supabase Storage

**Responsible for:**
- Private buckets for: identity documents, inspection photos, damage photos, invoices
- Public bucket for: marketing vehicle photos only

**Access model:**
- Private documents accessed exclusively via server-generated signed URLs
- Signed URLs are short-lived (15 minutes maximum)
- No public access to private buckets under any circumstances

### 2.7 Background Jobs / Workers

**Responsible for (future):**
- Email and SMS dispatch (triggered by domain events)
- Reservation hold expiry (cron: check holds older than TTL)
- Reminder notifications (pickup, return)
- Webhook event reprocessing (dead-letter queue)
- Report generation

**Implementation approach:** Initially Next.js Route Handlers with Vercel Cron. If throughput demands it, migrate to a proper queue (pg_cron via Supabase, or a separate worker service). Do not introduce a queue system prematurely.

---

## 3. Business Logic Ownership

| Domain Operation | Owned By |
|---|---|
| Price calculation | Next.js server (pricing service) |
| Quote creation | Next.js server |
| Availability check | Next.js server + PostgreSQL |
| Inventory hold | PostgreSQL transaction (FOR UPDATE) |
| Reservation creation | Next.js server + PostgreSQL |
| Payment intent | Next.js server → PayMongo |
| Payment status | PayMongo webhook → Next.js → PostgreSQL |
| Deposit authorization | PayMongo at pickup |
| Vehicle assignment | Next.js server (admin action) |
| Inspection record | Next.js server (staff action) |
| Audit log entries | Next.js server (never client) |
| Document access control | Next.js server (signed URL issuance) |
| Role/permission checks | Next.js server middleware + services |
| RLS policies | PostgreSQL (defense-in-depth) |
| Webhook validation | Next.js Route Handler |

---

## 4. Key Architectural Principles

1. **Server-authoritative pricing.** The browser sends selections; the server calculates and creates a quote snapshot. The quote is the price.

2. **Defense in depth.** Authorization is checked at: middleware → service layer → RLS policy. Failing one layer does not mean access is granted.

3. **Immutable financial records.** Quotes, payments, and invoices are append-only. Corrections create new records, not mutations.

4. **Idempotency by design.** Critical operations (reservation creation, payment, refund, webhook processing) must tolerate duplicate calls.

5. **Mock → real via repository abstraction.** Data access is abstracted so mock repositories can be swapped for real Supabase repositories without UI changes.

6. **Audit everything meaningful.** All state transitions in reservations, payments, and fleet operations must produce an audit event.

7. **Fail safely.** When an external provider fails, the system must leave data in a recoverable state. No orphan holds, no silent data loss.

---

## 5. Technology Decisions (Current)

| Component | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16.3.6 | App Router, Turbopack dev server |
| Language | TypeScript | 5.x | Strict mode |
| UI | shadcn/ui (Base UI) | current | Preset b3ZzWgYd8d |
| Identity | Clerk | @clerk/nextjs ^7.9.7 | Core 3 SDK |
| Database | Supabase PostgreSQL | @supabase/supabase-js ^2.117.2 | Hosted on Supabase Cloud |
| SSR client | @supabase/ssr | ^0.12.7 | Clerk JWT forwarded as Bearer token |
| Payment | PayMongo (candidate) | — | Not yet integrated |
| Deployment | Vercel | — | Configured; no Docker required |
| Middleware | Next.js Proxy (proxy.ts) | 16.x | Renamed from middleware.ts in ≤15 |

---

## 6. Implementation Status

### Phase 8C Complete (Cloud Infrastructure Wired)

| Layer | Status | Notes |
|---|---|---|---|
| Supabase schema (28 tables) | ✅ Declared | `supabase/schemas/*.sql` |
| Supabase schema (applied) | ⏳ Pending | Needs `supabase db push` to hosted project |
| TypeScript DB types | ⏳ Pending stub | Run `supabase gen types` after push |
| Clerk Provider | ✅ Done | `ClerkProvider` in root layout |
| Clerk native 3rd-party auth | ⏳ Dashboard step | Clerk domain added in Supabase Auth -> Third-Party Auth |
| Supabase server client | ✅ Done | Native accessToken with server-only guard |
| Supabase browser client | ✅ Done | Native accessToken with useSupabase hook |
| Clerk webhook → DB user sync | ❌ Not started | Phase 9 |
| Application data (mock) | 🟡 Mock | All vehicle/reservation data still mock |
| Payments | ❌ Not started | Future phase |

The frontend integrates cleanly when real repositories replace mock data providers.
