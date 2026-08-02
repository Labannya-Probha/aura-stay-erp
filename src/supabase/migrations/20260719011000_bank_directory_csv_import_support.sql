-- AEDS PR-03.1: Supabase CSV import support for Bangladesh bank directory.
-- Run this after 20260719010000_pos_terminal_and_cheque_bank_directory.sql
-- and before importing the CSV through Table Editor.

-- The source directory contains two routing-number conflicts. Routing number remains
-- searchable, but uniqueness is enforced on the complete bank/branch identity so
-- the official source rows can be imported without discarding data.
alter table public.bank_directory
  drop constraint if exists bank_directory_routing_number_key;

create unique index if not exists uq_bank_directory_branch_identity
  on public.bank_directory (
    bank_name,
    district_name,
    branch_name,
    routing_number
  );

create index if not exists idx_bank_directory_routing_number
  on public.bank_directory (routing_number);

-- Safe operational checks after import.
create or replace view public.bank_directory_import_status as
select
  count(*)::bigint as total_rows,
  count(distinct bank_name)::bigint as total_banks,
  count(distinct district_name)::bigint as total_districts,
  count(distinct routing_number)::bigint as distinct_routing_numbers,
  count(*) - count(distinct routing_number)::bigint as routing_conflict_rows,
  max(created_at) as latest_import_at
from public.bank_directory;

grant select on public.bank_directory_import_status to authenticated;

notify pgrst, 'reload schema';
