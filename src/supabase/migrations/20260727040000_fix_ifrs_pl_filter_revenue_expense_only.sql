-- Fixes rpt_ifrs_profit_or_loss: the summary totals were correctly filtered
-- to REVENUE/EXPENSE account types, but the `rows` array itself included
-- every account in the chart of accounts (Assets, Liabilities, Equity too),
-- making the P&L look like a raw account dump instead of a real statement.

begin;

create or replace function public.rpt_ifrs_profit_or_loss(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
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
    where ifrs_statement_class in ('REVENUE', 'EXPENSE')
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
end; $function$;

commit;
