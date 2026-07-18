# PR-03.2 — Commit 2

Copy the `src/modules/accounting/payment-configuration` folder into the same location in the Aura Stay ERP repository.

The uploaded `paths.js` already contains `ACCOUNTING_PAYMENT_CONFIGURATION`, and the uploaded `AppRoutes.jsx` already imports and registers the page. No route change is required for Commit 2.

Run:

```bash
npm run build
git add src/modules/accounting/payment-configuration
git commit -m "feat(payment): add payment terminal management ui"
```

No demo terminal or chart-of-accounts data is included. Supabase CRUD will be connected in Commit 3.
