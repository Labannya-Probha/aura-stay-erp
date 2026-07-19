# AEDS v4 Metadata-Driven Reporting Engine

Extract into project root.

## SQL order
1. `src/modules/reports/sql/001_metadata_schema.sql`
2. `src/modules/reports/sql/002_seed_accounts_reports.sql`
3. `src/modules/reports/sql/003_rpc_engine.sql`

## Routes
```jsx
import ReportsCenterPage from "./modules/reports/ReportsCenterPage.jsx"
import { DynamicReportPage } from "./modules/reports"

<Route path="/reports" element={<ReportsCenterPage company={company} role={role} />} />
<Route path="/reports/:department/:slug" element={<DynamicReportPage company={company} role={role} />} />
```

Open:
- `/reports`
- `/reports/accounts/accounts-payable-aging`
- `/reports/accounts/trial-balance`
