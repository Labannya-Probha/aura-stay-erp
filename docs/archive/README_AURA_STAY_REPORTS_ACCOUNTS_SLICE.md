# Aura Stay ERP — Report Module Accounts Vertical Slice

Built from `ERP_Report_Module_CodeGen_Template.xlsx`.

## Read sheets

The package was generated after reading all 8 sheets:

1. README
2. Report_Catalog
3. Field_Specs
4. Filters_Params
5. Calculations_KPIs
6. Visualization
7. Access_Roles
8. Tech_Config

## Delivered in this batch

### Shared infrastructure

- `CycleSelector`
- `ReportPageLayout`
- `useReportData(reportId, filters)`
- `ReportTable`
- Export utilities
- RBAC helpers
- Reports landing page
- Reports sidebar grouped by Department
- Route page `/reports/:department/:reportId`
- Schedule modal foundation for reports with Schedule/Email action

### Accounts vertical slice

Generated per-report folders for the first 17 Accounts reports:

- RPT-001 — Accounts Payable Aging Report
- RPT-002 — Accounts Receivable Aging Report
- RPT-003 — Balance Sheet
- RPT-004 — Bank Book Report
- RPT-005 — Bank Reconciliation Report
- RPT-006 — Cash Book Report
- RPT-007 — Cash Flow Statement
- RPT-008 — Depreciation Report
- RPT-009 — Due Balance Report
- RPT-010 — Expense Report (By Category/Department)
- RPT-011 — Ledger Report
- RPT-012 — Net Asset Value Report
- RPT-013 — Profit & Loss Statement
- RPT-014 — Trial Balance Report
- RPT-015 — Vat & Tax Collection Report
- RPT-016 — Vat & Tax Collection vs. Payment Report
- RPT-017 — Vat & Tax Payment Report

## Notes

- Field_Specs only contains detailed rows for selected reports. For blank Accounts reports, columns are inferred from similar Accounts patterns and flagged with one-line code comments in each `columns.ts`.
- Query layer always applies `tenant_id` when available in filters.
- If live Supabase data is unavailable, the preview uses realistic Bangladesh hospitality sample rows.
- Export Excel uses an Excel-compatible `.xls` file generated from table data to avoid adding a hard dependency that could break CI. You can later swap it to SheetJS if `xlsx` is already installed.

## Install

Extract this ZIP into project root.

Then add route patch from `ROUTE_PATCH_REPORTS_SLICE.md`.

Run:

```bash
npm run lint -- src/modules/reports src/reports/accounts
npm run dev
```
