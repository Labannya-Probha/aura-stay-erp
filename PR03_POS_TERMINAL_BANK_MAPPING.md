# PR-03 — POS Terminal & Cheque Bank Mapping

## Approved behavior

- **Bank Transfer:** receiving bank GL is selected from the current tenant's active bank accounts in Chart of Accounts.
- **Card:** user selects a tenant POS terminal. The database automatically derives the mapped settlement GL; users cannot override it.
- **Cheque:** issuing bank, branch and routing number come from the supplied Bangladesh bank directory. Deposit-to GL comes from the tenant COA.

## Migration order

1. `20260718010000_payment_engine_foundation.sql` (already applied as PR-02)
2. `20260719010000_pos_terminal_and_cheque_bank_directory.sql`
3. `20260719011000_seed_bangladesh_bank_directory.sql`

## Demo configuration

After identifying the demo tenant UUID:

```sql
select public.seed_demo_payment_configuration('<demo-tenant-uuid>');
```

This creates/maps:
- Demo City POS (`9001`) → Demo City Bank GL `110201`
- Demo Pubali POS (`063`) → Demo Pubali Bank GL `110202`

## Historical rows

The migration does not invent or repost historical payments. Review exceptions safely with:

```sql
select * from public.payment_configuration_exceptions;
```

Legacy CARD/CHEQUE rows can then be mapped tenant-by-tenant after documentary verification.

## PR-03.1 update

The oversized `20260719011000_seed_bangladesh_bank_directory.sql` was removed. Use the CSV import workflow in `PR03_1_BANK_DIRECTORY_CSV_IMPORT.md`.
