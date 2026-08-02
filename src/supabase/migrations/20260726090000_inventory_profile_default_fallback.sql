begin;

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
  v_requested_warehouse text;
begin
  if p_total_cost <= 0 then
    return null;
  end if;

  v_requested_warehouse := upper(coalesce(nullif(btrim(p_warehouse), ''), 'DEFAULT'));

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
    and (
      upper(coalesce(nullif(btrim(ap.warehouse), ''), 'DEFAULT')) = v_requested_warehouse
      or upper(coalesce(nullif(btrim(ap.warehouse), ''), 'DEFAULT')) = 'DEFAULT'
    )
  order by
    case
      when upper(coalesce(nullif(btrim(ap.warehouse), ''), 'DEFAULT')) = v_requested_warehouse then 0
      when upper(coalesce(nullif(btrim(ap.warehouse), ''), 'DEFAULT')) = 'DEFAULT' then 1
      else 2
    end
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

commit;
