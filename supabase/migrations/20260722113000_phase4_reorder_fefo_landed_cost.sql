begin;

alter table public.inv_items
  add column if not exists reorder_point numeric(20,6) null,
  add column if not exists reorder_qty numeric(20,6) null,
  add column if not exists safety_stock numeric(20,6) null,
  add column if not exists lead_time_days integer null,
  add column if not exists auto_reorder_enabled boolean not null default false,
  add column if not exists is_perishable boolean not null default false,
  add column if not exists shelf_life_days integer null;

create table if not exists public.inventory_lots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  item_id uuid not null references public.inv_items(id) on delete restrict,
  warehouse text not null,
  grn_id uuid null references public.goods_receipts(id) on delete set null,
  grn_item_id uuid null references public.grn_items(id) on delete set null,
  batch_no text not null,
  mfg_date date null,
  expiry_date date null,
  received_at timestamptz not null default now(),
  original_qty numeric(20,6) not null check (original_qty > 0),
  remaining_qty numeric(20,6) not null check (remaining_qty >= 0 and remaining_qty <= original_qty),
  unit_cost numeric(20,8) not null check (unit_cost >= 0),
  landed_unit_cost numeric(20,8) not null default 0 check (landed_unit_cost >= 0),
  status text not null default 'AVAILABLE' check (status in ('AVAILABLE', 'DEPLETED', 'EXPIRED', 'HOLD')),
  created_by text null,
  created_at timestamptz not null default now(),
  unique (tenant_id, item_id, warehouse, batch_no)
);

create index if not exists idx_inventory_lots_fefo
  on public.inventory_lots (tenant_id, item_id, warehouse, expiry_date nulls last, received_at)
  where remaining_qty > 0 and status = 'AVAILABLE';

