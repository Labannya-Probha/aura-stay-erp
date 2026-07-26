# AEDS v3 Sprint 2–7 Stabilization Pack

This package is designed to stabilize the current Aura Stay ERP codebase without breaking existing modules.

## What this package does

- Adds React 19 migration-safe ESLint profile
- Keeps risky React compiler rules disabled during legacy migration
- Adds sprint-based module migration plan
- Adds shared AEDS page primitives for module rewrites
- Adds safe placeholders for sprint execution
- Adds command scripts for lint metric tracking

## Why risky React 19 rules are disabled now

Your current lint report shows many errors from:
- react-hooks/set-state-in-effect
- react-hooks/static-components
- react-hooks/immutability

These are migration rules. Turning them on immediately creates 100+ legacy rewrite tasks and may break Reservations, POS, Front Office, VAT, and Accounting.

## Recommended sprint order

Sprint 2: Dashboard  
Sprint 3: Reservations  
Sprint 4: Front Office  
Sprint 5: Housekeeping + Restaurant POS  
Sprint 6: Inventory + Accounting + Reports  
Sprint 7: React 19 strict migration + final lint hardening

## Merge order

1. Replace `eslint.config.js`
2. Add `scripts/lint-metrics.mjs`
3. Add `src/design-system/*`
4. Add `src/modules/_migration/*`
5. Run:

```bash
npm run lint:metrics
npm run lint
```

## Add package.json scripts

```json
"lint:metrics": "node scripts/lint-metrics.mjs",
"lint:strict": "eslint src --max-warnings=0"
```
