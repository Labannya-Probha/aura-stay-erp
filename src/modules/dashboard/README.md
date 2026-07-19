# AEDS v2 Enterprise Dashboard Module

## Use this import in AppRoutes.jsx

```js
import DashboardPage from "./modules/dashboard/DashboardPage.jsx"
```

## Recommended route

```jsx
<Route
  path={PATHS.DASHBOARD}
  element={
    <SaasModuleFrame moduleId="dashboard" company={company} role={role} userName={userName}>
      <DashboardPage company={company} userName={userName} />
    </SaasModuleFrame>
  }
/>
```

## Migration

Move/delete old duplicate folders after confirming build:

- `src/components/dashboard/`
- `src/pages/Dashboard.jsx`

Run SQL:

- `src/modules/dashboard/sql/dashboard.sql`
