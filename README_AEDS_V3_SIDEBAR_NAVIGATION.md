# AEDS v3 SidebarNavigation Rewrite

This package replaces:

`src/components/layout/Sidebar/SidebarNavigation.jsx`

Fixes:
- Reports Center click going to Dashboard
- Old `/reports?report=CODE` query routing
- Adds `/reports/accounts/accounts-payable-aging` style URL
- Department-wise Reports tree
- Reservations tab routing
- Front Office tab routing
- Dynamic RBAC checks
- No duplicate navigation logic

After merge:

```bash
npm run lint -- src/components/layout/Sidebar/SidebarNavigation.jsx
npm run dev
```

Important:
Make sure `PATHS.REPORTS = "/reports"` exists in `src/app/paths.js`.
