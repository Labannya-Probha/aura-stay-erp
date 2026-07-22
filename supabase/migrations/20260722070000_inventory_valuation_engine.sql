begin;

create extension if not exists pgcrypto;

alter table public.goods_receipts
  add column if not exists warehouse text;

alter table public.goods_receipts
  alter column warehouse set default 'STORE';

update public.goods_receipts
set warehouse = 'STORE'
where warehouse is null or btrim(warehouse) = '';

alter table public.goods_receipts
  alter column warehouse set not null;

create table if not exists public.inventory_valuation_policy (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  item_id uuid null references public.inv_items(id) on delete cascade,
  warehouse text null,
  method text not null default 'FIFO' check (method in ('FIFO', 'WEIGHTED_AVERAGE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, item_id, warehouse)
);

create table if not exists public.inventory_cost_layers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  item_id uuid not null references public.inv_items(id) on delete restrict,
  warehouse text not null,
  source_type text not null,
  source_id uuid null,
  source_line_id uuid null,
  purchased_at timestamptz not null default now(),
  original_qty numeric(20,6) not null check (original_qty > 0),
  remaining_qty numeric(20,6) not null check (remaining_qty >= 0 and remaining_qty <= original_qty),
  unit_cost numeric(20,8) not null check (unit_cost >= 0),
  currency text not null default 'BDT',
  created_by text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_cost_layers_fifo
  on public.inventory_cost_layers (tenant_id, item_id, warehouse, purchased_at, id)
  where remaining_qty > 0;

create index if not exists idx_inventory_cost_layers_source
  on public.inventory_cost_layers (tenant_id, source_type, source_id, source_line_id);

create table if not exists public.inventory_cost_states (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  item_id uuid not null references public.inv_items(id) on delete restrict,
  warehouse text not null,
  method text not null check (method in ('FIFO', 'WEIGHTED_AVERAGE')),
  qty_on_hand numeric(20,6) not null default 0 check (qty_on_hand >= 0),
  avg_unit_cost numeric(20,8) not null default 0 check (avg_unit_cost >= 0),
  inventory_value numeric(20,8) not null default 0 check (inventory_value >= 0),
  version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, item_id, warehouse)
);

create index if not exists idx_inventory_cost_states_tenant
  on public.inventory_cost_states (tenant_id, warehouse, item_id);

create table if not exists public.inventory_valuation_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  item_id uuid not null references public.inv_items(id) on delete restrict,
  warehouse text not null,
  movement_type text not null check (movement_type in ('INBOUND', 'OUTBOUND', 'TRANSFER_IN', 'TRANSFER_OUT', 'RETURN_TO_VENDOR', 'RETURN_TO_STORE', 'ADJUSTMENT_IN', 'ADJUSTMENT_OUT')),
  method text not null check (method in ('FIFO', 'WEIGHTED_AVERAGE')),
  qty numeric(20,6) not null check (qty > 0),
  unit_cost numeric(20,8) not null check (unit_cost >= 0),
  total_cost numeric(20,8) not null check (total_cost >= 0),
  balance_qty numeric(20,6) not null check (balance_qty >= 0),
  balance_value numeric(20,8) not null check (balance_value >= 0),
  reference_type text null,
  reference_id uuid null,
  reference_line_id uuid null,
  journal_entry_id uuid null references public.journal_entries(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_by text null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_valuation_ledger_ref
  on public.inventory_valuation_ledger (tenant_id, reference_type, reference_id, reference_line_id);

create index if not exists idx_inventory_valuation_ledger_item
  on public.inventory_valuation_ledger (tenant_id, item_id, warehouse, created_at desc);

create table if not exists public.inventory_accounting_profiles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  warehouse text null,
  cogs_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  inventory_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, warehouse)
);

create unique index if not exists uq_inventory_accounting_profiles_active
  on public.inventory_accounting_profiles (tenant_id, coalesce(warehouse, 'DEFAULT'))
  where is_active = true;

create table if not exists public.inventory_cogs_postings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  reference_type text not null,
  reference_id uuid null,
  reference_line_id uuid null,
  reference_key text not null,
  item_id uuid not null references public.inv_items(id) on delete restrict,
  warehouse text not null,
  qty numeric(20,6) not null check (qty > 0),
  total_cost numeric(20,8) not null check (total_cost >= 0),
  journal_entry_id uuid not null references public.journal_entries(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (tenant_id, reference_key)
);

