# AEDS Front Office Routing Architecture Rebuild

## Canonical routes

- /front-office/room-rack
- /front-office/arrivals
- /front-office/departures
- /front-office/in-house
- /front-office/check-in-out
- /front-office/guest-folio
- /front-office/service-bills
- /front-office/cashier
- /front-office/night-audit
- /front-office/lost-found
- /front-office/guest-messages

Legacy `/front-office?tab=...` URLs are automatically redirected to canonical slugs.

## Architecture

`frontOffice.config.js` is the single source of truth for:

- URL slug
- sidebar label
- title and description
- icon
- permission
- renderer key
- ordering
- Room Rack workspace visibility

The Front Office Workspace and KPI strip are rendered only on Room Rack. Every other route has a compact page-specific header.

## Validation

- `npm run lint`: 0 errors (existing repository warnings remain)
- `npm run build`: PASS, 2321 modules transformed

Two existing Linux case-sensitive import issues were also corrected:

- `src/components/Login.jsx`
- `src/layout/shell/AedsShell.jsx`
