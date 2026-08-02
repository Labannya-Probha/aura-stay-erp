-- Widens account_department_mapping.usali_line_group's CHECK constraint to
-- allow a 'NOT_APPLICABLE' sentinel, needed because usali_line_group is a
-- P&L-only concept (REVENUE/PAYROLL_AND_RELATED/OTHER_EXPENSE) but every
-- account — including ASSET/LIABILITY/EQUITY — gets a mapping row (since
-- ifrs_statement_class in the same row is needed for the Balance Sheet
-- report regardless of account type).

begin;

alter table public.account_department_mapping
  drop constraint if exists account_department_mapping_usali_line_group_check;

alter table public.account_department_mapping
  add constraint account_department_mapping_usali_line_group_check
  check (usali_line_group = any (array[
    'REVENUE'::text,
    'PAYROLL_AND_RELATED'::text,
    'OTHER_EXPENSE'::text,
    'NOT_APPLICABLE'::text
  ]));

commit;
