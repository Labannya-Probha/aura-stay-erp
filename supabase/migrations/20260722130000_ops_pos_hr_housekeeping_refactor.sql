-- Core operations refactor: Restaurant POS, HR/Payroll and Housekeeping
-- Multi-tenant safe foundation with transactional RPCs and RLS policies.

-- =====================================================================
-- 1) RESTAURANT POS: atomic void/reversal RPC
-- =====================================================================

alter table if exists public.pos_orders
  add column if not exists voided_at timestamptz,
  add column if not exists voided_by text,
  add column if not exists void_reason text;

create or replace function public.pos_void_order(
  p_order_id uuid,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant_id uuid;
  v_order record;
  v_deleted_folio integer := 0;
  v_deleted_payments integer := 0;
  v_deleted_invoice integer := 0;
begin
  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'Tenant context is required.' using errcode = 'P0001';
  end if;

  select * into v_order
  from public.pos_orders
  where id = p_order_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'POS order not found for this tenant.' using errcode = 'P0001';
  end if;

  if coalesce(v_order.status, '') = 'CANCELLED' then
    return jsonb_build_object(
      'status', 'already_voided',
      'order_id', v_order.id,
      'order_no', v_order.order_no
    );
  end if;

  if coalesce(v_order.status, '') not in ('SETTLED', 'CHARGED_TO_ROOM') then
    raise exception 'Only SETTLED or CHARGED_TO_ROOM orders can be voided (current: %).', v_order.status using errcode = 'P0001';
  end if;

  if v_order.folio_charge_id is not null then
    delete from public.folio_charges
    where id = v_order.folio_charge_id
      and tenant_id = v_tenant_id;
    get diagnostics v_deleted_folio = row_count;
  end if;

  if v_order.reservation_id is not null then
    delete from public.payments
    where tenant_id = v_tenant_id
      and reservation_id = v_order.reservation_id
      and reference = v_order.order_no;
    get diagnostics v_deleted_payments = row_count;
  end if;

  if v_order.invoice_id is not null then
    delete from public.invoices
    where id = v_order.invoice_id
      and tenant_id = v_tenant_id;
    get diagnostics v_deleted_invoice = row_count;
  end if;

  update public.pos_orders
  set
    status = 'CANCELLED',
    notes = concat_ws(' ', nullif(notes, ''), '[VOIDED]'),
    voided_at = now(),
    voided_by = coalesce((auth.jwt() ->> 'username'), (auth.jwt() ->> 'email'), auth.uid()::text, 'system'),
    void_reason = coalesce(nullif(trim(p_reason), ''), 'Administrative void')
  where id = v_order.id
    and tenant_id = v_tenant_id;

  return jsonb_build_object(
    'status', 'ok',
    'order_id', v_order.id,
    'order_no', v_order.order_no,
    'deleted_folio_rows', v_deleted_folio,
    'deleted_payment_rows', v_deleted_payments,
    'deleted_invoice_rows', v_deleted_invoice
  );
end;
$$;

revoke execute on function public.pos_void_order(uuid, text) from public, anon;
grant execute on function public.pos_void_order(uuid, text) to authenticated;

-- =====================================================================
-- 2) HR/PAYROLL: tenant salary structures + gated status transitions
-- =====================================================================

create table if not exists public.employee_salary_structures (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  employee_id uuid null references public.employees(id) on delete cascade,
  structure_name text not null default 'DEFAULT',
  effective_from date not null default current_date,
  basic_pct numeric(8,6) not null default 0.48,
  house_rent_pct numeric(8,6) not null default 0.50,
  conveyance_pct numeric(8,6) not null default 0.35,
  medical_pct numeric(8,6) not null default 0.20,
  internet_allowance numeric(14,2) not null default 0,
  other_allowance numeric(14,2) not null default 0,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employee_salary_structures_pct_check check (
    basic_pct >= 0 and basic_pct <= 1
    and house_rent_pct >= 0 and house_rent_pct <= 1
    and conveyance_pct >= 0 and conveyance_pct <= 1
    and medical_pct >= 0 and medical_pct <= 1
  )
);

