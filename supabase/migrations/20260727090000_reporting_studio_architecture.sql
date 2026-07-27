begin;

create table if not exists public.reporting_fx_rates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  rate_date date not null,
  base_currency text not null,
  quote_currency text not null,
  rate numeric(20,6) not null check (rate > 0),
  source_system text not null default 'manual',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, rate_date, base_currency, quote_currency)
);

create index if not exists idx_reporting_fx_rates_lookup
  on public.reporting_fx_rates (tenant_id, rate_date desc, base_currency, quote_currency);

create table if not exists public.reporting_budgets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  scope_type text not null check (scope_type in ('property', 'department', 'report', 'entity')),
  scope_key text not null,
  budget_year integer not null,
  budget_month integer null check (budget_month between 1 and 12 or budget_month is null),
  currency_code text not null default 'BDT',
  amount numeric(20,2) not null default 0,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, scope_type, scope_key, budget_year, budget_month, currency_code)
);

create index if not exists idx_reporting_budgets_lookup
  on public.reporting_budgets (tenant_id, scope_type, scope_key, budget_year, budget_month);

alter table public.reporting_fx_rates enable row level security;
alter table public.reporting_budgets enable row level security;

do $$
begin
  if to_regclass('public.report_definitions') is not null then
    alter table public.report_definitions
      add column if not exists tenant_id uuid,
      add column if not exists report_name text,
      add column if not exists report_key text,
      add column if not exists name text,
      add column if not exists key_fields text,
      add column if not exists status text not null default 'READY',
      add column if not exists created_at timestamptz not null default now(),
      add column if not exists updated_at timestamptz not null default now();
  end if;
end $$;

create unique index if not exists report_definitions_department_name_key
  on public.report_definitions (department, name);

create unique index if not exists report_catalog_department_slug_key
  on public.report_catalog (department_id, slug);

drop policy if exists reporting_fx_rates_tenant_read on public.reporting_fx_rates;
create policy reporting_fx_rates_tenant_read
  on public.reporting_fx_rates
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists reporting_fx_rates_tenant_write on public.reporting_fx_rates;
create policy reporting_fx_rates_tenant_write
  on public.reporting_fx_rates
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists reporting_budgets_tenant_read on public.reporting_budgets;
create policy reporting_budgets_tenant_read
  on public.reporting_budgets
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists reporting_budgets_tenant_write on public.reporting_budgets;
create policy reporting_budgets_tenant_write
  on public.reporting_budgets
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

create or replace function public.rpt_reporting_fx_snapshot(
  p_tenant_id uuid,
  p_filters jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_base_currency text := upper(coalesce(nullif(trim(p_filters ->> 'base_currency'), ''), 'BDT'));
  v_rate_date date := coalesce(nullif(trim(p_filters ->> 'rate_date'), '')::date, current_date);
  v_rows jsonb;
begin
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'rate_date', rate_date,
        'base_currency', base_currency,
        'quote_currency', quote_currency,
        'rate', rate,
        'source_system', source_system,
        'notes', notes
      )
      order by quote_currency
    ),
    '[]'::jsonb
  )
  into v_rows
  from public.reporting_fx_rates r
  where r.tenant_id = p_tenant_id
    and upper(r.base_currency) = v_base_currency
    and r.rate_date <= v_rate_date;

  return jsonb_build_object(
    'rows', v_rows,
    'summary', jsonb_build_object(
      'report', 'reporting_fx_snapshot',
      'tenant_id', p_tenant_id,
      'base_currency', v_base_currency,
      'rate_date', v_rate_date,
      'generated_at', now()
    )
  );
end;
$$;

