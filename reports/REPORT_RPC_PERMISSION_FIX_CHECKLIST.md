# Reports RPC Permission Fix Checklist

## Goal

Make `public.aeds_run_report` callable by authenticated users and verify real 72-report coverage.

## 1) Apply migration

Run your normal Supabase migration flow and include:

- `supabase/migrations/20260727083000_fix_reports_rpc_execute_grants.sql`

This migration:

- Revokes execute from `public` and `anon`
- Grants execute to `authenticated` and `service_role`
- Applies to all current signatures of:
  - `public.aeds_report_metadata`
  - `public.aeds_report_definition`
  - `public.aeds_run_report`

## 2) Confirm in SQL (optional but recommended)

```sql
select
  p.oid::regprocedure as fn,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') as auth_can_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') as service_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('aeds_report_metadata', 'aeds_report_definition', 'aeds_run_report')
order by 1;
```

## 3) Rerun full 72 audit

1. Log in to the app as a tenant user (Demo Superuser works).
2. Get fresh access token from browser session storage key:
   - `sb-<project-ref>-auth-token`
3. In terminal:

```powershell
$env:REPORT_ACCESS_TOKEN = '<fresh access_token>'
node scripts/reports-audit72.mjs
```

## 4) Read final output

Generated file:

- `reports/report-audit-72-live-YYYY-MM-DD.md`

Use this as the single source of truth for:

- Working reports
- Placeholder reports
- Missing/error reports
- Department-wise completeness
