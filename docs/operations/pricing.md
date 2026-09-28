# Veyra Pricing Architecture

**Phase 7 — Architecture Blueprint (Design-Only)**
**Status:** Design document.
**Date:** September 2026

---

## 1. Core Rule

**The browser is never authoritative for price.**

The current frontend pricing engine (`src/features/booking/lib/pricing.ts`) is a prototype display tool. In production:

1. The customer selects a vehicle, dates, and extras
2. The client sends these **selections** to the server
3. The server **calculates the authoritative quote**
4. The quote is returned to the client for display
5. The client displays the server-computed price without modification
6. Payment is initiated against the server-computed quote amount

No client-computed price is ever trusted for financial processing.

---

## 2. Money Representation

All monetary values are stored and computed in **minor units (centavos)**.

```
PHP 1,999.00 → stored as 199900
PHP 250.00  → stored as 25000
PHP 0.50    → stored as 50
```

**Column type:** `BIGINT` in PostgreSQL. Never `NUMERIC`, `DECIMAL`, or `FLOAT` for monetary fields.

**Display:** Divide by 100 on the server or in a dedicated formatter. Never pass floating-point monetary values between layers.

**Currency code:** `CHAR(3)` ISO 4217. Default `PHP`.

### Rounding Rules

- All intermediate calculations use integer arithmetic where possible
- If rounding is required (e.g., fractional discount calculation), round **toward even** (banker's rounding) at the final step
- Never round intermediate values — compute the full amount first, then round once
- The `totalRentalPrice` is always the authoritative final sum

---

## 3. Pricing Components

```
Base Rental
= vehicle.daily_rate × max(1, rental_days)

Extras Subtotal
= Σ (extra.daily_rate × rental_days) for each selected extra

Airport Concession Fee (if applicable)
= fixed amount per reservation at airport hubs

Mandatory Liability Coverage (if applicable)
= fixed or per-day amount

Local Taxes (VAT)
= (Base Rental + Extras Subtotal + other fees) × tax_rate
  -- In the Philippines: 12% VAT is typically inclusive in display prices
  -- Policy TBD: whether VAT is inclusive or exclusive in listed rates

Discount
= applied coupon or rate plan reduction (in minor units)

Subtotal
= Base Rental + Extras Subtotal + Fees

Total Rental
= Subtotal + Taxes − Discount

Security Deposit
= vehicle.security_deposit
  -- Strictly separate from the rental total
  -- Collected as an authorization hold, not a charge
```

---

## 4. Rate Plans

Rate plans allow pricing overrides for specific durations, seasons, or vehicle classes:

| Scenario | Rule |
|---|---|
| 7+ days | Apply 10% long-stay discount |
| Weekend special | Override daily rate for Sat–Sun pickups |
| Vehicle class pricing | Different base rates per class |
| Promotional codes | Fixed discount or percentage off |

Rate plan selection is server-side only. The server evaluates all applicable rate plans in priority order and applies the best one (or the specifically selected promotion code).

---

## 5. Quote Lifecycle

```
Customer selects: vehicle, dates, extras
         ↓
Server: createQuote()
  - Validate inputs
  - Check vehicle exists and is in catalog
  - Calculate all pricing components
  - Create immutable quotes record
  - Create quote_extras records
  - Set expires_at (NOW() + 30 minutes)
         ↓
Quote returned to client (display only)
         ↓
Customer confirms quote
         ↓
Server: createHold()
  - Validate quote is still active and not expired
  - Check availability (atomic)
  - Create reservation in 'held' status
  - Quote.status = 'converted' (or 'expired' if conflict)
         ↓
Customer initiates payment (against quote amount)
         ↓
Payment provider processes
         ↓
Webhook: confirm reservation
  - Reservation.total_amount = quote.total_rental (immutable)
```

### Quote Expiry

- Quotes expire after 30 minutes
- An expired quote cannot be used to create a hold
- The customer must request a new quote (prices may have changed)
- Holds expire after 15 minutes (separate TTL from quote)

---

## 6. Historical Price Preservation

When a reservation is created:

1. The `reservations.total_amount` is copied from the quote and **never updated**
2. `reservation_extras` records copy the extra name and rate at the time of booking
3. Future changes to `vehicles.daily_rate` or `extras.daily_rate` do not affect existing reservations
4. The `quotes.pricing_version` field captures a hash or version tag of the active pricing configuration at quote time

This ensures:
- Financial audits can reconstruct how any historical price was computed
- Price changes never retroactively alter confirmed bookings
- Disputes can be resolved by showing the quote snapshot

---

## 7. Extras Pricing

Extras are priced per day:

```
Extra total = extra.daily_rate × rental_days
```

Some extras may eventually be priced as flat fees (e.g., GPS unit: one-time charge). The `extras` table schema supports this via a `pricing_model` field (future addition).

---

## 8. Security Deposit

- The deposit is separate from the rental payment
- It is collected as a **card authorization hold** at the time of vehicle handover (not at booking)
- If the return inspection passes with no damage: hold is released within 24–48 hours
- If damage is found: deposit may be partially or fully forfeited
- If the customer contests: reservation enters `disputed` state
- The deposit amount is determined by `vehicles.security_deposit` at quote time and preserved in `quotes.security_deposit` and `deposits.amount`

---

## 9. Tax Handling

Philippine tax policy (VAT): TBD with product/legal team.

Options:
- **Inclusive pricing**: Displayed price includes VAT (common for consumer-facing)
- **Exclusive pricing**: VAT added at checkout (common for B2B/corporate)

**Decision required before implementation.** Document as a policy decision, not a technical one.

The schema accommodates both via `tax_amount` in the `quotes` table. Until policy is decided, `tax_amount = 0` and all rates are listed as VAT-inclusive.

---

## 10. Pricing Authority Summary

| Component | Authority |
|---|---|
| Base rate | Database (`vehicles.daily_rate`) |
| Extras rate | Database (`extras.daily_rate`) |
| Rate plan selection | Server (evaluated at quote time) |
| Discount application | Server (validates coupon, applies) |
| Quote total | Server (computed, immutable after creation) |
| Reservation total | Copied from quote (immutable) |
| Historical pricing | Quote snapshot preserved forever |
| Browser price display | Informational only — never trusted |