create or replace function public.resolve_inventory_valuation_method(
  p_tenant_id uuid,
  p_item_id uuid,
  p_warehouse text
)
returns text
language sql
stable
set search_path = public
as $$
  with ranked as (
    select
      p.method,
      case
        when p.item_id = p_item_id and coalesce(p.warehouse, '') = coalesce(p_warehouse, '') then 1
        when p.item_id = p_item_id and p.warehouse is null then 2
        when p.item_id is null and coalesce(p.warehouse, '') = coalesce(p_warehouse, '') then 3
        when p.item_id is null and p.warehouse is null then 4
        else 99
      end as priority
    from public.inventory_valuation_policy p
    where p.tenant_id = p_tenant_id
  )
  select coalesce((select method from ranked where priority < 99 order by priority limit 1), 'FIFO');
$$;

create or replace function public.ensure_inventory_cost_state(
  p_tenant_id uuid,
  p_item_id uuid,
  p_warehouse text,
  p_method text
)
returns public.inventory_cost_states
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_state public.inventory_cost_states;
  v_bootstrap_qty numeric(20,6);
  v_bootstrap_unit numeric(20,8);
  v_bootstrap_value numeric(20,8);
begin
  v_bootstrap_qty := round(
    greatest(coalesce(public.get_stock_balance(p_tenant_id, p_item_id), 0), 0),
    6
  );

  select coalesce(gi.unit_cost, 0)
    into v_bootstrap_unit
  from public.grn_items gi
  join public.goods_receipts gr on gr.id = gi.grn_id
  where gi.item_id = p_item_id
    and gr.tenant_id = p_tenant_id
  order by gr.grn_date desc nulls last, gr.created_at desc nulls last, gi.id desc
  limit 1;

  v_bootstrap_unit := coalesce(v_bootstrap_unit, 0);
  v_bootstrap_value := round(v_bootstrap_qty * v_bootstrap_unit, 8);

  insert into public.inventory_cost_states (
    tenant_id,
    item_id,
    warehouse,
    method,
    qty_on_hand,
    avg_unit_cost,
    inventory_value
  )
  values (
    p_tenant_id,
    p_item_id,
    p_warehouse,
    p_method,
    v_bootstrap_qty,
    v_bootstrap_unit,
    v_bootstrap_value
  )
  on conflict (tenant_id, item_id, warehouse) do nothing;

  if p_method = 'FIFO' and v_bootstrap_qty > 0 and not exists (
    select 1
    from public.inventory_cost_layers cl
    where cl.tenant_id = p_tenant_id
      and cl.item_id = p_item_id
      and cl.warehouse = p_warehouse
  ) then
    insert into public.inventory_cost_layers (
      tenant_id,
      item_id,
      warehouse,
      source_type,
      purchased_at,
      original_qty,
      remaining_qty,
      unit_cost,
      created_by
    )
    values (
      p_tenant_id,
      p_item_id,
      p_warehouse,
      'OPENING_BALANCE',
      now(),
      v_bootstrap_qty,
      v_bootstrap_qty,
      v_bootstrap_unit,
      'system-migration'
    );
  end if;

  select *
    into v_state
  from public.inventory_cost_states
  where tenant_id = p_tenant_id
    and item_id = p_item_id
    and warehouse = p_warehouse
  for update;

  return v_state;
end;
$$;

