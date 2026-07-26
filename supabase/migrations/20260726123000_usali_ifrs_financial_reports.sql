begin;

create table if not exists public.account_department_mapping (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  account_id uuid not null references public.chart_of_accounts(id) on delete cascade,
  usali_department text not null check (usali_department in (
    'Rooms',
    'Food & Beverage',
    'Administrative & General',
    'Information & Telecom Systems',
    'Sales & Marketing',
    'Property Operations & Maintenance',
    'Utility Costs'
  )),
  usali_line_group text not null check (usali_line_group in (
    'REVENUE',
    'PAYROLL_AND_RELATED',
    'OTHER_EXPENSE',
    'NOT_APPLICABLE'
  )),
  ifrs_statement_class text not null check (ifrs_statement_class in (
    'ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'OTHER'
  )),
  effective_from date not null default current_date,
  effective_to date null,
  classification_source text not null default 'heuristic',
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, account_id, effective_from)
);

create index if not exists idx_account_department_mapping_lookup
  on public.account_department_mapping (tenant_id, account_id, effective_from desc, effective_to);

alter table public.account_department_mapping enable row level security;

drop policy if exists account_department_mapping_tenant_select on public.account_department_mapping;
create policy account_department_mapping_tenant_select
  on public.account_department_mapping
  for select to authenticated
  using (tenant_id = public.current_tenant_id());

drop policy if exists account_department_mapping_tenant_write on public.account_department_mapping;
create policy account_department_mapping_tenant_write
  on public.account_department_mapping
  for all to authenticated
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create or replace function public.classify_account_for_reporting(
  p_account_name text,
  p_account_code text,
  p_account_type text
)
returns table (
  usali_department text,
  usali_line_group text,
  ifrs_statement_class text
)
language sql
immutable
set search_path = public, pg_temp
as $$
with n as (
  select
    lower(coalesce(p_account_name, '')) as name,
    upper(coalesce(p_account_type, '')) as account_type
)
select
  case
    when name ~ '(room revenue|rooms?|accommodation|lodging|front office|guest room|suite|villa|occupancy)' then 'Rooms'
    when name ~ '(restaurant|food|beverage|bar|banquet|kitchen|cafe|coffee|dining|room service|catering|f\&b)' then 'Food & Beverage'
    when name ~ '(telecom|telephone|internet|wifi|network|computer|software|system|systems|it | information technology|pbx)' then 'Information & Telecom Systems'
    when name ~ '(sales|marketing|advertis|promotion|commission|distribution|ota|travel agent)' then 'Sales & Marketing'
    when name ~ '(maintenance|repair|engineering|property operations|grounds|janitorial|housekeeping supplies)' then 'Property Operations & Maintenance'
    when name ~ '(utility|electric|power|water|gas|fuel|diesel|generator|sewage|steam)' then 'Utility Costs'
    else 'Administrative & General'
  end,
  case
    when account_type = 'REVENUE' then 'REVENUE'
    when account_type in ('EXPENSE', 'OTHER') and name ~ '(salary|salaries|wage|payroll|bonus|benefit|pf\b|provident|insurance|gratuity|overtime|allowance)' then 'PAYROLL_AND_RELATED'
    when account_type in ('EXPENSE', 'OTHER') then 'OTHER_EXPENSE'
    else 'NOT_APPLICABLE'
  end,
  case
    when account_type in ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'OTHER') then account_type
    when name ~ '(cash|bank|receivable|inventory|prepaid|advance|deposit|asset|property|equipment|building|vehicle)' then 'ASSET'
    when name ~ '(payable|accrued|loan|borrow|tax payable|deferred revenue|liability|vendor credit)' then 'LIABILITY'
    when name ~ '(equity|capital|retained earnings|reserve|shareholder|owners? capital)' then 'EQUITY'
    when name ~ '(revenue|income|sales|fee|charge|room revenue|restaurant revenue|other income)' then 'REVENUE'
    else 'EXPENSE'
  end
from n;
$$;

create or replace function public.sync_account_department_mapping()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_department text;
  v_line_group text;
  v_ifrs_class text;
begin
  select c.usali_department, c.usali_line_group, c.ifrs_statement_class
    into v_department, v_line_group, v_ifrs_class
  from public.classify_account_for_reporting(new.name, new.code, new.type) c;

  insert into public.account_department_mapping (
    tenant_id, account_id, usali_department, usali_line_group, ifrs_statement_class,
    effective_from, effective_to, classification_source, notes, updated_at
  )
  values (
    new.tenant_id, new.id, v_department, v_line_group, v_ifrs_class,
    current_date, null, 'heuristic', 'Auto-seeded from chart_of_accounts trigger', now()
  )
  on conflict (tenant_id, account_id, effective_from)
  do update set
    usali_department = excluded.usali_department,
    usali_line_group = excluded.usali_line_group,
    ifrs_statement_class = excluded.ifrs_statement_class,
    effective_to = excluded.effective_to,
    classification_source = excluded.classification_source,
    notes = excluded.notes,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_sync_account_department_mapping on public.chart_of_accounts;
create trigger trg_sync_account_department_mapping
after insert or update of code, name, type, is_active on public.chart_of_accounts
for each row
execute function public.sync_account_department_mapping();

insert into public.account_department_mapping (
  tenant_id, account_id, usali_department, usali_line_group, ifrs_statement_class,
  effective_from, effective_to, classification_source, notes, created_at, updated_at
)
select
  coa.tenant_id,
  coa.id,
  c.usali_department,
  c.usali_line_group,
  c.ifrs_statement_class,
  current_date,
  null,
  'seed',
  'Initial classification seed for reporting statements',
  now(),
  now()
