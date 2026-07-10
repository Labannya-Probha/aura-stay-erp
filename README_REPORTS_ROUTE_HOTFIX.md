# AEDS v3 Reports Route Hotfix

This fixes:

`Failed to resolve import "./modules/reports/ReportsCenterPage.jsx"`

## What to do

Extract into project root.

It adds:

`src/modules/reports/ReportsCenterPage.jsx`

Your existing import will work:

```jsx
import ReportsCenterPage from "./modules/reports/ReportsCenterPage.jsx"
```

## Recommended route

```jsx
<Route
  path={PATHS.REPORTS}
  element={
    <ReportsCenterPage
      company={company}
      role={role}
      userName={userName}
      privileges={privileges}
    />
  }
/>
```

## Dynamic report route

Also add this route if you want `/reports/:department/:reportId`:

```jsx
import { ReportsModuleLayout, ReportRoutePage } from "./modules/reports"

<Route
  path="/reports/:department/:reportId"
  element={
    <ReportsModuleLayout role={role}>
      <ReportRoutePage role={role} />
    </ReportsModuleLayout>
  }
/>
```
