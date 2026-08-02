# AEDS Report Center v2 — Cumulative Slice 3

This cumulative package contains the first three UI implementation slices.

## Slice 1 — Report workspace foundation

- Compact enterprise report header
- Collapsible report criteria
- Controlled PDF/Excel/print actions
- Financial statement-safe KPI behavior

## Slice 2 — Report catalog

- Report Explorer
- Dense report library table
- Department navigation
- Favorites and recent reports

## Slice 3 — Execution workflow

- Draft criteria separated from executed criteria
- Explicit **Run report** action
- Reset criteria
- Per-report saved views stored as user browser preferences
- Fullscreen report workspace with Escape support
- Refined document canvas and criteria action bar

## Files

- `src/modules/reports/components/ReportExplorer.tsx`
- `src/modules/reports/components/ReportingStudioShell.tsx`
- `src/modules/reports/components/ReportViewManager.tsx`
- `src/modules/reports/pages/DynamicReportPage.tsx`
- `src/modules/reports/pages/ReportsLandingPage.tsx`
- `src/modules/reports/reports.css`

## Integration

Copy the `src` directory into the repository root and run the normal typecheck, tests and production build.

Saved views in this slice are intentionally user-local. Shared/team views require tenant-scoped database tables, RBAC, APIs and audit records and should not be simulated only in React.

## Slice 4 — Enterprise Report Table

This cumulative release replaces the generic metadata table with a controller-grade report grid.

Included:

- sticky table header and grand-total footer
- compact / comfortable / spacious density modes
- sortable columns with accessible `aria-sort`
- per-user column visibility control
- numeric and financial value alignment
- section grouping and section totals
- comparison summary table
- responsive horizontal overflow handling
- optional row drill-down callback (`onRowOpen`)
- print-safe table header/footer behavior

Important:

- Sorting and column visibility are presentation-only and do not alter server-owned financial calculations.
- Drill-down navigation remains opt-in until each report defines a trusted target route or row action.
- For very large result sets, the next backend phase should use server-side sorting, cursor pagination, and virtualization rather than loading every row into React.

## Slice 5 — Financial Statement Renderer

This cumulative release adds a dedicated professional renderer for Profit and Loss, Balance Sheet, Cash Flow, Statement of Changes in Equity, and configured USALI financial statements.

Included:

- formal statement heading and period treatment
- current and comparative period headers
- optional variance amount and percentage columns
- account hierarchy indentation
- account-code and notes-reference support
- section, subtotal, calculated, memo, and grand-total line treatments
- parentheses-based negative amounts and configurable zero display
- report status, currency, scale, and validation provenance
- validation failure and warning banners
- professional statement footer
- responsive and print-safe behavior

Recommended metadata:

- `formatting.show_variance_columns`
- `formatting.show_notes_column`
- `formatting.show_account_codes`
- `formatting.amount_scale_label`
- `report.statement_type`
- `report.report_code`

Important:

- The renderer displays server-returned balances; it does not calculate financial statements in React.
- Positive/negative variance color is mathematically based. A future server metadata field should define whether increases are favourable or adverse for each line.

## Slice 6 — Enterprise Governance Workspace

This cumulative release upgrades each report page into a controlled reporting workspace.

New files:

- `src/modules/reports/components/ReportGovernanceBar.tsx`
- `src/modules/reports/components/ReportHealthPanel.tsx`
- `src/modules/reports/components/ReportProvenanceBar.tsx`
- `src/modules/reports/hooks/useReportKeyboardShortcuts.ts`

Implemented:

- report status and snapshot badge
- prepared / reviewed / approved / locked ribbon
- report version selector
- version and approval history panel
- report health control summary
- status watermark for Draft, Approved, and Locked reports
- generation engine, dataset hash, snapshot, approver, execution-time provenance
- keyboard shortcuts for Run, Print, Excel, Filters, and Fullscreen
- defensive metadata handling when backend fields are absent

Expected optional response metadata:

```json
{
  "approval": {
    "status": "Approved",
    "approved_by_name": "Finance Controller",
    "steps": [
      {
        "key": "prepared",
        "label": "Prepared",
        "status": "complete",
        "actorName": "Accounts Officer",
        "completedAt": "2026-08-02T10:00:00Z"
      }
    ]
  },
  "snapshot": {
    "id": "RPT-SNP-0001",
    "version": 3,
    "status": "Approved",
    "locked": true,
    "dataset_hash": "sha256..."
  },
  "versions": [],
  "history": [],
  "meta": {
    "engine": "AEDS Python Reporting Engine",
    "generated_at": "2026-08-02T10:05:00Z",
    "execution_ms": 840,
    "freshness_label": "Ledger through 02 Aug 2026"
  },
  "validation": {
    "valid": true,
    "balanced": true
  },
  "mapping": {
    "complete": true,
    "unmappedCount": 0
  }
}
```

The UI does not invent approval actors, snapshot hashes, versions, or audit history. Missing server metadata is explicitly displayed as unavailable or unknown.

## Runtime Alignment Pack

See `docs/reports/RUNTIME_AUDIT_AND_VISUAL_QA.md` and `docs/reports/REPORT_RUNTIME_CONTRACT_V1.md`. Apply the included Supabase migration before using the legacy four-argument `runAedsReport` path.