create or replace function public.rpt_usali_departmental_statement(
  p_tenant_id uuid,
  p_filters jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_start_date date;
  v_end_date date;
  v_as_of date;
  v_period_days integer;
  v_previous_start date;
  v_previous_end date;
  v_department_rows jsonb;
  v_prior_rows jsonb;
  v_budget_total numeric(20,2) := 0;
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for rpt_usali_departmental_statement' using errcode = 'P0001';
  end if;

  begin
    v_start_date := nullif(trim(p_filters ->> 'start_date'), '')::date;
  exception when others then
    v_start_date := null;
  end;

  begin
    v_end_date := nullif(trim(p_filters ->> 'end_date'), '')::date;
  exception when others then
    v_end_date := null;
  end;

  begin
    v_as_of := nullif(trim(p_filters ->> 'as_of_date'), '')::date;
  exception when others then
    v_as_of := null;
  end;

  v_as_of := coalesce(v_as_of, coalesce(v_end_date, current_date));
  v_start_date := coalesce(v_start_date, date_trunc('month', v_as_of)::date);
  v_end_date := coalesce(v_end_date, v_as_of);
  v_period_days := greatest((v_end_date - v_start_date) + 1, 1);
  v_previous_start := v_start_date - v_period_days;
  v_previous_end := v_end_date - v_period_days;

  with current_slice as (
    select *
    from public.accounting_reporting_balances(p_tenant_id, v_start_date, v_end_date, v_as_of)
  ),
  prior_slice as (
    select *
    from public.accounting_reporting_balances(p_tenant_id, v_previous_start, v_previous_end, v_previous_end)
  ),
  current_grouped as (
    select
      coalesce(nullif(usali_department, ''), 'Unclassified') as usali_department,
      coalesce(nullif(usali_line_group, ''), 'NOT_APPLICABLE') as usali_line_group,
      coalesce(nullif(ifrs_statement_class, ''), 'OTHER') as ifrs_statement_class,
      round(sum(period_debit), 2) as period_debit,
      round(sum(period_credit), 2) as period_credit,
      round(sum(period_balance), 2) as period_balance,
      round(sum(presentation_balance), 2) as presentation_balance
    from current_slice
    group by 1, 2, 3
  ),
  prior_grouped as (
    select
      coalesce(nullif(usali_department, ''), 'Unclassified') as usali_department,
      coalesce(nullif(usali_line_group, ''), 'NOT_APPLICABLE') as usali_line_group,
      round(sum(period_balance), 2) as prior_balance
    from prior_slice
    group by 1, 2
  ),
  budget_lookup as (
    select
      upper(scope_key) as scope_key,
      coalesce(sum(amount), 0)::numeric(20,2) as budget_amount
    from public.reporting_budgets
    where tenant_id = p_tenant_id
      and scope_type = 'department'
      and budget_year = extract(year from v_end_date)::int
      and (budget_month = extract(month from v_end_date)::int or budget_month is null)
    group by 1
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'usali_department', c.usali_department,
          'usali_line_group', c.usali_line_group,
          'ifrs_statement_class', c.ifrs_statement_class,
          'current_period', jsonb_build_object(
            'debit', c.period_debit,
            'credit', c.period_credit,
            'balance', c.period_balance,
            'presentation_balance', c.presentation_balance
          ),
          'prior_period', jsonb_build_object(
            'balance', coalesce(p.prior_balance, 0)
          ),
          'budget', jsonb_build_object(
            'balance', coalesce(b.budget_amount, 0)
          ),
          'variance', jsonb_build_object(
            'vs_prior', c.period_balance - coalesce(p.prior_balance, 0),
            'vs_budget', c.period_balance - coalesce(b.budget_amount, 0)
          )
        )
        order by c.usali_department, c.usali_line_group
      ),
      '[]'::jsonb
    )
  into v_department_rows
  from current_grouped c
  left join prior_grouped p
    on p.usali_department = c.usali_department
   and p.usali_line_group = c.usali_line_group
  left join budget_lookup b
    on b.scope_key = upper(c.usali_department);

  select coalesce(sum(amount), 0)
    into v_budget_total
  from public.reporting_budgets
  where tenant_id = p_tenant_id
    and scope_type = 'department'
    and budget_year = extract(year from v_end_date)::int
    and (budget_month = extract(month from v_end_date)::int or budget_month is null);

  return jsonb_build_object(
    'rows', v_department_rows,
    'summary', jsonb_build_object(
      'report', 'usali_departmental_statement',
      'tenant_id', p_tenant_id,
      'start_date', v_start_date,
      'end_date', v_end_date,
      'comparison_start_date', v_previous_start,
      'comparison_end_date', v_previous_end,
      'budget_total', coalesce(v_budget_total, 0),
      'generated_at', now()
    )
  );
