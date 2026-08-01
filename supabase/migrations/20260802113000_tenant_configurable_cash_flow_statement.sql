begin;

create table if not exists public.cash_flow_account_mappings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  account_id uuid not null references public.chart_of_accounts(id) on delete cascade,
  activity_class text not null check (activity_class in ('OPERATING', 'INVESTING', 'FINANCING')),
  is_cash_and_equivalent boolean not null default false,
  include_non_cash boolean not null default false,
  is_active boolean not null default true,
  approved_by uuid,
  approved_note text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, account_id)
);

create table if not exists public.cash_flow_non_cash_rules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  keyword text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, keyword)
);

create index if not exists idx_cash_flow_account_mappings_tenant
  on public.cash_flow_account_mappings (tenant_id, is_active, activity_class);

create index if not exists idx_cash_flow_non_cash_rules_tenant
  on public.cash_flow_non_cash_rules (tenant_id, is_active);

alter table public.cash_flow_account_mappings enable row level security;
alter table public.cash_flow_non_cash_rules enable row level security;

drop policy if exists cash_flow_account_mappings_tenant_rw on public.cash_flow_account_mappings;
create policy cash_flow_account_mappings_tenant_rw
  on public.cash_flow_account_mappings
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists cash_flow_non_cash_rules_tenant_rw on public.cash_flow_non_cash_rules;
create policy cash_flow_non_cash_rules_tenant_rw
  on public.cash_flow_non_cash_rules
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

insert into public.cash_flow_non_cash_rules (tenant_id, keyword)
select distinct coa.tenant_id, v.keyword
from public.chart_of_accounts coa
cross join (values
  ('depreciat'),
  ('amortis'),
  ('impair'),
  ('provision'),
  ('accrual'),
  ('write off')
) as v(keyword)
where coa.tenant_id is not null
on conflict (tenant_id, keyword) do nothing;

insert into public.cash_flow_account_mappings (
  tenant_id,
  account_id,
  activity_class,
  is_cash_and_equivalent,
  include_non_cash,
  is_active,
  approved_note,
  approved_at
)
select
  coa.tenant_id,
  coa.id,
  case
    when lower(coalesce(coa.name, '') || ' ' || coalesce(coa.code, '')) ~ '(loan|mortgage|lease|equity|capital|dividend|shareholder|owner)' then 'FINANCING'
    when lower(coalesce(coa.name, '') || ' ' || coalesce(coa.code, '')) ~ '(asset|property|plant|equipment|vehicle|capex|software|investment)' then 'INVESTING'
    else 'OPERATING'
  end as activity_class,
  lower(coalesce(coa.name, '') || ' ' || coalesce(coa.code, '')) ~ '(cash|bank|petty cash|cash equivalent|short.?term deposit)' as is_cash_and_equivalent,
  false as include_non_cash,
  true as is_active,
  'System-seeded default cash-flow mapping' as approved_note,
  now() as approved_at
from public.chart_of_accounts coa
where coa.tenant_id is not null
  and coalesce(coa.is_active, true)
on conflict (tenant_id, account_id) do nothing;

create or replace function public.aeds_resolve_cash_flow_mapping(
  p_tenant_id uuid,
  p_account_id uuid,
  p_account_name text,
  p_account_code text,
  p_account_type text,
  p_ifrs_statement_class text,
  p_usali_line_group text
)
returns table (
  activity_class text,
  is_cash_and_equivalent boolean,
  include_non_cash boolean
)
language sql
stable
set search_path = public, pg_temp
as $$
  with explicit_map as (
    select
      m.activity_class,
      m.is_cash_and_equivalent,
      m.include_non_cash
    from public.cash_flow_account_mappings m
    where m.tenant_id = p_tenant_id
      and m.account_id = p_account_id
      and m.is_active = true
    limit 1
  )
  select
    coalesce(
      (select em.activity_class from explicit_map em),
      case
        when lower(coalesce(p_account_name, '') || ' ' || coalesce(p_account_code, '')) ~ '(loan|mortgage|lease|equity|capital|dividend|shareholder|owner)' then 'FINANCING'
        when lower(coalesce(p_account_name, '') || ' ' || coalesce(p_account_code, '')) ~ '(asset|property|plant|equipment|vehicle|capex|software|investment)' then 'INVESTING'
        when upper(coalesce(p_ifrs_statement_class, '')) in ('EQUITY', 'LIABILITY') then 'FINANCING'
        when upper(coalesce(p_ifrs_statement_class, '')) = 'ASSET' then 'INVESTING'
        else 'OPERATING'
      end
    ) as activity_class,
    coalesce(
      (select em.is_cash_and_equivalent from explicit_map em),
      lower(coalesce(p_account_name, '') || ' ' || coalesce(p_account_code, '')) ~ '(cash|bank|petty cash|cash equivalent|short.?term deposit)'
    ) as is_cash_and_equivalent,
    coalesce((select em.include_non_cash from explicit_map em), false) as include_non_cash;