create index if not exists idx_employee_salary_structures_tenant_employee
  on public.employee_salary_structures (tenant_id, employee_id, effective_from desc);

create unique index if not exists uq_employee_salary_structures_one_default
  on public.employee_salary_structures (tenant_id)
  where (is_default = true and employee_id is null and is_active = true);

alter table public.employee_salary_structures enable row level security;

drop policy if exists employee_salary_structures_tenant_select on public.employee_salary_structures;
create policy employee_salary_structures_tenant_select
  on public.employee_salary_structures
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists employee_salary_structures_tenant_write on public.employee_salary_structures;
create policy employee_salary_structures_tenant_write
  on public.employee_salary_structures
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

insert into public.employee_salary_structures (
  tenant_id,
  employee_id,
  structure_name,
  effective_from,
  basic_pct,
  house_rent_pct,
  conveyance_pct,
  medical_pct,
  internet_allowance,
  other_allowance,
  is_default,
  is_active,
  created_by
)
select
  ac.tenant_id,
  null::uuid,
  'DEFAULT',
  current_date,
  0.48,
  0.50,
  0.35,
  0.20,
  coalesce(max(ac.amount) filter (where ac.allowance_name = 'Internet/Telephone Allowance'), 0),
  0,
  true,
  true,
  'migration'
from public.allowance_config ac
where ac.tenant_id is not null
group by ac.tenant_id
on conflict do nothing;

insert into public.employee_salary_structures (
  tenant_id,
  employee_id,
  structure_name,
  effective_from,
  basic_pct,
  house_rent_pct,
  conveyance_pct,
  medical_pct,
  internet_allowance,
  other_allowance,
  is_default,
  is_active,
  created_by
)
select distinct
  e.tenant_id,
  null::uuid,
  'DEFAULT',
  current_date,
  0.48,
  0.50,
  0.35,
  0.20,
  0,
  0,
  true,
  true,
  'migration'
from public.employees e
where e.tenant_id is not null
  and not exists (
    select 1
    from public.employee_salary_structures s
    where s.tenant_id = e.tenant_id
      and s.is_default = true
      and s.employee_id is null
      and s.is_active = true
  );

alter table if exists public.payroll_runs
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by text,
  add column if not exists locked_at timestamptz,
  add column if not exists locked_by text;

create table if not exists public.payroll_approval_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  payroll_run_id uuid not null references public.payroll_runs(id) on delete cascade,
  previous_status text,
  new_status text not null,
  action_note text,
  action_by text,
  action_at timestamptz not null default now()
);

create index if not exists idx_payroll_approval_logs_tenant_run
  on public.payroll_approval_logs (tenant_id, payroll_run_id, action_at desc);

alter table public.payroll_approval_logs enable row level security;

drop policy if exists payroll_approval_logs_tenant_select on public.payroll_approval_logs;
create policy payroll_approval_logs_tenant_select
  on public.payroll_approval_logs
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists payroll_approval_logs_tenant_insert on public.payroll_approval_logs;
create policy payroll_approval_logs_tenant_insert
  on public.payroll_approval_logs
  for insert to authenticated
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

do $$
declare
  v_constraint record;
begin
  for v_constraint in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'payroll_runs'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%status%'
  loop
    execute format('alter table public.payroll_runs drop constraint if exists %I', v_constraint.conname);
  end loop;
end
$$;

alter table public.payroll_runs
  add constraint payroll_runs_status_check
  check (status in ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'LOCKED', 'PAID'));

create or replace function public.enforce_payroll_run_status_transition()
returns trigger
language plpgsql
as $$
begin
  if new.status is null then
    raise exception 'payroll_runs.status cannot be null' using errcode = 'P0001';
  end if;

  if new.status = old.status then
    return new;
  end if;

  if old.status = 'DRAFT' and new.status = 'PENDING_REVIEW' then
    return new;
  end if;

  if old.status = 'PENDING_REVIEW' and new.status = 'APPROVED' then
    return new;
  end if;

  if (old.status = 'APPROVED' and new.status = 'LOCKED')
     or (old.status = 'PAID' and new.status = 'LOCKED') then
    return new;
  end if;

  raise exception 'Invalid payroll status transition: % -> %', old.status, new.status using errcode = 'P0001';
