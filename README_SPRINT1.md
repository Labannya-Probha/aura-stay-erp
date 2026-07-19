# AEDS v3 Stabilization Sprint 1

Includes:

- React 19 safe AppSession.jsx
- Enterprise ESLint config
- lint metrics script

Merge order:

1. Replace eslint.config.js
2. Add scripts/lint-metrics.mjs
3. Replace src/AppSession.jsx
4. Add scripts to package.json:
   "lint:metrics": "node scripts/lint-metrics.mjs",
   "lint:strict": "eslint src"
5. Run:
   npm run lint:metrics
   npm run lint