$$;

create or replace function public.rpt_cash_flow_direct_configurable(
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
  v_rows jsonb;
  v_operating numeric(20,2) := 0;
  v_investing numeric(20,2) := 0;
  v_financing numeric(20,2) := 0;
  v_opening_cash numeric(20,2) := 0;
  v_closing_cash numeric(20,2) := 0;
  v_expected_closing numeric(20,2) := 0;
  v_recon_delta numeric(20,2) := 0;
  v_bs_cash numeric(20,2) := 0;
  v_bs_delta numeric(20,2) := 0;
  v_missing_mapped_accounts integer := 0;
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for configurable cash flow direct method' using errcode = 'P0001';
  end if;

  begin
    v_start_date := nullif(trim(p_filters ->> 'start_date'), '')::date;
  exception when others then
    v_start_date := null;
  end;

  begin
    v_end_date := nullif(trim(coalesce(p_filters ->> 'end_date', p_filters ->> 'as_of_date')), '')::date;
  exception when others then
    v_end_date := null;
  end;

  v_end_date := coalesce(v_end_date, current_date);
  v_start_date := coalesce(v_start_date, date_trunc('month', v_end_date)::date);

  with balances_close as (
    select *
    from public.accounting_reporting_balances(p_tenant_id, v_start_date, v_end_date, v_end_date)
  ),
  balances_open as (
    select *
    from public.accounting_reporting_balances(p_tenant_id, null, null, v_start_date - 1)
  ),
  mapped_accounts as (
    select
      bc.account_id,
      bc.account_code,
      bc.account_name,
      bc.account_type,
      bc.ifrs_statement_class,
      bc.usali_line_group,
      bc.is_cash_account,
      r.activity_class,
      r.is_cash_and_equivalent,
      r.include_non_cash
    from balances_close bc
    cross join lateral public.aeds_resolve_cash_flow_mapping(
      p_tenant_id,
      bc.account_id,
      bc.account_name,
      bc.account_code,
      bc.account_type,
      bc.ifrs_statement_class,
      bc.usali_line_group
    ) r
  ),
  cash_accounts as (
    select account_id
    from mapped_accounts
    where is_cash_and_equivalent or is_cash_account
  ),
  period_entries as (
    select je.id
    from public.journal_entries je
    where je.tenant_id = p_tenant_id
      and coalesce(je.jv_date, je.created_at::date) between v_start_date and v_end_date
  ),
  cash_entry_totals as (
    select
      jl.entry_id,
      round(sum(coalesce(jl.debit, 0) - coalesce(jl.credit, 0)), 2) as cash_delta
    from public.journal_lines jl
    join period_entries pe on pe.id = jl.entry_id
    join cash_accounts ca on ca.account_id = jl.account_id
    where jl.tenant_id = p_tenant_id
    group by jl.entry_id
    having abs(round(sum(coalesce(jl.debit, 0) - coalesce(jl.credit, 0)), 2)) > 0
  ),
  counterpart_raw as (
    select
      jl.entry_id,
      jl.account_id,
      ma.account_code,
      ma.account_name,
      ma.activity_class,
      ma.include_non_cash,
      round(sum(coalesce(jl.debit, 0) - coalesce(jl.credit, 0)), 2) as counterpart_delta,
      exists (
        select 1
        from public.cash_flow_non_cash_rules ncr
        where ncr.tenant_id = p_tenant_id
          and ncr.is_active = true
          and lower(coalesce(ma.account_name, '') || ' ' || coalesce(ma.account_code, '')) like '%' || lower(ncr.keyword) || '%'
      ) as matched_non_cash_keyword
    from public.journal_lines jl
    join cash_entry_totals cet on cet.entry_id = jl.entry_id
    join mapped_accounts ma on ma.account_id = jl.account_id
    where jl.tenant_id = p_tenant_id
      and jl.account_id not in (select account_id from cash_accounts)
    group by jl.entry_id, jl.account_id, ma.account_code, ma.account_name, ma.activity_class, ma.include_non_cash
  ),
  counterpart as (
    select *
    from counterpart_raw cr
    where not (cr.matched_non_cash_keyword and cr.include_non_cash = false)
      and abs(cr.counterpart_delta) > 0
  ),
  entry_weight_base as (
    select
      cr.entry_id,
      sum(abs(cr.counterpart_delta)) as sum_abs_counterpart
    from counterpart cr
    group by cr.entry_id
  ),
  distributed as (
    select
      cr.activity_class,
      cr.account_code,
      cr.account_name,
      round(cet.cash_delta * (abs(cr.counterpart_delta) / nullif(ewb.sum_abs_counterpart, 0)), 2) as amount
    from counterpart cr
    join cash_entry_totals cet on cet.entry_id = cr.entry_id
    join entry_weight_base ewb on ewb.entry_id = cr.entry_id
    where ewb.sum_abs_counterpart > 0

    union all

    select
      'OPERATING'::text as activity_class,
      'UNMAPPED'::text as account_code,
      'Unclassified cash movement'::text as account_name,
      cet.cash_delta as amount
    from cash_entry_totals cet
    where not exists (
      select 1 from entry_weight_base ewb where ewb.entry_id = cet.entry_id and ewb.sum_abs_counterpart > 0
    )
  ),
  grouped as (
    select
      d.activity_class,
      d.account_code,
      d.account_name,
      round(sum(d.amount), 2) as amount
    from distributed d
    group by d.activity_class, d.account_code, d.account_name
  ),
  class_totals as (
    select
      coalesce(round(sum(case when g.activity_class = 'OPERATING' then g.amount else 0 end), 2), 0) as operating_total,
      coalesce(round(sum(case when g.activity_class = 'INVESTING' then g.amount else 0 end), 2), 0) as investing_total,
      coalesce(round(sum(case when g.activity_class = 'FINANCING' then g.amount else 0 end), 2), 0) as financing_total
    from grouped g
  ),
  statement_rows as (
    select 100 as display_order, 'CF.OP.HEADER'::text as line_code, 'Operating Activities'::text as label, 'HEADER'::text as line_type, 0::int as indent_level, null::numeric as current_amount, true as is_bold, false as is_underlined, false as is_double_underlined
    union all
    select 110 + row_number() over (order by g.account_code, g.account_name), 'CF.OP.' || coalesce(g.account_code, row_number() over ()::text), g.account_name, 'LINE', 1, g.amount, false, false, false
    from grouped g where g.activity_class = 'OPERATING'
    union all
    select 190, 'CF.OP.SUBTOTAL', 'Net cash from operating activities', 'SUBTOTAL', 0, (select operating_total from class_totals), true, true, false

    union all
    select 200, 'CF.INV.HEADER', 'Investing Activities', 'HEADER', 0, null, true, false, false
    union all
    select 210 + row_number() over (order by g.account_code, g.account_name), 'CF.INV.' || coalesce(g.account_code, row_number() over ()::text), g.account_name, 'LINE', 1, g.amount, false, false, false
    from grouped g where g.activity_class = 'INVESTING'
    union all
    select 290, 'CF.INV.SUBTOTAL', 'Net cash from investing activities', 'SUBTOTAL', 0, (select investing_total from class_totals), true, true, false

    union all
    select 300, 'CF.FIN.HEADER', 'Financing Activities', 'HEADER', 0, null, true, false, false
    union all
    select 310 + row_number() over (order by g.account_code, g.account_name), 'CF.FIN.' || coalesce(g.account_code, row_number() over ()::text), g.account_name, 'LINE', 1, g.amount, false, false, false
    from grouped g where g.activity_class = 'FINANCING'
    union all
    select 390, 'CF.FIN.SUBTOTAL', 'Net cash from financing activities', 'SUBTOTAL', 0, (select financing_total from class_totals), true, true, false
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'line_code', sr.line_code,
          'label', sr.label,
          'line_type', sr.line_type,
          'display_order', sr.display_order,
          'indent_level', sr.indent_level,
          'current_amount', case when sr.current_amount is null then null else round(sr.current_amount, 2) end,
          'comparison_amount', null,
          'is_bold', sr.is_bold,
          'is_underlined', sr.is_underlined,
          'is_double_underlined', sr.is_double_underlined
        )
        order by sr.display_order
      ),
      '[]'::jsonb
    ),
    (select operating_total from class_totals),
    (select investing_total from class_totals),
    (select financing_total from class_totals),
    coalesce((select round(sum(bo.asof_balance), 2) from balances_open bo join cash_accounts ca on ca.account_id = bo.account_id), 0),
    coalesce((select round(sum(bc.asof_balance), 2) from balances_close bc join cash_accounts ca on ca.account_id = bc.account_id), 0),
    coalesce((
      select count(*)::int
      from mapped_accounts ma
      where ma.activity_class not in ('OPERATING', 'INVESTING', 'FINANCING')
    ), 0)
  into v_rows, v_operating, v_investing, v_financing, v_opening_cash, v_closing_cash, v_missing_mapped_accounts;

  v_expected_closing := round(v_opening_cash + v_operating + v_investing + v_financing, 2);
  v_recon_delta := round(v_closing_cash - v_expected_closing, 2);

  select coalesce(round(sum((item ->> 'amount')::numeric), 2), 0)
    into v_bs_cash
  from jsonb_array_elements(
    coalesce(
      public.rpt_ifrs_balance_sheet(p_tenant_id, jsonb_build_object('as_of_date', v_end_date)) -> 'rows',
      '[]'::jsonb
    )
  ) as item
  where upper(coalesce(item ->> 'statement_class', '')) = 'ASSET'
    and lower(coalesce(item ->> 'account_name', '') || ' ' || coalesce(item ->> 'account_code', '')) ~ '(cash|bank)';

  v_bs_delta := round(v_closing_cash - v_bs_cash, 2);

  return jsonb_build_object(
    'rows', v_rows,
    'validation', jsonb_build_object(
      'valid', abs(v_recon_delta) <= 1 and abs(v_bs_delta) <= 1,
      'errors',
        case
          when abs(v_recon_delta) > 1 then jsonb_build_array(jsonb_build_object('code', 'CASH_RECON_MISMATCH', 'message', 'Opening cash + net movement does not reconcile to closing cash.'))
          else '[]'::jsonb
        end,
      'warnings',
        (case
          when abs(v_bs_delta) > 1 then jsonb_build_array(jsonb_build_object('code', 'BALANCE_SHEET_CASH_MISMATCH', 'message', 'Closing cash does not match balance sheet cash assets.'))
          else '[]'::jsonb
        end) ||
        (case
          when v_missing_mapped_accounts > 0 then jsonb_build_array(jsonb_build_object('code', 'UNCLASSIFIED_ACTIVITY_RULES', 'message', 'Some accounts use default cash-flow activity classification.'))
          else '[]'::jsonb
        end)
    ),
    'summary', jsonb_build_object(
      'report', 'cash_flow_direct_configurable',
      'method', 'Direct',
      'tenant_id', p_tenant_id,
      'start_date', v_start_date,
      'end_date', v_end_date,
      'operating_activities', v_operating,
      'investing_activities', v_investing,
      'financing_activities', v_financing,
      'net_change_in_cash', round(v_operating + v_investing + v_financing, 2),
      'opening_cash', v_opening_cash,
      'closing_cash', v_closing_cash,
      'expected_closing_cash', v_expected_closing,
      'reconciliation_delta', v_recon_delta,
      'balance_sheet_cash', v_bs_cash,
      'balance_sheet_delta', v_bs_delta,
      'currency', coalesce(nullif(trim(p_filters ->> 'currency'), ''), 'BDT'),
      'generated_at', now()
    )
  );
