-- Aura Stay ERP — Reservation workflow, amendments and approval control.

alter table if exists public.reservations
  add column if not exists version_no integer not null default 1,
  add column if not exists reinstated_at timestamptz,
  add column if not exists reinstatement_reason text,
  add column if not exists workflow_metadata jsonb not null default '{}'::jsonb;

create table if not exists public.reservation_amendments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  version_no integer not null,
  amendment_type text not null default 'GENERAL',
  reason text not null,
  before_snapshot jsonb not null default '{}'::jsonb,
  after_snapshot jsonb not null default '{}'::jsonb,
  changes jsonb not null default '{}'::jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  unique (reservation_id, version_no)
);

create table if not exists public.reservation_approvals (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  approval_type text not null,
  requested_value jsonb not null default '{}'::jsonb,
  reason text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','REJECTED','CANCELLED')),
  requested_by uuid default auth.uid(),
  decided_by uuid,
  decision_note text,
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_reservation_amendments_lookup on public.reservation_amendments (tenant_id, reservation_id, version_no desc);
create index if not exists idx_reservation_approvals_queue on public.reservation_approvals (tenant_id, status, created_at desc);

alter table public.reservation_amendments enable row level security;
alter table public.reservation_approvals enable row level security;

create policy reservation_amendments_tenant_all on public.reservation_amendments for all
using (tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid()))
with check (tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid()));

create policy reservation_approvals_tenant_all on public.reservation_approvals for all
using (tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid()))
with check (tenant_id in (select tenant_id from public.tenant_users where user_id = auth.uid()));

create or replace function public.amend_reservation(
  p_reservation_id uuid,
  p_amendment_type text,
  p_reason text,
  p_before jsonb,
  p_after jsonb,
  p_changes jsonb
) returns public.reservations
language plpgsql security invoker set search_path = public as $$
declare
  v_res public.reservations;
  v_next_version integer;
begin
  select * into v_res from public.reservations where id = p_reservation_id for update;
  if v_res.id is null then raise exception 'Reservation not found'; end if;
  v_next_version := coalesce(v_res.version_no, 1) + 1;

  insert into public.reservation_amendments(tenant_id,reservation_id,version_no,amendment_type,reason,before_snapshot,after_snapshot,changes)
  values(v_res.tenant_id,v_res.id,v_next_version,coalesce(p_amendment_type,'GENERAL'),p_reason,p_before,p_after,p_changes);

  update public.reservations set
    check_in = coalesce((p_after->>'check_in')::date, check_in),
    check_out = coalesce((p_after->>'check_out')::date, check_out),
    pax_adults = coalesce((p_after->>'adults')::integer, pax_adults),
    pax_children = coalesce((p_after->>'children')::integer, pax_children),
    notes = coalesce(p_after->>'notes', notes),
    version_no = v_next_version,
    updated_at = now()
  where id = p_reservation_id returning * into v_res;
  return v_res;
end; $$;

create or replace function public.execute_reservation_workflow_action(
  p_reservation_id uuid,
  p_action text,
  p_next_status text,
  p_reason text default null,
  p_metadata jsonb default '{}'::jsonb
) returns public.reservations
language plpgsql security invoker set search_path = public as $$
declare v_res public.reservations;
begin
  update public.reservations set
    status = p_next_status,
    cancellation_reason = case when p_next_status = 'CANCELLED' then p_reason else cancellation_reason end,
    cancelled_at = case when p_next_status = 'CANCELLED' then now() else cancelled_at end,
    reinstated_at = case when p_action = 'REINSTATE' then now() else reinstated_at end,
    reinstatement_reason = case when p_action = 'REINSTATE' then p_reason else reinstatement_reason end,
    guaranteed_at = case when p_next_status = 'GUARANTEED' then now() else guaranteed_at end,
    workflow_metadata = coalesce(workflow_metadata, '{}'::jsonb) || coalesce(p_metadata, '{}'::jsonb) || jsonb_build_object('last_action', p_action),
    updated_at = now()
  where id = p_reservation_id returning * into v_res;
  if v_res.id is null then raise exception 'Reservation not found'; end if;
  return v_res;
end; $$;

alter table public.reservation_amendments replica identity full;
alter table public.reservation_approvals replica identity full;
