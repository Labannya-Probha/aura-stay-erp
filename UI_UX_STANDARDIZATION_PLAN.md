# UI/UX Standardization Plan (Enterprise Rollout)

## Objective

Raise UI consistency, resilience, and accessibility across all high-traffic modules through shared platform primitives, module-level fault isolation, and incremental rollout with zero tenant-theme regression.

## New Shared Building Blocks

- `src/components/feedback/LoadingState.tsx`
- `src/components/feedback/EmptyState.tsx`
- `src/components/boundary/ModuleErrorBoundary.tsx`
- `src/hooks/accessibility/useGridKeyboardNavigation.ts`
- `src/hooks/accessibility/useLayerFocus.ts`

## Rollout Architecture

1. Phase 1: Platform primitives

- Introduce shared Loading/Empty/Boundary and keyboard-focus hooks.
- Integrate with table/dialog primitives only.

1. Phase 2: Module shell protection

- Wrap route-level module roots in `ModuleErrorBoundary`:
  - Restaurant POS
  - HR/Payroll routes
  - Inventory
  - Accounting
  - Housekeeping
  - Front Office tabs

1. Phase 3: High-traffic screen refactor

- Replace ad-hoc placeholders and skeleton divs with `LoadingState` + `EmptyState`.
- Enforce keyboard grid behavior on dense data tables.

1. Phase 4: Governance

- Add PR checklist gates:
  - Has loading state.
  - Has empty state.
  - Has module boundary.
  - Keyboard and ARIA checks complete.

## File Structure Guide

- Shared visual states: `src/components/feedback/*`
- Error containment: `src/components/boundary/*`
- Cross-cutting accessibility hooks: `src/hooks/accessibility/*`
- Module-specific adapters remain inside each module folder (`src/modules/<module>/...`) and import shared primitives.

## Live Multi-Tenant Theme Safety

- New components use existing semantic tokens (`bg-card`, `text-foreground`, `border-border`) and avoid hard-coded palette overrides.
- No new global CSS variable is required.

## Suggested Adoption Sequence

1. `src/components/data/DataTable.jsx`
2. `src/modules/front-office/shared/FrontOfficeTable.jsx`
3. `src/components/ui/dialog.jsx`
4. `src/AppRoutes.jsx` module wrappers
5. Remaining feature tables and modal shells module-by-module

## QA Criteria

- Visual consistency across loading/empty/failure states.
- Tab and arrow-key navigation works in dense tables.
- Dialog open/close focus behavior remains predictable.
- Route crashes remain isolated to the module boundary.
