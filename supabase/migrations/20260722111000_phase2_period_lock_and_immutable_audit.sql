begin;

create table if not exists public.accounting_periods (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  period_code text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED', 'LOCKED')),
  lock_reason text null,
  closed_by text null,
  closed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, period_code),
  check (start_date <= end_date)
);

create index if not exists idx_accounting_periods_lookup
  on public.accounting_periods (tenant_id, start_date, end_date, status);

create extension if not exists btree_gist;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'accounting_periods_no_overlap'
      and conrelid = 'public.accounting_periods'::regclass
  ) then
    alter table public.accounting_periods
      add constraint accounting_periods_no_overlap
      exclude using gist (
        tenant_id with =,
        daterange(start_date, end_date + 1, '[)') with &&
      );
  end if;
end $$;

create or replace function public.get_period_status(
  p_tenant_id uuid,
  p_date date
)
returns text
language sql
stable
set search_path = public
as $$
  select coalesce(
    (
      select ap.status
      from public.accounting_periods ap
      where ap.tenant_id = p_tenant_id
        and p_date between ap.start_date and ap.end_date
      order by ap.start_date desc
      limit 1
    ),
    'OPEN'
  );
$$;

create or replace function public.enforce_journal_period_lock_entry()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant uuid;
  v_old_date date;
  v_new_date date;
  v_old_status text;
  v_new_status text;
begin
  if tg_op = 'INSERT' then
    v_tenant := new.tenant_id;
    v_new_date := coalesce(new.jv_date, current_date);
    v_new_status := public.get_period_status(v_tenant, v_new_date);

    if v_new_status in ('CLOSED', 'LOCKED') then
      raise exception 'Journal date % falls in % period and cannot be posted.', v_new_date, v_new_status using errcode = 'P0001';
    end if;

    return new;
  end if;

  if tg_op = 'UPDATE' then
    v_tenant := coalesce(new.tenant_id, old.tenant_id);
    v_old_date := coalesce(old.jv_date, current_date);
    v_new_date := coalesce(new.jv_date, v_old_date);
    v_old_status := public.get_period_status(v_tenant, v_old_date);
    v_new_status := public.get_period_status(v_tenant, v_new_date);

    if v_old_status in ('CLOSED', 'LOCKED') or v_new_status in ('CLOSED', 'LOCKED') then
      raise exception 'Journal in %/% period cannot be edited.', v_old_status, v_new_status using errcode = 'P0001';
    end if;

    return new;
  end if;

  if tg_op = 'DELETE' then
    v_tenant := old.tenant_id;
    v_old_date := coalesce(old.jv_date, current_date);
    v_old_status := public.get_period_status(v_tenant, v_old_date);

    if v_old_status in ('CLOSED', 'LOCKED') then
      raise exception 'Journal in % period cannot be deleted.', v_old_status using errcode = 'P0001';
    end if;

    return old;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.enforce_journal_period_lock_lines()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_entry_id uuid;
  v_tenant uuid;
  v_jv_date date;
  v_status text;
begin
  v_entry_id := coalesce(new.entry_id, old.entry_id);
  if v_entry_id is null then
    return coalesce(new, old);
  end if;

  select je.tenant_id, coalesce(je.jv_date, current_date)
    into v_tenant, v_jv_date
  from public.journal_entries je
  where je.id = v_entry_id;

  if v_tenant is null then
    return coalesce(new, old);
  end if;

  v_status := public.get_period_status(v_tenant, v_jv_date);
  if v_status in ('CLOSED', 'LOCKED') then
    raise exception 'Journal lines cannot be changed because period % is %.', v_jv_date, v_status using errcode = 'P0001';
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_enforce_journal_period_lock_entry on public.journal_entries;
create trigger trg_enforce_journal_period_lock_entry
  before insert or update or delete on public.journal_entries
  for each row
  execute function public.enforce_journal_period_lock_entry();

drop trigger if exists trg_enforce_journal_period_lock_lines on public.journal_lines;
create trigger trg_enforce_journal_period_lock_lines
  before insert or update or delete on public.journal_lines
  for each row
  execute function public.enforce_journal_period_lock_lines();

