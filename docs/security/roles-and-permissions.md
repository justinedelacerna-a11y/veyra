# Veyra Roles & Permissions

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document.
**Date:** September 2026

---

## 1. Role Definitions

| Role | Scope | Description |
|---|---|---|
| `customer` | Own data only | Authenticated end-user who books vehicles |
| `branch_staff` | Assigned branch | Front-line staff: handover, inspection, basic operations |
| `branch_manager` | Assigned branch | Manages branch operations, staff oversight |
| `fleet_manager` | Organization | Manages fleet inventory, maintenance, vehicle status |
| `support` | Customer data (read) | Customer service team: view reservations, assist customers |
| `finance` | Financial data | Manages payments, refunds, invoices, deposits |
| `admin` | Organization | Full operational access except superadmin functions |
| `superadmin` | Organization | System configuration, user management, audit access |

---

## 2. Permission Matrix

✅ = Allowed | ❌ = Denied | 🔒 = Own data only | 📍 = Branch-scoped only

| Permission | customer | branch_staff | branch_manager | fleet_manager | support | finance | admin | superadmin |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Reservations** | | | | | | | | |
| view own reservations | 🔒 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| view branch reservations | ❌ | 📍 | 📍 | ❌ | ✅ | ✅ | ✅ | ✅ |
| view all reservations | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| create reservation | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| modify own reservation | 🔒 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| modify any reservation | ❌ | ❌ | 📍 | ❌ | ❌ | ❌ | ✅ | ✅ |
| cancel own reservation | 🔒 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| cancel any reservation | ❌ | ❌ | 📍 | ❌ | ❌ | ❌ | ✅ | ✅ |
| view reservation pricing | 🔒 | 📍 | 📍 | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Fleet** | | | | | | | | |
| view fleet catalog | ✅ | 📍 | 📍 | ✅ | ✅ | ❌ | ✅ | ✅ |
| assign vehicle to reservation | ❌ | 📍 | 📍 | ✅ | ❌ | ❌ | ✅ | ✅ |
| update vehicle status | ❌ | 📍 | 📍 | ✅ | ❌ | ❌ | ✅ | ✅ |
| create/edit vehicle record | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| retire vehicle | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Inspections** | | | | | | | | |
| create inspection record | ❌ | 📍 | 📍 | ✅ | ❌ | ❌ | ✅ | ✅ |
| view inspection history | ❌ | 📍 | 📍 | ✅ | ✅ | ❌ | ✅ | ✅ |
| approve damage charge | ❌ | ❌ | 📍 | ✅ | ❌ | ✅ | ✅ | ✅ |
| **Maintenance** | | | | | | | | |
| view maintenance records | ❌ | 📍 | 📍 | ✅ | ❌ | ❌ | ✅ | ✅ |
| create maintenance record | ❌ | ❌ | 📍 | ✅ | ❌ | ❌ | ✅ | ✅ |
| update maintenance status | ❌ | 📍 | 📍 | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Payments** | | | | | | | | |
| view own payment history | 🔒 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| view all payment records | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| initiate refund | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| release deposit | ❌ | ❌ | 📍 | ❌ | ❌ | ✅ | ✅ | ✅ |
| modify pricing configuration | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| **Customers** | | | | | | | | |
| view own profile | 🔒 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| view any customer profile | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| modify customer profile | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| suspend customer account | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Documents** | | | | | | | | |
| upload own documents | 🔒 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| review customer documents | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| approve/reject documents | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ |
| **Users & Staff** | | | | | | | | |
| view staff list | ❌ | ❌ | 📍 | ❌ | ❌ | ❌ | ✅ | ✅ |
| create staff user | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| assign roles | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| manage branches | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Audit & Security** | | | | | | | | |
| view own audit trail | 🔒 | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| view operational audit logs | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| view full audit logs | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| configure system settings | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Role Storage

**Application roles are stored in PostgreSQL** (`staff_users.role`), not in Clerk. This is because:

1. Clerk's native role system is tied to Organizations, which may not map cleanly to Veyra's branch-scoped operational model.
2. Roles must be version-controlled with the application data, not in a third-party system.
3. Role changes require audit trail entries in Veyra's own `audit_events` table.

**Clerk stores:** Identity only (authentication).
**PostgreSQL stores:** Role assignments, branch scope, permission evaluation data.

---

## 4. Branch Scope Enforcement

Branch-scoped roles (`branch_staff`, `branch_manager`) must be enforced at multiple levels:

### Service Layer Check
```typescript
// Pseudocode
async function getReservationsForBranch(actorId: string, branchId: string) {
  const staff = await getStaffUser(actorId)
  if (!staff) throw new ForbiddenError()
  if (['branch_staff', 'branch_manager'].includes(staff.role)) {
    if (staff.branch_id !== branchId) throw new ForbiddenError()
  }
  return db.reservations.findAll({ where: { branchId } })
}
```

### RLS Policy Enforcement
Branch staff can only read reservations at their assigned branch via RLS using `auth.jwt() → app_metadata → branch_id`.

---

## 5. Permission Check Hierarchy

Every protected operation must pass all of these checks in order:

1. **Authentication** — Is there a valid Clerk session? (`middleware`)
2. **User existence** — Does a matching `users` row exist? (`service layer`)
3. **Role check** — Does the role permit this operation at all? (`permission service`)
4. **Branch scope** — If branch-scoped, is this within the actor's branch? (`permission service`)
5. **Resource ownership** — For customer operations, does this resource belong to them? (`service layer`)
6. **RLS policy** — Database-level enforcement as the final defense. (`PostgreSQL`)

**Authorization is NOT enforced by:**
- Hiding UI buttons (UI reflects state; it is not the enforcement layer)
- URL structure alone
- Client-side role checks

---

## 6. Least Privilege Principle

- No role is granted permissions it doesn't need to perform its function.
- `branch_staff` cannot refund payments — only `finance` or above.
- `fleet_manager` cannot view payment records — only fleet and maintenance data.
- `support` can read customer data but cannot modify it or initiate financial actions.
- `finance` can manage payments but cannot modify fleet records.
- `customer` cannot read other customers' data under any circumstance.

---

## 7. Role Escalation Prevention

- Roles are assigned by `superadmin` only. No role can grant itself or others a higher role.
- Staff users cannot modify their own `staff_users.role` record.
- Branch managers cannot assign roles beyond `branch_staff` within their branch.
- All role assignments are recorded in `audit_events`.
