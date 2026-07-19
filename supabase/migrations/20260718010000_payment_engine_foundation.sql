-- AEDS PR-02: shared, tenant-safe payment transaction foundation.
-- Additive only. Existing payment rows and journal links are preserved.

alter table public.payments
  add column if not exists source_module text,
  add column if not exists bank_account_id uuid,
  add column if not exists card_type text,
  add column if not exists cheque_number text,
  add column if not exists cheque_date date;

alter table public.chart_of_accounts
  add column if not exists is_bank_account boolean not null default false;

create index if not exists idx_payments_tenant_source_date
  on public.payments (tenant_id, source_module, received_date desc);

create index if not exists idx_payments_tenant_reservation_date
  on public.payments (tenant_id, reservation_id, received_date desc);

create index if not exists idx_coa_tenant_bank_accounts
  on public.chart_of_accounts (tenant_id, is_bank_account, is_active)
  where is_bank_account = true;

-- Classify existing rows conservatively. This does not invent missing payments.
update public.payments
set source_module = case
  when upper(coalesce(notes, '')) like '%RESTAURANT%POS%' then 'RESTAURANT_POS'
  when upper(coalesce(notes, '')) like '%SERVICE%BILL%' then 'FRONT_OFFICE'
  when reservation_id is not null then 'RESERVATIONS'
  else 'ACCOUNTING'
end
where source_module is null or btrim(source_module) = '';

alter table public.payments
  alter column source_module set default 'ACCOUNTING';

-- Conditional data integrity. NOT VALID avoids blocking deployment on legacy rows;
-- new/updated rows are checked immediately and existing rows can be validated after audit.
alter table public.payments
  drop constraint if exists payments_card_type_required,
  add constraint payments_card_type_required
  check (upper(coalesce(method, '')) <> 'CARD' or nullif(btrim(card_type), '') is not null) not valid;

alter table public.payments
  drop constraint if exists payments_cheque_fields_required,
  add constraint payments_cheque_fields_required
  check (
    upper(coalesce(method, '')) <> 'CHEQUE'
    or (nullif(btrim(cheque_number), '') is not null and cheque_date is not null)
  ) not valid;

alter table public.payments
  drop constraint if exists payments_bank_account_required,
  add constraint payments_bank_account_required
  check (
    upper(coalesce(method, '')) not in ('BANK', 'BANK_TRANSFER', 'CARD', 'CHEQUE')
    or bank_account_id is not null
  ) not valid;

-- Prevent accidental cross-tenant bank account selection at database level.
create or replace function public.validate_payment_bank_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.bank_account_id is null then
    return new;
  end if;

  if not exists (
    select 1
    from public.chart_of_accounts coa
    where coa.id = new.bank_account_id
      and coa.tenant_id = new.tenant_id
      and coa.is_active = true
      and coa.is_bank_account = true
  ) then
    raise exception 'Selected bank account is not an active bank account for this tenant';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_payment_bank_account on public.payments;
create trigger trg_validate_payment_bank_account
before insert or update of bank_account_id, tenant_id
on public.payments
for each row execute function public.validate_payment_bank_account();

notify pgrst, 'reload schema';
