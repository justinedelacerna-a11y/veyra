# Veyra Database Migration Workflow

**Phase:** Phase 8 — Declarative Migration System  
**Engine:** pg-delta (bundled with Supabase CLI v2.118+)  
**Source of Truth:** `supabase/schemas/*.sql`  

---

## 1. Declarative Architecture Overview

Veyra uses Supabase's modern declarative database schema workflow:

1. **Source of Truth:** All schema definitions live as declarative SQL files under `supabase/schemas/`.
2. **Ordered Execution:** Schema files are executed lexicographically (`00_extensions.sql` through `18_public_catalog.sql`).
3. **Migration Generator:** `supabase db schema declarative sync` calculates the delta between the migrations baseline and `supabase/schemas/` using a shadow database instance.
4. **Never Hand-Write Migrations:** Imperative migration files under `supabase/migrations/` should never be authored by hand. Edit `supabase/schemas/*.sql`, then generate migrations using the declarative sync command.

---

## 2. Configuration (`supabase/config.toml`)

```toml
[db.migrations]
enabled = true
schema_paths = ["./schemas/*.sql"]

[db.seed]
enabled = true
sql_paths = ["./seed.sql"]
```

---

## 3. Standard Developer Workflow

### Step 1: Make Schema Changes in Declarative Sources
Edit or add SQL files under `supabase/schemas/`. Ensure all table constraints, indexes, triggers, and RLS policies follow Veyra architecture standards.

### Step 2: Generate Migration
```bash
# Generate the migration file from declarative schemas without immediately applying
npx supabase db schema declarative sync --name descriptive_migration_name --no-apply
```

### Step 3: Inspect Generated Migration
Review the resulting file in `supabase/migrations/<timestamp>_descriptive_migration_name.sql`:
- Check for unintended `DROP TABLE` or `DROP COLUMN` statements
- Verify constraint and foreign key definitions
- Verify index and RLS policy declarations

### Step 4: Apply Locally & Reset
```bash
# Reset local database, apply all migrations, and seed synthetic data
npx supabase db reset
```

### Step 5: Regenerate TypeScript Database Types
```bash
# Generate TypeScript definitions directly from the local database
npx supabase gen types typescript --local > src/types/database.ts
```

---

## 4. Local Prerequisites

The declarative engine (`pg-delta`) spins up an ephemeral PostgreSQL shadow database container to compute diffs against your declarative sources.
- **Prerequisite:** Docker Desktop (or Podman) running locally.
- **Verification:** Run `docker --version` before executing `supabase db schema declarative sync` or `supabase db reset`.
