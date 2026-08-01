begin;

create table if not exists public.financial_statement_account_mappings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  statement_code text not null default 'BALANCE_SHEET' check (statement_code in ('BALANCE_SHEET')),
  account_id uuid not null references public.chart_of_accounts(id) on delete cascade,
  line_code text not null check (
    line_code in (
      'BS.CA.CASH',
      'BS.CA.BANK',
      'BS.CA.RECEIVABLE',
      'BS.CA.INVENTORY',
      'BS.CA.PREPAID',
      'BS.CA.SHORT_TERM_INVESTMENTS',
      'BS.CA.OTHER_CURRENT_ASSETS',
      'BS.NCA.PPE',
      'BS.NCA.ACCUMULATED_DEPRECIATION',
      'BS.NCA.INTANGIBLE_ASSETS',
      'BS.NCA.INVESTMENT_PROPERTY',
      'BS.NCA.LONG_TERM_INVESTMENTS',
      'BS.NCA.DEFERRED_TAX_ASSETS',
      'BS.NCA.OTHER_NON_CURRENT_ASSETS',
      'BS.EQ.SHARE_CAPITAL',
      'BS.EQ.ADDITIONAL_PAID_IN_CAPITAL',
      'BS.EQ.RETAINED_EARNINGS',
      'BS.EQ.CURRENT_YEAR_PROFIT',
      'BS.EQ.RESERVES',
      'BS.EQ.OTHER_EQUITY',
      'BS.CL.ACCOUNTS_PAYABLE',
      'BS.CL.ACCRUED_EXPENSES',
      'BS.CL.VAT_PAYABLE',
      'BS.CL.PAYROLL_PAYABLE',
      'BS.CL.SHORT_TERM_LOANS',
      'BS.CL.CURRENT_TAX',
      'BS.CL.OTHER_CURRENT_LIABILITIES',
      'BS.NCL.LONG_TERM_LOANS',
      'BS.NCL.DEFERRED_TAX',
      'BS.NCL.LEASE_LIABILITIES',
      'BS.NCL.OTHER_NON_CURRENT_LIABILITIES'
    )
  ),
  line_label text not null,
  liquidity_class text not null check (liquidity_class in ('CURRENT', 'NON_CURRENT', 'NOT_APPLICABLE')),
  major_section text not null check (major_section in ('ASSETS', 'EQUITY', 'LIABILITIES')),
  note_number text,
  note_reference text,
  note_hyperlink text,
  presentation_order integer not null,
  is_contra boolean not null default false,
  is_active boolean not null default true,
  approval_status text not null default 'DRAFT' check (approval_status in ('DRAFT', 'APPROVED', 'REJECTED')),
  approved_by uuid,
  approved_at timestamptz,
  approval_note text,
  valid_from date not null default current_date,
  valid_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, statement_code, account_id, valid_from)
);

alter table public.financial_statement_account_mappings
  add column if not exists statement_code text;

update public.financial_statement_account_mappings
set statement_code = coalesce(nullif(trim(statement_code), ''), 'BALANCE_SHEET')
where statement_code is null or trim(statement_code) = '';

alter table public.financial_statement_account_mappings
  alter column statement_code set default 'BALANCE_SHEET';

alter table public.financial_statement_account_mappings
  alter column statement_code set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.financial_statement_account_mappings'::regclass
      and conname = 'financial_statement_account_mappings_statement_code_check'
  ) then
    alter table public.financial_statement_account_mappings
      add constraint financial_statement_account_mappings_statement_code_check
      check (statement_code in ('BALANCE_SHEET'));
  end if;
end
$$;

create unique index if not exists idx_fin_stmt_account_mappings_unique
  on public.financial_statement_account_mappings (tenant_id, statement_code, account_id, valid_from);

create index if not exists idx_fin_stmt_account_mappings_lookup
  on public.financial_statement_account_mappings (
    tenant_id,
    statement_code,
    approval_status,
    is_active,
    valid_from desc,
    valid_to
  );

alter table public.financial_statement_account_mappings enable row level security;

drop policy if exists financial_statement_account_mappings_tenant_read on public.financial_statement_account_mappings;
create policy financial_statement_account_mappings_tenant_read
  on public.financial_statement_account_mappings
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists financial_statement_account_mappings_tenant_write on public.financial_statement_account_mappings;
create policy financial_statement_account_mappings_tenant_write
  on public.financial_statement_account_mappings
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

