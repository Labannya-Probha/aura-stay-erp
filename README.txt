AEDS Front Office Complete Fix

Changes:
1. Front Office Workspace header/KPI/tabs render only on Room Rack.
2. Night Audit no longer shows Outstanding Due KPI.
3. Night Audit KPI queries are tenant-scoped for every tenant.
4. Night Audit in-house count uses active stays for the current date.
5. Service Bills tab now resolves to the Service Bills component instead of Room Rack.
6. Legacy room-board URL resolves to room-rack.
7. Front Office tab resolver now returns a tab ID, not a tab object.

Install:
- Extract this ZIP into the project root and replace matching files.
- Run: npm install
- Run: npm run build
- Run: npm run dev

Git:
- git add src/modules/front-office/FrontOfficePage.jsx src/modules/front-office/frontOffice.config.js src/components/KPICards.jsx
- git commit -m "fix(front-office): tenant-safe night audit and room rack workspace"
- git push origin main