end;
$$;

create or replace function public.rpt_ar_ap_aging_schedule(
  p_tenant_id uuid,
  p_filters jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_as_of date;
  v_rows jsonb;
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for rpt_ar_ap_aging_schedule' using errcode = 'P0001';
  end if;

  begin
    v_as_of := nullif(trim(p_filters ->> 'as_of_date'), '')::date;
  exception when others then
    v_as_of := null;
  end;

  v_as_of := coalesce(v_as_of, current_date);

  with aging as (
    select *
    from public.get_aging_buckets(p_tenant_id, v_as_of, 'ALL')
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'ledger_type', ledger_type,
        'entity_id', entity_id,
        'entity_name', entity_name,
        'document_id', document_id,
        'document_no', document_no,
        'document_date', document_date,
        'due_date', due_date,
        'days_overdue', days_overdue,
        'outstanding', outstanding,
        'bucket_0_30', bucket_0_30,
        'bucket_31_60', bucket_31_60,
        'bucket_61_90', bucket_61_90,
        'bucket_91_plus', bucket_91_plus
      )
      order by ledger_type, entity_name, document_date
    ),
    '[]'::jsonb
  )
  into v_rows
  from aging;

  return jsonb_build_object(
    'rows', v_rows,
    'summary', jsonb_build_object(
      'report', 'ar_ap_aging_schedule',
      'tenant_id', p_tenant_id,
      'as_of_date', v_as_of,
      'generated_at', now()
    )
  );
end;
$$;

grant select, insert, update, delete on public.reporting_fx_rates to authenticated;
grant select, insert, update, delete on public.reporting_budgets to authenticated;
grant execute on function public.rpt_reporting_fx_snapshot(uuid, jsonb) to authenticated;
grant execute on function public.rpt_usali_departmental_statement(uuid, jsonb) to authenticated;
grant execute on function public.rpt_ar_ap_aging_schedule(uuid, jsonb) to authenticated;

insert into public.report_definitions (tenant_id, department, report_name, report_key, name, key_fields, status)
values
  (coalesce(public.current_tenant_id(), (select id from public.properties order by created_at asc limit 1)), 'Accounting', 'AR/AP Aging Schedule', 'ar_ap_aging_schedule', 'AR/AP Aging Schedule', 'Ledger Type, Entity, Document No, Due Date, Outstanding, Aging Buckets', 'READY'),
  (coalesce(public.current_tenant_id(), (select id from public.properties order by created_at asc limit 1)), 'Accounting', 'USALI Departmental Statement', 'usali_departmental_statement', 'USALI Departmental Statement', 'Department, Line Group, Current Period, Prior Period, Budget, Variance', 'READY'),
  (coalesce(public.current_tenant_id(), (select id from public.properties order by created_at asc limit 1)), 'Admin & Audit', 'Reporting FX Snapshot', 'reporting_fx_snapshot', 'Reporting FX Snapshot', 'Rate Date, Base Currency, Quote Currency, Rate', 'READY')
on conflict (department, name) do update set
  key_fields = excluded.key_fields,
  status = 'READY',
  updated_at = now();

