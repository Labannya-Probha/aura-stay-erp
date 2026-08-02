begin;

-- Weighted Average Cost from GRN history.
create or replace function public.get_item_wac(
  p_tenant_id uuid,
  p_item_id uuid,
  p_warehouse text default null,
  p_as_of timestamptz default now()
)
returns numeric(20,8)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_total_qty numeric(20,8);
  v_total_value numeric(20,8);
  v_wac numeric(20,8);
begin
  select
    coalesce(sum(gi.qty), 0),
    coalesce(sum(gi.qty * gi.unit_cost), 0)
  into v_total_qty, v_total_value
  from public.grn_items gi
  join public.goods_receipts gr on gr.id = gi.grn_id
  where gr.tenant_id = p_tenant_id
    and gi.item_id = p_item_id
    and (p_warehouse is null or coalesce(nullif(gr.warehouse, ''), 'STORE') = p_warehouse)
    and coalesce(gr.grn_date::timestamptz, gr.created_at, now()) <= p_as_of;

  if v_total_qty <= 0 then
    return 0;
  end if;

  v_wac := round(v_total_value / v_total_qty, 8);
  return coalesce(v_wac, 0);
end;
$$;

comment on function public.get_item_wac(uuid, uuid, text, timestamptz)
  is 'Returns weighted average unit cost from GRN receipt history for a tenant/item, optionally warehouse-scoped and as-of timestamp.';

-- Convenience as-of-now wrapper (explicitly named RPC for front-end callers).
create or replace function public.get_item_wac_now(
  p_tenant_id uuid,
  p_item_id uuid,
  p_warehouse text default null
)
returns numeric(20,8)
language sql
stable
security definer
set search_path = public
as $$
  select public.get_item_wac(p_tenant_id, p_item_id, p_warehouse, now());
$$;

revoke execute on function public.get_item_wac(uuid, uuid, text, timestamptz)
  from public, anon;
grant execute on function public.get_item_wac(uuid, uuid, text, timestamptz)
  to authenticated;

revoke execute on function public.get_item_wac_now(uuid, uuid, text)
  from public, anon;
grant execute on function public.get_item_wac_now(uuid, uuid, text)
  to authenticated;

commit;
