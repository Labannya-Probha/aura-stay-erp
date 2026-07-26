1. Copy this package over the project root (preserve folder structure).
2. Run the SQL migration in Supabase SQL Editor:
   supabase/migrations/20260717010000_global_payment_reference_and_layout_fix.sql
3. Run:
   npm run lint
   npm run build
   npm run dev
4. Verify a new payment gets RP-{TENANT_CODE}-00000001 style payment_id.