with seed_payload as (
  select
    'RPT-033'::text as report_code,
    d.id as department_id,
    'Reporting FX Snapshot'::text as title,
    'reporting-fx-snapshot'::text as slug,
    'Live exchange rate snapshot for multi-currency reporting.'::text as description,
    'reporting'::text as module_owner,
    'Daily'::text as cycle,
    array['reporting_fx_rates']::text[] as primary_tables,
    '/reports/' || d.slug || '/reporting-fx-snapshot' as route,
    41::int as display_order,
    5::int as cache_minutes,
    true as supports_table,
    true as supports_chart,
    true as supports_kpi,
    true as supports_print,
    true as supports_export_pdf,
    true as supports_export_excel,
    false as supports_schedule,
    true as is_active,
    'rpt_reporting_fx_snapshot'::text as source_function
  from public.report_departments d
  where d.slug = 'admin'

  union all

  select
    'RPT-034'::text,
    d.id,
    'USALI Departmental Statement'::text,
    'usali-departmental-statement'::text,
    'Comparative departmental operating statement with prior period and budget variance.'::text,
    'reporting'::text,
    'Monthly'::text,
    array['accounting_reporting_balances', 'reporting_budgets']::text[],
    '/reports/' || d.slug || '/usali-departmental-statement',
    42::int,
    5::int,
    true,
    true,
    true,
    true,
    true,
    true,
    false,
    true,
    'rpt_usali_departmental_statement'::text
  from public.report_departments d
  where d.slug = 'accounts'

  union all

  select
    'RPT-035'::text,
    d.id,
    'AR/AP Aging Schedule'::text,
    'ar-ap-aging-schedule'::text,
    'Combined aging schedule for receivables and payables with bucket analysis.'::text,
    'reporting'::text,
    'Daily'::text,
    array['invoices', 'v_ap_aging']::text[],
    '/reports/' || d.slug || '/ar-ap-aging-schedule',
    43::int,
    5::int,
    true,
    false,
    true,
    true,
    true,
    true,
    false,
    true,
    'rpt_ar_ap_aging_schedule'::text
  from public.report_departments d
  where d.slug = 'accounts'
),
deleted_slug_conflicts as (
  delete from public.report_catalog rc
  using seed_payload p
  where rc.department_id = p.department_id
    and rc.slug = p.slug
    and rc.report_code <> p.report_code
    and exists (
      select 1
      from public.report_catalog by_code
      where by_code.report_code = p.report_code
    )
  returning rc.id
),
updated_by_code as (
  update public.report_catalog rc
  set
    department_id = p.department_id,
    title = p.title,
    slug = p.slug,
    description = p.description,
    module_owner = p.module_owner,
    cycle = p.cycle,
    primary_tables = p.primary_tables,
    route = p.route,
    display_order = p.display_order,
    cache_minutes = p.cache_minutes,
    supports_table = p.supports_table,
    supports_chart = p.supports_chart,
    supports_kpi = p.supports_kpi,
    supports_print = p.supports_print,
    supports_export_pdf = p.supports_export_pdf,
    supports_export_excel = p.supports_export_excel,
    supports_schedule = p.supports_schedule,
    is_active = true,
    source_function = p.source_function
  from seed_payload p
  where rc.report_code = p.report_code
  returning rc.id, rc.report_code
),
updated_by_slug as (
  update public.report_catalog rc
  set
    report_code = p.report_code,
    title = p.title,
    description = p.description,
    module_owner = p.module_owner,
    cycle = p.cycle,
    primary_tables = p.primary_tables,
    route = p.route,
    display_order = p.display_order,
    cache_minutes = p.cache_minutes,
    supports_table = p.supports_table,
    supports_chart = p.supports_chart,
    supports_kpi = p.supports_kpi,
    supports_print = p.supports_print,
    supports_export_pdf = p.supports_export_pdf,
    supports_export_excel = p.supports_export_excel,
    supports_schedule = p.supports_schedule,
    is_active = true,
    source_function = p.source_function
  from seed_payload p
  where rc.department_id = p.department_id
    and rc.slug = p.slug
    and not exists (
      select 1
      from updated_by_code ubc
      where ubc.report_code = p.report_code
    )
  returning rc.id, rc.report_code
)
insert into public.report_catalog (
  report_code,
  department_id,
  title,
  slug,
  description,
  module_owner,
  cycle,
  primary_tables,
  route,
  display_order,
  cache_minutes,
  supports_table,
  supports_chart,
  supports_kpi,
  supports_print,
  supports_export_pdf,
  supports_export_excel,
  supports_schedule,
  is_active,
  source_function
)
select
  p.report_code,
  p.department_id,
  p.title,
  p.slug,
  p.description,
  p.module_owner,
  p.cycle,
  p.primary_tables,
  p.route,
  p.display_order,
  p.cache_minutes,
  p.supports_table,
  p.supports_chart,
  p.supports_kpi,
  p.supports_print,
  p.supports_export_pdf,
  p.supports_export_excel,
  p.supports_schedule,
  p.is_active,
  p.source_function
from seed_payload p
where not exists (
  select 1
  from updated_by_code ubc
  where ubc.report_code = p.report_code
)
  and not exists (
    select 1
    from updated_by_slug ubs
    where ubs.report_code = p.report_code
  );

commit;
