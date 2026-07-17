# Local project decision

I inspected the uploaded project archive listing and the provided route/navigation files.

## Decision

Do not rebuild the whole ERP right now. The project already contains the new metadata-driven Reports module under:

`src/modules/reports`

The actual problems are integration problems:

1. `src/AppRoutes.jsx` has `/reports` but does not have `/reports/:department/:slug`.
2. The app sidebar folder is lowercase: `src/components/layout/sidebar`, so earlier uppercase-path patches may not affect the live file.
3. The main sidebar still gets report entries from `src/lib/reporting/tenantReporting.js`, so those entries must expose:
   - `departmentSlug`
   - `slug`
   - `route`
4. Your Supabase already had old report tables, so `CREATE TABLE IF NOT EXISTS` did not add missing columns. Run the included SQL migration first.

## Apply order

1. Copy files from this ZIP into your project root.
2. Run SQL:
   `src/modules/reports/sql/000_existing_table_migration_fix.sql`
3. Then run:
   `src/modules/reports/sql/001_metadata_schema.sql`
   `src/modules/reports/sql/002_seed_accounts_reports.sql`
   `src/modules/reports/sql/003_rpc_engine.sql`
4. Restart:
   `npm run dev`

## Expected route

`/reports/accounts/accounts-payable-aging`