end;
$$;

create or replace function public.rpt_cash_flow_indirect_configurable(
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
  v_net_profit numeric(20,2) := 0;
  v_depreciation numeric(20,2) := 0;
  v_opening_wc numeric(20,2) := 0;
  v_closing_wc numeric(20,2) := 0;
  v_working_capital_adj numeric(20,2) := 0;
  v_investing numeric(20,2) := 0;
  v_financing numeric(20,2) := 0;
  v_operating numeric(20,2) := 0;
  v_opening_cash numeric(20,2) := 0;
  v_closing_cash numeric(20,2) := 0;
  v_expected_closing numeric(20,2) := 0;
  v_recon_delta numeric(20,2) := 0;
  v_bs_cash numeric(20,2) := 0;
  v_bs_delta numeric(20,2) := 0;
  v_direct_payload jsonb;
  v_rows jsonb;
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for configurable cash flow indirect method' using errcode = 'P0001';
  end if;

  begin
    v_start_date := nullif(trim(p_filters ->> 'start_date'), '')::date;
  exception when others then
    v_start_date := null;
  end;

  begin
    v_end_date := nullif(trim(coalesce(p_filters ->> 'end_date', p_filters ->> 'as_of_date')), '')::date;
  exception when others then
    v_end_date := null;
  end;

  v_end_date := coalesce(v_end_date, current_date);
  v_start_date := coalesce(v_start_date, date_trunc('month', v_end_date)::date);

  v_direct_payload := public.rpt_cash_flow_direct_configurable(
    p_tenant_id,
    coalesce(p_filters, '{}'::jsonb) || jsonb_build_object('start_date', v_start_date, 'end_date', v_end_date)
  );

  v_investing := coalesce((v_direct_payload -> 'summary' ->> 'investing_activities')::numeric, 0);
  v_financing := coalesce((v_direct_payload -> 'summary' ->> 'financing_activities')::numeric, 0);
  v_opening_cash := coalesce((v_direct_payload -> 'summary' ->> 'opening_cash')::numeric, 0);
  v_closing_cash := coalesce((v_direct_payload -> 'summary' ->> 'closing_cash')::numeric, 0);
  v_bs_cash := coalesce((v_direct_payload -> 'summary' ->> 'balance_sheet_cash')::numeric, 0);

  v_net_profit := coalesce((public.rpt_ifrs_profit_or_loss(p_tenant_id, jsonb_build_object('start_date', v_start_date, 'end_date', v_end_date)) -> 'summary' ->> 'net_profit')::numeric, 0);
  v_depreciation := coalesce((public.rpt_ifrs_profit_or_loss(p_tenant_id, jsonb_build_object('start_date', v_start_date, 'end_date', v_end_date)) -> 'summary' ->> 'depreciation_and_amortisation')::numeric, 0);
  v_opening_wc := coalesce((public.rpt_ifrs_balance_sheet(p_tenant_id, jsonb_build_object('as_of_date', v_start_date - 1)) -> 'summary' ->> 'working_capital')::numeric, 0);
  v_closing_wc := coalesce((public.rpt_ifrs_balance_sheet(p_tenant_id, jsonb_build_object('as_of_date', v_end_date)) -> 'summary' ->> 'working_capital')::numeric, 0);

  v_working_capital_adj := round(v_opening_wc - v_closing_wc, 2);
  v_operating := round(v_net_profit + v_depreciation + v_working_capital_adj, 2);
  v_expected_closing := round(v_opening_cash + v_operating + v_investing + v_financing, 2);
  v_recon_delta := round(v_closing_cash - v_expected_closing, 2);
  v_bs_delta := round(v_closing_cash - v_bs_cash, 2);

  v_rows := jsonb_build_array(
    jsonb_build_object('line_code', 'CFI.OP.HEADER', 'label', 'Operating Activities (Indirect)', 'line_type', 'HEADER', 'display_order', 100, 'indent_level', 0, 'current_amount', null, 'comparison_amount', null, 'is_bold', true, 'is_underlined', false, 'is_double_underlined', false),
    jsonb_build_object('line_code', 'CFI.OP.NET_PROFIT', 'label', 'Profit for the period', 'line_type', 'LINE', 'display_order', 110, 'indent_level', 1, 'current_amount', v_net_profit, 'comparison_amount', null, 'is_bold', false, 'is_underlined', false, 'is_double_underlined', false),
    jsonb_build_object('line_code', 'CFI.OP.DEP', 'label', 'Depreciation and amortisation (non-cash)', 'line_type', 'LINE', 'display_order', 120, 'indent_level', 1, 'current_amount', v_depreciation, 'comparison_amount', null, 'is_bold', false, 'is_underlined', false, 'is_double_underlined', false),
    jsonb_build_object('line_code', 'CFI.OP.WC', 'label', 'Working capital movement', 'line_type', 'LINE', 'display_order', 130, 'indent_level', 1, 'current_amount', v_working_capital_adj, 'comparison_amount', null, 'is_bold', false, 'is_underlined', false, 'is_double_underlined', false),
    jsonb_build_object('line_code', 'CFI.OP.SUBTOTAL', 'label', 'Net cash from operating activities', 'line_type', 'SUBTOTAL', 'display_order', 190, 'indent_level', 0, 'current_amount', v_operating, 'comparison_amount', null, 'is_bold', true, 'is_underlined', true, 'is_double_underlined', false),

    jsonb_build_object('line_code', 'CFI.INV.HEADER', 'label', 'Investing Activities', 'line_type', 'HEADER', 'display_order', 200, 'indent_level', 0, 'current_amount', null, 'comparison_amount', null, 'is_bold', true, 'is_underlined', false, 'is_double_underlined', false),
    jsonb_build_object('line_code', 'CFI.INV.SUBTOTAL', 'label', 'Net cash from investing activities', 'line_type', 'SUBTOTAL', 'display_order', 290, 'indent_level', 0, 'current_amount', v_investing, 'comparison_amount', null, 'is_bold', true, 'is_underlined', true, 'is_double_underlined', false),

    jsonb_build_object('line_code', 'CFI.FIN.HEADER', 'label', 'Financing Activities', 'line_type', 'HEADER', 'display_order', 300, 'indent_level', 0, 'current_amount', null, 'comparison_amount', null, 'is_bold', true, 'is_underlined', false, 'is_double_underlined', false),
    jsonb_build_object('line_code', 'CFI.FIN.SUBTOTAL', 'label', 'Net cash from financing activities', 'line_type', 'SUBTOTAL', 'display_order', 390, 'indent_level', 0, 'current_amount', v_financing, 'comparison_amount', null, 'is_bold', true, 'is_underlined', true, 'is_double_underlined', false),

    jsonb_build_object('line_code', 'CFI.NET', 'label', 'Net change in cash and cash equivalents', 'line_type', 'GRAND_TOTAL', 'display_order', 450, 'indent_level', 0, 'current_amount', round(v_operating + v_investing + v_financing, 2), 'comparison_amount', null, 'is_bold', true, 'is_underlined', false, 'is_double_underlined', true),
    jsonb_build_object('line_code', 'CFI.OPENING', 'label', 'Opening cash and cash equivalents', 'line_type', 'LINE', 'display_order', 460, 'indent_level', 0, 'current_amount', v_opening_cash, 'comparison_amount', null, 'is_bold', false, 'is_underlined', false, 'is_double_underlined', false),
    jsonb_build_object('line_code', 'CFI.CLOSING', 'label', 'Closing cash and cash equivalents', 'line_type', 'LINE', 'display_order', 470, 'indent_level', 0, 'current_amount', v_closing_cash, 'comparison_amount', null, 'is_bold', true, 'is_underlined', false, 'is_double_underlined', false)
  );

  return jsonb_build_object(
    'rows', v_rows,
    'validation', jsonb_build_object(
      'valid', abs(v_recon_delta) <= 1 and abs(v_bs_delta) <= 1,
      'errors',
        case
          when abs(v_recon_delta) > 1 then jsonb_build_array(jsonb_build_object('code', 'CASH_RECON_MISMATCH', 'message', 'Opening cash + net movement does not reconcile to closing cash.'))
          else '[]'::jsonb
        end,
      'warnings',
        case
          when abs(v_bs_delta) > 1 then jsonb_build_array(jsonb_build_object('code', 'BALANCE_SHEET_CASH_MISMATCH', 'message', 'Closing cash does not match balance sheet cash assets.'))
          else '[]'::jsonb
        end
    ),
    'summary', jsonb_build_object(
      'report', 'cash_flow_indirect_configurable',
      'method', 'Indirect',
      'tenant_id', p_tenant_id,
      'start_date', v_start_date,
      'end_date', v_end_date,
      'net_profit', v_net_profit,
      'depreciation_and_amortisation', v_depreciation,
      'opening_working_capital', v_opening_wc,
      'closing_working_capital', v_closing_wc,
      'working_capital_adjustment', v_working_capital_adj,
      'operating_activities', v_operating,
      'investing_activities', v_investing,
      'financing_activities', v_financing,
      'net_change_in_cash', round(v_operating + v_investing + v_financing, 2),
      'opening_cash', v_opening_cash,
      'closing_cash', v_closing_cash,
      'expected_closing_cash', v_expected_closing,
      'reconciliation_delta', v_recon_delta,
      'balance_sheet_cash', v_bs_cash,
      'balance_sheet_delta', v_bs_delta,
      'currency', coalesce(nullif(trim(p_filters ->> 'currency'), ''), 'BDT'),
      'generated_at', now()
    )
  );
end;
$$;

create or replace function public.rpt_cash_flow_statement(
  p_tenant_id uuid,
  p_filters jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_method text;
  v_payload jsonb;
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for cash flow statement' using errcode = 'P0001';
  end if;

  v_method := lower(coalesce(nullif(trim(p_filters ->> 'method'), ''), 'direct'));

  if v_method = 'indirect' then
    v_payload := public.rpt_cash_flow_indirect_configurable(p_tenant_id, p_filters);
  else
    v_payload := public.rpt_cash_flow_direct_configurable(p_tenant_id, p_filters);
  end if;

  return jsonb_set(
    jsonb_set(v_payload, '{summary,method}', to_jsonb(initcap(v_method))),
    '{summary,report}',
    to_jsonb('cash_flow_statement')
  );
end;
$$;

create or replace function public.aeds_cash_flow_validate(
  p_tenant_id uuid,
  p_filters jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payload jsonb;
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for cash flow validation' using errcode = 'P0001';
  end if;

  v_payload := public.rpt_cash_flow_statement(p_tenant_id, p_filters);

  return coalesce(
    v_payload -> 'validation',
    v_payload -> 'summary' -> 'validation',
    jsonb_build_object('valid', true, 'errors', '[]'::jsonb, 'warnings', '[]'::jsonb)
  );
end;
$$;

create or replace function public.aeds_cash_flow_mapping_list(
  p_tenant_id uuid default null
)
returns table (
  account_id uuid,
  account_code text,
  account_name text,
  account_type text,
  activity_class text,
  is_cash_and_equivalent boolean,
  include_non_cash boolean,
  is_active boolean,
  approved_by uuid,
  approved_note text,
  approved_at timestamptz,
  updated_at timestamptz
)
language sql
security definer
set search_path = public, pg_temp
as $$
  with tenant_ctx as (
    select coalesce(p_tenant_id, public.current_tenant_id()) as tenant_id
  )
  select
    coa.id as account_id,
    coa.code as account_code,
    coa.name as account_name,
    coa.type as account_type,
    coalesce(m.activity_class, r.activity_class) as activity_class,
    coalesce(m.is_cash_and_equivalent, r.is_cash_and_equivalent) as is_cash_and_equivalent,
    coalesce(m.include_non_cash, r.include_non_cash) as include_non_cash,
    coalesce(m.is_active, true) as is_active,
    m.approved_by,
    m.approved_note,
    m.approved_at,
    m.updated_at
  from public.chart_of_accounts coa
  join tenant_ctx t on t.tenant_id = coa.tenant_id
  left join public.cash_flow_account_mappings m
    on m.tenant_id = coa.tenant_id
   and m.account_id = coa.id
  cross join lateral public.aeds_resolve_cash_flow_mapping(
    coa.tenant_id,
    coa.id,
    coa.name,
    coa.code,
    coa.type,
    null,
    null
  ) r
  where coalesce(coa.is_active, true)
  order by coalesce(m.is_cash_and_equivalent, r.is_cash_and_equivalent) desc, coa.code, coa.name;
$$;

create or replace function public.aeds_cash_flow_mapping_upsert(
  p_account_id uuid,
  p_activity_class text,
  p_is_cash_and_equivalent boolean default false,
  p_include_non_cash boolean default false,
  p_is_active boolean default true,
  p_approved_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_tenant_id uuid;
  v_mapping_id uuid;
begin
  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'Tenant context missing for cash flow mapping upsert' using errcode = 'P0001';
  end if;

  if upper(coalesce(trim(p_activity_class), '')) not in ('OPERATING', 'INVESTING', 'FINANCING') then
    raise exception 'Invalid activity class. Allowed values: OPERATING, INVESTING, FINANCING.' using errcode = '22023';
  end if;

  insert into public.cash_flow_account_mappings (
    tenant_id,
    account_id,
    activity_class,
    is_cash_and_equivalent,
    include_non_cash,
    is_active,
    approved_by,
    approved_note,
    approved_at,
    updated_at
  )
  values (
    v_tenant_id,
    p_account_id,
    upper(trim(p_activity_class)),
    coalesce(p_is_cash_and_equivalent, false),
    coalesce(p_include_non_cash, false),
    coalesce(p_is_active, true),
    auth.uid(),
    p_approved_note,
    now(),
    now()
  )
  on conflict (tenant_id, account_id) do update
    set activity_class = excluded.activity_class,
        is_cash_and_equivalent = excluded.is_cash_and_equivalent,
        include_non_cash = excluded.include_non_cash,
        is_active = excluded.is_active,
        approved_by = excluded.approved_by,
        approved_note = excluded.approved_note,
        approved_at = excluded.approved_at,
        updated_at = excluded.updated_at
  returning id into v_mapping_id;

  return v_mapping_id;
end;
$$;

do $$
declare
  v_department_id uuid;
  v_report_id uuid;
begin
  select id into v_department_id
  from public.report_departments
  where slug = 'accounts' or code = 'ACCOUNTS'
  order by case when slug = 'accounts' then 0 else 1 end
  limit 1;

  if v_department_id is null then
    return;
  end if;

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
  values (
    'RPT-007',
    v_department_id,
    'Cash Flow Statement',
    'cash-flow-statement',
    'Tenant-configurable cash flow statement with direct and indirect methods.',
    'reporting',
    'Monthly',
    array['journal_entries', 'journal_lines', 'chart_of_accounts', 'cash_flow_account_mappings'],
    '/reports/accounts/cash-flow-statement',
    24,
    2,
    true,
    false,
    false,
    true,
    true,
    true,
    false,
    true,
    'rpt_cash_flow_statement'
  )
  on conflict (department_id, slug) do update
    set report_code = excluded.report_code,
        title = excluded.title,
        description = excluded.description,
        route = excluded.route,
        supports_print = true,
        supports_export_pdf = true,
        supports_export_excel = true,
        is_active = true,
        source_function = 'rpt_cash_flow_statement';

  update public.report_catalog
     set source_function = 'rpt_cash_flow_statement',
         supports_print = true,
         supports_export_pdf = true,
         supports_export_excel = true,
         is_active = true
   where department_id = v_department_id
     and slug in ('statement-of-cash-flows-direct', 'statement-of-cash-flows-indirect');

  select id into v_report_id
  from public.report_catalog
  where department_id = v_department_id
    and slug = 'cash-flow-statement'
  limit 1;

  if v_report_id is null then
    return;
  end if;

  delete from public.report_fields where report_id = v_report_id;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'report_fields'
      and column_name = 'field_label'
  ) then
    insert into public.report_fields (
      report_id,
      field_key,
      field_label,
      label,
      data_type,
      source_column,
      display_format,
      aggregation,
      alignment,
      sortable,
      filterable,
      required,
      display_order,
      is_visible
    ) values
      (v_report_id, 'line_code', 'Line Code', 'Line Code', 'Text', 'line_code', null, null, 'left', false, false, false, 1, false),
      (v_report_id, 'label', 'Particulars', 'Particulars', 'Text', 'label', null, null, 'left', true, false, true, 2, true),
      (v_report_id, 'line_type', 'Line Type', 'Line Type', 'Text', 'line_type', null, null, 'left', false, false, false, 3, false),
      (v_report_id, 'indent_level', 'Indent', 'Indent', 'Number', 'indent_level', null, null, 'left', false, false, false, 4, false),
      (v_report_id, 'current_amount', 'Amount', 'Amount', 'Currency-BDT', 'current_amount', 'Currency-BDT', 'SUM', 'right', true, false, false, 5, true),
      (v_report_id, 'comparison_amount', 'Comparative Amount', 'Comparative Amount', 'Currency-BDT', 'comparison_amount', 'Currency-BDT', 'SUM', 'right', false, false, false, 6, false);
  else
    insert into public.report_fields (
      report_id,
      field_key,
      label,
      data_type,
      source_column,
      display_format,
      aggregation,
      alignment,
      sortable,
      filterable,
      required,
      display_order,
      is_visible
    ) values
      (v_report_id, 'line_code', 'Line Code', 'Text', 'line_code', null, null, 'left', false, false, false, 1, false),
      (v_report_id, 'label', 'Particulars', 'Text', 'label', null, null, 'left', true, false, true, 2, true),
      (v_report_id, 'line_type', 'Line Type', 'Text', 'line_type', null, null, 'left', false, false, false, 3, false),
      (v_report_id, 'indent_level', 'Indent', 'Number', 'indent_level', null, null, 'left', false, false, false, 4, false),
      (v_report_id, 'current_amount', 'Amount', 'Currency-BDT', 'current_amount', 'Currency-BDT', 'SUM', 'right', true, false, false, 5, true),
      (v_report_id, 'comparison_amount', 'Comparative Amount', 'Currency-BDT', 'comparison_amount', 'Currency-BDT', 'SUM', 'right', false, false, false, 6, false);
  end if;

  delete from public.report_filters where report_id = v_report_id;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'report_filters'
      and column_name = 'filter_label'
  ) then
    insert into public.report_filters (
      report_id,
      filter_key,
      filter_label,
      label,
      filter_type,
      source_options,
      default_value,
      required,
      display_order,
      is_global
    ) values
      (v_report_id, 'cycle', 'Cycle', 'Cycle', 'cycle', 'Daily,Weekly,Monthly,Quarterly,Half-Yearly,Yearly,Custom Date Range', 'Monthly', false, 1, false),
      (v_report_id, 'start_date', 'Start Date', 'Start Date', 'Date Picker', null, null, false, 2, false),
      (v_report_id, 'end_date', 'End Date', 'End Date', 'Date Picker', null, null, false, 3, false),
      (v_report_id, 'method', 'Method', 'Method', 'Dropdown', 'Direct,Indirect', 'Direct', false, 4, false),
      (v_report_id, 'currency', 'Currency', 'Currency', 'Dropdown', 'BDT,USD,EUR', 'BDT', false, 5, false);
  else
    insert into public.report_filters (
      report_id,
      filter_key,
      label,
      filter_type,
      source_options,
      default_value,
      required,
      display_order,
      is_global
    ) values
      (v_report_id, 'cycle', 'Cycle', 'cycle', 'Daily,Weekly,Monthly,Quarterly,Half-Yearly,Yearly,Custom Date Range', 'Monthly', false, 1, false),
      (v_report_id, 'start_date', 'Start Date', 'Date Picker', null, null, false, 2, false),
      (v_report_id, 'end_date', 'End Date', 'Date Picker', null, null, false, 3, false),
      (v_report_id, 'method', 'Method', 'Dropdown', 'Direct,Indirect', 'Direct', false, 4, false),
      (v_report_id, 'currency', 'Currency', 'Dropdown', 'BDT,USD,EUR', 'BDT', false, 5, false);
  end if;

  delete from public.report_actions where report_id = v_report_id;

  insert into public.report_actions (report_id, action_key, label, display_order, is_enabled)
  values
    (v_report_id, 'print', 'Print', 1, true),
    (v_report_id, 'export_pdf', 'Export PDF', 2, true),
    (v_report_id, 'export_excel', 'Export Excel', 3, true);
end
$$;

grant select, insert, update, delete on table public.cash_flow_account_mappings to authenticated;
grant select, insert, update, delete on table public.cash_flow_non_cash_rules to authenticated;

grant execute on function public.aeds_resolve_cash_flow_mapping(uuid,uuid,text,text,text,text,text) to authenticated;
grant execute on function public.rpt_cash_flow_direct_configurable(uuid,jsonb) to authenticated;
grant execute on function public.rpt_cash_flow_indirect_configurable(uuid,jsonb) to authenticated;
grant execute on function public.rpt_cash_flow_statement(uuid,jsonb) to authenticated;
grant execute on function public.aeds_cash_flow_validate(uuid,jsonb) to authenticated;
grant execute on function public.aeds_cash_flow_mapping_list(uuid) to authenticated;
grant execute on function public.aeds_cash_flow_mapping_upsert(uuid,text,boolean,boolean,boolean,text) to authenticated;

commit;
