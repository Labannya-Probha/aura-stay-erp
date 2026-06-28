# Discount & Tax Policy Guide

## Overview

This guide explains how to use the discount policy feature and manage tax/VAT configurations in Novem ERP Phase 1.

---

## 🎯 Discount Policy

### What is a Discount Policy?

A discount policy allows you to apply a percentage-based discount to a guest's room charges. The discount is applied **before** taxes and service charges are calculated, following standard hospitality accounting practices.

### How to Set a Discount

1. **Open a Reservation** → Click on any reservation to view details
2. **Navigate to Overview Tab** → This is the default tab when opening a reservation
3. **Click "Set Discount Policy"** → Located in the right panel under "Pipeline actions"
4. **Enter Discount Details:**
   - **Discount percentage (%)** — Enter 0-100 (e.g., 10 for 10% discount)
   - **Discount reason** (optional) — Document why the discount was given
     - Examples: "Corporate rate", "Early bird", "Referral", "Group booking", etc.
5. **Click "Save Discount"** → The policy is saved and applied to all room charges

### When Discounts Are Applied

Discounts are automatically applied in these places:

#### Quotation Tab
- Discount amount shown in the breakdown
- Discount reason included in WhatsApp/Email message
- Example:
  ```
  Room charge: ৳ 5,000
  Discount (10%): −৳ 500
  Service charge (10%): ৳ 450
  VAT (15%): ৳ 742.50
  Total: ৳ 5,692.50
  ```

#### Folio & Payments Tab
- Applied when posting room charges
- Displayed in the "Discount" column (abbreviated as "Disc.")
- Works for nightly room charges only
- **Does NOT apply to:**
  - Extra pax charges
  - Driver accommodation charges
  - Restaurant orders
  - Manual adjustments (add with 0% discount if needed)

#### Invoices
- Both Guest Bill and Mushak-6.3 show discount breakdown
- Discount is separated from other charges for tax compliance

### Discount Calculation Logic

```
Base Amount (room rate × nights): ৳ 10,000
↓
Discount (10%): −৳ 1,000
↓
Taxable Base: ৳ 9,000
↓
Service Charge (10% of base): ৳ 900
↓
SD (0%): ৳ 0
↓
VAT Base (taxable + SC + SD): ৳ 9,900
↓
VAT (15% of base): ৳ 1,485
↓
TOTAL: ৳ 11,385
```

### Can I Change a Discount After Posting Charges?

Yes, but **changes only apply to future room charges**. To change a discount:

1. Return to Overview tab
2. Click "Set Discount Policy" again
3. Update the percentage/reason
4. Click "Save Discount"
5. **Post room charges again** if you want the new discount applied

**Note:** Already-posted charges keep their original discount. You can manually edit individual line items if needed.

---

## 💰 Tax & VAT Policy Configuration

### Overview

Tax policies define how VAT, Service Charge, and SD are calculated for each charge type (Room, Restaurant, Laundry, Other). Policies are **effective-dated**, meaning you can change rates over time.

### Accessing Tax Configuration

1. **Navigate to Settings** → Left sidebar → "Settings" link
2. **Scroll to "Tax Configuration"** → Middle section of Settings page
3. You'll see a table of existing rates and a form to add new ones

### Understanding Tax Components

| Component | Example | Purpose |
|-----------|---------|---------|
| **VAT %** | 15% | Value-added tax (Bangladesh NBR requirement) |
| **SD %** | 0% | Supplementary Duty (if applicable) |
| **Service Charge %** | 10% | Hotel service charge (not included in VAT base in some scenarios) |

### Tax Application Order (Hotel Practice)

1. **Base Amount** → Room rate, restaurant order, etc.
2. **Discount Applied** → Subtract discount from base
3. **Net Amount** → After discount
4. **Service Charge & SD Calculated** → On net amount
5. **VAT Calculated** → On (net + SC + SD)
6. **Total** → Net + SC + SD + VAT

### How to Add a New Tax Rate

