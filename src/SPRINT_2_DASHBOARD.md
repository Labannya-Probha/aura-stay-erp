# Sprint 2 — Dashboard

Goal:
- Keep only one dashboard module: `src/modules/dashboard`
- Remove duplicate `src/components/dashboard` and old `src/pages/Dashboard.jsx` after route confirms
- Dashboard data flow:
  UI → useDashboard → dashboardService → Supabase RPC

Done criteria:
- `/dashboard` loads without layout glitch
- KPI row visible
- No dummy demo label
- No direct Supabase call in widget components