end;
$$;

drop trigger if exists trg_enforce_payroll_run_status_transition on public.payroll_runs;
create trigger trg_enforce_payroll_run_status_transition
  before update of status on public.payroll_runs
  for each row
  execute function public.enforce_payroll_run_status_transition();

create or replace function public.payroll_submit_for_review(
  p_payroll_run_id uuid,
  p_note text default null
)
returns public.payroll_runs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant_id uuid;
  v_run public.payroll_runs;
begin
  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'Tenant context is required.' using errcode = 'P0001';
  end if;

  select * into v_run
  from public.payroll_runs
  where id = p_payroll_run_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'Payroll run not found for this tenant.' using errcode = 'P0001';
  end if;

  if v_run.status <> 'DRAFT' then
    raise exception 'Only DRAFT payroll runs can be submitted for review (current: %).', v_run.status using errcode = 'P0001';
  end if;

  update public.payroll_runs
  set
    status = 'PENDING_REVIEW',
    reviewed_at = now(),
    reviewed_by = coalesce((auth.jwt() ->> 'username'), (auth.jwt() ->> 'email'), auth.uid()::text, 'system')
  where id = p_payroll_run_id
  returning * into v_run;

  insert into public.payroll_approval_logs(
    tenant_id,
    payroll_run_id,
    previous_status,
    new_status,
    action_note,
    action_by
  ) values (
    v_tenant_id,
    p_payroll_run_id,
    'DRAFT',
    'PENDING_REVIEW',
    p_note,
    coalesce((auth.jwt() ->> 'username'), (auth.jwt() ->> 'email'), auth.uid()::text, 'system')
  );

  return v_run;
end;
$$;

create or replace function public.payroll_approve_and_post_jv(
  p_payroll_run_id uuid,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant_id uuid;
  v_run record;
  v_jv_id uuid;
begin
  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'Tenant context is required.' using errcode = 'P0001';
  end if;

  select * into v_run
  from public.payroll_runs
  where id = p_payroll_run_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'Payroll run not found for this tenant.' using errcode = 'P0001';
  end if;

  if v_run.status <> 'PENDING_REVIEW' then
    raise exception 'Payroll run must be PENDING_REVIEW before approval (current: %).', v_run.status using errcode = 'P0001';
  end if;

  v_jv_id := public.approve_payroll_and_post_jv(p_payroll_run_id);

  insert into public.payroll_approval_logs(
    tenant_id,
    payroll_run_id,
    previous_status,
    new_status,
    action_note,
    action_by
  ) values (
    v_tenant_id,
    p_payroll_run_id,
    'PENDING_REVIEW',
    'APPROVED',
    p_note,
    coalesce((auth.jwt() ->> 'username'), (auth.jwt() ->> 'email'), auth.uid()::text, 'system')
  );

  return v_jv_id;
end;
$$;

create or replace function public.payroll_lock_run(
  p_payroll_run_id uuid,
  p_note text default null
)
returns public.payroll_runs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant_id uuid;
  v_run public.payroll_runs;
begin
  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'Tenant context is required.' using errcode = 'P0001';
  end if;

  select * into v_run
  from public.payroll_runs
  where id = p_payroll_run_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'Payroll run not found for this tenant.' using errcode = 'P0001';
  end if;

  if v_run.status <> 'APPROVED' then
    raise exception 'Only APPROVED payroll runs can be locked (current: %).', v_run.status using errcode = 'P0001';
  end if;

  update public.payroll_runs
  set
    status = 'LOCKED',
    locked_at = now(),
    locked_by = coalesce((auth.jwt() ->> 'username'), (auth.jwt() ->> 'email'), auth.uid()::text, 'system')
  where id = p_payroll_run_id
  returning * into v_run;

  insert into public.payroll_approval_logs(
    tenant_id,
    payroll_run_id,
    previous_status,
    new_status,
    action_note,
    action_by
  ) values (
    v_tenant_id,
    p_payroll_run_id,
    'APPROVED',
    'LOCKED',
    p_note,
    coalesce((auth.jwt() ->> 'username'), (auth.jwt() ->> 'email'), auth.uid()::text, 'system')
  );

  return v_run;
end;
$$;

revoke execute on function public.payroll_submit_for_review(uuid, text) from public, anon;
revoke execute on function public.payroll_approve_and_post_jv(uuid, text) from public, anon;
revoke execute on function public.payroll_lock_run(uuid, text) from public, anon;

grant execute on function public.payroll_submit_for_review(uuid, text) to authenticated;
grant execute on function public.payroll_approve_and_post_jv(uuid, text) to authenticated;
grant execute on function public.payroll_lock_run(uuid, text) to authenticated;

-- =====================================================================
-- 3) HOUSEKEEPING: assignment, checklist, status history, inventory links
-- =====================================================================

