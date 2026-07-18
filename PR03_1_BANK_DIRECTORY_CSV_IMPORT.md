# AEDS PR-03.1 — Bank Directory CSV Import

This revision replaces the oversized SQL data seed with Supabase Table Editor CSV import.

## Files

- `supabase/migrations/20260719010000_pos_terminal_and_cheque_bank_directory.sql`
- `supabase/migrations/20260719011000_bank_directory_csv_import_support.sql`
- `supabase/data/bangladesh_bank_branches_routing_numbers_import.csv`

## Execution order

1. Run `20260719010000_pos_terminal_and_cheque_bank_directory.sql` only if it has not already been run.
2. Run `20260719011000_bank_directory_csv_import_support.sql`.
3. Open Supabase Dashboard → Table Editor → `bank_directory` → Import data from CSV.
4. Upload `supabase/data/bangladesh_bank_branches_routing_numbers_import.csv`.
5. Keep `id` and `created_at` unmapped/default. Map the eight CSV columns to the same-named table columns.
6. Start the import.

## Verification

```sql
select * from public.bank_directory_import_status;
```

Expected source row count: `10801`.

The source contains two routing-number conflicts. PR-03.1 preserves those rows and indexes routing numbers for fast lookup instead of silently deleting either branch.

## Re-import safely

To fully reload the directory:

```sql
truncate table public.bank_directory restart identity;
```

Then import the CSV again.

## Demo tenant payment mapping

```sql
select public.seed_demo_payment_configuration('YOUR-DEMO-TENANT-UUID');
```
