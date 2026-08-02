# AEDS Report Center — Runtime Audit and Contract Alignment

## Audit result

### P0 — RPC signature mismatch

`src/components/report-engine/reportEngine.service.js` calls:

```js
supabase.rpc('aeds_run_report', {
  p_department_slug,
  p_report_slug,
  p_filters,
  p_tenant_id,
})
```

The existing PostgreSQL function accepts only:

```sql
aeds_run_report(text, text, jsonb)
```

The included migration adds a safe four-argument compatibility overload. It verifies the supplied tenant id against `current_tenant_id()` and delegates to the authoritative three-argument function. It does not trust an arbitrary tenant id.

### P1 — Two inconsistent report runtime paths

- `useDynamicReport` uses `reportMetadata.service.ts`.
- `reportEngine.service.js` exposes another execution method.
- The UI expects governance, snapshot, health and provenance fields, while the current PostgreSQL result mainly returns `{ rows, summary }`.

The included `reportRuntime.contract.ts` creates one normalized UI envelope supporting both the current PostgreSQL response and a future Python reporting response.

### P1 — Missing runtime error state

The original hook could remain in a loading state after exceptions because errors were not caught and `loading` was not finalized. The replacement hook adds:

- `error`
- `refetch`
- try/catch/finally
- stale request protection
- route-change reset
- response normalization

### P1 — Stale response race

Rapid filter or route changes could allow an earlier request to overwrite a newer result. The replacement hook uses a request sequence and disposal check.

### P2 — Governance metadata is mostly unavailable

Current SQL reports return rows and summary totals, but not authoritative:

- approval steps
- report versions
- snapshot hash
- audit history
- mapping completeness
- validation state

The UI continues to show these as unknown instead of inventing values.

## Runtime verification matrix

Run these with a real tenant session:

| Test                     | Expected                                                              |
| ------------------------ | --------------------------------------------------------------------- |
| Open Trial Balance       | One request completes, loading clears                                 |
| Change cycle and Run     | Dates resolve and report reruns once                                  |
| Rapidly run two criteria | Last request wins                                                     |
| RPC failure              | Error banner appears; Refresh retries                                 |
| Missing tenant context   | Controlled tenant error, no fallback data in production               |
| PDF export               | Job queues and returns download URL                                   |
| Empty report             | Empty state without crash                                             |
| Comparison Off           | No comparative data panel                                             |
| Comparison enabled       | Current and previous labels are present                               |
| Financial statement      | Renderer receives normalized lines/rows                               |
| Legacy `runAedsReport`   | Four-argument compatibility function succeeds only for current tenant |

## Screenshot-based visual audit required

Code inspection cannot verify actual browser rendering. Capture the following at 100% browser zoom:

1. Reports Center — 1440×900
2. Trial Balance — 1440×900
3. Profit & Loss — 1440×900
4. P&L with filters expanded
5. Table with horizontal overflow
6. Column menu open
7. Saved Views menu open
8. Approval/version bar with real metadata
9. Empty-state report
10. Error-state report
11. Fullscreen workspace
12. A4 print preview first and second pages
13. 1366×768 desktop
14. 1024×768 tablet
15. 390×844 mobile

For each screenshot verify:

- no overlapping controls
- report title remains dominant
- no decorative oversized cards
- numeric columns align
- filter controls have consistent heights
- toolbar wraps without clipping
- sticky header does not cover group rows
- watermark does not obstruct values
- approval ribbon is readable
- print header repeats correctly
- no horizontal page clipping in PDF preview

Upload those screenshots for pixel-level correction.