create table if not exists public.inventory_lot_movements (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  lot_id uuid not null references public.inventory_lots(id) on delete restrict,
  movement_type text not null check (movement_type in ('RECEIPT', 'ISSUE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'RETURN_IN', 'RETURN_OUT')),
  qty numeric(20,6) not null check (qty > 0),
  unit_cost numeric(20,8) not null check (unit_cost >= 0),
  total_cost numeric(20,8) not null check (total_cost >= 0),
  reference_type text null,
  reference_id uuid null,
  reference_line_id uuid null,
  created_by text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_lot_movements_lookup
  on public.inventory_lot_movements (tenant_id, reference_type, reference_id, lot_id);

create table if not exists public.landed_cost_allocations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  grn_id uuid not null references public.goods_receipts(id) on delete cascade,
  grn_item_id uuid not null references public.grn_items(id) on delete cascade,
  lot_id uuid null references public.inventory_lots(id) on delete set null,
  allocation_method text not null check (allocation_method in ('QTY', 'VALUE', 'WEIGHT', 'MANUAL')),
  base_amount numeric(20,8) not null default 0,
  allocated_amount numeric(20,8) not null,
  allocated_unit_cost numeric(20,8) not null,
  created_by text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_landed_cost_allocations_grn
  on public.landed_cost_allocations (tenant_id, grn_id, grn_item_id);

create or replace function public.create_inventory_lot_from_grn_item()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_grn record;
  v_batch text;
begin
  if new.item_id is null or new.qty is null or new.qty <= 0 then
    return new;
  end if;

  select tenant_id, warehouse, grn_no, grn_date, created_by
    into v_grn
  from public.goods_receipts
  where id = new.grn_id;

  if v_grn.tenant_id is null then
    return new;
  end if;

  v_batch := coalesce(v_grn.grn_no, 'GRN') || '-' || substr(new.id::text, 1, 8);

  insert into public.inventory_lots (
    tenant_id,
    item_id,
    warehouse,
    grn_id,
    grn_item_id,
    batch_no,
    expiry_date,
    received_at,
    original_qty,
    remaining_qty,
    unit_cost,
    created_by
  )
  values (
    v_grn.tenant_id,
    new.item_id,
    coalesce(nullif(v_grn.warehouse, ''), 'STORE'),
    new.grn_id,
    new.id,
    v_batch,
    case
      when exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'inv_items' and column_name = 'shelf_life_days'
      ) then (
        select case when i.is_perishable and coalesce(i.shelf_life_days, 0) > 0
          then (coalesce(v_grn.grn_date, current_date) + i.shelf_life_days)
          else null end
        from public.inv_items i
        where i.id = new.item_id
      )
      else null
    end,
    coalesce(v_grn.grn_date::timestamptz, now()),
    new.qty,
    new.qty,
    coalesce(new.unit_cost, 0),
    v_grn.created_by
  )
  on conflict (tenant_id, item_id, warehouse, batch_no) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_create_inventory_lot_from_grn_item on public.grn_items;
create trigger trg_create_inventory_lot_from_grn_item
  after insert on public.grn_items
  for each row
  execute function public.create_inventory_lot_from_grn_item();

create or replace function public.allocate_landed_cost_to_grn(
  p_grn_id uuid,
  p_total_landed_cost numeric,
  p_method text default 'VALUE',
  p_created_by text default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant uuid;
  v_count integer := 0;
  v_total_base numeric(20,8) := 0;
  r record;
  v_alloc numeric(20,8);
begin
  if p_total_landed_cost is null or p_total_landed_cost <= 0 then
    return 0;
  end if;

  select tenant_id into v_tenant from public.goods_receipts where id = p_grn_id;
  if v_tenant is null then
    raise exception 'GRN % not found', p_grn_id using errcode = 'P0001';
  end if;

  with base_rows as (
    select
      gi.id as grn_item_id,
      l.id as lot_id,
      case
        when upper(p_method) = 'QTY' then gi.qty
        else (gi.qty * gi.unit_cost)
      end as base_amount,
      gi.qty
    from public.grn_items gi
    left join public.inventory_lots l on l.grn_item_id = gi.id
    where gi.grn_id = p_grn_id
  )
  select coalesce(sum(base_amount), 0) into v_total_base from base_rows;

  if v_total_base <= 0 then
    return 0;
  end if;

  for r in
    select
      gi.id as grn_item_id,
      l.id as lot_id,
      gi.qty,
      case
        when upper(p_method) = 'QTY' then gi.qty
        else (gi.qty * gi.unit_cost)
      end as base_amount
    from public.grn_items gi
    left join public.inventory_lots l on l.grn_item_id = gi.id
    where gi.grn_id = p_grn_id
  loop
    v_alloc := round((r.base_amount / v_total_base) * p_total_landed_cost, 8);

    insert into public.landed_cost_allocations (
      tenant_id,
      grn_id,
      grn_item_id,
      lot_id,
      allocation_method,
      base_amount,
      allocated_amount,
      allocated_unit_cost,
      created_by
    )
    values (
      v_tenant,
      p_grn_id,
      r.grn_item_id,
      r.lot_id,
      upper(p_method),
      r.base_amount,
      v_alloc,
      case when r.qty > 0 then round(v_alloc / r.qty, 8) else 0 end,
      p_created_by
    );

    if r.lot_id is not null and r.qty > 0 then
      update public.inventory_lots
      set landed_unit_cost = round(coalesce(landed_unit_cost, 0) + (v_alloc / r.qty), 8)
      where id = r.lot_id;
    end if;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.consume_inventory_fefo(
  p_tenant_id uuid,
  p_item_id uuid,
  p_warehouse text,
  p_qty numeric,
  p_reference_type text,
  p_reference_id uuid,
  p_reference_line_id uuid,
  p_posted_by text default null,
  p_post_to_cogs boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_remaining numeric(20,6);
  v_take numeric(20,6);
  v_total_cost numeric(20,8) := 0;
  v_line_cost numeric(20,8);
  v_issue_result jsonb;
  r_lot record;
begin
  if p_qty <= 0 then
    raise exception 'FEFO consumption qty must be > 0' using errcode = 'P0001';
  end if;

  v_remaining := p_qty;

  for r_lot in
    select id, remaining_qty, (unit_cost + coalesce(landed_unit_cost, 0)) as eff_unit_cost, expiry_date
    from public.inventory_lots
    where tenant_id = p_tenant_id
      and item_id = p_item_id
      and warehouse = coalesce(nullif(p_warehouse, ''), 'STORE')
      and status = 'AVAILABLE'
      and remaining_qty > 0
    order by expiry_date asc nulls last, received_at asc, id asc
    for update
  loop
    exit when v_remaining <= 0;

    v_take := least(v_remaining, r_lot.remaining_qty);
    v_line_cost := round(v_take * r_lot.eff_unit_cost, 8);
    v_total_cost := round(v_total_cost + v_line_cost, 8);

    update public.inventory_lots
    set
      remaining_qty = round(remaining_qty - v_take, 6),
      status = case when round(remaining_qty - v_take, 6) <= 0 then 'DEPLETED' else status end
    where id = r_lot.id;

    insert into public.inventory_lot_movements (
      tenant_id,
      lot_id,
      movement_type,
      qty,
      unit_cost,
      total_cost,
      reference_type,
      reference_id,
      reference_line_id,
      created_by
    )
    values (
      p_tenant_id,
      r_lot.id,
      'ISSUE',
      v_take,
      r_lot.eff_unit_cost,
      v_line_cost,
      p_reference_type,
      p_reference_id,
      p_reference_line_id,
      p_posted_by
    );

    v_remaining := round(v_remaining - v_take, 6);
  end loop;

  if v_remaining > 0 then
    raise exception 'Insufficient FEFO lots for item %, warehouse %, requested %, remaining %', p_item_id, p_warehouse, p_qty, v_remaining using errcode = 'P0001';
  end if;

  -- Keep core valuation and GL atomicity with existing inventory issue engine.
  v_issue_result := public.inventory_issue_cost(
    p_tenant_id,
    p_item_id,
    coalesce(nullif(p_warehouse, ''), 'STORE'),
    p_qty,
    p_reference_type,
    p_reference_id,
    p_reference_line_id,
    p_posted_by,
    p_post_to_cogs,
    'FEFO issue ' || coalesce(p_reference_type, ''),
    now(),
    'OUTBOUND'
  );

  return jsonb_build_object(
    'physical_cost', v_total_cost,
    'valuation_result', v_issue_result
  );
end;
$$;

create or replace function public.generate_reorder_requisitions(
  p_tenant_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer := 0;
  v_tenant uuid;
  v_req_id uuid;
  v_req_no text;
  r_item record;
begin
  for v_tenant in
    select distinct i.tenant_id
    from public.inv_items i
    where (p_tenant_id is null or i.tenant_id = p_tenant_id)
      and coalesce(i.is_active, true) = true
      and coalesce(i.auto_reorder_enabled, false) = true
  loop
    select r.id, r.req_no
      into v_req_id, v_req_no
    from public.requisitions r
    where r.tenant_id = v_tenant
      and r.req_date = current_date
      and r.status = 'PENDING'
      and r.requested_by = 'SYSTEM_AUTO_REORDER'
    order by r.created_at desc
    limit 1;

    if v_req_id is null then
      insert into public.requisitions (
        tenant_id,
        req_date,
        department,
        requested_by,
        status,
        notes
      )
      values (
        v_tenant,
        current_date,
        'STORE',
        'SYSTEM_AUTO_REORDER',
        'PENDING',
        'Generated by reorder scheduler'
      )
      returning id, req_no into v_req_id, v_req_no;
    end if;

    for r_item in
      select
        i.id as item_id,
        i.name as item_name,
        coalesce(i.reorder_point, i.reorder_level, 0) as reorder_point,
        coalesce(i.reorder_qty, greatest(coalesce(i.reorder_point, i.reorder_level, 0), 1)) as reorder_qty,
        coalesce(public.get_stock_balance(v_tenant, i.id), 0) as on_hand
      from public.inv_items i
      where i.tenant_id = v_tenant
        and coalesce(i.is_active, true) = true
        and coalesce(i.auto_reorder_enabled, false) = true
        and coalesce(i.reorder_point, i.reorder_level, 0) > 0
    loop
      if r_item.on_hand < r_item.reorder_point and not exists (
        select 1
        from public.requisition_items ri
        where ri.requisition_id = v_req_id
          and ri.item_id = r_item.item_id
      ) then
        insert into public.requisition_items (
          requisition_id,
          tenant_id,
          item_id,
          item_name,
          qty,
          notes
        )
        values (
          v_req_id,
          v_tenant,
          r_item.item_id,
          r_item.item_name,
          r_item.reorder_qty,
          'Auto reorder (on hand ' || r_item.on_hand || ' < reorder point ' || r_item.reorder_point || ')'
        );

        v_count := v_count + 1;
      end if;
    end loop;
  end loop;

  return v_count;
end;
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    if not exists (
      select 1 from cron.job where jobname = 'auto_reorder_requisitions_hourly'
    ) then
      perform cron.schedule(
        'auto_reorder_requisitions_hourly',
        '15 * * * *',
        'select public.generate_reorder_requisitions();'
      );
    end if;
  end if;
end $$;

commit;