create table if not exists public.housekeeping_inspection_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  template_name text not null,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by text,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_housekeeping_templates_default
  on public.housekeeping_inspection_templates (tenant_id)
  where (is_default = true and is_active = true);

create table if not exists public.housekeeping_inspection_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  template_id uuid not null references public.housekeeping_inspection_templates(id) on delete cascade,
  item_label text not null,
  is_required boolean not null default true,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_housekeeping_inspection_items_lookup
  on public.housekeeping_inspection_items (tenant_id, template_id, sort_order);

create table if not exists public.housekeeping_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  room_id uuid not null references public.rooms(id) on delete cascade,
  reservation_id uuid null references public.reservations(id) on delete set null,
  template_id uuid null references public.housekeeping_inspection_templates(id) on delete set null,
  assigned_to uuid null references public.employees(id) on delete set null,
  assigned_by text,
  due_at timestamptz,
  status text not null default 'ASSIGNED' check (status in ('ASSIGNED','IN_PROGRESS','INSPECTED','COMPLETED','CANCELLED')),
  notes text,
  completed_at timestamptz,
  completed_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_housekeeping_assignments_tenant_room
  on public.housekeeping_assignments (tenant_id, room_id, status, created_at desc);

create table if not exists public.housekeeping_assignment_checks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  assignment_id uuid not null references public.housekeeping_assignments(id) on delete cascade,
  inspection_item_id uuid null references public.housekeeping_inspection_items(id) on delete set null,
  item_label text not null,
  is_passed boolean not null default false,
  remarks text,
  checked_by text,
  checked_at timestamptz not null default now(),
  unique (tenant_id, assignment_id, item_label)
);

create index if not exists idx_housekeeping_assignment_checks_lookup
  on public.housekeeping_assignment_checks (tenant_id, assignment_id);

create table if not exists public.room_status_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  room_id uuid not null references public.rooms(id) on delete cascade,
  previous_status text,
  new_status text not null,
  reason text,
  changed_by text,
  assignment_id uuid null references public.housekeeping_assignments(id) on delete set null,
  changed_at timestamptz not null default now()
);

create index if not exists idx_room_status_history_lookup
  on public.room_status_history (tenant_id, room_id, changed_at desc);

create table if not exists public.housekeeping_consumption_mappings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  inspection_item_id uuid not null references public.housekeeping_inspection_items(id) on delete cascade,
  item_id uuid not null references public.inv_items(id) on delete cascade,
  qty_per_completion numeric(14,4) not null default 1,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, inspection_item_id, item_id)
);

create index if not exists idx_housekeeping_consumption_map_lookup
  on public.housekeeping_consumption_mappings (tenant_id, inspection_item_id, is_active);

alter table public.housekeeping_inspection_templates enable row level security;
alter table public.housekeeping_inspection_items enable row level security;
alter table public.housekeeping_assignments enable row level security;
alter table public.housekeeping_assignment_checks enable row level security;
alter table public.room_status_history enable row level security;
alter table public.housekeeping_consumption_mappings enable row level security;

