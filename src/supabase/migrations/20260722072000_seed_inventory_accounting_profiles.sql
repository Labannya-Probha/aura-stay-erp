begin;

/*
  Seeds inventory_accounting_profiles per tenant and warehouse.
  Priority order for account mapping:
  1) accounting_transaction_mapping transaction_type='INVENTORY_COGS'
     debit_account_id => COGS (expense), credit_account_id => Inventory asset
  2) Name-based fallback from chart_of_accounts.
*/
with dedupe_active as (
  select
    p.id,
    row_number() over (
      partition by p.tenant_id, coalesce(nullif(btrim(p.warehouse), ''), 'DEFAULT')
      order by p.updated_at desc nulls last, p.created_at desc nulls last, p.id desc
    ) as rn
  from public.inventory_accounting_profiles p
  where coalesce(p.is_active, true) = true
),
deactivate_dupes as (
  update public.inventory_accounting_profiles p
  set
    is_active = false,
    updated_at = now()
  from dedupe_active d
  where p.id = d.id
    and d.rn > 1
  returning p.id
),
tenant_pool as (
  select distinct tenant_id
  from public.chart_of_accounts
  where tenant_id is not null
),
resolved_accounts as (
  select
    t.tenant_id,
    coalesce(
      (
        select atm.debit_account_id
        from public.accounting_transaction_mapping atm
        where atm.tenant_id = t.tenant_id
          and atm.transaction_type = 'INVENTORY_COGS'
          and atm.debit_account_id is not null
        order by atm.created_at desc nulls last
        limit 1
      ),
      (
        select coa.id
        from public.chart_of_accounts coa
        where coa.tenant_id = t.tenant_id
          and coa.is_active = true
          and coa.type = 'EXPENSE'
          and (
            coa.name ilike '%cost of goods sold%'
            or coa.name ilike '%cogs%'
            or coa.code in ('500100', '500101', '500110')
          )
        order by coa.code
        limit 1
      )
    ) as cogs_account_id,
    coalesce(
      (
        select atm.credit_account_id
        from public.accounting_transaction_mapping atm
        where atm.tenant_id = t.tenant_id
          and atm.transaction_type = 'INVENTORY_COGS'
          and atm.credit_account_id is not null
        order by atm.created_at desc nulls last
        limit 1
      ),
      (
        select coa.id
        from public.chart_of_accounts coa
        where coa.tenant_id = t.tenant_id
          and coa.is_active = true
          and coa.type = 'ASSET'
          and (
            coa.name ilike '%inventory%'
            or coa.name ilike '%stock%'
            or coa.code in ('120100', '120110', '120120')
          )
        order by coa.code
        limit 1
      )
    ) as inventory_account_id
  from tenant_pool t
),
default_updated as (
  update public.inventory_accounting_profiles p
  set
    cogs_account_id = ra.cogs_account_id,
    inventory_account_id = ra.inventory_account_id,
    warehouse = 'DEFAULT',
    is_active = true,
    updated_at = now()
  from resolved_accounts ra
  where p.tenant_id = ra.tenant_id
    and coalesce(nullif(btrim(p.warehouse), ''), 'DEFAULT') = 'DEFAULT'
    and ra.cogs_account_id is not null
    and ra.inventory_account_id is not null
  returning p.tenant_id, p.cogs_account_id, p.inventory_account_id
),
default_inserted as (
  insert into public.inventory_accounting_profiles (
    tenant_id,
    warehouse,
    cogs_account_id,
    inventory_account_id,
    is_active
  )
  select
    ra.tenant_id,
    'DEFAULT',
    ra.cogs_account_id,
    ra.inventory_account_id,
    true
  from resolved_accounts ra
  where ra.cogs_account_id is not null
    and ra.inventory_account_id is not null
    and not exists (
      select 1
      from public.inventory_accounting_profiles p
      where p.tenant_id = ra.tenant_id
        and coalesce(nullif(btrim(p.warehouse), ''), 'DEFAULT') = 'DEFAULT'
    )
  returning tenant_id, cogs_account_id, inventory_account_id
),
default_seed as (
  select tenant_id, cogs_account_id, inventory_account_id from default_updated
  union all
  select tenant_id, cogs_account_id, inventory_account_id from default_inserted
)
insert into public.inventory_accounting_profiles (
  tenant_id,
  warehouse,
  cogs_account_id,
  inventory_account_id,
  is_active
)
select
  ds.tenant_id,
  sl.name,
  ds.cogs_account_id,
  ds.inventory_account_id,
  true
from default_seed ds
join public.store_locations sl
  on sl.tenant_id = ds.tenant_id
 and coalesce(sl.is_active, true) = true
where sl.name is not null
  and btrim(sl.name) <> ''
on conflict (tenant_id, warehouse) do update
set
  cogs_account_id = excluded.cogs_account_id,
  inventory_account_id = excluded.inventory_account_id,
  is_active = true,
  updated_at = now();

commit;
