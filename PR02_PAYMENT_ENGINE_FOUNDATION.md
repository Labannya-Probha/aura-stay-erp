# PR-02 — Payment Engine Foundation

## Scope delivered

- Shared payment scope filtering for Reservation, Front Office, Restaurant POS and Accounting contexts.
- Accounting-wide Payment Transactions view.
- Front Office Cashier restricted to `source_module = FRONT_OFFICE`.
- Dynamic Bank/Card/Cheque fields sourced from tenant COA bank accounts.
- Additive database migration for payment source metadata and method-specific fields.
- Tenant-level database validation for selected bank accounts.

## Manual setup after migration

Mark appropriate COA rows as bank accounts:

```sql
update public.chart_of_accounts
set is_bank_account = true
where tenant_id = public.current_tenant_id()
  and code in ('YOUR_BANK_GL_CODES');
```

## Deferred to PR-03

- Missing historical payment discovery/backfill from reservation, POS and accounting source documents.
- Before/after reconciliation report and exception queue.
- POS and Service Bills source-module tagging at every write path.
