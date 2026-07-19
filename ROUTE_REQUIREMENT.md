# Required Reports Route

Make sure AppRoutes.jsx contains:

```jsx
import ReportsCenterPage from "./modules/reports/ReportsCenterPage.jsx"
import ReportsDynamicRoute from "./modules/reports/ReportsDynamicRoute.jsx"

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

<Route
  path="/reports/:department/:reportId"
  element={
    <ReportsDynamicRoute
      company={company}
      role={role}
      userName={userName}
      privileges={privileges}
    />
  }
/>
```

Also make sure `src/app/paths.js` has:

```js
REPORTS: "/reports",
```
