-- Fixes rpt_usali_department_statement — the shared function powering all 7
-- USALI departmental statements (Rooms, F&B, A&G, IT, S&M, POM, Utilities).
-- It filtered by department correctly but not by usali_line_group, so
-- Asset/Liability/Equity accounts belonging to a department (e.g.
-- "Restaurant Cash" tagged Food & Beverage) leaked into that department's
-- operating statement. One fix here corrects all 7 statements at once.

begin;

create or replace function public.rpt_usali_department_statement(p_tenant_id uuid, p_filters jsonb default '{}'::jsonb, p_department text default null::text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
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
$function$;

commit;
