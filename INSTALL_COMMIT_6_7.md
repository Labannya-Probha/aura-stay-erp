# Install PR03.2 Commit-6 & Commit-7

Prerequisite: Commit-5 Payment Posting Engine must already exist.

Extract this archive into the repository root, not inside `src`.

Then run:

```powershell
npm run test:run -- --run src/modules/accounting/payment-posting/__tests__/paymentJournalBuilder.test.js src/modules/accounting/payment-settlement/__tests__/settlementJournalBuilder.test.js
npm run build
npx supabase db push

git add src/modules/accounting/payment-posting
git add src/modules/accounting/payment-settlement
git add supabase/migrations/20260720020000_payment_posting_queue.sql
git add supabase/migrations/20260720030000_payment_settlement_engine.sql
git add PR03_2_COMMIT_6.md PR03_2_COMMIT_7.md
git commit -m "feat(payments): add auto posting queue and settlement engine"
git pull --rebase origin feature/pr03-2-payment-configuration
git push origin feature/pr03-2-payment-configuration
```
