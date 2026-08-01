# Aura Stay ERP — P0 Financial Report Frontend Integration Patch

This patch aligns the frontend report engine with the live tenant-aware Supabase RPC contract.

## Changes

- Sends `p_tenant_id` to `aeds_run_report`.
- Removes silent production fallbacks that previously showed empty reports after RPC errors.
- Adds visible loading/error/retry states.
- Renders structured financial-statement rows (`line_code`, `label`, formatting flags, current/comparison/variance amounts).
- Adds print-safe A4 styling.
- Tenant-scopes saved report views and export requests.

## Apply

Copy the four files into the repository root, replacing the existing files, then run:

```bash
npm run lint
npm test -- --run
npm run build
```

## Database prerequisite

The live database migrations already applied in this execution are required, including the mapping-driven `rpt_ifrs_profit_or_loss()` implementation.
