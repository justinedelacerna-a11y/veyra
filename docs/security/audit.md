# Veyra Audit Log Design

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document.
**Date:** September 2026

---

## 1. Audit Event Structure

Every audit event records:

| Field | Type | Description |
|---|---|---|
| `id` | UUID | Unique event identifier |
| `actor_id` | UUID | `users.id` of who performed the action |
| `actor_role` | TEXT | Role snapshot at time of action (denormalized) |
| `action` | TEXT | Namespaced action string (see taxonomy below) |
| `resource_type` | TEXT | Type of resource affected |
| `resource_id` | TEXT | ID of the affected record |
| `result` | TEXT | `success` or `failure` |
| `details` | TEXT | Human-readable summary |
| `before_state` | JSONB | Relevant fields before change (nullable) |
| `after_state` | JSONB | Relevant fields after change (nullable) |
| `ip_address` | INET | Server-recorded request IP |
| `user_agent` | TEXT | Client user agent string |
| `created_at` | TIMESTAMPTZ | UTC timestamp (immutable) |

**This table is append-only. UPDATE and DELETE are never performed on `audit_events`.**

---

## 2. Action Taxonomy

Actions follow a `{resource}.{event}` naming pattern.

### Reservation Actions
| Action | Triggered When |
|---|---|
| `reservation.created` | New reservation record inserted |
| `reservation.status_changed` | Any status transition |
| `reservation.modified` | Dates, location, or extras changed |
| `reservation.cancelled` | Customer or staff cancels |
| `reservation.vehicle_assigned` | Staff assigns specific vehicle |
| `reservation.no_show` | Staff marks no-show |

### Payment Actions
| Action | Triggered When |
|---|---|
| `payment.created` | Payment intent created |
| `payment.authorized` | Provider confirms authorization |
| `payment.captured` | Funds collected |
| `payment.failed` | Payment declined |
| `payment.refund_initiated` | Refund started |
| `payment.refund_completed` | Refund confirmed by provider |
| `payment.refund_failed` | Refund attempt failed |

### Deposit Actions
| Action | Triggered When |
|---|---|
| `deposit.authorized` | Security hold confirmed |
| `deposit.released` | Clean return, deposit released |
| `deposit.forfeited` | Damage charges applied |
| `deposit.partial_release` | Partial damage deducted |

### Vehicle / Fleet Actions
| Action | Triggered When |
|---|---|
| `vehicle.status_changed` | `fleet_status` updated |
| `vehicle.created` | New vehicle added to fleet |
| `vehicle.retired` | Vehicle soft-deleted |
| `vehicle.maintenance_scheduled` | Maintenance record created |
| `vehicle.maintenance_completed` | Maintenance marked complete |

### Customer / User Actions
| Action | Triggered When |
|---|---|
| `user.created` | Clerk webhook: user.created |
| `user.suspended` | Admin suspends account |
| `user.deleted` | Soft delete performed |
| `customer.profile_updated` | Customer updates own profile |
| `customer.verification_updated` | Verification status changed |

### Document Actions
| Action | Triggered When |
|---|---|
| `document.uploaded` | Customer uploads a document |
| `document.approved` | Staff approves document |
| `document.rejected` | Staff rejects document |
| `document.signed_url_issued` | Server generates signed URL |
| `document.deleted` | Document removed |

### Inspection Actions
| Action | Triggered When |
|---|---|
| `inspection.created` | Pre or post-trip inspection started |
| `inspection.completed` | Inspection signed off |
| `damage_report.created` | Damage finding recorded |
| `damage_report.status_changed` | Damage outcome updated |

### Staff / Admin Actions
| Action | Triggered When |
|---|---|
| `staff.created` | New staff user added |
| `staff.role_changed` | Role assignment updated |
| `staff.suspended` | Staff account suspended |
| `auth.login` | Successful authentication |
| `auth.login_failed` | Failed authentication attempt |
| `auth.logout` | Session terminated |

### Webhook Actions
| Action | Triggered When |
|---|---|
| `webhook.received` | Webhook arrives at endpoint |
| `webhook.processed` | Webhook successfully handled |
| `webhook.failed` | Processing error |
| `webhook.duplicate` | Duplicate event detected and ignored |

---

## 3. Before/After State Examples

### Reservation Status Change
```json
{
  "action": "reservation.status_changed",
  "before_state": { "status": "confirmed" },
  "after_state": { "status": "pickup_ready" },
  "details": "Branch staff acknowledged reservation. Vehicle prep in progress."
}
```

### Payment Refund Initiated
```json
{
  "action": "payment.refund_initiated",
  "before_state": {
    "payment_status": "captured",
    "refund_status": null
  },
  "after_state": {
    "payment_status": "captured",
    "refund_status": "pending",
    "refund_amount": 1455000
  },
  "details": "Refund of PHP 14,550.00 initiated. Reason: customer cancellation within policy window."
}
```

---

## 4. What Must NOT Be Logged

The following must **never** appear in audit log `before_state`, `after_state`, `details`, or any other log field:

- Passwords or password hashes
- Clerk secret keys or API tokens
- PayMongo API keys or webhook secrets
- Full payment card numbers, CVV, or PAN
- Raw Supabase service role keys
- Full contents of private documents
- Signed URLs (which grant temporary access to private files)
- Personal data not directly relevant to the audited action (e.g., don't log the customer's full date of birth when auditing a fleet status change)

---

## 5. System Actor

Actions triggered by automated processes (TTL expiry, cron jobs, webhook processing) must be attributed to a dedicated system user:

```
users.id: <designated system user UUID>
users.clerk_id: 'system'
users.user_type: 'staff'
staff_users.role: 'superadmin'  -- or a dedicated 'system' role
```

This ensures every audit event has a valid `actor_id` foreign key without requiring a human actor for automated transitions.

---

## 6. Audit Log Access Policy

| Role | Access |
|---|---|
| `customer` | Own actions only (`actor_id = their user_id`) |
| `branch_staff` | No direct audit access |
| `branch_manager` | No direct audit access |
| `fleet_manager` | Fleet-related events only (vehicle, maintenance) |
| `support` | Customer-related events for their cases |
| `finance` | Payment and refund events |
| `admin` | All operational events |
| `superadmin` | Full audit log including admin actions |

**Admins cannot see or modify their own audit records.** Superadmin oversight is required.

---

## 7. Retention

Audit logs must be retained for a minimum period (exact duration requires legal/compliance review):

- Reservation and payment events: minimum 5 years
- Authentication events: minimum 2 years
- Fleet and maintenance events: minimum 3 years
- All other events: minimum 1 year

Audit records are never deleted during the retention period. After retention, archival or deletion requires an explicit policy and a recorded justification.

---

## 8. Implementation Notes

- Audit writes must be within the same database transaction as the state change they record. If the transaction rolls back, the audit event is also rolled back.
- For asynchronous events (webhook processing), the audit write happens within the webhook processing transaction.
- The `audit_events` table should not have any foreign key constraints except on `actor_id` — resource IDs are stored as TEXT to accommodate multi-table references without cascading deletes destroying the audit trail.
- Consider a separate write-optimized schema or partition by month for high-volume audit tables in the future.
