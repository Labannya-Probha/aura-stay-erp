-- PostgreSQL (Supabase) migration.
-- AEDS PR03.2 Commit-5: tenant-safe payment posting engine foundation.
-- Additive and idempotent. It does not auto-post legacy payments.

create extension if not exists pgcrypto;

create table if not exists public.payment_posting_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  payment_method text not null,
  terminal_id uuid null references public.payment_terminals(id) on delete restrict,
  settlement_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  posting_type text not null default 'RECEIPT',
  priority integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_posting_rules_type_check check (posting_type in ('RECEIPT','REFUND','SETTLEMENT'))
);

create unique index if not exists uq_payment_posting_rules_method_default
  on public.payment_posting_rules (tenant_id, payment_method)
  where terminal_id is null and is_active = true;

create unique index if not exists uq_payment_posting_rules_terminal
  on public.payment_posting_rules (tenant_id, payment_method, terminal_id)
  where terminal_id is not null and is_active = true;

create table if not exists public.payment_postings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  payment_id uuid null,
  idempotency_key text not null,
  source_module text not null,
  source_reference text not null,
  payment_method text not null,
  terminal_id uuid null references public.payment_terminals(id) on delete restrict,
  posting_rule_id uuid null references public.payment_posting_rules(id) on delete restrict,
  journal_entry_id uuid null references public.journal_entries(id) on delete restrict,
  amount numeric(18,2) not null check (amount > 0),
  currency text not null default 'BDT',
  status text not null default 'DRAFT',
  error_message text null,
  posted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_postings_status_check check (status in ('DRAFT','READY','POSTED','FAILED','REVERSED')),
  unique (tenant_id, idempotency_key)
);

create index if not exists idx_payment_postings_tenant_status
  on public.payment_postings (tenant_id, status, created_at desc);
create index if not exists idx_payment_postings_source
  on public.payment_postings (tenant_id, source_module, source_reference);

create or replace function public.validate_payment_posting_rule_tenant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.chart_of_accounts coa
    where coa.id = new.settlement_account_id
      and coa.tenant_id = new.tenant_id
      and coa.is_active = true
  ) then
    raise exception 'Posting settlement account must be an active GL account of the same tenant';
  end if;

  if new.terminal_id is not null and not exists (
    select 1 from public.payment_terminals pt
    where pt.id = new.terminal_id
      and pt.tenant_id = new.tenant_id
      and pt.is_active = true
  ) then
    raise exception 'Posting terminal must be active and belong to the same tenant';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_validate_payment_posting_rule_tenant on public.payment_posting_rules;
create trigger trg_validate_payment_posting_rule_tenant
before insert or update on public.payment_posting_rules
for each row execute function public.validate_payment_posting_rule_tenant();

create or replace function public.touch_payment_posting_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_touch_payment_postings on public.payment_postings;
create trigger trg_touch_payment_postings
before update on public.payment_postings
for each row execute function public.touch_payment_posting_updated_at();

alter table public.payment_posting_rules enable row level security;
alter table public.payment_postings enable row level security;

-- Reuse the project's tenant context helper used by existing tenant-scoped tables.
drop policy if exists payment_posting_rules_tenant_guard on public.payment_posting_rules;
create policy payment_posting_rules_tenant_guard
on public.payment_posting_rules
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists payment_postings_tenant_guard on public.payment_postings;
create policy payment_postings_tenant_guard
on public.payment_postings
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

grant select, insert, update, delete on public.payment_posting_rules to authenticated;
grant select, insert, update on public.payment_postings to authenticated;

notify pgrst, 'reload schema';
