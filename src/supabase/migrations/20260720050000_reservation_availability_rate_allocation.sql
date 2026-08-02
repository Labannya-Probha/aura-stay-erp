-- Aura Stay ERP — Reservation Sprint 2 / Phase 2
-- Availability, rate plans, restrictions, overbooking and atomic room allocation.

create table if not exists public.reservation_rate_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  code text not null,
  name text not null,
  room_type_key text null,
  currency text not null default 'BDT',
  base_rate numeric(14,2) not null default 0 check (base_rate >= 0),
  extra_adult_rate numeric(14,2) not null default 0,
  extra_child_rate numeric(14,2) not null default 0,
  included_adults integer not null default 2,
  included_children integer not null default 0,
  min_nights integer not null default 1,
  max_nights integer null,
  valid_from date null,
  valid_to date null,
  is_refundable boolean not null default true,
  is_active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, code)
);

create table if not exists public.reservation_rate_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  rate_plan_id uuid not null references public.reservation_rate_plans(id) on delete cascade,
  code text not null,
  name text not null,
  priority integer not null default 100,
  adjustment_type text not null check (adjustment_type in ('SET','FIXED','PERCENT')),
  adjustment_value numeric(14,4) not null default 0,
  start_date date null,
  end_date date null,
  days_of_week smallint[] null,
  min_occupancy numeric(5,2) null,
  max_occupancy numeric(5,2) null,
  min_nights integer null,
  max_nights integer null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, rate_plan_id, code)
);

create table if not exists public.reservation_inventory_controls (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  room_type_key text not null,
  business_date date not null,
  out_of_order integer not null default 0 check (out_of_order >= 0),
  overbooking_limit integer not null default 0 check (overbooking_limit >= 0),
  stop_sell boolean not null default false,
  closed_to_arrival boolean not null default false,
  closed_to_departure boolean not null default false,
  min_stay integer not null default 1,
  max_stay integer null,
  reason text null,
  updated_by uuid null,
  updated_at timestamptz not null default now(),
  unique (tenant_id, room_type_key, business_date)
);

create index if not exists idx_rate_plans_tenant_active on public.reservation_rate_plans(tenant_id, is_active, room_type_key);
create index if not exists idx_rate_rules_plan_dates on public.reservation_rate_rules(tenant_id, rate_plan_id, start_date, end_date) where is_active;
create index if not exists idx_inventory_controls_lookup on public.reservation_inventory_controls(tenant_id, room_type_key, business_date);
create index if not exists idx_reservation_rooms_overlap on public.reservation_rooms(tenant_id, room_id, from_date, to_date);

alter table public.reservation_rate_plans enable row level security;
alter table public.reservation_rate_rules enable row level security;
alter table public.reservation_inventory_controls enable row level security;

-- Tenant isolation uses the same JWT/session convention as the rest of Aura Stay.
do $$
begin
  if exists (select 1 from pg_proc where proname = 'current_tenant_id') then
    execute 'drop policy if exists reservation_rate_plans_tenant on public.reservation_rate_plans';
    execute 'create policy reservation_rate_plans_tenant on public.reservation_rate_plans for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id())';
    execute 'drop policy if exists reservation_rate_rules_tenant on public.reservation_rate_rules';
    execute 'create policy reservation_rate_rules_tenant on public.reservation_rate_rules for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id())';
    execute 'drop policy if exists reservation_inventory_controls_tenant on public.reservation_inventory_controls';
    execute 'create policy reservation_inventory_controls_tenant on public.reservation_inventory_controls for all to authenticated using (tenant_id = public.current_tenant_id()) with check (tenant_id = public.current_tenant_id())';
  end if;
end $$;