grant select, insert, update, delete on public.financial_statement_account_mappings to authenticated;

create or replace function public.aeds_report_definition(
  p_department_slug text,
  p_report_slug text,
  p_role text default 'FRONT_OFFICE'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_report_id uuid;
  v_lookup_slug text := case
    when lower(coalesce(trim(p_report_slug), '')) = 'balance-sheet' then 'statement-of-financial-position'
    else p_report_slug
  end;
begin
  select r.id into v_report_id
  from public.report_catalog r
  join public.report_departments d on d.id = r.department_id
  left join public.report_role_access a on a.report_id = r.id and a.role = p_role
  where d.slug = p_department_slug
    and r.slug = v_lookup_slug
    and r.is_active = true
    and coalesce(a.can_view, p_role in ('SUPERUSER','ADMIN')) = true
  limit 1;

  if v_report_id is null then
    return null;
  end if;

  return (
    select jsonb_build_object(
      'department', jsonb_build_object('code', d.code, 'name', d.name, 'slug', d.slug, 'icon', d.icon),
      'report', jsonb_build_object(
        'id', r.id,
        'reportCode', r.report_code,
        'title', r.title,
        'slug', r.slug,
        'route', r.route,
        'description', r.description,
        'supportsPrint', r.supports_print,
        'supportsExportPdf', r.supports_export_pdf,
        'supportsExportExcel', r.supports_export_excel
      ),
      'fields', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'fieldKey', field_key,
              'label', label,
              'dataType', data_type,
              'displayFormat', display_format,
              'aggregation', aggregation,
              'alignment', alignment,
              'sortable', sortable,
              'filterable', filterable
            )
            order by display_order
          ),
          '[]'::jsonb
        )
        from public.report_fields
        where report_id = r.id
          and is_visible = true
      ),
      'filters', (
        select coalesce(
          jsonb_agg(
            jsonb_build_object(
              'filterKey', filter_key,
              'label', label,
              'filterType', filter_type,
              'sourceOptions', source_options,
              'defaultValue', default_value,
              'required', required,
              'isGlobal', is_global
            )
            order by display_order
          ),
          '[]'::jsonb
        )
        from public.report_filters
        where report_id = r.id
           or is_global = true
      ),
      'actions', (
        select coalesce(
          jsonb_agg(jsonb_build_object('actionKey', action_key, 'label', label) order by display_order),
          '[]'::jsonb
        )
        from public.report_actions
        where report_id = r.id
          and is_enabled = true
      )
    )
    from public.report_catalog r
    join public.report_departments d on d.id = r.department_id
    where r.id = v_report_id
  );
end;
$$;

