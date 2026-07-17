/*
Add this import in AppRoutes.jsx:
*/

import ReportsCenterPage from "./modules/reports/ReportsCenterPage.jsx"
import ReportsDynamicRoute from "./modules/reports/ReportsDynamicRoute.jsx"

/*
Use these routes:
*/

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