from public.chart_of_accounts coa
cross join lateral public.classify_account_for_reporting(coa.name, coa.code, coa.type) c
where coa.tenant_id is not null
  and coalesce(coa.is_active, true)
  and not exists (
    select 1 from public.account_department_mapping adm
    where adm.tenant_id = coa.tenant_id
      and adm.account_id = coa.id
      and adm.effective_to is null
  )
on conflict (tenant_id, account_id, effective_from) do nothing;

create or replace function public.accounting_reporting_balances(
  p_tenant_id uuid,
  p_start_date date default null,
  p_end_date date default null,
  p_as_of_date date default null
)
returns table (
  account_id uuid,
  account_code text,
  account_name text,
  account_type text,
  usali_department text,
  usali_line_group text,
  ifrs_statement_class text,
  period_debit numeric(20,2),
  period_credit numeric(20,2),
  period_balance numeric(20,2),
  asof_debit numeric(20,2),
  asof_credit numeric(20,2),
  asof_balance numeric(20,2),
  presentation_balance numeric(20,2),
  is_cash_account boolean
)
language sql
stable
set search_path = public, pg_temp
as $$
with params as (
  select
    coalesce(p_start_date, date_trunc('month', coalesce(p_as_of_date, p_end_date, current_date))::date) as start_date,
    coalesce(p_end_date, coalesce(p_as_of_date, current_date)) as end_date,
    coalesce(p_as_of_date, p_end_date, current_date) as as_of_date
),
classification as (
  select
    coa.id,
    coa.code,
    coa.name,
    upper(coalesce(coa.type, 'OTHER')) as account_type,
    coalesce(adm.usali_department, c.usali_department) as usali_department,
    coalesce(adm.usali_line_group, c.usali_line_group) as usali_line_group,
    coalesce(adm.ifrs_statement_class, c.ifrs_statement_class) as ifrs_statement_class,
    lower(coalesce(coa.code, '') || ' ' || coalesce(coa.name, '')) ~ '(cash|bank)' as is_cash_account
  from public.chart_of_accounts coa
  cross join lateral public.classify_account_for_reporting(coa.name, coa.code, coa.type) c
  left join lateral (
    select adm.usali_department, adm.usali_line_group, adm.ifrs_statement_class
    from public.account_department_mapping adm, params p
    where adm.tenant_id = coa.tenant_id
      and adm.account_id = coa.id
      and adm.effective_from <= p.as_of_date
      and coalesce(adm.effective_to, date 'infinity') >= p.as_of_date
    order by adm.effective_from desc, adm.created_at desc
    limit 1
  ) adm on true
  where coa.tenant_id = p_tenant_id
    and coalesce(coa.is_active, true)
),
period_balances as (
  select jl.account_id,
    round(sum(coalesce(jl.debit, 0)), 2) as debit,
    round(sum(coalesce(jl.credit, 0)), 2) as credit,
    round(sum(coalesce(jl.debit, 0) - coalesce(jl.credit, 0)), 2) as balance
  from public.journal_lines jl
  join public.journal_entries je on je.id = jl.entry_id
  cross join params p
  where jl.tenant_id = p_tenant_id
    and je.tenant_id = p_tenant_id
    and coalesce(je.jv_date, je.created_at::date) between p.start_date and p.end_date
  group by jl.account_id
),
asof_balances as (
  select jl.account_id,
    round(sum(coalesce(jl.debit, 0)), 2) as debit,
    round(sum(coalesce(jl.credit, 0)), 2) as credit,
    round(sum(coalesce(jl.debit, 0) - coalesce(jl.credit, 0)), 2) as balance
  from public.journal_lines jl
  join public.journal_entries je on je.id = jl.entry_id
  cross join params p
  where jl.tenant_id = p_tenant_id
    and je.tenant_id = p_tenant_id
    and coalesce(je.jv_date, je.created_at::date) <= p.as_of_date
  group by jl.account_id
)
select
  c.id, c.code, c.name, c.account_type,
  coalesce(c.usali_department, 'Administrative & General'),
  coalesce(
    c.usali_line_group,
    case
      when c.account_type = 'REVENUE' then 'REVENUE'
      when c.account_type in ('EXPENSE', 'OTHER') then 'OTHER_EXPENSE'
      else 'NOT_APPLICABLE'
    end
  ),
  coalesce(c.ifrs_statement_class, c.account_type),
  coalesce(p.debit, 0)::numeric(20,2),
  coalesce(p.credit, 0)::numeric(20,2),
  coalesce(p.balance, 0)::numeric(20,2),
  coalesce(a.debit, 0)::numeric(20,2),
  coalesce(a.credit, 0)::numeric(20,2),
  coalesce(a.balance, 0)::numeric(20,2),
  case when c.account_type in ('LIABILITY', 'EQUITY') then round(coalesce(a.credit, 0) - coalesce(a.debit, 0), 2) else round(coalesce(a.debit, 0) - coalesce(a.credit, 0), 2) end::numeric(20,2),
  c.is_cash_account
from classification c
left join period_balances p on p.account_id = c.id
left join asof_balances a on a.account_id = c.id;
$$;