create or replace function public.reservation_availability(
  p_tenant_id uuid,
  p_check_in date,
  p_check_out date,
  p_room_type_id text default null,
  p_quantity integer default 1
)
returns table (
  room_type_key text,
  physical_rooms bigint,
  minimum_available integer,
  requested_quantity integer,
  can_sell boolean,
  stop_sell boolean,
  restrictions jsonb,
  daily_inventory jsonb
)
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_tenant_id is null then raise exception 'Tenant is required'; end if;
  if p_check_in is null or p_check_out is null or p_check_out <= p_check_in then
    raise exception 'Check-out must be after check-in';
  end if;

  return query
  with room_types as (
    select coalesce(nullif(r.room_type, ''), 'UNASSIGNED')::text as type_key, count(*)::bigint as room_count
    from public.rooms r
    where r.tenant_id = p_tenant_id and coalesce(r.is_active, true)
      and (p_room_type_id is null or r.room_type = p_room_type_id)
    group by 1
  ), dates as (
    select d::date as business_date
    from generate_series(p_check_in, p_check_out - 1, interval '1 day') d
  ), inventory as (
    select rt.type_key, rt.room_count, dates.business_date,
      coalesce(ic.out_of_order, 0) as out_of_order,
      coalesce(ic.overbooking_limit, 0) as overbooking_limit,
      coalesce(ic.stop_sell, false) as stop_sell,
      coalesce(ic.closed_to_arrival, false) as cta,
      coalesce(ic.closed_to_departure, false) as ctd,
      coalesce(ic.min_stay, 1) as min_stay,
      ic.max_stay,
      count(distinct rm.id)::integer as sold
    from room_types rt cross join dates
    left join public.reservation_inventory_controls ic
      on ic.tenant_id = p_tenant_id and ic.room_type_key = rt.type_key and ic.business_date = dates.business_date
    left join public.reservation_rooms rr
      on rr.tenant_id = p_tenant_id
      and rr.from_date <= dates.business_date and rr.to_date > dates.business_date
    left join public.rooms rm on rm.id = rr.room_id and rm.tenant_id = p_tenant_id and rm.room_type = rt.type_key
    left join public.reservations res on res.id = rr.reservation_id and res.tenant_id = p_tenant_id
      and upper(coalesce(res.status,'')) not in ('CANCELLED','NO_SHOW','CHECKED_OUT')
    group by rt.type_key, rt.room_count, dates.business_date, ic.out_of_order, ic.overbooking_limit,
      ic.stop_sell, ic.closed_to_arrival, ic.closed_to_departure, ic.min_stay, ic.max_stay
  ), calculated as (
    select *, greatest(0, room_count::integer - out_of_order + overbooking_limit - sold) as available
    from inventory
  )
  select c.type_key,
    max(c.room_count),
    min(case when c.stop_sell then 0 else c.available end)::integer,
    greatest(1, p_quantity),
    bool_and(not c.stop_sell and c.available >= greatest(1, p_quantity)
      and not (c.business_date = p_check_in and c.cta)
      and not (c.business_date = p_check_out - 1 and c.ctd)
      and (p_check_out - p_check_in) >= c.min_stay
      and (c.max_stay is null or (p_check_out - p_check_in) <= c.max_stay)),
    bool_or(c.stop_sell),
    jsonb_build_object('cta', bool_or(c.cta), 'ctd', bool_or(c.ctd), 'minStay', max(c.min_stay), 'maxStay', min(c.max_stay)),
    jsonb_agg(jsonb_build_object(
      'date', c.business_date, 'physicalRooms', c.room_count, 'outOfOrder', c.out_of_order,
      'overbookingLimit', c.overbooking_limit, 'sold', c.sold,
      'available', case when c.stop_sell then 0 else c.available end, 'stopSell', c.stop_sell
    ) order by c.business_date)
  from calculated c
  group by c.type_key
  order by c.type_key;
end;
$$;