1. Go to **Settings → Tax Configuration**
2. Fill in the form:
   - **Charge Type:** ROOM, RESTAURANT, LAUNDRY, or OTHER
   - **VAT %:** e.g., 15
   - **SD %:** e.g., 0
   - **Service Charge %:** e.g., 10
   - **Effective From:** The date this rate becomes active
3. Click **"Add Rate"** button
4. The new rate appears in the table below

### Example: Adding a New VAT Rate for 2026

**Scenario:** Starting July 1, 2026, VAT increases from 15% to 17%

1. **Current rates (active before July 1):**
   - ROOM: 15% VAT, 0% SD, 10% SC (Effective from 2026-01-01)

2. **Add new rate:**
   - Charge Type: ROOM
   - VAT %: 17
   - SD %: 0
   - Service Charge %: 10
   - Effective From: 2026-07-01

3. **Result:**
   - Check-ins before 2026-07-01 → Use 15% VAT
   - Check-ins on/after 2026-07-01 → Use 17% VAT

### Important Notes on Tax Rates

✅ **Good Practices:**
- Always verify rates with your VAT consultant
- Set effective dates at the start of the month/quarter
- Keep historical records for audit purposes
- Test rates on a test reservation before using live

⚠️ **Watch Out For:**
- Duplicate rates for the same charge type on the same date (system uses the latest)
- Forgetting to update rates when tax laws change (NBR changes are common)
- Different rates for check-in vs. check-out (system uses check-in date)

### Seeded Default Rates

The system comes with these default rates (must verify with your consultant):

```
ROOM:       VAT 15%, SD 0%, SC 10%
RESTAURANT: VAT 5%, SD 0%, SC 10%
LAUNDRY:    VAT 5%, SD 0%, SC 10%
OTHER:      VAT 5%, SD 0%, SC 10%
```

These are **recommendations only**. Contact your NBR VAT division to confirm your applicable rates.

---

## 📊 How Discount & Tax Work Together

### Complete Example: 3-night stay with 15% discount

**Setup:**
- Guest: Mr. Rahman
- Check-in: 2026-06-15 | Check-out: 2026-06-18 (3 nights)
- Room Rate: ৳ 5,000/night
- Discount Policy: 15% (Corporate rate)
- Tax Rate (ROOM, effective 2026-06-15): VAT 15%, SD 0%, SC 10%

**Calculation per night:**

```
Room charge:           ৳ 5,000
Discount (15%):       −৳ 750
Net:                   ৳ 4,250
Service Charge (10%):  ৳ 425
SD (0%):               ৳ 0
VAT Base:              ৳ 4,675
VAT (15%):             ৳ 701.25
Total per night:       ৳ 5,376.25
```

**Total for 3 nights:**
```
Room charges (3 × 5,000):        ৳ 15,000
Discounts (3 × 750):            −৳ 2,250
Service Charges (3 × 425):       ৳ 1,275
SD (3 × 0):                      ৳ 0
VAT (3 × 701.25):                ৳ 2,103.75
─────────────────────────────────────────
GRAND TOTAL:                     ৳ 16,128.75
```

**What appears in Folio:**

| Date | Type | Description | Base | Disc. | SC | SD | VAT | Total |
|------|------|-------------|------|-------|----|----|-----|-------|
| 2026-06-15 | ROOM | Room 101 — Night of 15 Jun | 5,000 | 750 | 425 | 0 | 701.25 | 5,376.25 |
| 2026-06-16 | ROOM | Room 101 — Night of 16 Jun | 5,000 | 750 | 425 | 0 | 701.25 | 5,376.25 |
| 2026-06-17 | ROOM | Room 101 — Night of 17 Jun | 5,000 | 750 | 425 | 0 | 701.25 | 5,376.25 |
| | | **TOTALS** | **15,000** | **2,250** | **1,275** | **0** | **2,103.75** | **16,128.75** |

Both invoices (Guest Bill & Mushak-6.3) display this exact breakdown.

---

## 🔄 Database Implementation

### Required Schema Changes

Run this SQL in your Supabase SQL Editor:

```sql
-- Add discount columns to reservations table
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS discount_pct NUMERIC(5,2) DEFAULT 0;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS discount_reason TEXT;

-- Create index for faster lookups on discounted reservations
CREATE INDEX IF NOT EXISTS idx_reservations_discount_pct ON reservations(discount_pct) WHERE discount_pct > 0;
```

### Column Definitions

| Column | Type | Default | Purpose |
|--------|------|---------|---------|
| `discount_pct` | NUMERIC(5,2) | 0 | Discount percentage (0-100) applied to room charges |
| `discount_reason` | TEXT | NULL | Optional reason (Corporate, Early bird, etc.) |

---

## 🚀 Workflow Examples

### Example 1: Corporate Booking with 10% Discount

**Step 1:** Create New Reservation Query
- Guest: Acme Corporation
- Check-in: 2026-07-01 | Check-out: 2026-07-05 (4 nights)

**Step 2:** Set Discount Policy
- Click "Set Discount Policy" in Overview
- Discount: 10%
- Reason: "Corporate rate - Acme Corporation"

**Step 3:** Build & Send Quotation
- Navigate to Quotation tab
- Rate: ৳ 4,500/night
- Rooms: 2
- Message shows: "Discount 10% (Corporate rate - Acme Corporation)"

**Step 4:** Post Room Charges
- Go to Folio & Payments tab
- Click "Post room charges"
- System creates 8 lines (2 rooms × 4 nights)
- Each line shows base amount, 10% discount, taxes applied

**Step 5:** Check-out & Invoice
- Click "Check out & generate invoices"
- Both Guest Bill and Mushak-6.3 display discount breakdown
- Export to Excel if needed

### Example 2: Update Tax Rate Mid-Year

**Scenario:** NBR announces VAT increase from 15% to 17% effective October 1, 2026

**Step 1:** Add New Tax Rate
- Settings → Tax Configuration
- Charge Type: ROOM
- VAT: 17%
- SC: 10%
- SD: 0%
- Effective From: 2026-10-01

**Step 2:** Previous Reservations Use Old Rate
- Guests checking in before Oct 1 → 15% VAT
- Guests checking in on/after Oct 1 → 17% VAT

**Step 3:** Audit Trail
- Old rate stays in system (for historical records)
- New rate automatically applied to new check-ins
- All invoices show correct rate per check-in date

---

## ❓ FAQ

### Q: Can I apply a discount to restaurant orders?
**A:** No, discounts only apply to room charges. Restaurant orders (RESTAURANT charge type) are not discounted. Add a separate line with 0% discount if you want to discount a restaurant charge.

### Q: What if I set discount to 0%?
**A:** The system treats 0% as "no discount". No discount lines appear on invoices.

### Q: Can I edit a discount reason after posting charges?
**A:** Yes, go back to Overview, click "Set discount policy", update the reason, and save. The new reason appears on future documents. Already-posted charges keep their original reason.

### Q: What's the maximum discount?
**A:** 100% (complete waiver). Enter decimals like 10.5 for 10.5% discount.

### Q: How is discount affected by extra pax and driver charges?
**A:** Extra pax and driver accommodation are NOT discounted. Only room charges (ROOM type) get the discount.

### Q: Can I have different discounts for different rooms in the same reservation?
**A:** The current system applies one discount per reservation. For different room rates, use room assignment during check-in.

### Q: What happens to discount if I cancel a reservation?
**A:** The discount is preserved in the reservation record. If you reinstate the reservation, the discount remains active.

### Q: Are tax rates NBR-compliant?
**A:** The seeded defaults are recommendations. Always verify with your local VAT consultant and NBR division. Novem ERP does not guarantee NBR compliance without verification.

---

## 📞 Support & Questions

For issues or questions:
1. Check the FAQ above
2. Review the Quotation message preview before sending
3. Test on a non-live reservation first
4. Contact your NBR VAT consultant for tax rate verification
5. Open an issue on GitHub with details

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-06-11 | Initial release - Discount policy modal & tax integration |
