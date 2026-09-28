# Veyra Data Classification & Sensitive Data Handling Standard

This document establishes the data classification policy, tier definitions, data inventory mapping, encryption requirements, and handling rules for all data processed across the Veyra platform.

---

## 1. Classification Tiers

| Tier | Sensitivity | Definition | Impact of Breach | Handling Restrictions |
|---|---|---|---|---|
| **Tier 1: Public** | Lowest | Information intentionally published for unauthenticated public consumption. | Negligible / None | Freely accessible via CDN / public APIs. No encryption required at rest for static marketing content. |
| **Tier 2: Internal** | Medium-Low | Operational data intended for authenticated employees and staff, but not containing customer PII. | Operational embarrassment, minor competitive disadvantage | Strict RBAC. Requires HTTPS in transit and database encryption at rest. Redacted from public endpoints. |
| **Tier 3: Confidential** | High | Customer Personally Identifiable Information (PII), reservation details, branch financial metrics. | Regulatory fines (Philippine DPA 2012 / GDPR), loss of customer trust | Encrypted in transit (TLS 1.3) and at rest (AES-256). Masked in logs. Access strictly limited to owning customer and assigned branch staff. |
| **Tier 4: Restricted / Highly Sensitive** | Critical | Government ID documents (Driver's License, Passports), selfie verifications, payment tokens, API secrets. | Severe civil/criminal penalties, identity theft, high-severity data breach | Encrypted in private object storage with signed time-limited URLs (TTL <= 15m). Strict access auditing. Zero client-side persistence. Prohibited in logs. |

---

## 2. Comprehensive Entity & Attribute Classification Inventory

### 2.1 Customer & Identity Data

| Table / Field | Classification | Sensitive Attributes | Handling / Masking Rule |
|---|---|---|---|
| `users.email` | **Tier 3: Confidential** | Email address | Masked in server logs (`j***@example.com`). Available to customer and support. |
| `users.phone` | **Tier 3: Confidential** | Phone number | Masked in server logs (`+63 917 *** *890`). |
| `customers.first_name`, `last_name` | **Tier 3: Confidential** | Full legal name | Visible to staff upon check-in; restricted from public APIs. |
| `drivers.license_number` | **Tier 4: Restricted** | Government Driver's License # | Masked in standard UI (`•••••••4821`). Full view requires explicit audit log record. |
| `drivers.license_expiry` | **Tier 3: Confidential** | Expiration date | Used for verification rules; not public. |
| `customer_documents.file_path` | **Tier 4: Restricted** | License photo, passport photo, selfie | Stored in Supabase private bucket. Signed URLs only (15-min TTL). Never public. |
| `customer_notes.content` | **Tier 2: Internal** | Internal operational notes | Internal staff view only. Never returned to customer-facing APIs. |

---

### 2.2 Reservations & Pricing Data

| Table / Field | Classification | Attributes | Handling / Masking Rule |
|---|---|---|---|
| `reservations.reference_number` | **Tier 2: Internal** | `VY-8921-X9` | Safe to display on invoice and booking lookups. |
| `reservations.customer_id` | **Tier 3: Confidential** | Foreign key | Bound to authenticated customer session via RLS. |
| `quotes.subtotal_centavos`, `total_centavos` | **Tier 2: Internal** | Pricing totals | Safe for customer and staff view. Server-authoritative. |
| `quotes.pricing_breakdown` | **Tier 2: Internal** | JSON snapshot of rates | Preserved historical quote data. |
| `reservation_status_history` | **Tier 2: Internal** | Lifecycle tracking | Staff and audit view. |

---

### 2.3 Payments & Financial Data

| Table / Field | Classification | Attributes | Handling / Masking Rule |
|---|---|---|---|
| `payments.provider_payment_id` | **Tier 3: Confidential** | PayMongo Payment ID | Internal reference only. Never expose raw transaction handles to public clients. |
| `payments.payment_method_details` | **Tier 3: Confidential** | Card brand, last 4 digits (`Visa •••• 4242`) | Safe for customer confirmation display. |
| **Raw Card PAN / CVV / CVC** | **PROHIBITED** | Full Credit/Debit Card Number | **NEVER RECEIVED, STORED, OR PROCESSED BY VEYRA.** Handled exclusively by PayMongo client SDK / hosted checkout. |
| `deposits.held_amount_centavos` | **Tier 2: Internal** | Security deposit amount | Monitored by Finance and Branch Manager roles. |
| `refunds.reason`, `amount_centavos` | **Tier 2: Internal** | Refund adjustments | Authorized staff only. |

---

### 2.4 Fleet & Asset Data

| Table / Field | Classification | Attributes | Handling / Masking Rule |
|---|---|---|---|
| `vehicles.make`, `model`, `year`, `specs` | **Tier 1: Public** | Catalog specs | Freely queryable by anonymous searchers. |
| `fleet_vehicles.license_plate` | **Tier 2: Internal** | Registration plate | Displayed on customer reservation once assigned; visible to staff. |
| `fleet_vehicles.vin` | **Tier 2: Internal** | Vehicle Identification Number | Staff/fleet management only. Hidden from public customer views. |
| `inspections.photos` | **Tier 2: Internal** | Pre/post rental condition photos | Private Supabase storage bucket; signed URLs for customer review. |
| `maintenance_records` | **Tier 2: Internal** | Repair costs, mechanic notes | Fleet Manager and Admin only. |

---

### 2.5 Security, Credentials & Audit Logs

| Table / Field | Classification | Attributes | Handling / Masking Rule |
|---|---|---|---|
| Clerk Secret Keys / Webhook Secrets | **Tier 4: Restricted** | API secrets (`sk_live_...`, `whsec_...`) | Environment variables only (Vercel encrypted envs). Prohibited in code or database. |
| Supabase Service Role Key | **Tier 4: Restricted** | Admin bypass token | Server-side execution only. Never passed to client or browser. |
| `audit_logs.payload` | **Tier 3: Confidential** | Operational delta JSON | Automatic redaction of passwords, tokens, full license numbers before write. |

---

## 3. Data Masking & Log Sanitization Rules

Any logging pipeline (console output, Sentry, Datadog, Axiom) MUST execute a sanitization interceptor:

1. **Email Sanitization:**
   * Input: `customer.juan@gmail.com`
   * Masked: `c***********n@gmail.com`
2. **Phone Number Sanitization:**
   * Input: `+639178889999`
   * Masked: `+63917****999`
3. **Government ID / License Sanitization:**
   * Input: `N02-14-098765`
   * Masked: `***-**-098765`
4. **Payment Details:**
   * Input: `PayMongo Intent pi_902j8492hf92`
   * Masked: `pi_902j...` (truncated in non-debug logs)
5. **Forbidden Log Patterns:**
   * Zero tolerance for raw authorization headers, session cookies, driver license image binary data, or Webhook signatures in standard application logs.

---

## 4. Export & Data Subject Access Rules (DPA 2012 / GDPR)

Under the Philippine Data Privacy Act of 2012 (RA 10173):
* **Right to Access:** Customers can request an export of their profile, reservations, and document metadata. The export file is delivered as an encrypted ZIP archive via authenticated download link expiring in 24 hours.
* **Bulk Data Exports:** Exporting full reservation or customer tables to CSV/Excel is restricted to `SUPERADMIN` and `FINANCE` roles and strictly requires a logged entry in `audit_logs` including row count and purpose justification.
