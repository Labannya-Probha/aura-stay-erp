# Front Office Pattern Replication Guide

## Why Front Office Feels Clean

Front Office is clean because it centralizes repeated UI behavior into shared building blocks instead of re-implementing per page.

Current Front Office pattern:

- `shared/FrontOfficePageHeader.jsx`
- `shared/FrontOfficeTable.jsx`
- `shared/StatusPill.jsx`
- `shared/FrontOfficeRouteBoundary.jsx`
- `shared/FrontOfficeKpiStrip.jsx`
- `dialog/FrontOfficeDialogShell.jsx` used by all Front Office dialogs

This creates consistency in:

- loading and empty states
- table header/cell rhythm and spacing
- status color language
- route-level crash isolation
- dialog frame/close/footer behavior

## Extracted Cross-Module Shared Base

New generic components now exist in `src/components/shared/`:

- `ModuleContainer.tsx`
- `ModulePageHeader.tsx`
- `ModuleDataTable.tsx`
- `ModuleStatusPill.tsx`
- `ModuleDialogShell.tsx`
- `ModuleRouteBoundary.tsx`

Composition intent:

- `ModuleLayout` or `ModuleContainer` is the page-level shell for module routes.
- `ModulePageHeader` owns eyebrow, breadcrumb, title, subtitle, icon, and action cluster.
- `ModuleDataTable` provides table skeleton, empty state, and consistent header rhythm.
- `ModuleStatusPill` standardizes semantic status colors by tone map.
- `ModuleDialogShell` ensures one dialog frame across modules.
- `ModuleRouteBoundary` prevents one route crash from cascading across the app shell.

Front Office wrappers are already rewired to these generic components, so behavior remains the same while enabling module-wide reuse.

## Measured Retrofit Scope

React file counts by module (real workspace scan):

- HR: 16
- Accounting: 13
- Inventory: 12
- Restaurant: 10
- Housekeeping: 1

Priority order:

1. HR
2. Accounting
3. Inventory
4. Restaurant
5. Housekeeping

## Replication Contract (Apply to Every Module)

1. Replace page-level custom header blocks with `ModulePageHeader`.
2. Replace custom table markup with `ModuleDataTable` where feasible.
3. Replace ad-hoc status badge/chip spans with `ModuleStatusPill` and module tone map.
4. Wrap route content with `ModuleRouteBoundary`.
5. Standardize dialog shells with `ModuleDialogShell`.
6. For complex pages, compose everything using `ModuleContainer`.

## Unified App Shell and Page Layout Standard

Target hierarchy:

1. App shell (`AedsShell` + module route)
2. Module layout wrapper (`ModuleLayout`)
3. Header block (`ModulePageHeader`)
4. KPI strip (optional)
5. Filter/action bar (optional)
6. Tabs (optional)
7. Route boundary
8. Main content card/grid/table/drawer

Header anatomy policy:

- Left: eyebrow, title, subtitle.
- Top optional: breadcrumb row.
- Right: primary actions then refresh action.
- Do not put filters inside title row; keep filters in dedicated filter bar below header.

## Token and Typography Discipline

Global token source:

- CSS root tokens in `src/index.css` remain single source of truth.
- Tenant colors: `--tenant-primary`, `--tenant-accent`, and related RGB channels.
- Spacing: enforce 8pt rhythm (`4, 8, 12, 16, 24, 32...`) in paddings/gaps.

Typography policy:

- UI copy: Inter via `--tenant-font-family`.
- Numeric or code-like values: IBM Plex Mono via `--tenant-data-font-family`.
- Use utility classes:
  - `font-data` for table numbers, IDs, transaction refs.
  - `metric-value` for KPI numerics.

## shadcn/ui Primitive Mapping

Use these primitives uniformly from `src/components/ui/`:

- Tables: `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`.
- Tabs: `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`.
- Dialogs: `Dialog` primitives or `ModuleDialogShell` for custom modal shells.
- Drawers/forms: existing `DrawerForm` wrappers and consistent focus hooks.
- Buttons/inputs/selects: always use shadcn primitives, not raw inconsistent controls.

Avoid:

- raw `<table>` with custom ad-hoc class naming for core data views.
- repeated status badge style blocks per page.
- one-off modal shells per feature.

## Minimal Page Template

```tsx
import { Boxes } from 'lucide-react'
import ModuleContainer from 'src/components/shared/ModuleContainer'
import ModuleDataTable from 'src/components/shared/ModuleDataTable'
import ModuleStatusPill from 'src/components/shared/ModuleStatusPill'

const STATUS_TONES = {
  ACTIVE: 'success',
  PENDING: 'warning',
  BLOCKED: 'danger',
}

export default function InventoryExamplePage({ rows, loading, error, refresh }) {
  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Name' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <ModuleStatusPill status={row.status} toneMap={STATUS_TONES} />,
    },
    { key: 'qty', label: 'Quantity', align: 'right' },
  ]

  return (
    <ModuleContainer
      moduleName="Inventory"
      routeKey="inventory-example"
      title="Inventory"
      description="Unified inventory operations view"
      eyebrow="Supply Chain"
      icon={Boxes}
      loading={loading}
      error={error}
      onRefresh={refresh}
    >
      <ModuleDataTable
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText="No inventory rows found"
      />
    </ModuleContainer>
  )
}
```

## Dialog Template

```tsx
import ModuleDialogShell from 'src/components/shared/ModuleDialogShell'

export default function ExampleDialog({ open, onClose }) {
  return (
    <ModuleDialogShell
      open={open}
      onClose={onClose}
      title="Edit Record"
      subtitle="Keep structure and behavior consistent across modules"
      footer={<button onClick={onClose}>Close</button>}
    >
      <div>Form fields...</div>
    </ModuleDialogShell>
  )
}
```

## Rollout Plan (Low Risk)

Phase 1:

- HR tabs + drawer internals that still use raw tables.
- Accounting payment configuration and list views.

Phase 2:

- Inventory list/reporting pages.
- Restaurant table/list views and badge harmonization.

Phase 3:

- Housekeeping alignment and final design audit.
- remove remaining one-off table/header/status implementations.

Execution method per module:

1. Add module-level tone map for statuses.
2. Replace page wrappers with `ModuleLayout`.
3. Migrate one table per route to `ModuleDataTable`.
4. Migrate dialogs to `ModuleDialogShell`.
5. Add `ModuleRouteBoundary` around route body.
6. Run keyboard/focus regression check for table, dialog, drawer interactions.
7. Ship behind a feature flag if route is high-risk.

## Definition of Done

A module is considered migrated when:

- all list pages use `ModuleDataTable` or shared `DataTable` with matching behavior
- all page headers use `ModulePageHeader` or `ModuleContainer`
- all status badges use `ModuleStatusPill`
- all module routes are wrapped with `ModuleRouteBoundary`
- all module dialogs use `ModuleDialogShell`
- loading/empty/error states are visible and consistent

## Notes

- Keep `Inter` for UI copy and `IBM Plex Mono` for numeric/data emphasis only.
- Prefer token classes and existing design primitives; avoid module-specific hardcoded style drift.
- Front Office wrappers should remain for now as compatibility aliases while other modules migrate.
