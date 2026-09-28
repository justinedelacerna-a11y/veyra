# Veyra Data Retention & Deletion Policy Architecture

This document defines the lifecycle, retention periods, soft vs. hard deletion strategies, automated purging mechanics, and legal hold processes for all data stored within Veyra.

---

## 1. Regulatory Context & Retention Drivers (Provisional — Legal Review Required)

Veyra’s data retention schedule balances three competing legal, tax, and operational frameworks. **All retention periods below are provisional working baselines and REQUIRE FORMAL CORPORATE LEGAL & TAX COUNSEL REVIEW before automated deletion jobs are executed in production**:
1. **Tax & Accounting Records:** Commonly referenced baseline of ten (10) years based on general Philippine Bureau of Internal Revenue (BIR) NIRC Sec. 235 practices. *(Policy/Legal Review Required for digital/electronic invoicing applicability)*.
2. **Philippine Data Privacy Act of 2012 (RA 10173):** Personal data must not be retained longer than necessary to fulfill the declared purpose. *(Policy/Legal Review Required for post-rental KYC document retention threshold)*.
3. **Tort Liabilities & Motor Vehicle Claims:** Civil Code Article 1146 quasi-delict 4-year statute of limitations. *(Policy/Legal Review Required for incident and driver profile preservation)*.

---

## 2. Retention Schedule by Entity Category

> **Notice:** The timeframes below represent proposed architectural defaults. No automated hard-purge jobs may run in production until each timeline is signed off by Veyra Legal & Compliance.

| Entity Category | Target Tables / Storage | Baseline Retention Period | Legal Status | Post-Period Action |
|---|---|---|---|---|
| **KYC / Identity Documents** | `customer_documents`, Supabase Storage (`customer-documents`) | **90 days after rental completion** (proposed) | **Policy/Legal Review Required** | **Hard Delete** from Storage + Database |
| **Driver Profile Metadata** | `drivers`, `reservation_drivers` | **4 years** post-reservation (proposed) | **Policy/Legal Review Required** | **Anonymize** (mask license #, remove name) |
| **Financial & Invoicing** | `payments`, `refunds`, `deposits`, `invoices`, `quote_snapshots` | **10 years** (proposed) | **Policy/Legal Review Required (BIR Tax Review)** | **Archive to Cold Storage** |
| **Operational Reservations** | `reservations`, `reservation_status_history` | **5 years** active DB, then archive | **Policy/Legal Review Required** | **Anonymize Customer FK** after 5 years |
| **Fleet & Inspection Records** | `fleet_vehicles`, `inspections`, `damage_reports` | **Lifetime of vehicle + 2 years** | **Policy/Legal Review Required (Insurance)** | **Archive / Purge** |
| **Audit Logs** | `audit_logs` | **7 years** (proposed) | **Policy/Legal Review Required** | **Cold S3 archive** |
| **Webhook Delivery Logs** | `webhook_events`, `failed_jobs` | **30 days** | **Operational Baseline (Internal Policy)** | **Hard Delete** via automated rolling cron |
| **Stale Quote Drafts / Abandoned Holds** | `quotes`, `availability_blocks` (expired) | **14 days** | **Operational Baseline (Internal Policy)** | **Hard Delete** |

---

## 3. Soft-Delete vs. Hard-Delete vs. Anonymization Strategy

### 3.1 Hard-Delete Prohibitions
To preserve relational integrity and financial audit trails, **HARD DELETION of primary reservation or payment rows is strictly forbidden**.
```
-- NEVER ALLOWED:
DELETE FROM reservations WHERE id = '...';
DELETE FROM payments WHERE id = '...';
```

### 3.2 The Three-Tier Deletion Pipeline

#### Tier 1: Soft-Delete (`is_deleted = TRUE` or `deleted_at IS NOT NULL`)
* Used for operational soft toggles:
  * Inactive vehicles (`fleet_vehicles.status = 'DECOMMISSIONED'`)
  * Removed branch locations
  * Discontinued extras / add-on packages
* Filtered by default in application queries via repository layer (`WHERE deleted_at IS NULL`).

#### Tier 2: Anonymization (Right-to-be-Forgotten / Account Erasure)
When a user exercises their Data Privacy Act "Right to Erasure":
1. Check if user has open balances, active reservations, or active legal holds. If yes, reject deletion request with explanation.
2. In `users` and `customers`:
   * Set `email = 'deleted_user_' || id || '@erased.veyra.ph'`
   * Set `phone = NULL`
   * Set `first_name = 'Anonymized'`
   * Set `last_name = 'User'`
   * Nullify address, date of birth, and marketing preferences.
3. In `drivers`:
   * Mask license number: `DELETED_` || SUBSTRING(hash, 1, 8)
   * Delete uploaded ID photos immediately.
4. Financial transaction records remain intact for BIR compliance, but point to the anonymized customer entity.

#### Tier 3: Hard-Delete (Transient & High-Liability Artifacts)
* Binary objects in private storage buckets (`customer-documents/license_*.jpg`)
* Inbound webhook payloads older than 30 days
* Expired session cache and draft quotes older than 14 days

---

## 4. Automated Purge Mechanics (`pg_cron` & Storage Worker)

### 4.1 SQL Automation Function
```sql
CREATE OR REPLACE FUNCTION purge_expired_transient_data()
RETURNS void AS $$
BEGIN
  -- 1. Delete transient webhook events older than 30 days
  DELETE FROM webhook_events
  WHERE processed_at < NOW() - INTERVAL '30 days';

  -- 2. Delete abandoned unreserved quotes older than 14 days
  DELETE FROM quotes
  WHERE status = 'EXPIRED'
    AND created_at < NOW() - INTERVAL '14 days'
    AND reservation_id IS NULL;

  -- 3. Mark KYC documents eligible for storage deletion
  UPDATE customer_documents
  SET purge_status = 'PENDING_STORAGE_PURGE'
  WHERE created_at < NOW() - INTERVAL '90 days'
    AND purge_status = 'ACTIVE'
    AND NOT EXISTS (
      SELECT 1 FROM legal_holds lh
      WHERE lh.customer_id = customer_documents.customer_id
        AND lh.status = 'ACTIVE'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 4.2 Storage Cleanup Worker
A background worker polls rows where `purge_status = 'PENDING_STORAGE_PURGE'`, calls Supabase Storage API `remove([file_path])`, and on confirmation sets `purge_status = 'PURGED'` and zeroes the metadata.

---

## 5. Legal Hold Framework

A **Legal Hold** overrides all automated retention and deletion schedules.

### 5.1 Trigger Conditions
* Vehicular accident resulting in bodily injury or significant property damage.
* Open insurance dispute or subrogation claim.
* Active credit card chargeback / fraud investigation.
* Formal court subpoena or law enforcement warrant.

### 5.2 Mechanics
* Stored in `legal_holds` table (`customer_id`, `reservation_id`, `reason`, `placed_by_staff_id`, `placed_at`, `status = 'ACTIVE'`).
* The automated purge job explicitly verifies:
  ```sql
  WHERE NOT EXISTS (
    SELECT 1 FROM legal_holds lh
    WHERE lh.customer_id = c.id AND lh.status = 'ACTIVE'
  )
  ```
* Any attempt by a staff member or user to trigger an account erasure while an active legal hold exists is rejected with HTTP 409 Conflict.
