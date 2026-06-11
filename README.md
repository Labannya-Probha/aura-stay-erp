# Novem ERP — Phase 1 (Front Office · Billing · Mushak-6.3)

Custom resort ERP for **Novem Eco Resort, Sreemangal** — built on React + Supabase + Vercel.

Phase 1 covers the guest revenue cycle: Reservation Query → Quotation (WhatsApp/Email) →
Advance & Confirmation → Check-In + printable Guest Registration Card → Folio & Payments
(automatic ADVANCE/REGULAR classification) → Check-out generating **two invoices**
(branded Guest Bill + NBR **Mushak-6.3**), with an auto-populated **Mushak-6.2 sales register**.

---

## Database — ALREADY LIVE ✅

Supabase project **Novem ERP** (`gwllsoembqacolzfrquu`, region `ap-south-1` Mumbai).
The Phase-1 schema (12 tables, triggers, sequences, RLS) is already applied — nothing to run.

- URL: `https://gwllsoembqacolzfrquu.supabase.co`
- The app ships with the project URL + anon key pre-filled in `src/supabase.js`.
  (The anon key is safe in client code; Row Level Security restricts all data to signed-in staff.)
- Optional Vercel env-var overrides: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Deploy (GitHub → Vercel, no local tooling)

1. Create a new GitHub repository (e.g. `novem-erp`) → **Add file → Upload files** →
   drag the entire contents of this folder (keep the folder structure) → Commit.
2. In **Vercel → Add New → Project**, import the repo.
   Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`. Deploy.
3. Done — Vercel installs dependencies and builds in the cloud.

## First-run checklist (5 minutes)

1. **Create staff logins**: Supabase Dashboard → project *Novem ERP* → **Authentication → Users →
   Add user** (email + password, tick auto-confirm). The app sign-in uses these accounts.
2. **Settings → Company profile**: enter your **BIN** (required on Mushak-6.3).
3. **Settings → Tax configuration**: verify VAT / SD / Service-Charge % with your VAT consultant
   (seeded defaults: ROOM 15/0/10, RESTAURANT 5/0/10 — editable, effective-dated).
4. **Settings → Room inventory**: add room numbers, types, and base rates.
5. Create your first reservation query and walk the pipeline.

## How the rules you specified are enforced

- **Advance vs Regular (req. 5):** a database trigger compares payment date with check-in date — staff never choose.
- **Separated components (req. 8):** every charge stores Base / Discount / Service Charge / SD / VAT / Total in separate columns.
- **Dual invoices (req. 9):** checkout writes both `GUEST_BILL` and `MUSHAK_63` invoices with a line snapshot; both print (browser → Save as PDF) and export to Excel.
- **Gap-free NBR serial:** Mushak-6.3 numbers come from a dedicated PostgreSQL sequence (`MUS-000001`, `MUS-000002`, …).
- **Mushak-6.2 (req. 10):** every 6.3 auto-inserts into `vat_sales_register`; the VAT Register page gives monthly totals + Excel export.

## Roadmap

Phase 2 Restaurant POS → Phase 3 Inventory + approvals + Mushak-6.1 → Phase 4 VAT suite (9.1, 6.6, 6.10) → Phase 5 HR & office (Labour Law registers, docket numbers) → Phase 6 IFRS GL + Fixed Assets.