create or replace function public.aeds_run_report(
  p_department_slug text,
  p_report_slug text,
  p_filters jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_source_function text;
  v_tenant_id uuid;
  v_payload jsonb;
  v_regprocedure regprocedure;
  v_report_id uuid;
  v_cache_minutes int := 0;
  v_filters_hash text;
  v_cached_response jsonb;
  v_lookup_slug text := case
    when lower(coalesce(trim(p_report_slug), '')) = 'balance-sheet' then 'statement-of-financial-position'
    else p_report_slug
  end;
begin
  if coalesce(trim(p_department_slug), '') = '' then
    raise exception 'department slug is required' using errcode = '22023';
  end if;

  if coalesce(trim(v_lookup_slug), '') = '' then
    raise exception 'report slug is required' using errcode = '22023';
  end if;

  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'Tenant context missing for report execution' using errcode = 'P0001';
  end if;

  select r.source_function, r.id, coalesce(r.cache_minutes, 0)
    into v_source_function, v_report_id, v_cache_minutes
  from public.report_catalog r
  join public.report_departments d on d.id = r.department_id
  where d.slug = p_department_slug
    and r.slug = v_lookup_slug
    and d.is_active = true
    and r.is_active = true
  limit 1;

  if v_source_function is null then
    raise exception 'No source function mapped for report %.%', p_department_slug, v_lookup_slug
      using errcode = 'P0001';
  end if;

  if v_source_function !~ '^rpt_[a-z_]+$' then
    raise exception 'Invalid report source function: %', v_source_function
      using errcode = '22023';
  end if;

  v_regprocedure := to_regprocedure(format('public.%I(uuid,jsonb)', v_source_function));
  if v_regprocedure is null then
    raise exception 'Mapped report function % does not exist with signature (uuid,jsonb)', v_source_function
      using errcode = '42883';
  end if;

  v_filters_hash := md5(coalesce(p_filters, '{}'::jsonb)::text);

  if v_cache_minutes > 0 then
    select rc.response
      into v_cached_response
    from public.report_result_cache rc
    where rc.tenant_id = v_tenant_id
      and rc.report_id = v_report_id
      and rc.filters_hash = v_filters_hash
      and rc.expires_at > now()
    order by rc.expires_at desc
    limit 1;

    if v_cached_response is not null then
      return v_cached_response;
    end if;
  end if;

  execute format('select public.%I($1, $2)', v_source_function)
    into v_payload
    using v_tenant_id, coalesce(p_filters, '{}'::jsonb);

  v_cached_response := jsonb_build_object(
    'rows', coalesce(v_payload -> 'rows', '[]'::jsonb),
    'summary', coalesce(v_payload -> 'summary', '{}'::jsonb) || jsonb_build_object(
      'department_slug', p_department_slug,
      'report_slug', v_lookup_slug,
      'source_function', v_source_function,
      'tenant_id', v_tenant_id
    ),
    'validation', coalesce(v_payload -> 'validation', null)
  );

  if v_cache_minutes > 0 then
    insert into public.report_result_cache (
      tenant_id,
      report_id,
      filters_hash,
      response,
      expires_at,
      created_at,
      updated_at
    ) values (
      v_tenant_id,
      v_report_id,
      v_filters_hash,
      v_cached_response,
      now() + make_interval(mins => v_cache_minutes),
      now(),
      now()
    )
    on conflict (tenant_id, report_id, filters_hash) do update set
      response = excluded.response,
      expires_at = excluded.expires_at,
      updated_at = excluded.updated_at;
  end if;

  return v_cached_response;
end;
$$;

create or replace function public.rpt_ifrs_balance_sheet(
  p_tenant_id uuid,
  p_filters jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_as_of_date date;
  v_start_date date;
  v_opening_as_of_date date;
  v_comparison_as_of_date date;
  v_rows jsonb;
  v_assets numeric(20,2) := 0;
  v_liabilities numeric(20,2) := 0;
  v_equity numeric(20,2) := 0;
  v_equity_liabilities numeric(20,2) := 0;
  v_balance_delta numeric(20,2) := 0;
  v_current_assets numeric(20,2) := 0;
  v_current_liabilities numeric(20,2) := 0;
  v_unmapped_accounts integer := 0;
  v_unapproved_mappings integer := 0;
  v_errors jsonb := '[]'::jsonb;
  v_warnings jsonb := '[]'::jsonb;
  v_validation jsonb;
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for balance sheet' using errcode = 'P0001';
  end if;

  begin
    v_as_of_date := nullif(trim(coalesce(p_filters ->> 'as_of_date', p_filters ->> 'end_date')), '')::date;
  exception when others then
    v_as_of_date := null;
  end;

  begin
    v_start_date := nullif(trim(p_filters ->> 'start_date'), '')::date;
  exception when others then
    v_start_date := null;
  end;

  begin
    v_comparison_as_of_date := nullif(trim(coalesce(p_filters ->> 'comparison_as_of_date', p_filters ->> 'prior_year_as_of_date')), '')::date;
  exception when others then
    v_comparison_as_of_date := null;
  end;

  v_as_of_date := coalesce(v_as_of_date, current_date);
  v_start_date := coalesce(v_start_date, date_trunc('year', v_as_of_date)::date);
  v_opening_as_of_date := v_start_date - 1;
  v_comparison_as_of_date := coalesce(v_comparison_as_of_date, (v_as_of_date - interval '1 year')::date);

  with line_catalog as (
    select *
    from (values
      ('BS.ASSETS', 'Assets', 'HEADER', 10, 0),
      ('BS.CA', 'Current Assets', 'HEADER', 20, 1),
      ('BS.CA.CASH', 'Cash', 'DETAIL', 30, 2),
      ('BS.CA.BANK', 'Bank', 'DETAIL', 40, 2),
      ('BS.CA.RECEIVABLE', 'Receivable', 'DETAIL', 50, 2),
      ('BS.CA.INVENTORY', 'Inventory', 'DETAIL', 60, 2),
      ('BS.CA.PREPAID', 'Prepaid', 'DETAIL', 70, 2),
      ('BS.CA.SHORT_TERM_INVESTMENTS', 'Short-term Investments', 'DETAIL', 80, 2),
      ('BS.CA.OTHER_CURRENT_ASSETS', 'Other Current Assets', 'DETAIL', 90, 2),
      ('BS.CA.TOTAL', 'Total Current Assets', 'SUBTOTAL', 100, 1),
      ('BS.NCA', 'Non-current Assets', 'HEADER', 110, 1),
      ('BS.NCA.PPE', 'Property Plant Equipment', 'DETAIL', 120, 2),
      ('BS.NCA.ACCUMULATED_DEPRECIATION', 'Accumulated Depreciation', 'DETAIL', 130, 2),
      ('BS.NCA.INTANGIBLE_ASSETS', 'Intangible Assets', 'DETAIL', 140, 2),
      ('BS.NCA.INVESTMENT_PROPERTY', 'Investment Property', 'DETAIL', 150, 2),
      ('BS.NCA.LONG_TERM_INVESTMENTS', 'Long-term Investments', 'DETAIL', 160, 2),
      ('BS.NCA.DEFERRED_TAX_ASSETS', 'Deferred Tax Assets', 'DETAIL', 170, 2),
      ('BS.NCA.OTHER_NON_CURRENT_ASSETS', 'Other Non-current Assets', 'DETAIL', 180, 2),
      ('BS.NCA.TOTAL', 'Total Non-current Assets', 'SUBTOTAL', 190, 1),
      ('BS.ASSETS.TOTAL', 'Total Assets', 'GRAND_TOTAL', 200, 0),
      ('BS.EQUITY', 'Equity', 'HEADER', 210, 0),
      ('BS.EQ.SHARE_CAPITAL', 'Share Capital', 'DETAIL', 220, 1),
      ('BS.EQ.ADDITIONAL_PAID_IN_CAPITAL', 'Additional Paid-in Capital', 'DETAIL', 230, 1),
      ('BS.EQ.RETAINED_EARNINGS', 'Retained Earnings', 'DETAIL', 240, 1),
      ('BS.EQ.CURRENT_YEAR_PROFIT', 'Current Year Profit', 'DETAIL', 250, 1),
      ('BS.EQ.RESERVES', 'Reserves', 'DETAIL', 260, 1),
      ('BS.EQ.OTHER_EQUITY', 'Other Equity', 'DETAIL', 270, 1),
      ('BS.EQUITY.TOTAL', 'Total Equity', 'SUBTOTAL', 280, 0),
      ('BS.LIABILITIES', 'Liabilities', 'HEADER', 290, 0),
      ('BS.CL', 'Current Liabilities', 'HEADER', 300, 1),
      ('BS.CL.ACCOUNTS_PAYABLE', 'Accounts Payable', 'DETAIL', 310, 2),
      ('BS.CL.ACCRUED_EXPENSES', 'Accrued Expenses', 'DETAIL', 320, 2),
      ('BS.CL.VAT_PAYABLE', 'VAT Payable', 'DETAIL', 330, 2),
      ('BS.CL.PAYROLL_PAYABLE', 'Payroll Payable', 'DETAIL', 340, 2),
      ('BS.CL.SHORT_TERM_LOANS', 'Short-term Loans', 'DETAIL', 350, 2),
      ('BS.CL.CURRENT_TAX', 'Current Tax', 'DETAIL', 360, 2),
      ('BS.CL.OTHER_CURRENT_LIABILITIES', 'Other Current Liabilities', 'DETAIL', 370, 2),
      ('BS.CL.TOTAL', 'Total Current Liabilities', 'SUBTOTAL', 380, 1),
      ('BS.NCL', 'Non-current Liabilities', 'HEADER', 390, 1),
      ('BS.NCL.LONG_TERM_LOANS', 'Long-term Loans', 'DETAIL', 400, 2),
      ('BS.NCL.DEFERRED_TAX', 'Deferred Tax', 'DETAIL', 410, 2),
      ('BS.NCL.LEASE_LIABILITIES', 'Lease Liabilities', 'DETAIL', 420, 2),
      ('BS.NCL.OTHER_NON_CURRENT_LIABILITIES', 'Other Non-current Liabilities', 'DETAIL', 430, 2),
      ('BS.NCL.TOTAL', 'Total Non-current Liabilities', 'SUBTOTAL', 440, 1),
      ('BS.LIABILITIES.TOTAL', 'Total Liabilities', 'SUBTOTAL', 450, 0),
      ('BS.EQ_LIAB.TOTAL', 'Total Equity + Liabilities', 'GRAND_TOTAL', 460, 0)
    ) as t(line_code, label, line_type, display_order, indent_level)
  ),
  approved_mappings as (
    select
      m.account_id,
      m.line_code,
      m.line_label,
      m.note_number,
      m.note_reference,
      m.note_hyperlink,
      m.presentation_order,
      m.is_contra
    from public.financial_statement_account_mappings m
    where m.tenant_id = p_tenant_id
      and m.statement_code = 'BALANCE_SHEET'
      and m.approval_status = 'APPROVED'
      and m.is_active = true
      and m.valid_from <= v_as_of_date
      and coalesce(m.valid_to, date 'infinity') >= v_as_of_date
  ),
  current_balances as (
    select account_id, presentation_balance
    from public.accounting_reporting_balances(p_tenant_id, null, v_as_of_date, v_as_of_date)
    where ifrs_statement_class in ('ASSET', 'LIABILITY', 'EQUITY')
  ),
  opening_balances as (
    select account_id, presentation_balance
    from public.accounting_reporting_balances(p_tenant_id, null, null, v_opening_as_of_date)
    where ifrs_statement_class in ('ASSET', 'LIABILITY', 'EQUITY')
  ),
  comparison_balances as (
    select account_id, presentation_balance
    from public.accounting_reporting_balances(p_tenant_id, null, null, v_comparison_as_of_date)
    where ifrs_statement_class in ('ASSET', 'LIABILITY', 'EQUITY')
  ),
  detail_amounts as (
    select
      m.line_code,
      coalesce(max(nullif(m.line_label, '')), max(lc.label), m.line_code) as line_label,
      string_agg(distinct nullif(m.note_number, ''), ', ') filter (where nullif(m.note_number, '') is not null) as note_number,
      string_agg(distinct nullif(m.note_reference, ''), ', ') filter (where nullif(m.note_reference, '') is not null) as note_reference,
      string_agg(distinct nullif(m.note_hyperlink, ''), ', ') filter (where nullif(m.note_hyperlink, '') is not null) as note_hyperlink,
      round(sum(case when m.is_contra then -coalesce(ob.presentation_balance, 0) else coalesce(ob.presentation_balance, 0) end), 2) as opening_amount,
      round(sum(case when m.is_contra then -coalesce(cb.presentation_balance, 0) else coalesce(cb.presentation_balance, 0) end), 2) as current_amount,
      round(sum(case when m.is_contra then -coalesce(pb.presentation_balance, 0) else coalesce(pb.presentation_balance, 0) end), 2) as comparison_amount
    from approved_mappings m
    left join line_catalog lc on lc.line_code = m.line_code
    left join opening_balances ob on ob.account_id = m.account_id
    left join current_balances cb on cb.account_id = m.account_id
    left join comparison_balances pb on pb.account_id = m.account_id
    group by m.line_code
  ),
  final_lines as (
    select
      lc.line_code,
      lc.label,
      lc.line_type,
      lc.display_order,
      lc.indent_level,
      case
        when lc.line_type = 'DETAIL' then coalesce(da.opening_amount, 0)
        when lc.line_code = 'BS.CA.TOTAL' then coalesce((select sum(opening_amount) from detail_amounts where line_code like 'BS.CA.%'), 0)
        when lc.line_code = 'BS.NCA.TOTAL' then coalesce((select sum(opening_amount) from detail_amounts where line_code like 'BS.NCA.%' and line_code <> 'BS.NCA.TOTAL'), 0)
        when lc.line_code = 'BS.ASSETS.TOTAL' then coalesce((select sum(opening_amount) from detail_amounts where line_code like 'BS.CA.%' or line_code like 'BS.NCA.%'), 0)
        when lc.line_code = 'BS.EQUITY.TOTAL' then coalesce((select sum(opening_amount) from detail_amounts where line_code like 'BS.EQ.%'), 0)
        when lc.line_code = 'BS.CL.TOTAL' then coalesce((select sum(opening_amount) from detail_amounts where line_code like 'BS.CL.%'), 0)
        when lc.line_code = 'BS.NCL.TOTAL' then coalesce((select sum(opening_amount) from detail_amounts where line_code like 'BS.NCL.%'), 0)
        when lc.line_code = 'BS.LIABILITIES.TOTAL' then coalesce((select sum(opening_amount) from detail_amounts where line_code like 'BS.CL.%' or line_code like 'BS.NCL.%'), 0)
        when lc.line_code = 'BS.EQ_LIAB.TOTAL' then coalesce((select sum(opening_amount) from detail_amounts where line_code like 'BS.EQ.%' or line_code like 'BS.CL.%' or line_code like 'BS.NCL.%'), 0)
        else 0
      end as opening_amount,
      case
        when lc.line_type = 'DETAIL' then coalesce(da.current_amount, 0)
        when lc.line_code = 'BS.CA.TOTAL' then coalesce((select sum(current_amount) from detail_amounts where line_code like 'BS.CA.%'), 0)
        when lc.line_code = 'BS.NCA.TOTAL' then coalesce((select sum(current_amount) from detail_amounts where line_code like 'BS.NCA.%' and line_code <> 'BS.NCA.TOTAL'), 0)
        when lc.line_code = 'BS.ASSETS.TOTAL' then coalesce((select sum(current_amount) from detail_amounts where line_code like 'BS.CA.%' or line_code like 'BS.NCA.%'), 0)
        when lc.line_code = 'BS.EQUITY.TOTAL' then coalesce((select sum(current_amount) from detail_amounts where line_code like 'BS.EQ.%'), 0)
        when lc.line_code = 'BS.CL.TOTAL' then coalesce((select sum(current_amount) from detail_amounts where line_code like 'BS.CL.%'), 0)
        when lc.line_code = 'BS.NCL.TOTAL' then coalesce((select sum(current_amount) from detail_amounts where line_code like 'BS.NCL.%'), 0)
        when lc.line_code = 'BS.LIABILITIES.TOTAL' then coalesce((select sum(current_amount) from detail_amounts where line_code like 'BS.CL.%' or line_code like 'BS.NCL.%'), 0)
        when lc.line_code = 'BS.EQ_LIAB.TOTAL' then coalesce((select sum(current_amount) from detail_amounts where line_code like 'BS.EQ.%' or line_code like 'BS.CL.%' or line_code like 'BS.NCL.%'), 0)
        else 0
      end as current_amount,
      case
        when lc.line_type = 'DETAIL' then coalesce(da.comparison_amount, 0)
        when lc.line_code = 'BS.CA.TOTAL' then coalesce((select sum(comparison_amount) from detail_amounts where line_code like 'BS.CA.%'), 0)
        when lc.line_code = 'BS.NCA.TOTAL' then coalesce((select sum(comparison_amount) from detail_amounts where line_code like 'BS.NCA.%' and line_code <> 'BS.NCA.TOTAL'), 0)
        when lc.line_code = 'BS.ASSETS.TOTAL' then coalesce((select sum(comparison_amount) from detail_amounts where line_code like 'BS.CA.%' or line_code like 'BS.NCA.%'), 0)
        when lc.line_code = 'BS.EQUITY.TOTAL' then coalesce((select sum(comparison_amount) from detail_amounts where line_code like 'BS.EQ.%'), 0)
        when lc.line_code = 'BS.CL.TOTAL' then coalesce((select sum(comparison_amount) from detail_amounts where line_code like 'BS.CL.%'), 0)
        when lc.line_code = 'BS.NCL.TOTAL' then coalesce((select sum(comparison_amount) from detail_amounts where line_code like 'BS.NCL.%'), 0)
        when lc.line_code = 'BS.LIABILITIES.TOTAL' then coalesce((select sum(comparison_amount) from detail_amounts where line_code like 'BS.CL.%' or line_code like 'BS.NCL.%'), 0)
        when lc.line_code = 'BS.EQ_LIAB.TOTAL' then coalesce((select sum(comparison_amount) from detail_amounts where line_code like 'BS.EQ.%' or line_code like 'BS.CL.%' or line_code like 'BS.NCL.%'), 0)
        else 0
      end as comparison_amount,
      coalesce(da.note_number, da.note_reference) as notes_reference,
      da.note_hyperlink,
      (lc.line_type <> 'DETAIL') as show_if_zero
    from line_catalog lc
    left join detail_amounts da on da.line_code = lc.line_code
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'line_code', line_code,
          'label', label,
          'line_type', line_type,
          'display_order', display_order,
          'indent_level', indent_level,
          'opening_amount', opening_amount,
          'current_amount', current_amount,
          'comparison_amount', comparison_amount,
          'variance_amount', current_amount - comparison_amount,
          'show_if_zero', show_if_zero,
          'is_bold', line_type in ('SUBTOTAL', 'GRAND_TOTAL'),
          'is_underlined', line_type = 'SUBTOTAL',
          'is_double_underlined', line_type = 'GRAND_TOTAL',
          'notes_reference', notes_reference,
          'note_hyperlink', note_hyperlink
        )
        order by display_order
      ),
      '[]'::jsonb
    ),
    coalesce(max(case when line_code = 'BS.ASSETS.TOTAL' then current_amount end), 0),
    coalesce(max(case when line_code = 'BS.LIABILITIES.TOTAL' then current_amount end), 0),
    coalesce(max(case when line_code = 'BS.EQUITY.TOTAL' then current_amount end), 0),
    coalesce(max(case when line_code = 'BS.CA.TOTAL' then current_amount end), 0),
    coalesce(max(case when line_code = 'BS.CL.TOTAL' then current_amount end), 0)
    into v_rows, v_assets, v_liabilities, v_equity, v_current_assets, v_current_liabilities
  from final_lines;

  v_equity_liabilities := v_equity + v_liabilities;
  v_balance_delta := round(v_assets - v_equity_liabilities, 2);

  select count(*)
    into v_unmapped_accounts
  from public.accounting_reporting_balances(p_tenant_id, null, v_as_of_date, v_as_of_date) b
  where b.ifrs_statement_class in ('ASSET', 'LIABILITY', 'EQUITY')
    and abs(coalesce(b.presentation_balance, 0)) > 0.005
    and not exists (
      select 1
      from public.financial_statement_account_mappings m
      where m.tenant_id = p_tenant_id
        and m.statement_code = 'BALANCE_SHEET'
        and m.account_id = b.account_id
        and m.approval_status = 'APPROVED'
        and m.is_active = true
        and m.valid_from <= v_as_of_date
        and coalesce(m.valid_to, date 'infinity') >= v_as_of_date
    );

  select count(*)
    into v_unapproved_mappings
  from public.financial_statement_account_mappings m
  where m.tenant_id = p_tenant_id
    and m.statement_code = 'BALANCE_SHEET'
    and m.is_active = true
    and m.valid_from <= v_as_of_date
    and coalesce(m.valid_to, date 'infinity') >= v_as_of_date
    and m.approval_status <> 'APPROVED';

  v_errors :=
    (case
      when v_unmapped_accounts > 0 then jsonb_build_array(
        jsonb_build_object(
          'code', 'UNMAPPED_ACCOUNTS',
          'message', format('%s balance sheet accounts have no approved mapping.', v_unmapped_accounts)
        )
      )
      else '[]'::jsonb
    end)
    ||
    (case
      when abs(v_balance_delta) > 1 then jsonb_build_array(
        jsonb_build_object(
          'code', 'BALANCE_SHEET_OUT_OF_BALANCE',
          'message', format('Assets do not equal Equity plus Liabilities. Delta: %s', v_balance_delta)
        )
      )
      else '[]'::jsonb
    end);

  v_warnings := case
    when v_unapproved_mappings > 0 then jsonb_build_array(
      jsonb_build_object(
        'code', 'UNAPPROVED_MAPPINGS_PRESENT',
        'message', format('%s balance sheet mappings are present but not approved.', v_unapproved_mappings)
      )
    )
    else '[]'::jsonb
  end;

  v_validation := jsonb_build_object(
    'valid', jsonb_array_length(v_errors) = 0,
    'errors', v_errors,
    'warnings', v_warnings,
    'unmapped_accounts', v_unmapped_accounts,
    'balance_delta', v_balance_delta
  );

  return jsonb_build_object(
    'rows', v_rows,
    'validation', v_validation,
    'summary', jsonb_build_object(
      'report', 'ifrs_balance_sheet',
      'tenant_id', p_tenant_id,
      'as_of_date', v_as_of_date,
      'start_date', v_start_date,
      'opening_as_of_date', v_opening_as_of_date,
      'comparison_as_of_date', v_comparison_as_of_date,
      'assets', v_assets,
      'liabilities', v_liabilities,
      'equity', v_equity,
      'equity_and_liabilities', v_equity_liabilities,
      'working_capital', v_current_assets - v_current_liabilities,
      'current_assets', v_current_assets,
      'current_liabilities', v_current_liabilities,
      'balance_delta', v_balance_delta,
      'generated_at', now(),
      'period', jsonb_build_object(
        'as_of_date', v_as_of_date,
        'opening_as_of_date', v_opening_as_of_date,
        'comparison_as_of_date', v_comparison_as_of_date,
        'opening_label', 'Opening Balance',
        'current_label', 'Closing Balance',
        'comparison_label', 'Prior Year'
      ),
      'validation', v_validation
    )
  );
