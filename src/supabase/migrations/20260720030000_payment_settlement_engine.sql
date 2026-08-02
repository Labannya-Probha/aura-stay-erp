-- AEDS PR03.2 Commit-7: provider/card/mobile settlement and bank charge posting.
create table if not exists public.payment_settlement_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  terminal_id uuid null references public.payment_terminals(id) on delete restrict,
  provider text not null,
  clearing_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  bank_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  fee_account_id uuid null references public.chart_of_accounts(id) on delete restrict,
  tax_account_id uuid null references public.chart_of_accounts(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists uq_payment_settlement_profile_terminal
  on public.payment_settlement_profiles (tenant_id, terminal_id) where terminal_id is not null and is_active = true;
create unique index if not exists uq_payment_settlement_profile_provider
  on public.payment_settlement_profiles (tenant_id, provider) where terminal_id is null and is_active = true;

create table if not exists public.payment_settlements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  settlement_profile_id uuid null references public.payment_settlement_profiles(id) on delete restrict,
  terminal_id uuid null references public.payment_terminals(id) on delete restrict,
  provider text not null,
  settlement_reference text not null,
  idempotency_key text not null,
  settlement_date date not null,
  currency text not null default 'BDT',
  gross_amount numeric(18,2) not null check (gross_amount > 0),
  fee_amount numeric(18,2) not null default 0 check (fee_amount >= 0),
  tax_amount numeric(18,2) not null default 0 check (tax_amount >= 0),
  net_amount numeric(18,2) not null check (net_amount >= 0),
  status text not null default 'DRAFT',
  journal_entry_id uuid null references public.journal_entries(id) on delete restrict,
  error_message text null,
  posted_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_settlement_status_check check (status in ('DRAFT','PROCESSING','POSTED','FAILED','REVERSED')),
  constraint payment_settlement_amount_check check (net_amount + fee_amount + tax_amount = gross_amount),
  unique (tenant_id, idempotency_key),
  unique (tenant_id, provider, settlement_reference)
);

create table if not exists public.payment_settlement_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  settlement_id uuid not null references public.payment_settlements(id) on delete cascade,
  payment_posting_id uuid not null references public.payment_postings(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (tenant_id, payment_posting_id)
);

create index if not exists idx_payment_settlements_tenant_date on public.payment_settlements (tenant_id, settlement_date desc);
create index if not exists idx_payment_settlement_items_settlement on public.payment_settlement_items (tenant_id, settlement_id);

create or replace function public.validate_payment_settlement_tenant()
returns trigger language plpgsql security definer set search_path = public as $$
declare account_id uuid;
begin
  if tg_table_name = 'payment_settlement_items' then
    if not exists (select 1 from public.payment_settlements s where s.id = new.settlement_id and s.tenant_id = new.tenant_id)
       or not exists (select 1 from public.payment_postings p where p.id = new.payment_posting_id and p.tenant_id = new.tenant_id and p.status = 'POSTED') then
      raise exception 'Settlement item references must belong to the same tenant and payment must be posted';
    end if;
    return new;
  end if;
  for account_id in select unnest(array[new.clearing_account_id,new.bank_account_id,new.fee_account_id,new.tax_account_id]) loop
    if account_id is not null and not exists (select 1 from public.chart_of_accounts c where c.id = account_id and c.tenant_id = new.tenant_id and c.is_active = true) then
      raise exception 'Settlement accounts must be active and belong to the same tenant';
    end if;
  end loop;
  if new.terminal_id is not null and not exists (select 1 from public.payment_terminals t where t.id = new.terminal_id and t.tenant_id = new.tenant_id) then
    raise exception 'Settlement terminal belongs to another tenant';
  end if;
  new.updated_at := now(); return new;
end; $$;

drop trigger if exists trg_validate_payment_settlement_profile on public.payment_settlement_profiles;
create trigger trg_validate_payment_settlement_profile before insert or update on public.payment_settlement_profiles
for each row execute function public.validate_payment_settlement_tenant();
drop trigger if exists trg_validate_payment_settlement_item on public.payment_settlement_items;
create trigger trg_validate_payment_settlement_item before insert or update on public.payment_settlement_items
for each row execute function public.validate_payment_settlement_tenant();

create or replace function public.touch_payment_settlement_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;
drop trigger if exists trg_touch_payment_settlements on public.payment_settlements;
create trigger trg_touch_payment_settlements before update on public.payment_settlements
for each row execute function public.touch_payment_settlement_updated_at();

alter table public.payment_settlement_profiles enable row level security;
alter table public.payment_settlements enable row level security;
alter table public.payment_settlement_items enable row level security;

do $$ declare table_name text; begin
  foreach table_name in array array['payment_settlement_profiles','payment_settlements','payment_settlement_items'] loop
    execute format('drop policy if exists %I on public.%I', table_name || '_tenant_guard', table_name);
    execute format('create policy %I on public.%I for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id())', table_name || '_tenant_guard', table_name);
  end loop;
end $$;

grant select, insert, update, delete on public.payment_settlement_profiles to authenticated;
grant select, insert, update on public.payment_settlements to authenticated;
grant select, insert on public.payment_settlement_items to authenticated;
notify pgrst, 'reload schema';