drop policy if exists housekeeping_inspection_templates_tenant_read on public.housekeeping_inspection_templates;
create policy housekeeping_inspection_templates_tenant_read
  on public.housekeeping_inspection_templates
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists housekeeping_inspection_templates_tenant_write on public.housekeeping_inspection_templates;
create policy housekeeping_inspection_templates_tenant_write
  on public.housekeeping_inspection_templates
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists housekeeping_inspection_items_tenant_read on public.housekeeping_inspection_items;
create policy housekeeping_inspection_items_tenant_read
  on public.housekeeping_inspection_items
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists housekeeping_inspection_items_tenant_write on public.housekeeping_inspection_items;
create policy housekeeping_inspection_items_tenant_write
  on public.housekeeping_inspection_items
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists housekeeping_assignments_tenant_read on public.housekeeping_assignments;
create policy housekeeping_assignments_tenant_read
  on public.housekeeping_assignments
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists housekeeping_assignments_tenant_write on public.housekeeping_assignments;
create policy housekeeping_assignments_tenant_write
  on public.housekeeping_assignments
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists housekeeping_assignment_checks_tenant_read on public.housekeeping_assignment_checks;
create policy housekeeping_assignment_checks_tenant_read
  on public.housekeeping_assignment_checks
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists housekeeping_assignment_checks_tenant_write on public.housekeeping_assignment_checks;
create policy housekeeping_assignment_checks_tenant_write
  on public.housekeeping_assignment_checks
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists room_status_history_tenant_read on public.room_status_history;
create policy room_status_history_tenant_read
  on public.room_status_history
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists room_status_history_tenant_insert on public.room_status_history;
create policy room_status_history_tenant_insert
  on public.room_status_history
  for insert to authenticated
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists housekeeping_consumption_mappings_tenant_read on public.housekeeping_consumption_mappings;
create policy housekeeping_consumption_mappings_tenant_read
  on public.housekeeping_consumption_mappings
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists housekeeping_consumption_mappings_tenant_write on public.housekeeping_consumption_mappings;
create policy housekeeping_consumption_mappings_tenant_write
  on public.housekeeping_consumption_mappings
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