create or replace function public.post_inventory_cogs_journal(
  p_tenant_id uuid,
  p_reference_type text,
  p_reference_id uuid,
  p_reference_line_id uuid,
  p_item_id uuid,
  p_warehouse text,
  p_qty numeric,
  p_total_cost numeric,
  p_posted_by text,
  p_jv_date date,
  p_narration text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_entry_id uuid;
  v_profile record;
  v_ref_key text;
  v_seq bigint;
  v_jv_no text;
begin
  if p_total_cost <= 0 then
    return null;
  end if;

  v_ref_key := coalesce(
    p_reference_line_id::text,
    p_reference_type || ':' || coalesce(p_reference_id::text, 'na') || ':' || p_item_id::text || ':' || p_warehouse
  );

  select cp.journal_entry_id
    into v_entry_id
  from public.inventory_cogs_postings cp
  where cp.tenant_id = p_tenant_id
    and cp.reference_key = v_ref_key
  limit 1;

  if v_entry_id is not null then
    return v_entry_id;
  end if;

  select *
    into v_profile
  from public.inventory_accounting_profiles ap
  where ap.tenant_id = p_tenant_id
    and ap.is_active = true
    and (ap.warehouse = p_warehouse or ap.warehouse is null)
  order by case when ap.warehouse = p_warehouse then 0 else 1 end
  limit 1;

  if not found then
    raise exception 'Inventory accounting profile missing for tenant %, warehouse %', p_tenant_id, p_warehouse
      using errcode = 'P0001';
  end if;

  begin
    select public.next_tenant_seq('jv_no_seq') into v_seq;
    v_jv_no := 'JV-' || to_char(coalesce(p_jv_date, current_date), 'YYYY') || '-' || lpad(v_seq::text, 6, '0');
  exception when others then
    v_jv_no := 'JV-' || to_char(now(), 'YYYYMMDD-HH24MISS') || '-' || substr(gen_random_uuid()::text, 1, 4);
  end;

  insert into public.journal_entries (
    jv_no,
    jv_date,
    narration,
    source,
    posted_by,
    is_locked,
    tenant_id
  )
  values (
    v_jv_no,
    coalesce(p_jv_date, current_date),
    coalesce(
      p_narration,
      'Inventory COGS ' || p_reference_type || ' ' || coalesce(p_reference_id::text, '')
    ),
    'INVENTORY_COGS',
    coalesce(p_posted_by, 'system'),
    true,
    p_tenant_id
  )
  returning id into v_entry_id;

  insert into public.journal_lines (
    entry_id,
    account_id,
    debit,
    credit,
    line_note,
    tenant_id
  )
  values
    (
      v_entry_id,
      v_profile.cogs_account_id,
      p_total_cost,
      0,
      'COGS debit for item ' || p_item_id::text,
      p_tenant_id
    ),
    (
      v_entry_id,
      v_profile.inventory_account_id,
      0,
      p_total_cost,
      'Inventory asset credit for item ' || p_item_id::text,
      p_tenant_id
    );

  insert into public.inventory_cogs_postings (
    tenant_id,
    reference_type,
    reference_id,
    reference_line_id,
    reference_key,
    item_id,
    warehouse,
    qty,
    total_cost,
    journal_entry_id
  )
  values (
    p_tenant_id,
    p_reference_type,
    p_reference_id,
    p_reference_line_id,
    v_ref_key,
    p_item_id,
    p_warehouse,
    p_qty,
    p_total_cost,
    v_entry_id
  );

  return v_entry_id;
end;
$$;

create or replace function public.inventory_receive_cost(
  p_tenant_id uuid,
  p_item_id uuid,
  p_warehouse text,
  p_qty numeric,
  p_unit_cost numeric,
  p_reference_type text,
  p_reference_id uuid,
  p_reference_line_id uuid,
  p_posted_by text default null,
  p_posted_at timestamptz default now(),
  p_movement_type text default 'INBOUND'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_method text;
  v_state public.inventory_cost_states;
  v_total_cost numeric(20,8);
  v_new_qty numeric(20,6);
  v_new_value numeric(20,8);
  v_new_avg numeric(20,8);
begin
  if p_qty <= 0 then
    raise exception 'Inbound quantity must be > 0' using errcode = 'P0001';
  end if;
  if p_unit_cost < 0 then
    raise exception 'Inbound unit cost must be >= 0' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_tenant_id::text || ':' || p_item_id::text || ':' || coalesce(p_warehouse, 'STORE'), 2001)
  );

  v_method := public.resolve_inventory_valuation_method(p_tenant_id, p_item_id, coalesce(p_warehouse, 'STORE'));
  v_state := public.ensure_inventory_cost_state(p_tenant_id, p_item_id, coalesce(p_warehouse, 'STORE'), v_method);

  v_total_cost := round(p_qty * p_unit_cost, 8);
  v_new_qty := round(v_state.qty_on_hand + p_qty, 6);
  v_new_value := round(v_state.inventory_value + v_total_cost, 8);
  if v_new_qty = 0 then
    v_new_avg := 0;
  else
    v_new_avg := round(v_new_value / v_new_qty, 8);
  end if;

  if v_method = 'FIFO' then
    insert into public.inventory_cost_layers (
      tenant_id,
      item_id,
      warehouse,
      source_type,
      source_id,
      source_line_id,
      purchased_at,
      original_qty,
      remaining_qty,
      unit_cost,
      created_by
    )
    values (
      p_tenant_id,
      p_item_id,
      coalesce(p_warehouse, 'STORE'),
      p_reference_type,
      p_reference_id,
      p_reference_line_id,
      coalesce(p_posted_at, now()),
      p_qty,
      p_qty,
      p_unit_cost,
      p_posted_by
    );
  end if;

  update public.inventory_cost_states
  set
    method = v_method,
    qty_on_hand = v_new_qty,
    inventory_value = v_new_value,
    avg_unit_cost = v_new_avg,
    version = version + 1,
    updated_at = now()
  where id = v_state.id;

  insert into public.inventory_valuation_ledger (
    tenant_id,
    item_id,
    warehouse,
    movement_type,
    method,
    qty,
    unit_cost,
    total_cost,
    balance_qty,
    balance_value,
    reference_type,
    reference_id,
    reference_line_id,
    created_by,
    created_at
  )
  values (
    p_tenant_id,
    p_item_id,
    coalesce(p_warehouse, 'STORE'),
    p_movement_type,
    v_method,
    p_qty,
    p_unit_cost,
    v_total_cost,
    v_new_qty,
    v_new_value,
    p_reference_type,
    p_reference_id,
    p_reference_line_id,
    p_posted_by,
    coalesce(p_posted_at, now())
  );

  return jsonb_build_object(
    'method', v_method,
    'qty', p_qty,
    'unit_cost', p_unit_cost,
    'total_cost', v_total_cost,
    'balance_qty', v_new_qty,
    'balance_value', v_new_value,
    'avg_unit_cost', v_new_avg
  );