create or replace function public.rpt_usali_department_statement(
  p_tenant_id uuid,
  p_filters jsonb default '{}'::jsonb,
  p_department text default null
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
  v_total_revenue numeric(20,2) := 0;
  v_total_payroll numeric(20,2) := 0;
  v_total_other numeric(20,2) := 0;
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for USALI report' using errcode = 'P0001';
  end if;
  begin v_start_date := nullif(trim(p_filters ->> 'start_date'), '')::date; exception when others then v_start_date := null; end;
  begin v_end_date := nullif(trim(p_filters ->> 'end_date'), '')::date; exception when others then v_end_date := null; end;
  v_end_date := coalesce(v_end_date, current_date);
  v_start_date := coalesce(v_start_date, date_trunc('month', v_end_date)::date);

  with balances as (
    select * from public.accounting_reporting_balances(p_tenant_id, v_start_date, v_end_date, v_end_date)
  ), filtered as (
    select b.*, case when b.usali_line_group = 'REVENUE' then greatest(b.period_credit - b.period_debit, 0) else greatest(b.period_debit - b.period_credit, 0) end as amount
    from balances b
    where (p_department is null or b.usali_department = p_department)
      and b.usali_line_group in ('REVENUE', 'PAYROLL_AND_RELATED', 'OTHER_EXPENSE')
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'account_id', f.account_id,
    'account_code', f.account_code,
    'account_name', f.account_name,
    'department', f.usali_department,
    'line_group', f.usali_line_group,
    'amount', round(f.amount, 2),
    'debit', f.period_debit,
    'credit', f.period_credit,
    'presentation_balance', f.period_balance
  ) order by f.usali_line_group, f.account_code, f.account_name), '[]'::jsonb),
    coalesce(round(sum(case when f.usali_line_group = 'REVENUE' then f.amount else 0 end), 2), 0),
    coalesce(round(sum(case when f.usali_line_group = 'PAYROLL_AND_RELATED' then f.amount else 0 end), 2), 0),
    coalesce(round(sum(case when f.usali_line_group = 'OTHER_EXPENSE' then f.amount else 0 end), 2), 0)
  into v_rows, v_total_revenue, v_total_payroll, v_total_other
  from filtered f;

  return jsonb_build_object(
    'rows', v_rows,
    'summary', jsonb_build_object(
      'report', coalesce(p_department, 'USALI'),
      'tenant_id', p_tenant_id,
      'department', p_department,
      'start_date', v_start_date,
      'end_date', v_end_date,
      'total_revenue', v_total_revenue,
      'total_payroll_and_related', v_total_payroll,
      'total_other_expense', v_total_other,
      'net_contribution', v_total_revenue - v_total_payroll - v_total_other,
      'generated_at', now()
    )
  );
end;
$$;

create or replace function public.rpt_ifrs_profit_or_loss(
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
  v_revenue numeric(20,2) := 0;
  v_operating_expense numeric(20,2) := 0;
  v_depreciation numeric(20,2) := 0;
  v_finance_cost numeric(20,2) := 0;
  v_tax numeric(20,2) := 0;
  v_gross_profit numeric(20,2) := 0;
  v_ebitda numeric(20,2) := 0;
  v_net_profit numeric(20,2) := 0;
begin
  if p_tenant_id is null then raise exception 'Tenant context missing for IFRS P&L' using errcode = 'P0001'; end if;
  begin v_start_date := nullif(trim(p_filters ->> 'start_date'), '')::date; exception when others then v_start_date := null; end;
  begin v_end_date := nullif(trim(p_filters ->> 'end_date'), '')::date; exception when others then v_end_date := null; end;
  v_end_date := coalesce(v_end_date, current_date);
  v_start_date := coalesce(v_start_date, date_trunc('month', v_end_date)::date);

  with balances as (
    select * from public.accounting_reporting_balances(p_tenant_id, v_start_date, v_end_date, v_end_date)
  ), shaped as (
    select b.*,
      case when b.ifrs_statement_class = 'REVENUE' then greatest(b.period_credit - b.period_debit, 0) else greatest(b.period_debit - b.period_credit, 0) end as amount,
      case when b.account_name ~ '(depreciat|amorti)' then greatest(b.period_debit - b.period_credit, 0) else 0 end as depreciation_amount,
      case
        when b.ifrs_statement_class = 'REVENUE' then 'Revenue'
        when b.ifrs_statement_class = 'EXPENSE' and b.usali_line_group = 'PAYROLL_AND_RELATED' then 'Payroll & Related Expense'
        when b.ifrs_statement_class = 'EXPENSE' then 'Operating Expense'
        else 'Other'
      end as statement_line
    from balances b
    where b.ifrs_statement_class in ('REVENUE', 'EXPENSE')
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'account_id', s.account_id,
      'account_code', s.account_code,
      'account_name', s.account_name,
      'statement_line', s.statement_line,
      'department', s.usali_department,
      'line_group', s.usali_line_group,
      'amount', round(s.amount, 2),
      'presentation_balance', s.period_balance
    ) order by s.statement_line, s.account_code, s.account_name), '[]'::jsonb),
    coalesce(round(sum(case when s.ifrs_statement_class = 'REVENUE' then s.amount else 0 end), 2), 0),
    coalesce(round(sum(case when s.ifrs_statement_class = 'EXPENSE' then s.amount else 0 end), 2), 0),
    coalesce(round(sum(s.depreciation_amount), 2), 0),
    coalesce(round(sum(case when s.account_name ~ '(finance cost|interest|bank charge)' then s.amount else 0 end), 2), 0),
    coalesce(round(sum(case when s.account_name ~ '(tax|income tax)' then s.amount else 0 end), 2), 0),
    coalesce(round(sum(case when s.ifrs_statement_class = 'EXPENSE' and s.account_name !~ '(finance cost|interest|bank charge|tax)' then s.amount else 0 end), 2), 0)
  into v_rows, v_revenue, v_operating_expense, v_depreciation, v_finance_cost, v_tax, v_ebitda, v_net_profit
  from shaped s;

  v_gross_profit := v_revenue - v_operating_expense;
  v_ebitda := v_gross_profit - v_depreciation;
  v_net_profit := v_gross_profit - v_finance_cost - v_tax;

  return jsonb_build_object('rows', v_rows, 'summary', jsonb_build_object('report', 'ifrs_profit_or_loss', 'tenant_id', p_tenant_id, 'start_date', v_start_date, 'end_date', v_end_date, 'revenue', v_revenue, 'operating_expense', v_operating_expense, 'gross_profit', v_gross_profit, 'ebitda', v_ebitda, 'finance_cost', v_finance_cost, 'tax', v_tax, 'net_profit', v_net_profit, 'generated_at', now()));