end;
$$;

do $$
declare
  v_report_id uuid;
begin
  select r.id
    into v_report_id
  from public.report_catalog r
  join public.report_departments d on d.id = r.department_id
  where d.slug = 'accounts'
    and r.slug = 'statement-of-financial-position'
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
      (v_report_id, 'opening_amount', 'Opening Balance', 'Opening Balance', 'Currency-BDT', 'opening_amount', 'Currency-BDT', 'SUM', 'right', false, false, false, 3, true),
      (v_report_id, 'current_amount', 'Closing Balance', 'Closing Balance', 'Currency-BDT', 'current_amount', 'Currency-BDT', 'SUM', 'right', true, false, false, 4, true),
      (v_report_id, 'comparison_amount', 'Prior Year', 'Prior Year', 'Currency-BDT', 'comparison_amount', 'Currency-BDT', 'SUM', 'right', false, false, false, 5, true),
      (v_report_id, 'notes_reference', 'Note', 'Note', 'Text', 'notes_reference', null, null, 'left', false, false, false, 6, false);
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
      (v_report_id, 'opening_amount', 'Opening Balance', 'Currency-BDT', 'opening_amount', 'Currency-BDT', 'SUM', 'right', false, false, false, 3, true),
      (v_report_id, 'current_amount', 'Closing Balance', 'Currency-BDT', 'current_amount', 'Currency-BDT', 'SUM', 'right', true, false, false, 4, true),
      (v_report_id, 'comparison_amount', 'Prior Year', 'Currency-BDT', 'comparison_amount', 'Currency-BDT', 'SUM', 'right', false, false, false, 5, true),
      (v_report_id, 'notes_reference', 'Note', 'Text', 'notes_reference', null, null, 'left', false, false, false, 6, false);
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
      (v_report_id, 'start_date', 'Start Date', 'Start Date', 'Date Picker', null, null, false, 1, false),
      (v_report_id, 'as_of_date', 'As Of Date', 'As Of Date', 'Date Picker', null, null, true, 2, false),
      (v_report_id, 'comparison_as_of_date', 'Comparative As Of Date', 'Comparative As Of Date', 'Date Picker', null, null, false, 3, false),
      (v_report_id, 'currency', 'Currency', 'Currency', 'Dropdown', 'BDT,USD,EUR', 'BDT', false, 4, false);
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
      (v_report_id, 'start_date', 'Start Date', 'Date Picker', null, null, false, 1, false),
      (v_report_id, 'as_of_date', 'As Of Date', 'Date Picker', null, null, true, 2, false),
      (v_report_id, 'comparison_as_of_date', 'Comparative As Of Date', 'Date Picker', null, null, false, 3, false),
      (v_report_id, 'currency', 'Currency', 'Dropdown', 'BDT,USD,EUR', 'BDT', false, 4, false);
  end if;
end $$;

grant execute on function public.rpt_ifrs_balance_sheet(uuid, jsonb) to authenticated;

commit;