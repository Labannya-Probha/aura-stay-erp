# Executive Command Center and Reporting Studio Blueprint

This repository now has the foundation for a premium hospitality command center and reporting studio.

## UI Foundation

- `src/components/executive/ExecutiveCommandCenter.tsx` is the executive shell for premium dashboard layouts.
- `src/components/executive/RoomStatusGrid.tsx` renders a color-coded live floor map.
- `src/hooks/useComparativeSeries.ts` normalizes KPI series into current, delta, and sparkline metadata.
- `src/hooks/useRoomSnapshot.ts` loads live room state and keeps it synced through realtime changes.
- `src/components/feedback/LoadingState.tsx` and `src/components/feedback/EmptyState.tsx` remain the shared state primitives.

## Reporting Foundation

- `src/modules/reports/components/ReportingStudioShell.tsx` provides a premium report workspace frame.
- `src/modules/reports/hooks/useComparativeReportFrame.ts` prepares current vs prior vs budget comparison data.
- `supabase/migrations/20260727090000_reporting_studio_architecture.sql` adds reporting FX and budget schemas plus USALI and aging report functions.

## Adoption Pattern

1. Use `ExecutiveCommandCenter` for dashboard-style pages that need live KPI tiles and room grids.
2. Use `ReportingStudioShell` for report routes that need filters, comparison cards, and export actions.
3. Keep `ModuleContainer` for standard module pages that do not need executive treatment.
4. Wire report pages to the SQL functions in the new migration instead of duplicating logic in the UI.

## Design Rules

- Typography: Inter for UI, IBM Plex Mono for numeric fields.
- Spacing: 8pt grid discipline.
- Tokens: prefer `--tenant-primary`, `--tenant-accent`, `--tenant-surface`, `--tenant-border`.
- Failure isolation: keep route-level `ModuleRouteBoundary` wrappers around all high-traffic module pages.
