# Veyra Local Database Development Guide

**Phase:** Phase 8 — Local Provisioning & Verification  
**Tools:** Supabase CLI (v2.118+), Docker Desktop / Podman  

---

## 1. Local Prerequisites

To run the local Supabase stack and execute database operations, the following must be installed and active:

1. **Node.js:** v20+ / v22+
2. **Supabase CLI:** `npx supabase` (v2.118.0 installed in workspace)
3. **Container Runtime:** Docker Desktop for Windows or Podman
   - **Status on this machine:** Docker is not currently installed (`docker: command not found`).
   - Installation guide: [Docker Desktop for Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
   - WSL 2 backend recommended.

---

## 2. CLI Command Reference

Once Docker Desktop is running:

| Task | Command | Notes |
|---|---|---|
| Start Supabase local stack | `npx supabase start` | Starts Postgres, PostgREST, Studio, Storage |
| Stop Supabase local stack | `npx supabase stop` | Stops all local containers |
| Check local status & ports | `npx supabase status` | Lists API URL, Studio URL, DB URL |
| Reset & re-apply all migrations | `npx supabase db reset` | Drops local DB, runs migrations, executes `seed.sql` |
| Sync declarative schema | `npx supabase db schema declarative sync --name <name> --no-apply` | Generates migration from `supabase/schemas/*.sql` |
| Generate TypeScript types | `npx supabase gen types typescript --local > src/types/database.ts` | Outputs database types |
| Open Supabase Studio | Navigate to `http://localhost:54323` | Local database management GUI |

---

## 3. Seed Data & Safety Rules

Seed data is located in `supabase/seed.sql` and loaded automatically on `supabase db reset`.

### Safety Invariants:
1. **No Real Customer Data:** All user accounts, names, and contact details are purely synthetic (`alexander.mercer@veyra.local`).
2. **Distinct Dev Clerk IDs:** All Clerk user IDs are prefixed with `dev_clerk_` (`dev_clerk_customer_001`, `dev_clerk_admin_001`). They can never be confused with live production Clerk identities (`user_2...`).
3. **No Real Payment Credentials:** All transaction amounts are synthetic test centavos.
4. **Isolated Fleet:** Test vehicles use synthetic plates (`DEV-TYC-01`) and VINs (`DEV17...`).
