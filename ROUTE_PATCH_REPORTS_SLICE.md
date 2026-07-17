# Route patch for Reports Module vertical slice

Add imports:

```tsx
import {
  ReportsLandingPage,
  ReportsModuleLayout,
  ReportRoutePage,
} from "./modules/reports"
import "./modules/reports/reports.css"
```

Routes:

```tsx
<Route
  path="/reports"
  element={
    <ReportsModuleLayout role={role}>
      <ReportsLandingPage role={role} />
    </ReportsModuleLayout>
  }
/>

<Route
  path="/reports/:department/:reportId"
  element={
    <ReportsModuleLayout role={role}>
      <ReportRoutePage role={role} />
    </ReportsModuleLayout>
  }
/>
```

This batch implements shared infrastructure + landing/sidebar + Accounts vertical slice.
