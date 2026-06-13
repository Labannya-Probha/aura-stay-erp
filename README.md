# Aura Stay — Resort ERP (white-label)

White-label hotel/resort ERP. Front Office, Restaurant POS, Facilities, Inventory,
VAT Center (NBR Mushak), Accounting, HR & Office, Night Audit, Booking Calendar and Reports.

## White-label / resale
All branding lives in **Settings → Branding & company profile**:
- Upload your logo (stored in Supabase Storage bucket `branding`, public URL).
- Software name, property name, legal name, address, BIN, currency symbol,
  document short code, VAT circle, Mushak-6.10 threshold, invoice footer and
  default Terms & Conditions are all editable per client.
- No company detail is hard-coded in the UI — a new client only edits Settings.

## Tech
React 18 + Vite + Tailwind 3, Supabase (Postgres + Auth + Storage), deploy on Vercel.
Supabase credentials live in `src/supabase.js`.

## Deploy (no local tooling)
1. Upload this folder's contents to your GitHub repo (web upload is fine).
2. Vercel auto-builds on push (`npm run build`, output `dist`).
3. First user to sign in becomes Administrator. Add more users in
   Supabase → Authentication → Users; set their role in Settings → Staff & roles.

## Roles
ADMIN, MANAGER, FRONT_OFFICE, RESTAURANT, STORE, ACCOUNTS, HR — module access is role-gated.

## Login (username-based, no email)
Staff sign in with a **username + password** — no email required. Internally each
account maps to a system address. Create staff in **Settings → Staff & roles**
(admin only): enter name, username, password, role.

IMPORTANT for new installs: in Supabase → Authentication → Providers → Email,
turn **off** "Confirm email" so username accounts activate instantly.

## Bill rounding
Grand total auto-rounds per **Settings → Branding → Bill rounding**
(None / Nearest 1 / 5 / 10). Taxable value, service charge, SD and VAT stay exact;
the difference posts as a "Rounding adjustment" line so the folio balance and the
printed bill agree to the rounded payable.