create or replace function public.capture_room_hk_status_history()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.hk_status is distinct from old.hk_status then
    insert into public.room_status_history (
      tenant_id,
      room_id,
      previous_status,
      new_status,
      reason,
      changed_by
    ) values (
      new.tenant_id,
      new.id,
      old.hk_status,
      new.hk_status,
      'room_status_update',
      coalesce((auth.jwt() ->> 'username'), (auth.jwt() ->> 'email'), auth.uid()::text, 'system')
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_capture_room_hk_status_history on public.rooms;
create trigger trg_capture_room_hk_status_history
  after update of hk_status on public.rooms
  for each row
  execute function public.capture_room_hk_status_history();

create or replace function public.complete_housekeeping_assignment(
  p_assignment_id uuid,
  p_completion_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant_id uuid;
  v_assignment record;
  v_entry_id uuid;
  v_lines_inserted integer := 0;
begin
  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'Tenant context is required.' using errcode = 'P0001';
  end if;

  select * into v_assignment
  from public.housekeeping_assignments
  where id = p_assignment_id
    and tenant_id = v_tenant_id
  for update;

  if not found then
    raise exception 'Housekeeping assignment not found for this tenant.' using errcode = 'P0001';
  end if;

  if v_assignment.status = 'COMPLETED' then
    return jsonb_build_object('status', 'already_completed', 'assignment_id', v_assignment.id);
  end if;

  update public.housekeeping_assignments
  set
    status = 'COMPLETED',
    completed_at = now(),
    completed_by = coalesce((auth.jwt() ->> 'username'), (auth.jwt() ->> 'email'), auth.uid()::text, 'system'),
    notes = concat_ws(' | ', nullif(notes, ''), nullif(trim(p_completion_note), ''))
  where id = v_assignment.id;

  update public.rooms
  set hk_status = 'Inspected'
  where id = v_assignment.room_id
    and tenant_id = v_tenant_id;

  insert into public.room_status_history (
    tenant_id,
    room_id,
    previous_status,
    new_status,
    reason,
    changed_by,
    assignment_id
  )
  select
    r.tenant_id,
    r.id,
    r.hk_status,
    'Inspected',
    'housekeeping_assignment_completed',
    coalesce((auth.jwt() ->> 'username'), (auth.jwt() ->> 'email'), auth.uid()::text, 'system'),
    v_assignment.id
  from public.rooms r
  where r.id = v_assignment.room_id
    and r.tenant_id = v_tenant_id;

  if exists (
    select 1
    from public.housekeeping_assignment_checks c
    join public.housekeeping_consumption_mappings m
      on m.tenant_id = c.tenant_id
     and m.inspection_item_id = c.inspection_item_id
     and m.is_active = true
    where c.tenant_id = v_tenant_id
      and c.assignment_id = v_assignment.id
      and c.is_passed = true
  ) then
    insert into public.consumption_entries(
      tenant_id,
      entry_date,
      location,
      reason,
      reference,
      notes,
      created_by
    ) values (
      v_tenant_id,
      current_date,
      'HOUSEKEEPING',
      'HOUSEKEEPING_USE',
      v_assignment.id::text,
      coalesce(nullif(trim(p_completion_note), ''), 'Auto consumption from housekeeping completion'),
      coalesce((auth.jwt() ->> 'username'), (auth.jwt() ->> 'email'), auth.uid()::text, 'system')
    )
    returning id into v_entry_id;

    insert into public.consumption_lines(
      tenant_id,
      consumption_id,
      item_id,
      item_name,
      qty,
      unit_cost,
      line_cost
    )
    select
      v_tenant_id,
      v_entry_id,
      m.item_id,
      coalesce(i.name, 'Inventory Item'),
      sum(m.qty_per_completion)::numeric,
      0,
      0
    from public.housekeeping_assignment_checks c
    join public.housekeeping_consumption_mappings m
      on m.tenant_id = c.tenant_id
     and m.inspection_item_id = c.inspection_item_id
     and m.is_active = true
    left join public.inv_items i on i.id = m.item_id
    where c.tenant_id = v_tenant_id
      and c.assignment_id = v_assignment.id
      and c.is_passed = true
    group by m.item_id, i.name;

    get diagnostics v_lines_inserted = row_count;
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'assignment_id', v_assignment.id,
    'consumption_entry_id', v_entry_id,
    'consumption_lines', v_lines_inserted
  );
end;
$$;

revoke execute on function public.complete_housekeeping_assignment(uuid, text) from public, anon;
grant execute on function public.complete_housekeeping_assignment(uuid, text) to authenticated;

-- Seed a sensible default checklist template per tenant if missing.
insert into public.housekeeping_inspection_templates (tenant_id, template_name, is_default, is_active, created_by)
select distinct
  r.tenant_id,
  'Default Room Turnover Checklist',
  true,
  true,
  'migration'
from public.rooms r
where r.tenant_id is not null
  and not exists (
    select 1
    from public.housekeeping_inspection_templates t
    where t.tenant_id = r.tenant_id
      and t.is_default = true
      and t.is_active = true
  );

insert into public.housekeeping_inspection_items (tenant_id, template_id, item_label, is_required, sort_order, is_active)
select
  t.tenant_id,
  t.id,
  seed.item_label,
  true,
  seed.sort_order,
  true
from public.housekeeping_inspection_templates t
cross join (
  values
    ('Linen replaced and counted', 10),
    ('Bathroom sanitized', 20),
    ('Amenities replenished', 30),
    ('Mini-bar / kettle checked', 40),
    ('Final visual inspection', 50)
) as seed(item_label, sort_order)
where t.is_default = true
  and t.is_active = true
  and not exists (
    select 1
    from public.housekeeping_inspection_items i
    where i.template_id = t.id
      and i.item_label = seed.item_label
  );