end; $$;

create or replace function public.rpt_ifrs_balance_sheet(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_as_of_date date; v_rows jsonb; v_assets numeric(20,2) := 0; v_liabilities numeric(20,2) := 0; v_equity numeric(20,2) := 0;
begin
  if p_tenant_id is null then raise exception 'Tenant context missing for balance sheet' using errcode = 'P0001'; end if;
  begin v_as_of_date := nullif(trim(coalesce(p_filters ->> 'as_of_date', p_filters ->> 'end_date')), '')::date; exception when others then v_as_of_date := null; end;
  v_as_of_date := coalesce(v_as_of_date, current_date);
  with balances as (
    select * from public.accounting_reporting_balances(p_tenant_id, null, v_as_of_date, v_as_of_date)
  ), shaped as (
    select b.*,
      case when b.ifrs_statement_class = 'ASSET' then b.presentation_balance when b.ifrs_statement_class in ('LIABILITY','EQUITY') then b.presentation_balance else 0 end as amount
    from balances b where b.ifrs_statement_class in ('ASSET','LIABILITY','EQUITY')
  )
  select coalesce(jsonb_agg(jsonb_build_object('account_id', s.account_id, 'account_code', s.account_code, 'account_name', s.account_name, 'statement_class', s.ifrs_statement_class, 'amount', round(s.amount, 2)) order by s.ifrs_statement_class, s.account_code, s.account_name), '[]'::jsonb),
    coalesce(round(sum(case when s.ifrs_statement_class = 'ASSET' then s.amount else 0 end), 2), 0),
    coalesce(round(sum(case when s.ifrs_statement_class = 'LIABILITY' then s.amount else 0 end), 2), 0),
    coalesce(round(sum(case when s.ifrs_statement_class = 'EQUITY' then s.amount else 0 end), 2), 0)
  into v_rows, v_assets, v_liabilities, v_equity from shaped s;
  return jsonb_build_object('rows', v_rows, 'summary', jsonb_build_object('report', 'ifrs_balance_sheet', 'tenant_id', p_tenant_id, 'as_of_date', v_as_of_date, 'assets', v_assets, 'liabilities', v_liabilities, 'equity', v_equity, 'working_capital', v_assets - v_liabilities, 'generated_at', now()));
end; $$;

create or replace function public.rpt_ifrs_changes_in_equity(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_start_date date; v_end_date date; v_opening_equity numeric(20,2) := 0; v_closing_equity numeric(20,2) := 0; v_profit numeric(20,2) := 0;
begin
  if p_tenant_id is null then raise exception 'Tenant context missing for changes in equity' using errcode = 'P0001'; end if;
  begin v_start_date := nullif(trim(p_filters ->> 'start_date'), '')::date; exception when others then v_start_date := null; end;
  begin v_end_date := nullif(trim(coalesce(p_filters ->> 'end_date', p_filters ->> 'as_of_date')), '')::date; exception when others then v_end_date := null; end;
  v_end_date := coalesce(v_end_date, current_date);
  v_start_date := coalesce(v_start_date, date_trunc('year', v_end_date)::date);
  v_profit := coalesce((public.rpt_ifrs_profit_or_loss(p_tenant_id, jsonb_build_object('start_date', v_start_date, 'end_date', v_end_date)) -> 'summary' ->> 'net_profit')::numeric, 0);
  v_closing_equity := coalesce((public.rpt_ifrs_balance_sheet(p_tenant_id, jsonb_build_object('as_of_date', v_end_date)) -> 'summary' ->> 'equity')::numeric, 0);
  v_opening_equity := coalesce((public.rpt_ifrs_balance_sheet(p_tenant_id, jsonb_build_object('as_of_date', v_start_date - 1)) -> 'summary' ->> 'equity')::numeric, 0);
  return jsonb_build_object('rows', jsonb_build_array(
    jsonb_build_object('line_item', 'Opening equity', 'amount', v_opening_equity),
    jsonb_build_object('line_item', 'Profit for the period', 'amount', v_profit),
    jsonb_build_object('line_item', 'Closing equity', 'amount', v_closing_equity)
  ), 'summary', jsonb_build_object('report', 'ifrs_changes_in_equity', 'tenant_id', p_tenant_id, 'start_date', v_start_date, 'end_date', v_end_date, 'opening_equity', v_opening_equity, 'profit_for_period', v_profit, 'closing_equity', v_closing_equity, 'generated_at', now()));
end; $$;

create or replace function public.rpt_ifrs_cash_flows_direct(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_start_date date; v_end_date date; v_rows jsonb; v_operating numeric(20,2) := 0; v_investing numeric(20,2) := 0; v_financing numeric(20,2) := 0;
begin
  if p_tenant_id is null then raise exception 'Tenant context missing for cash flows' using errcode = 'P0001'; end if;
  begin v_start_date := nullif(trim(p_filters ->> 'start_date'), '')::date; exception when others then v_start_date := null; end;
  begin v_end_date := nullif(trim(coalesce(p_filters ->> 'end_date', p_filters ->> 'as_of_date')), '')::date; exception when others then v_end_date := null; end;
  v_end_date := coalesce(v_end_date, current_date);
  v_start_date := coalesce(v_start_date, date_trunc('month', v_end_date)::date);
  with balances as (
    select * from public.accounting_reporting_balances(p_tenant_id, v_start_date, v_end_date, v_end_date)
  ), cash_lines as (
    select case
      when b.ifrs_statement_class = 'REVENUE' or b.account_name ~ '(guest|room|sales|restaurant|service)' then 'Operating Activities'
      when b.account_name ~ '(property|equipment|asset|capex|fixed asset|software)' then 'Investing Activities'
      when b.account_name ~ '(loan|capital|equity|dividend|shareholder|owner)' then 'Financing Activities'
      else 'Operating Activities' end as cash_flow_class,
      case when b.period_balance >= 0 then b.period_balance else abs(b.period_balance) * -1 end as amount,
      b.* from balances b
    where b.is_cash_account or b.ifrs_statement_class in ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE')
  )
  select coalesce(jsonb_agg(jsonb_build_object('cash_flow_class', c.cash_flow_class, 'account_code', c.account_code, 'account_name', c.account_name, 'amount', round(c.amount, 2)) order by c.cash_flow_class, c.account_code, c.account_name), '[]'::jsonb),
    coalesce(round(sum(case when c.cash_flow_class = 'Operating Activities' then c.amount else 0 end), 2), 0),
    coalesce(round(sum(case when c.cash_flow_class = 'Investing Activities' then c.amount else 0 end), 2), 0),
    coalesce(round(sum(case when c.cash_flow_class = 'Financing Activities' then c.amount else 0 end), 2), 0)
  into v_rows, v_operating, v_investing, v_financing from cash_lines c;
  return jsonb_build_object('rows', v_rows, 'summary', jsonb_build_object('report', 'ifrs_cash_flows_direct', 'tenant_id', p_tenant_id, 'start_date', v_start_date, 'end_date', v_end_date, 'operating_activities', v_operating, 'investing_activities', v_investing, 'financing_activities', v_financing, 'net_change_in_cash', v_operating + v_investing + v_financing, 'generated_at', now()));
end; $$;

create or replace function public.rpt_ifrs_cash_flows_indirect(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare v_start_date date; v_end_date date; v_rows jsonb; v_net_profit numeric(20,2) := 0; v_depreciation numeric(20,2) := 0; v_opening_wc numeric(20,2) := 0; v_closing_wc numeric(20,2) := 0; v_operating numeric(20,2) := 0; v_investing numeric(20,2) := 0; v_financing numeric(20,2) := 0;
begin
  if p_tenant_id is null then raise exception 'Tenant context missing for cash flows' using errcode = 'P0001'; end if;
  begin v_start_date := nullif(trim(p_filters ->> 'start_date'), '')::date; exception when others then v_start_date := null; end;
  begin v_end_date := nullif(trim(coalesce(p_filters ->> 'end_date', p_filters ->> 'as_of_date')), '')::date; exception when others then v_end_date := null; end;
  v_end_date := coalesce(v_end_date, current_date); v_start_date := coalesce(v_start_date, date_trunc('month', v_end_date)::date);
  v_net_profit := coalesce((public.rpt_ifrs_profit_or_loss(p_tenant_id, jsonb_build_object('start_date', v_start_date, 'end_date', v_end_date)) -> 'summary' ->> 'net_profit')::numeric, 0);
  v_depreciation := coalesce((public.rpt_ifrs_profit_or_loss(p_tenant_id, jsonb_build_object('start_date', v_start_date, 'end_date', v_end_date)) -> 'summary' ->> 'depreciation_and_amortisation')::numeric, 0);
  v_opening_wc := coalesce((public.rpt_ifrs_balance_sheet(p_tenant_id, jsonb_build_object('as_of_date', v_start_date - 1)) -> 'summary' ->> 'working_capital')::numeric, 0);
  v_closing_wc := coalesce((public.rpt_ifrs_balance_sheet(p_tenant_id, jsonb_build_object('as_of_date', v_end_date)) -> 'summary' ->> 'working_capital')::numeric, 0);
  v_operating := v_net_profit + v_depreciation + (v_opening_wc - v_closing_wc);
  v_rows := jsonb_build_array(
    jsonb_build_object('line_item', 'Net profit', 'amount', v_net_profit),
    jsonb_build_object('line_item', 'Depreciation and amortisation', 'amount', v_depreciation),
    jsonb_build_object('line_item', 'Working capital movement', 'amount', v_opening_wc - v_closing_wc),
    jsonb_build_object('line_item', 'Net cash from operating activities', 'amount', v_operating),
    jsonb_build_object('line_item', 'Net cash from investing activities', 'amount', v_investing),
    jsonb_build_object('line_item', 'Net cash from financing activities', 'amount', v_financing),
    jsonb_build_object('line_item', 'Net change in cash', 'amount', v_operating + v_investing + v_financing)
  );
  return jsonb_build_object('rows', v_rows, 'summary', jsonb_build_object('report', 'ifrs_cash_flows_indirect', 'tenant_id', p_tenant_id, 'start_date', v_start_date, 'end_date', v_end_date, 'net_profit', v_net_profit, 'depreciation_and_amortisation', v_depreciation, 'opening_working_capital', v_opening_wc, 'closing_working_capital', v_closing_wc, 'operating_activities', v_operating, 'investing_activities', v_investing, 'financing_activities', v_financing, 'net_change_in_cash', v_operating + v_investing + v_financing, 'generated_at', now()));
end; $$;

create or replace function public.rpt_hospitality_kpis(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_start_date date;
  v_end_date date;
  v_days integer;
  v_active_rooms integer := 0;
  v_occupied_room_nights integer := 0;
  v_available_room_nights integer := 0;
  v_occupancy numeric(20,4) := 0;
  v_room_revenue numeric(20,2) := 0;
  v_net_profit numeric(20,2) := 0;
  v_adr numeric(20,2) := 0;
  v_revpar numeric(20,2) := 0;
  v_gop numeric(20,2) := 0;
  v_ebitda numeric(20,2) := 0;
  v_net_profit_margin numeric(20,4) := 0;
  v_current_assets numeric(20,2) := 0;
  v_current_liabilities numeric(20,2) := 0;
  v_current_ratio numeric(20,4) := 0;
  v_quick_ratio numeric(20,4) := 0;
  v_working_capital numeric(20,2) := 0;
  v_rows jsonb;
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for hospitality KPI report' using errcode = 'P0001';
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
  v_days := greatest((v_end_date - v_start_date) + 1, 1);

  select count(*)::int
    into v_active_rooms
  from public.rooms r
  where r.tenant_id = p_tenant_id
    and coalesce(r.is_active, true);

  select coalesce(count(*), 0)::int
    into v_occupied_room_nights
  from public.reservation_rooms rr
  join public.reservations res on res.id = rr.reservation_id
  join lateral generate_series(greatest(rr.from_date, v_start_date), least(rr.to_date - 1, v_end_date), interval '1 day') d on true
  where rr.tenant_id = p_tenant_id
    and res.tenant_id = p_tenant_id
    and rr.from_date <= v_end_date
    and rr.to_date > v_start_date
    and upper(coalesce(res.status, '')) not in ('CANCELLED', 'NO_SHOW');

  v_available_room_nights := greatest(v_active_rooms * v_days, 1);
  v_occupancy := round((v_occupied_room_nights::numeric / v_available_room_nights::numeric) * 100, 2);

  select coalesce(sum(case when b.usali_department = 'Rooms' and b.usali_line_group = 'REVENUE' then greatest(b.period_credit - b.period_debit, 0) else 0 end), 0)::numeric(20,2)
    into v_room_revenue
  from public.accounting_reporting_balances(p_tenant_id, v_start_date, v_end_date, v_end_date) b;

  v_gop := coalesce((public.rpt_ifrs_profit_or_loss(p_tenant_id, jsonb_build_object('start_date', v_start_date, 'end_date', v_end_date)) -> 'summary' ->> 'gross_profit')::numeric, 0);
  v_ebitda := coalesce((public.rpt_ifrs_profit_or_loss(p_tenant_id, jsonb_build_object('start_date', v_start_date, 'end_date', v_end_date)) -> 'summary' ->> 'ebitda')::numeric, 0);
  v_net_profit := coalesce((public.rpt_ifrs_profit_or_loss(p_tenant_id, jsonb_build_object('start_date', v_start_date, 'end_date', v_end_date)) -> 'summary' ->> 'net_profit')::numeric, 0);

  select
    coalesce((public.rpt_ifrs_balance_sheet(p_tenant_id, jsonb_build_object('as_of_date', v_end_date)) -> 'summary' ->> 'assets')::numeric, 0),
    coalesce((public.rpt_ifrs_balance_sheet(p_tenant_id, jsonb_build_object('as_of_date', v_end_date)) -> 'summary' ->> 'liabilities')::numeric, 0),
    coalesce((public.rpt_ifrs_balance_sheet(p_tenant_id, jsonb_build_object('as_of_date', v_end_date)) -> 'summary' ->> 'working_capital')::numeric, 0)
  into v_current_assets, v_current_liabilities, v_working_capital;

  v_adr := case when v_occupied_room_nights > 0 then round(v_room_revenue / v_occupied_room_nights, 2) else 0 end;
  v_revpar := case when v_available_room_nights > 0 then round(v_room_revenue / v_available_room_nights, 2) else 0 end;
  v_current_ratio := case when v_current_liabilities > 0 then round(v_current_assets / v_current_liabilities, 4) else 0 end;
  v_quick_ratio := v_current_ratio;
  v_net_profit_margin := case when v_room_revenue <> 0 then round((v_net_profit / nullif(v_room_revenue, 0)) * 100, 4) else 0 end;

  v_rows := jsonb_build_array(
    jsonb_build_object('metric', 'occupancy_rate', 'value', v_occupancy),
    jsonb_build_object('metric', 'adr', 'value', v_adr),
    jsonb_build_object('metric', 'revpar', 'value', v_revpar),
    jsonb_build_object('metric', 'room_revenue', 'value', v_room_revenue),
    jsonb_build_object('metric', 'gop', 'value', v_gop),
    jsonb_build_object('metric', 'ebitda', 'value', v_ebitda),
    jsonb_build_object('metric', 'net_profit', 'value', v_net_profit),
    jsonb_build_object('metric', 'net_profit_margin_pct', 'value', v_net_profit_margin),
    jsonb_build_object('metric', 'current_ratio', 'value', v_current_ratio),
    jsonb_build_object('metric', 'quick_ratio', 'value', v_quick_ratio),
    jsonb_build_object('metric', 'working_capital', 'value', v_working_capital)
  );

  return jsonb_build_object(
    'rows', v_rows,
    'summary', jsonb_build_object(
      'report', 'hospitality_kpis',
      'tenant_id', p_tenant_id,
      'start_date', v_start_date,
      'end_date', v_end_date,
      'active_rooms', v_active_rooms,
      'occupied_room_nights', v_occupied_room_nights,
      'available_room_nights', v_available_room_nights,
      'occupancy_rate', v_occupancy,
      'adr', v_adr,
      'revpar', v_revpar,
      'room_revenue', v_room_revenue,
      'gop', v_gop,
      'ebitda', v_ebitda,
      'net_profit', v_net_profit,
      'net_profit_margin_pct', v_net_profit_margin,
      'current_ratio', v_current_ratio,
      'quick_ratio', v_quick_ratio,
      'working_capital', v_working_capital,
      'generated_at', now()
    )
  );
end; $$;

create or replace function public.rpt_usali_rooms_operating_statement(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$ begin return public.rpt_usali_department_statement(p_tenant_id, p_filters, 'Rooms'); end; $$;
create or replace function public.rpt_usali_food_beverage_operating_statement(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$ begin return public.rpt_usali_department_statement(p_tenant_id, p_filters, 'Food & Beverage'); end; $$;
create or replace function public.rpt_usali_admin_general_statement(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$ begin return public.rpt_usali_department_statement(p_tenant_id, p_filters, 'Administrative & General'); end; $$;
create or replace function public.rpt_usali_information_telecom_statement(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$ begin return public.rpt_usali_department_statement(p_tenant_id, p_filters, 'Information & Telecom Systems'); end; $$;
create or replace function public.rpt_usali_sales_marketing_statement(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$ begin return public.rpt_usali_department_statement(p_tenant_id, p_filters, 'Sales & Marketing'); end; $$;
create or replace function public.rpt_usali_property_operations_maintenance_statement(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$ begin return public.rpt_usali_department_statement(p_tenant_id, p_filters, 'Property Operations & Maintenance'); end; $$;
create or replace function public.rpt_usali_utility_costs_statement(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$ begin return public.rpt_usali_department_statement(p_tenant_id, p_filters, 'Utility Costs'); end; $$;

insert into public.report_departments (code, name, slug, icon, display_order, is_active)
values ('ACCOUNTS', 'Accounts', 'accounts', 'landmark', 10, true), ('OPERATIONS', 'Operations', 'operations', 'workflow', 20, true)
on conflict (code) do update set name = excluded.name, slug = excluded.slug, icon = excluded.icon, display_order = excluded.display_order, is_active = excluded.is_active;

with dept as (
  select id, code, slug from public.report_departments where code in ('ACCOUNTS', 'OPERATIONS')
), reports as (
  select * from (values
    ('ACCOUNTS', 'RPT-USALI-ROOMS', 'USALI Rooms Operating Statement', 'usali-rooms-operating-statement', 'rpt_usali_rooms_operating_statement', 'Rooms departmental operating statement', 10),
    ('ACCOUNTS', 'RPT-USALI-FNB', 'USALI Food & Beverage Operating Statement', 'usali-food-and-beverage-operating-statement', 'rpt_usali_food_beverage_operating_statement', 'Food & Beverage departmental operating statement', 11),
    ('ACCOUNTS', 'RPT-USALI-AG', 'USALI Administrative & General Statement', 'usali-administrative-and-general-statement', 'rpt_usali_admin_general_statement', 'Administrative & General departmental statement', 12),
    ('ACCOUNTS', 'RPT-USALI-ITS', 'USALI Information & Telecom Systems Statement', 'usali-information-and-telecom-systems-statement', 'rpt_usali_information_telecom_statement', 'Information & Telecom Systems statement', 13),
    ('ACCOUNTS', 'RPT-USALI-SM', 'USALI Sales & Marketing Statement', 'usali-sales-and-marketing-statement', 'rpt_usali_sales_marketing_statement', 'Sales & Marketing statement', 14),
    ('ACCOUNTS', 'RPT-USALI-POM', 'USALI Property Operations & Maintenance Statement', 'usali-property-operations-and-maintenance-statement', 'rpt_usali_property_operations_maintenance_statement', 'Property Operations & Maintenance statement', 15),
    ('ACCOUNTS', 'RPT-USALI-UTIL', 'USALI Utility Costs Statement', 'usali-utility-costs-statement', 'rpt_usali_utility_costs_statement', 'Utility costs statement', 16),
    ('ACCOUNTS', 'RPT-IFRS-PNL', 'Statement of Profit or Loss', 'statement-of-profit-or-loss', 'rpt_ifrs_profit_or_loss', 'IFRS profit or loss by function', 20),
    ('ACCOUNTS', 'RPT-IFRS-BS', 'Statement of Financial Position', 'statement-of-financial-position', 'rpt_ifrs_balance_sheet', 'IFRS balance sheet', 21),
    ('ACCOUNTS', 'RPT-IFRS-SCE', 'Statement of Changes in Equity', 'statement-of-changes-in-equity', 'rpt_ifrs_changes_in_equity', 'IFRS equity movements', 22),
    ('ACCOUNTS', 'RPT-IFRS-CF-D', 'Statement of Cash Flows - Direct', 'statement-of-cash-flows-direct', 'rpt_ifrs_cash_flows_direct', 'IFRS cash flow direct method', 23),
    ('ACCOUNTS', 'RPT-IFRS-CF-I', 'Statement of Cash Flows - Indirect', 'statement-of-cash-flows-indirect', 'rpt_ifrs_cash_flows_indirect', 'IFRS cash flow indirect method', 24),
    ('OPERATIONS', 'RPT-HOSP-KPI', 'Hospitality KPIs', 'hospitality-kpis', 'rpt_hospitality_kpis', 'RevPAR, ADR, occupancy and working capital ratios', 30)
  ) as v(dept_code, report_code, title, slug, source_function, description, display_order)
), upserted as (
  insert into public.report_catalog (report_code, department_id, title, slug, description, module_owner, cycle, primary_tables, route, display_order, cache_minutes, supports_table, supports_chart, supports_kpi, supports_print, supports_export_pdf, supports_export_excel, supports_schedule, is_active, source_function)
  select r.report_code, d.id, r.title, r.slug, r.description, 'reporting', 'Monthly', array['journal_entries', 'journal_lines', 'chart_of_accounts', 'reservation_rooms', 'reservations', 'rooms'], '/reports/' || d.slug || '/' || r.slug, r.display_order, 5, true, true, r.report_code = 'RPT-HOSP-KPI', true, true, true, false, true, r.source_function
  from reports r join dept d on d.code = r.dept_code
  on conflict (department_id, slug) do update set report_code = excluded.report_code, title = excluded.title, description = excluded.description, route = excluded.route, display_order = excluded.display_order, source_function = excluded.source_function, is_active = true
  returning report_code
)
select 1;

update public.report_catalog
set source_function = case
  when slug = 'usali-rooms-operating-statement' then 'rpt_usali_rooms_operating_statement'
  when slug = 'usali-food-and-beverage-operating-statement' then 'rpt_usali_food_beverage_operating_statement'
  when slug = 'usali-administrative-and-general-statement' then 'rpt_usali_admin_general_statement'
  when slug = 'usali-information-and-telecom-systems-statement' then 'rpt_usali_information_telecom_statement'
  when slug = 'usali-sales-and-marketing-statement' then 'rpt_usali_sales_marketing_statement'
  when slug = 'usali-property-operations-and-maintenance-statement' then 'rpt_usali_property_operations_maintenance_statement'
  when slug = 'usali-utility-costs-statement' then 'rpt_usali_utility_costs_statement'
  when slug = 'statement-of-profit-or-loss' then 'rpt_ifrs_profit_or_loss'
  when slug = 'statement-of-financial-position' then 'rpt_ifrs_balance_sheet'
  when slug = 'statement-of-changes-in-equity' then 'rpt_ifrs_changes_in_equity'
  when slug = 'statement-of-cash-flows-direct' then 'rpt_ifrs_cash_flows_direct'
  when slug = 'statement-of-cash-flows-indirect' then 'rpt_ifrs_cash_flows_indirect'
  when slug = 'hospitality-kpis' then 'rpt_hospitality_kpis'
  when slug in ('trial-balance', 'trial_balance') or report_code = 'RPT-014' then 'rpt_trial_balance'
  when slug in ('accounts-receivable-aging', 'ar-aging', 'ar_aging') or report_code = 'RPT-002' then 'rpt_ar_aging'
  else source_function
end
where is_active = true;

grant execute on function public.classify_account_for_reporting(text,text,text) to authenticated;
grant execute on function public.sync_account_department_mapping() to authenticated;
grant execute on function public.accounting_reporting_balances(uuid,date,date,date) to authenticated;
grant execute on function public.rpt_usali_department_statement(uuid,jsonb,text) to authenticated;
grant execute on function public.rpt_usali_rooms_operating_statement(uuid,jsonb) to authenticated;
grant execute on function public.rpt_usali_food_beverage_operating_statement(uuid,jsonb) to authenticated;
grant execute on function public.rpt_usali_admin_general_statement(uuid,jsonb) to authenticated;
grant execute on function public.rpt_usali_information_telecom_statement(uuid,jsonb) to authenticated;
grant execute on function public.rpt_usali_sales_marketing_statement(uuid,jsonb) to authenticated;
grant execute on function public.rpt_usali_property_operations_maintenance_statement(uuid,jsonb) to authenticated;
grant execute on function public.rpt_usali_utility_costs_statement(uuid,jsonb) to authenticated;
grant execute on function public.rpt_ifrs_profit_or_loss(uuid,jsonb) to authenticated;
grant execute on function public.rpt_ifrs_balance_sheet(uuid,jsonb) to authenticated;
grant execute on function public.rpt_ifrs_changes_in_equity(uuid,jsonb) to authenticated;
grant execute on function public.rpt_ifrs_cash_flows_direct(uuid,jsonb) to authenticated;
grant execute on function public.rpt_ifrs_cash_flows_indirect(uuid,jsonb) to authenticated;
grant execute on function public.rpt_hospitality_kpis(uuid,jsonb) to authenticated;

commit;
