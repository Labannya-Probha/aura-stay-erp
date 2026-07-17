AEDS Front Office Blank Pages Fix

Replace the included src folder over your project src folder.
Then run:
  npm run lint -- --quiet
  npm run build
  npm run dev

Validated in the supplied source:
  ESLint: 0 errors
  Vite production build: PASS (2323 modules)

Fixed pages:
- Guest Folio
- Cashier
- Night Audit
- Lost & Found
- Guest Messages

Also adds a route-level error boundary so runtime errors are visible instead of a blank page.
