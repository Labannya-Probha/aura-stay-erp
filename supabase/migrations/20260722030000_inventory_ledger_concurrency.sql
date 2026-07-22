-- Corrected for the ACTUAL schema: inv_items has no quantity column.
-- Stock is a computed balance across grn_items (+), consumption_lines (-),
-- transfer_items (+/- depending on direction), and return_items (-).
-- Race risk: concurrent consumption/transfer inserts can both pass a
-- "balance >= qty" check before either commits, over-issuing stock.
-- Fix: a BEFORE INSERT trigger that takes a per-tenant-per-item advisory
-- lock, recomputes the live balance under that lock, then verifies.

begin;

-- 1. A single view/function everyone should use to read current balance
--    (keeps the balance formula in one place instead of duplicated across app code).
create or replace function public.get_stock_balance(p_tenant_id uuid, p_item_id uuid)
returns numeric
language sql
stable
as $$
  select
    coalesce((select sum(gi.qty) from public.grn_items gi
                join public.goods_receipts gr on gr.id = gi.grn_id
               where gi.item_id = p_item_id and gr.tenant_id = p_tenant_id), 0)
  - coalesce((select sum(cl.qty) from public.consumption_lines cl
                join public.consumption_entries ce on ce.id = cl.consumption_id
               where cl.item_id = p_item_id and ce.tenant_id = p_tenant_id), 0)
  - coalesce((select sum(ri.qty) from public.return_items ri
                join public.stock_returns sr on sr.id = ri.return_id
               where ri.item_id = p_item_id and sr.tenant_id = p_tenant_id
                 and sr.return_type = 'TO_VENDOR'), 0)
  + coalesce((select sum(ri.qty) from public.return_items ri
                join public.stock_returns sr on sr.id = ri.return_id
               where ri.item_id = p_item_id and sr.tenant_id = p_tenant_id
                 and sr.return_type = 'TO_STORE'), 0)
  - coalesce((select sum(ti.qty) from public.transfer_items ti
                join public.stock_transfers st on st.id = ti.transfer_id
               where ti.item_id = p_item_id and st.tenant_id = p_tenant_id), 0);
$$;

-- 2. Guard trigger on consumption_lines — the highest-frequency depletion path
--    (POS sales / kitchen usage). Locks the item, re-checks balance, rejects
--    over-issue instead of allowing negative stock silently.
create or replace function public.check_consumption_stock_sufficient()
returns trigger
language plpgsql
as $$
declare
  v_tenant_id uuid;
  v_balance numeric;
begin
  select tenant_id into v_tenant_id
  from public.consumption_entries
  where id = new.consumption_id;

  if new.item_id is null then
    return new; -- free-text line with no linked inventory item; nothing to check
  end if;

  -- Serialize concurrent consumption against the SAME item+tenant only.
  perform pg_advisory_xact_lock(hashtextextended(v_tenant_id::text || ':' || new.item_id::text, 1));

  v_balance := public.get_stock_balance(v_tenant_id, new.item_id);

  if v_balance < new.qty then
    raise exception
      'Insufficient stock for item % (tenant %): available %, requested %',
      new.item_id, v_tenant_id, v_balance, new.qty
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_consumption_stock on public.consumption_lines;
create trigger trg_check_consumption_stock
  before insert on public.consumption_lines
  for each row
  execute function public.check_consumption_stock_sufficient();

-- 3. Same guard for outbound stock transfers (from_location depletes stock too).
create or replace function public.check_transfer_stock_sufficient()
returns trigger
language plpgsql
as $$
declare
  v_tenant_id uuid;
  v_balance numeric;
begin
  select tenant_id into v_tenant_id
  from public.stock_transfers
  where id = new.transfer_id;

  if new.item_id is null then
    return new;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_tenant_id::text || ':' || new.item_id::text, 2));

  v_balance := public.get_stock_balance(v_tenant_id, new.item_id);

  if v_balance < new.qty then
    raise exception
      'Insufficient stock to transfer item % (tenant %): available %, requested %',
      new.item_id, v_tenant_id, v_balance, new.qty
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_check_transfer_stock on public.transfer_items;
create trigger trg_check_transfer_stock
  before insert on public.transfer_items
  for each row
  execute function public.check_transfer_stock_sufficient();

commit;