create or replace function public.reservation_rate_quote(
  p_tenant_id uuid,
  p_room_type_id text,
  p_rate_plan_id uuid,
  p_check_in date,
  p_check_out date,
  p_adults integer default 1,
  p_children integer default 0,
  p_promo_code text default null
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_plan public.reservation_rate_plans%rowtype;
  v_date date;
  v_rate numeric;
  v_total numeric := 0;
  v_breakdown jsonb := '[]'::jsonb;
  v_rule record;
begin
  select * into v_plan from public.reservation_rate_plans
  where tenant_id = p_tenant_id and is_active
    and (p_rate_plan_id is null or id = p_rate_plan_id)
    and (room_type_key is null or room_type_key = p_room_type_id)
    and (valid_from is null or valid_from <= p_check_in)
    and (valid_to is null or valid_to >= p_check_out - 1)
  order by case when id = p_rate_plan_id then 0 else 1 end, created_at limit 1;
  if not found then raise exception 'No active rate plan found'; end if;
  if p_check_out <= p_check_in then raise exception 'Invalid stay dates'; end if;
  if (p_check_out - p_check_in) < v_plan.min_nights then raise exception 'Minimum stay is % night(s)', v_plan.min_nights; end if;
  if v_plan.max_nights is not null and (p_check_out - p_check_in) > v_plan.max_nights then raise exception 'Maximum stay is % night(s)', v_plan.max_nights; end if;

  for v_date in select generate_series(p_check_in, p_check_out - 1, interval '1 day')::date loop
    v_rate := v_plan.base_rate;
    for v_rule in select * from public.reservation_rate_rules r
      where r.tenant_id = p_tenant_id and r.rate_plan_id = v_plan.id and r.is_active
        and (r.start_date is null or r.start_date <= v_date)
        and (r.end_date is null or r.end_date >= v_date)
        and (r.days_of_week is null or extract(dow from v_date)::smallint = any(r.days_of_week))
      order by r.priority, r.id
    loop
      if v_rule.adjustment_type = 'SET' then v_rate := v_rule.adjustment_value;
      elsif v_rule.adjustment_type = 'FIXED' then v_rate := v_rate + v_rule.adjustment_value;
      elsif v_rule.adjustment_type = 'PERCENT' then v_rate := v_rate + (v_rate * v_rule.adjustment_value / 100); end if;
    end loop;
    v_rate := greatest(0, v_rate
      + greatest(0, p_adults - v_plan.included_adults) * v_plan.extra_adult_rate
      + greatest(0, p_children - v_plan.included_children) * v_plan.extra_child_rate);
    v_total := v_total + v_rate;
    v_breakdown := v_breakdown || jsonb_build_array(jsonb_build_object('date', v_date, 'rate', round(v_rate,2)));
  end loop;

  return jsonb_build_object('ratePlanId', v_plan.id, 'ratePlanCode', v_plan.code, 'currency', v_plan.currency,
    'nights', p_check_out - p_check_in, 'roomTotal', round(v_total,2),
    'averageNightlyRate', round(v_total / greatest(1, p_check_out - p_check_in),2), 'breakdown', v_breakdown);
end;
$$;

create or replace function public.allocate_reservation_rooms(
  p_tenant_id uuid,
  p_reservation_id uuid,
  p_room_ids uuid[],
  p_from_date date,
  p_to_date date,
  p_rate numeric default 0
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare v_room_id uuid; v_conflicts integer; v_inserted integer := 0;
begin
  if p_to_date <= p_from_date then raise exception 'Invalid allocation dates'; end if;
  if coalesce(array_length(p_room_ids,1),0) = 0 then raise exception 'At least one room is required'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text || ':' || p_from_date::text || ':' || p_to_date::text, 0));

  foreach v_room_id in array p_room_ids loop
    if not exists(select 1 from public.rooms where id=v_room_id and tenant_id=p_tenant_id and coalesce(is_active,true)) then
      raise exception 'Room % is unavailable', v_room_id;
    end if;
    select count(*) into v_conflicts from public.reservation_rooms rr
      join public.reservations r on r.id=rr.reservation_id
      where rr.tenant_id=p_tenant_id and rr.room_id=v_room_id
        and rr.from_date < p_to_date and rr.to_date > p_from_date
        and upper(coalesce(r.status,'')) not in ('CANCELLED','NO_SHOW','CHECKED_OUT')
        and rr.reservation_id <> p_reservation_id;
    if v_conflicts > 0 then raise exception 'Room % has an overlapping reservation', v_room_id; end if;
  end loop;

  delete from public.reservation_rooms where tenant_id=p_tenant_id and reservation_id=p_reservation_id;
  foreach v_room_id in array p_room_ids loop
    insert into public.reservation_rooms(tenant_id,reservation_id,room_id,rate,from_date,to_date)
    values(p_tenant_id,p_reservation_id,v_room_id,greatest(0,p_rate),p_from_date,p_to_date);
    v_inserted := v_inserted + 1;
  end loop;
  update public.reservations set check_in=p_from_date, check_out=p_to_date, updated_at=now()
  where id=p_reservation_id and tenant_id=p_tenant_id;
  return jsonb_build_object('reservationId',p_reservation_id,'allocatedRooms',v_inserted,'fromDate',p_from_date,'toDate',p_to_date);
end;
$$;

grant execute on function public.reservation_availability(uuid,date,date,text,integer) to authenticated;
grant execute on function public.reservation_rate_quote(uuid,text,uuid,date,date,integer,integer,text) to authenticated;
grant execute on function public.allocate_reservation_rooms(uuid,uuid,uuid[],date,date,numeric) to authenticated;
