# Route patch

```jsx
import ReportsCenterPage from "./modules/reports/ReportsCenterPage.jsx"
import { DynamicReportPage } from "./modules/reports"

<Route path="/reports" element={<ReportsCenterPage company={company} role={role} />} />
<Route path="/reports/:department/:slug" element={<DynamicReportPage company={company} role={role} />} />
```
