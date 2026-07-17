# PR-01 — Duplicate Rendering Stabilization

## Scope completed

This PR addresses source-level causes of duplicate KPI/card rendering and duplicate Supabase reads during React development remounts.

## Root causes found

1. Shared KPI and tab components accepted duplicate descriptors and used index-based keys.
2. React StrictMode intentionally remounts effects in development, causing concurrent duplicate Supabase requests even when stale responses were ignored.
3. Reservation payments, inventory KPI, HR KPI, and reservation KPI loaders had no shared request coalescing.
4. The repository contains legacy and current module implementations in parallel. Canonical routes currently point to the current modules; legacy files remain but are not removed in this PR to avoid breaking data flows.

## Files changed

- `src/lib/singleFlight.js` — Adds a shared concurrent-request coalescer for StrictMode-safe Supabase reads.
- `src/components/layout/KpiStrip.jsx` — Deduplicates KPI descriptors by `id`/`label` and removes index-based React keys.
- `src/components/layout/ModuleTabs.jsx` — Deduplicates tab descriptors by canonical tab ID before rendering.
- `src/modules/reservations/services/reservations.service.js` — Coalesces reservation KPI RPC calls.
- `src/modules/inventory/InventoryPage.jsx` — Coalesces inventory KPI queries per refresh cycle.
- `src/modules/hr/HrPayrollPage.jsx` — Coalesces daily HR KPI queries.
- `src/pages/ReservationPayments.jsx` — Coalesces reservation/payment list loading.

## Modules audited

- Reservations: canonical `ReservationsPage`; legacy page still present but not mounted by canonical route.
- Front Office: canonical slug-based `FrontOfficePage`; workspace limited to Room Rack by current implementation.
- Housekeeping: current module re-exports `HousekeepingHub` once.
- Restaurant POS: one canonical route mounts `RestaurantPage`; `/pos` redirects rather than mounting a second page.
- Inventory: one canonical route mounts `InventoryPage`.
- Accounting: route pages share `AccountingHub`; no duplicate route mount found.
- HR & Payroll: one canonical page mount; KPI reads were StrictMode-sensitive.
- Reports: tenant and non-tenant routes are separate URL patterns and mount one center each.

## Deferred to next PR

- Shared payment transaction component and module-scoped filtering.
- Dynamic bank/card/cheque fields.
- Historical payment backfill/reconciliation migration.
- Removal of AI task generation and rule-based task automation.
- Live dashboard/notification expansion.
- Guest QR portal.
