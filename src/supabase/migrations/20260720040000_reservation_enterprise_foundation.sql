-- Aura Stay ERP — Reservation enterprise foundation
-- Additive migration: lifecycle metadata, auditable status history and realtime readiness.

alter table if exists public.reservations
  add column if not exists cancellation_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists hold_expires_at timestamptz,
  add column if not exists guaranteed_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists idx_reservations_tenant_status_dates
  on public.reservations (tenant_id, status, check_in, check_out);

create index if not exists idx_reservations_tenant_updated_at
  on public.reservations (tenant_id, updated_at desc);

create table if not exists public.reservation_status_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  previous_status text,
  new_status text not null,
  reason text,
  changed_by uuid default auth.uid(),
  changed_at timestamptz not null default now()
);

create index if not exists idx_reservation_status_history_lookup
  on public.reservation_status_history (tenant_id, reservation_id, changed_at desc);

alter table public.reservation_status_history enable row level security;

drop policy if exists reservation_status_history_tenant_select on public.reservation_status_history;
create policy reservation_status_history_tenant_select
  on public.reservation_status_history
  for select
  using (tenant_id in (
    select tenant_id from public.tenant_users where user_id = auth.uid()
  ));

drop policy if exists reservation_status_history_tenant_insert on public.reservation_status_history;
create policy reservation_status_history_tenant_insert
  on public.reservation_status_history
  for insert
  with check (tenant_id in (
    select tenant_id from public.tenant_users where user_id = auth.uid()
  ));

create or replace function public.capture_reservation_status_history()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.status is distinct from new.status then
    insert into public.reservation_status_history (
      tenant_id,
      reservation_id,
      previous_status,
      new_status,
      reason,
      changed_by
    ) values (
      new.tenant_id,
      new.id,
      old.status,
      new.status,
      case when new.status = 'CANCELLED' then new.cancellation_reason else null end,
      auth.uid()
    );
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_capture_reservation_status_history on public.reservations;
create trigger trg_capture_reservation_status_history
before update on public.reservations
for each row execute function public.capture_reservation_status_history();

-- Supabase Realtime requires replica identity for complete UPDATE/DELETE payloads.
alter table if exists public.reservations replica identity full;
alter table if exists public.reservation_rooms replica identity full;
