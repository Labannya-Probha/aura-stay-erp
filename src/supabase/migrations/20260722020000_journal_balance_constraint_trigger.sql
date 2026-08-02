-- Enforce double-entry balance at commit time.
-- Supports schemas where journal_lines may reference journal_entries via
-- entry_id (current) or journal_entry_id (legacy).

begin;

create or replace function public.check_journal_balance()
returns trigger
language plpgsql
as $$
declare
  v_entry_id uuid;
  v_has_entry_id boolean;
  v_has_journal_entry_id boolean;
  v_total_debit numeric(18,2);
  v_total_credit numeric(18,2);
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'journal_lines'
      and column_name = 'entry_id'
  ) into v_has_entry_id;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'journal_lines'
      and column_name = 'journal_entry_id'
  ) into v_has_journal_entry_id;

  if v_has_entry_id then
    v_entry_id := coalesce(new.entry_id, old.entry_id);

    select
      coalesce(sum(debit), 0),
      coalesce(sum(credit), 0)
    into v_total_debit, v_total_credit
    from public.journal_lines
    where entry_id = v_entry_id;
  elsif v_has_journal_entry_id then
    v_entry_id := coalesce(new.journal_entry_id, old.journal_entry_id);

    select
      coalesce(sum(debit), 0),
      coalesce(sum(credit), 0)
    into v_total_debit, v_total_credit
    from public.journal_lines
    where journal_entry_id = v_entry_id;
  else
    raise exception 'journal_lines must have entry_id or journal_entry_id for balance checks';
  end if;

  if v_entry_id is null then
    return coalesce(new, old);
  end if;

  if v_total_debit <> v_total_credit then
    raise exception
      'Unbalanced journal entry %. Debit total (%) must equal credit total (%).',
      v_entry_id,
      v_total_debit,
      v_total_credit;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_check_journal_balance on public.journal_lines;
create constraint trigger trg_check_journal_balance
  after insert or update or delete on public.journal_lines
  deferrable initially deferred
  for each row
  execute function public.check_journal_balance();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'journal_lines_debit_or_credit_check'
      and conrelid = 'public.journal_lines'::regclass
  ) then
    alter table public.journal_lines
      add constraint journal_lines_debit_or_credit_check
      check (
        (debit >= 0 and credit >= 0)
        and (debit = 0 or credit = 0)
      );
  end if;
end $$;

commit;