end;
$$;

create or replace function public.inventory_preview_issue_cost(
  p_tenant_id uuid,
  p_item_id uuid,
  p_warehouse text,
  p_qty numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_method text;
  v_state public.inventory_cost_states;
  v_total numeric(20,8) := 0;
  v_remaining numeric(20,6);
  v_take numeric(20,6);
  v_layer record;
begin
  if p_qty <= 0 then
    raise exception 'Issue quantity must be > 0' using errcode = 'P0001';
  end if;

  v_method := public.resolve_inventory_valuation_method(p_tenant_id, p_item_id, coalesce(p_warehouse, 'STORE'));

  select *
    into v_state
  from public.inventory_cost_states
  where tenant_id = p_tenant_id
    and item_id = p_item_id
    and warehouse = coalesce(p_warehouse, 'STORE');

  if not found or v_state.qty_on_hand < p_qty then
    raise exception 'Insufficient stock for item %, warehouse %. Available %, requested %',
      p_item_id,
      coalesce(p_warehouse, 'STORE'),
      coalesce(v_state.qty_on_hand, 0),
      p_qty
      using errcode = 'P0001';
  end if;

  if v_method = 'WEIGHTED_AVERAGE' then
    v_total := round(p_qty * v_state.avg_unit_cost, 8);
  else
    v_remaining := p_qty;
    for v_layer in
      select remaining_qty, unit_cost
      from public.inventory_cost_layers
      where tenant_id = p_tenant_id
        and item_id = p_item_id
        and warehouse = coalesce(p_warehouse, 'STORE')
        and remaining_qty > 0
      order by purchased_at asc, id asc
    loop
      exit when v_remaining <= 0;
      v_take := least(v_remaining, v_layer.remaining_qty);
      v_total := v_total + round(v_take * v_layer.unit_cost, 8);
      v_remaining := round(v_remaining - v_take, 6);
    end loop;

    if v_remaining > 0 then
      raise exception 'FIFO layers do not have enough remaining quantity for item %, warehouse %', p_item_id, coalesce(p_warehouse, 'STORE') using errcode = 'P0001';
    end if;
  end if;

  return jsonb_build_object(
    'method', v_method,
    'qty', p_qty,
    'total_cost', round(v_total, 8),
    'unit_cost', case when p_qty = 0 then 0 else round(v_total / p_qty, 8) end
  );
end;
$$;

create or replace function public.inventory_issue_cost(
  p_tenant_id uuid,
  p_item_id uuid,
  p_warehouse text,
  p_qty numeric,
  p_reference_type text,
  p_reference_id uuid,
  p_reference_line_id uuid,
  p_posted_by text default null,
  p_post_to_cogs boolean default false,
  p_narration text default null,
  p_posted_at timestamptz default now(),
  p_movement_type text default 'OUTBOUND'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_method text;
  v_state public.inventory_cost_states;
  v_total_cost numeric(20,8) := 0;
  v_remaining numeric(20,6);
  v_take numeric(20,6);
  v_layer record;
  v_new_qty numeric(20,6);
  v_new_value numeric(20,8);
  v_new_avg numeric(20,8);
  v_journal_id uuid;
begin
  if p_qty <= 0 then
    raise exception 'Issue quantity must be > 0' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(
    hashtextextended(p_tenant_id::text || ':' || p_item_id::text || ':' || coalesce(p_warehouse, 'STORE'), 2002)
  );

  v_method := public.resolve_inventory_valuation_method(p_tenant_id, p_item_id, coalesce(p_warehouse, 'STORE'));
  v_state := public.ensure_inventory_cost_state(p_tenant_id, p_item_id, coalesce(p_warehouse, 'STORE'), v_method);

  if v_state.qty_on_hand < p_qty then
    raise exception 'Insufficient stock for item %, warehouse %. Available %, requested %', p_item_id, coalesce(p_warehouse, 'STORE'), v_state.qty_on_hand, p_qty using errcode = 'P0001';
  end if;

  if v_method = 'WEIGHTED_AVERAGE' then
    v_total_cost := round(p_qty * v_state.avg_unit_cost, 8);
  else
    v_remaining := p_qty;

    for v_layer in
      select id, remaining_qty, unit_cost
      from public.inventory_cost_layers
      where tenant_id = p_tenant_id
        and item_id = p_item_id
        and warehouse = coalesce(p_warehouse, 'STORE')
        and remaining_qty > 0
      order by purchased_at asc, id asc
      for update
    loop
      exit when v_remaining <= 0;
      v_take := least(v_remaining, v_layer.remaining_qty);

      update public.inventory_cost_layers
      set remaining_qty = round(remaining_qty - v_take, 6)
      where id = v_layer.id;

      v_total_cost := v_total_cost + round(v_take * v_layer.unit_cost, 8);
      v_remaining := round(v_remaining - v_take, 6);
    end loop;

    if v_remaining > 0 then
      raise exception 'FIFO layers do not have enough quantity for item %, warehouse %', p_item_id, coalesce(p_warehouse, 'STORE') using errcode = 'P0001';
    end if;
  end if;

  v_new_qty := round(v_state.qty_on_hand - p_qty, 6);
  v_new_value := round(v_state.inventory_value - v_total_cost, 8);
  if v_new_qty = 0 then
    v_new_avg := 0;
    v_new_value := 0;
  else
    v_new_avg := round(v_new_value / v_new_qty, 8);
  end if;

  update public.inventory_cost_states
  set
    method = v_method,
    qty_on_hand = v_new_qty,
    inventory_value = v_new_value,
    avg_unit_cost = v_new_avg,
    version = version + 1,
    updated_at = now()
  where id = v_state.id;

  if p_post_to_cogs then
    v_journal_id := public.post_inventory_cogs_journal(
      p_tenant_id,
      p_reference_type,
      p_reference_id,
      p_reference_line_id,
      p_item_id,
      coalesce(p_warehouse, 'STORE'),
      p_qty,
      v_total_cost,
      p_posted_by,
      coalesce(p_posted_at::date, current_date),
      p_narration
    );
  end if;

  insert into public.inventory_valuation_ledger (
    tenant_id,
    item_id,
    warehouse,
    movement_type,
    method,
    qty,
    unit_cost,
    total_cost,
    balance_qty,
    balance_value,
    reference_type,
    reference_id,
    reference_line_id,
    journal_entry_id,
    created_by,
    created_at
  )
  values (
    p_tenant_id,
    p_item_id,
    coalesce(p_warehouse, 'STORE'),
    p_movement_type,
    v_method,
    p_qty,
    case when p_qty = 0 then 0 else round(v_total_cost / p_qty, 8) end,
    round(v_total_cost, 8),
    v_new_qty,
    v_new_value,
    p_reference_type,
    p_reference_id,
    p_reference_line_id,
    v_journal_id,
    p_posted_by,
    coalesce(p_posted_at, now())
  );

  return jsonb_build_object(
    'method', v_method,
    'qty', p_qty,
    'total_cost', round(v_total_cost, 8),
    'unit_cost', case when p_qty = 0 then 0 else round(v_total_cost / p_qty, 8) end,
    'balance_qty', v_new_qty,
    'balance_value', v_new_value,
    'avg_unit_cost', v_new_avg,
    'journal_entry_id', v_journal_id
  );
end;
$$;

create or replace function public.inventory_asset_valuation(
  p_tenant_id uuid,
  p_warehouse text default null
)
returns table (
  item_id uuid,
  warehouse text,
  method text,
  qty_on_hand numeric,
  avg_unit_cost numeric,
  inventory_value numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.item_id,
    s.warehouse,
    s.method,
    s.qty_on_hand,
    s.avg_unit_cost,
    s.inventory_value
  from public.inventory_cost_states s
  where s.tenant_id = p_tenant_id
    and (p_warehouse is null or s.warehouse = p_warehouse)
    and s.qty_on_hand > 0
  order by s.item_id, s.warehouse;
$$;

create or replace function public.trg_grn_cost_inbound()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hdr record;
begin
  select gr.tenant_id, gr.warehouse, gr.grn_date, gr.grn_no, gr.created_by
    into v_hdr
  from public.goods_receipts gr
  where gr.id = new.grn_id;

  if new.item_id is null or new.qty is null or new.qty <= 0 then
    return new;
  end if;

  perform public.inventory_receive_cost(
    v_hdr.tenant_id,
    new.item_id,
    coalesce(nullif(v_hdr.warehouse, ''), 'STORE'),
    new.qty,
    coalesce(new.unit_cost, 0),
    'GRN',
    new.grn_id,
    new.id,
    v_hdr.created_by,
    coalesce(v_hdr.grn_date::timestamptz, now()),
    'INBOUND'
  );

  return new;
end;
$$;

drop trigger if exists trg_grn_cost_inbound on public.grn_items;
create trigger trg_grn_cost_inbound
  after insert on public.grn_items
  for each row
  execute function public.trg_grn_cost_inbound();

create or replace function public.trg_consumption_cost_issue()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hdr record;
  v_result jsonb;
begin
  if new.item_id is null or new.qty is null or new.qty <= 0 then
    return new;
  end if;

  select ce.tenant_id, ce.location, ce.entry_no, ce.entry_date, ce.created_by
    into v_hdr
  from public.consumption_entries ce
  where ce.id = new.consumption_id;

  v_result := public.inventory_issue_cost(
    v_hdr.tenant_id,
    new.item_id,
    coalesce(nullif(v_hdr.location, ''), 'STORE'),
    new.qty,
    'CONSUMPTION',
    new.consumption_id,
    new.id,
    v_hdr.created_by,
    true,
    'Consumption ' || coalesce(v_hdr.entry_no, ''),
    coalesce(v_hdr.entry_date::timestamptz, now()),
    'OUTBOUND'
  );

  new.unit_cost := (v_result ->> 'unit_cost')::numeric;
  new.line_cost := (v_result ->> 'total_cost')::numeric;

  return new;
end;
$$;

drop trigger if exists trg_consumption_cost_issue on public.consumption_lines;
create trigger trg_consumption_cost_issue
  before insert on public.consumption_lines
  for each row
  execute function public.trg_consumption_cost_issue();

create or replace function public.trg_transfer_cost_move()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hdr record;
  v_issue jsonb;
  v_unit_cost numeric;
begin
  if new.item_id is null or new.qty is null or new.qty <= 0 then
    return new;
  end if;

  select st.tenant_id, st.from_location, st.to_location, st.trf_no, st.transfer_date, st.created_by
    into v_hdr
  from public.stock_transfers st
  where st.id = new.transfer_id;

  v_issue := public.inventory_issue_cost(
    v_hdr.tenant_id,
    new.item_id,
    coalesce(nullif(v_hdr.from_location, ''), 'STORE'),
    new.qty,
    'TRANSFER',
    new.transfer_id,
    new.id,
    v_hdr.created_by,
    false,
    'Transfer out ' || coalesce(v_hdr.trf_no, ''),
    coalesce(v_hdr.transfer_date::timestamptz, now()),
    'TRANSFER_OUT'
  );

  v_unit_cost := (v_issue ->> 'unit_cost')::numeric;

  perform public.inventory_receive_cost(
    v_hdr.tenant_id,
    new.item_id,
    coalesce(nullif(v_hdr.to_location, ''), 'STORE'),
    new.qty,
    coalesce(v_unit_cost, 0),
    'TRANSFER',
    new.transfer_id,
    new.id,
    v_hdr.created_by,
    coalesce(v_hdr.transfer_date::timestamptz, now()),
    'TRANSFER_IN'
  );

  return new;
end;
$$;

drop trigger if exists trg_transfer_cost_move on public.transfer_items;
create trigger trg_transfer_cost_move
  before insert on public.transfer_items
  for each row
  execute function public.trg_transfer_cost_move();

create or replace function public.trg_return_cost_effect()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hdr record;
  v_avg numeric;
begin
  if new.item_id is null or new.qty is null or new.qty <= 0 then
    return new;
  end if;

  select sr.tenant_id, sr.return_type, sr.from_location, sr.return_no, sr.return_date, sr.created_by
    into v_hdr
  from public.stock_returns sr
  where sr.id = new.return_id;

  if v_hdr.return_type = 'TO_VENDOR' then
    perform public.inventory_issue_cost(
      v_hdr.tenant_id,
      new.item_id,
      coalesce(nullif(v_hdr.from_location, ''), 'STORE'),
      new.qty,
      'RETURN',
      new.return_id,
      new.id,
      v_hdr.created_by,
      false,
      'Return to vendor ' || coalesce(v_hdr.return_no, ''),
      coalesce(v_hdr.return_date::timestamptz, now()),
      'RETURN_TO_VENDOR'
    );
  else
    select s.avg_unit_cost
      into v_avg
    from public.inventory_cost_states s
    where s.tenant_id = v_hdr.tenant_id
      and s.item_id = new.item_id
      and s.warehouse = coalesce(nullif(v_hdr.from_location, ''), 'STORE')
    limit 1;

    perform public.inventory_receive_cost(
      v_hdr.tenant_id,
      new.item_id,
      coalesce(nullif(v_hdr.from_location, ''), 'STORE'),
      new.qty,
      coalesce(v_avg, 0),
      'RETURN',
      new.return_id,
      new.id,
      v_hdr.created_by,
      coalesce(v_hdr.return_date::timestamptz, now()),
      'RETURN_TO_STORE'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists trg_return_cost_effect on public.return_items;
create trigger trg_return_cost_effect
  before insert on public.return_items
  for each row
  execute function public.trg_return_cost_effect();

revoke execute on function public.post_inventory_cogs_journal(uuid, text, uuid, uuid, uuid, text, numeric, numeric, text, date, text)
  from public, anon, authenticated;

revoke execute on function public.inventory_receive_cost(uuid, uuid, text, numeric, numeric, text, uuid, uuid, text, timestamptz, text)
  from public, anon;
grant execute on function public.inventory_receive_cost(uuid, uuid, text, numeric, numeric, text, uuid, uuid, text, timestamptz, text)
  to authenticated;

revoke execute on function public.inventory_issue_cost(uuid, uuid, text, numeric, text, uuid, uuid, text, boolean, text, timestamptz, text)
  from public, anon;
grant execute on function public.inventory_issue_cost(uuid, uuid, text, numeric, text, uuid, uuid, text, boolean, text, timestamptz, text)
  to authenticated;

revoke execute on function public.inventory_preview_issue_cost(uuid, uuid, text, numeric)
  from public, anon;
grant execute on function public.inventory_preview_issue_cost(uuid, uuid, text, numeric)
  to authenticated;

revoke execute on function public.inventory_asset_valuation(uuid, text)
  from public, anon;
grant execute on function public.inventory_asset_valuation(uuid, text)
  to authenticated;

commit;