create table if not exists public.ledger_audit_log (
  id bigserial primary key,
  tenant_id uuid null,
  table_name text not null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  row_pk text not null,
  actor text not null,
  request_id text null,
  old_data jsonb null,
  new_data jsonb null,
  txid bigint not null default txid_current(),
  changed_at timestamptz not null default now()
);

create index if not exists idx_ledger_audit_log_tenant_time
  on public.ledger_audit_log (tenant_id, changed_at desc);

create index if not exists idx_ledger_audit_log_table_row
  on public.ledger_audit_log (table_name, row_pk, changed_at desc);

create or replace function public.guard_ledger_audit_log_immutable()
returns trigger
language plpgsql
as $$
begin
  raise exception 'ledger_audit_log is immutable; % is not allowed', tg_op using errcode = 'P0001';
end;
$$;

drop trigger if exists trg_guard_ledger_audit_log_immutable on public.ledger_audit_log;
create trigger trg_guard_ledger_audit_log_immutable
  before update or delete on public.ledger_audit_log
  for each row
  execute function public.guard_ledger_audit_log_immutable();

create or replace function public.capture_ledger_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_new jsonb;
  v_old jsonb;
  v_row jsonb;
  v_pk text;
  v_tenant uuid;
  v_claims jsonb := '{}'::jsonb;
  v_actor text;
  v_request_id text;
begin
  if tg_op in ('INSERT', 'UPDATE') then
    v_new := to_jsonb(new);
  end if;

  if tg_op in ('UPDATE', 'DELETE') then
    v_old := to_jsonb(old);
  end if;

  v_row := coalesce(v_new, v_old, '{}'::jsonb);
  v_pk := coalesce(v_row->>'id', 'n/a');

  begin
    v_tenant := nullif(coalesce(v_row->>'tenant_id', ''), '')::uuid;
  exception when others then
    v_tenant := null;
  end;

  begin
    v_claims := coalesce(current_setting('request.jwt.claims', true), '{}')::jsonb;
  exception when others then
    v_claims := '{}'::jsonb;
  end;

  begin
    v_request_id := nullif(current_setting('request.headers.x-correlation-id', true), '');
  exception when others then
    v_request_id := null;
  end;

  v_actor := coalesce(
    nullif(v_new->>'updated_by', ''),
    nullif(v_new->>'created_by', ''),
    nullif(v_old->>'updated_by', ''),
    nullif(v_old->>'created_by', ''),
    nullif(v_claims->>'email', ''),
    nullif(v_claims->>'sub', ''),
    'SYSTEM'
  );

  insert into public.ledger_audit_log (
    tenant_id,
    table_name,
    operation,
    row_pk,
    actor,
    request_id,
    old_data,
    new_data
  )
  values (
    v_tenant,
    tg_table_name,
    tg_op,
    v_pk,
    v_actor,
    v_request_id,
    case when tg_op in ('UPDATE', 'DELETE') then v_old else null end,
    case when tg_op in ('INSERT', 'UPDATE') then v_new else null end
  );

  return coalesce(new, old);
end;
$$;

do $$
declare
  v_table text;
  v_tables text[] := array[
    'journal_entries','journal_lines',
    'goods_receipts','grn_items',
    'consumption_entries','consumption_lines',
    'stock_transfers','transfer_items',
    'stock_returns','return_items',
    'vendor_payments','payments',
    'inventory_valuation_ledger','inventory_cost_layers','inventory_cost_states'
  ];
begin
  foreach v_table in array v_tables loop
    if exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = v_table
        and c.relkind = 'r'
    ) then
      execute format('drop trigger if exists trg_capture_ledger_audit_log on public.%I', v_table);
      execute format(
        'create trigger trg_capture_ledger_audit_log after insert or update or delete on public.%I for each row execute function public.capture_ledger_audit_log()',
        v_table
      );
    end if;
  end loop;
end $$;

commit;
