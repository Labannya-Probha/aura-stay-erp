begin;

alter table public.report_catalog
  add column if not exists source_function text;

alter table public.report_catalog
  drop constraint if exists report_catalog_source_function_chk;

alter table public.report_catalog
  add constraint report_catalog_source_function_chk
  check (source_function is null or source_function ~ '^rpt_[a-z_]+$');

create index if not exists idx_report_catalog_source_function
  on public.report_catalog (source_function)
  where source_function is not null;

create index if not exists idx_journal_entries_tenant_jv_date
  on public.journal_entries (tenant_id, jv_date, id);

create index if not exists idx_journal_lines_tenant_entry_account
  on public.journal_lines (tenant_id, entry_id, account_id);

create index if not exists idx_invoices_tenant_issued_due
  on public.invoices (tenant_id, issued_at, due);

create or replace function public.rpt_trial_balance(
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
  v_limit int;
  v_offset int;
  v_rows jsonb;
  v_total_rows int;
  v_total_debit numeric(20,2);
  v_total_credit numeric(20,2);
  v_total_balance numeric(20,2);
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for rpt_trial_balance' using errcode = 'P0001';
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

  v_limit := least(greatest(coalesce((p_filters ->> 'p_limit')::int, 200), 1), 2000);
  v_offset := greatest(coalesce((p_filters ->> 'p_offset')::int, 0), 0);

  with base as (
    select
      coa.id as account_id,
      coa.code as account_code,
      coa.name as account_name,
      coalesce(coa.type, 'UNCLASSIFIED') as account_type,
      round(sum(coalesce(jl.debit, 0)), 2) as debit,
      round(sum(coalesce(jl.credit, 0)), 2) as credit,
      round(sum(coalesce(jl.debit, 0) - coalesce(jl.credit, 0)), 2) as balance
    from public.journal_lines jl
    join public.journal_entries je on je.id = jl.entry_id
    join public.chart_of_accounts coa on coa.id = jl.account_id
    where jl.tenant_id = p_tenant_id
      and je.tenant_id = p_tenant_id
      and coa.tenant_id = p_tenant_id
      and (v_start_date is null or coalesce(je.jv_date, je.created_at::date) >= v_start_date)
      and (v_end_date is null or coalesce(je.jv_date, je.created_at::date) <= v_end_date)
    group by coa.id, coa.code, coa.name, coa.type
  ),
  numbered as (
    select
      b.*,
      row_number() over (order by b.account_code, b.account_name) as row_no
    from base b
  ),
  paged as (
    select *
    from numbered
    where row_no > v_offset
    order by row_no
    limit v_limit
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'row_no', p.row_no,
          'account_id', p.account_id,
          'account_code', p.account_code,
          'account_name', p.account_name,
          'account_type', p.account_type,
          'debit', p.debit,
          'credit', p.credit,
          'balance', p.balance
        )
        order by p.row_no
      ),
      '[]'::jsonb
    ),
    (select count(*)::int from base),
    (select coalesce(round(sum(debit), 2), 0) from base),
    (select coalesce(round(sum(credit), 2), 0) from base),
    (select coalesce(round(sum(balance), 2), 0) from base)
  into v_rows, v_total_rows, v_total_debit, v_total_credit, v_total_balance
  from paged p;

  return jsonb_build_object(
    'rows', v_rows,
    'summary', jsonb_build_object(
      'report', 'trial_balance',
      'tenant_id', p_tenant_id,
      'start_date', v_start_date,
      'end_date', v_end_date,
      'limit', v_limit,
      'offset', v_offset,
      'total_rows', coalesce(v_total_rows, 0),
      'total_debit', coalesce(v_total_debit, 0),
      'total_credit', coalesce(v_total_credit, 0),
      'total_balance', coalesce(v_total_balance, 0),
      'generated_at', now()
    )
  );
end;
$$;

create or replace function public.rpt_ar_aging(
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
  v_limit int;
  v_offset int;
  v_rows jsonb;
  v_total_rows int;
  v_total_outstanding numeric(20,2);
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for rpt_ar_aging' using errcode = 'P0001';
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

  v_as_of := coalesce(v_as_of, current_date);
  v_limit := least(greatest(coalesce((p_filters ->> 'p_limit')::int, 200), 1), 2000);
  v_offset := greatest(coalesce((p_filters ->> 'p_offset')::int, 0), 0);

  with base as (
    select
      i.id as invoice_id,
      i.invoice_no,
      i.reservation_id,
      coalesce(r.res_no, i.reservation_id::text) as folio_no,
      coalesce(r.reservation_name, g.full_name, 'Guest') as guest_name,
      coalesce(i.issued_at::date, current_date) as invoice_date,
      greatest(round(coalesce(i.due, 0), 2), 0) as outstanding,
      greatest((v_as_of - coalesce(i.issued_at::date, current_date)), 0)::int as days_overdue
    from public.invoices i
    left join public.reservations r on r.id = i.reservation_id
    left join public.guests g on g.id = r.primary_guest_id
    where i.tenant_id = p_tenant_id
      and coalesce(i.is_void, false) = false
      and greatest(coalesce(i.due, 0), 0) > 0
      and (v_start_date is null or coalesce(i.issued_at::date, current_date) >= v_start_date)
      and (v_end_date is null or coalesce(i.issued_at::date, current_date) <= v_end_date)
  ),
  shaped as (
    select
      b.*,
      case when b.days_overdue between 0 and 30 then b.outstanding else 0 end as bucket_0_30,
      case when b.days_overdue between 31 and 60 then b.outstanding else 0 end as bucket_31_60,
      case when b.days_overdue between 61 and 90 then b.outstanding else 0 end as bucket_61_90,
      case when b.days_overdue >= 91 then b.outstanding else 0 end as bucket_91_plus
    from base b
  ),
  numbered as (
    select
      s.*,
      row_number() over (order by s.days_overdue desc, s.invoice_date asc, s.invoice_no asc) as row_no
    from shaped s
  ),
  paged as (
    select *
    from numbered
    where row_no > v_offset
    order by row_no
    limit v_limit
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'row_no', p.row_no,
          'invoice_id', p.invoice_id,
          'invoice_no', p.invoice_no,
          'reservation_id', p.reservation_id,
          'folio_no', p.folio_no,
          'guest_name', p.guest_name,
          'invoice_date', p.invoice_date,
          'days_overdue', p.days_overdue,
          'outstanding', p.outstanding,
          'bucket_0_30', p.bucket_0_30,
          'bucket_31_60', p.bucket_31_60,
          'bucket_61_90', p.bucket_61_90,
          'bucket_91_plus', p.bucket_91_plus
        )
        order by p.row_no
      ),
      '[]'::jsonb
    ),
    (select count(*)::int from shaped),
    (select coalesce(round(sum(outstanding), 2), 0) from shaped)
  into v_rows, v_total_rows, v_total_outstanding
  from paged p;

  return jsonb_build_object(
    'rows', v_rows,
    'summary', jsonb_build_object(
      'report', 'ar_aging',
      'tenant_id', p_tenant_id,
      'as_of_date', v_as_of,
      'start_date', v_start_date,
      'end_date', v_end_date,
      'limit', v_limit,
      'offset', v_offset,
      'total_rows', coalesce(v_total_rows, 0),
      'total_outstanding', coalesce(v_total_outstanding, 0),
      'generated_at', now()
    )
  );
end;
$$;

update public.report_catalog
set source_function = case
  when slug in ('trial-balance', 'trial_balance') or report_code = 'RPT-014' then 'rpt_trial_balance'
  when slug in ('accounts-receivable-aging', 'ar-aging', 'ar_aging') or report_code = 'RPT-002' then 'rpt_ar_aging'
  else source_function
end
where is_active = true;

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
begin
  if coalesce(trim(p_department_slug), '') = '' then
    raise exception 'department slug is required' using errcode = '22023';
  end if;

  if coalesce(trim(p_report_slug), '') = '' then
    raise exception 'report slug is required' using errcode = '22023';
  end if;

  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'Tenant context missing for report execution' using errcode = 'P0001';
  end if;

  select r.source_function
    into v_source_function
  from public.report_catalog r
  join public.report_departments d on d.id = r.department_id
  where d.slug = p_department_slug
    and r.slug = p_report_slug
    and d.is_active = true
    and r.is_active = true
  limit 1;

  if v_source_function is null then
    raise exception 'No source function mapped for report %.%', p_department_slug, p_report_slug
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

  execute format('select public.%I($1, $2)', v_source_function)
    into v_payload
    using v_tenant_id, coalesce(p_filters, '{}'::jsonb);

  return jsonb_build_object(
    'rows', coalesce(v_payload -> 'rows', '[]'::jsonb),
    'summary', coalesce(v_payload -> 'summary', '{}'::jsonb) || jsonb_build_object(
      'department_slug', p_department_slug,
      'report_slug', p_report_slug,
      'source_function', v_source_function,
      'tenant_id', v_tenant_id
    )
  );
end;
$$;

drop materialized view if exists public.mv_monthly_account_balances;

create materialized view public.mv_monthly_account_balances
as
select
  jl.tenant_id,
  date_trunc('month', coalesce(je.jv_date, je.created_at::date))::date as period_month,
  jl.account_id,
  coa.code as account_code,
  coa.name as account_name,
  coalesce(coa.type, 'UNCLASSIFIED') as account_type,
  round(sum(coalesce(jl.debit, 0)), 2) as monthly_debit,
  round(sum(coalesce(jl.credit, 0)), 2) as monthly_credit,
  round(sum(coalesce(jl.debit, 0) - coalesce(jl.credit, 0)), 2) as net_change,
  max(je.created_at) as last_entry_at
from public.journal_lines jl
join public.journal_entries je on je.id = jl.entry_id
join public.chart_of_accounts coa on coa.id = jl.account_id
group by
  jl.tenant_id,
  date_trunc('month', coalesce(je.jv_date, je.created_at::date))::date,
  jl.account_id,
  coa.code,
  coa.name,
  coa.type
with no data;

create unique index if not exists uq_mv_monthly_account_balances
  on public.mv_monthly_account_balances (tenant_id, period_month, account_id);

create index if not exists idx_mv_monthly_account_balances_lookup
  on public.mv_monthly_account_balances (tenant_id, period_month, account_code);

create or replace function public.refresh_mv_monthly_account_balances(p_tenant_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_tenant_id is null then
    -- Note: CONCURRENTLY cannot execute inside a function transaction context.
    -- For zero-downtime refresh from a scheduler/maintenance session, run:
    --   REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_monthly_account_balances;
    refresh materialized view public.mv_monthly_account_balances;
    return;
  end if;

  delete from public.mv_monthly_account_balances mv
  where mv.tenant_id = p_tenant_id;

  insert into public.mv_monthly_account_balances (
    tenant_id,
    period_month,
    account_id,
    account_code,
    account_name,
    account_type,
    monthly_debit,
    monthly_credit,
    net_change,
    last_entry_at
  )
  select
    jl.tenant_id,
    date_trunc('month', coalesce(je.jv_date, je.created_at::date))::date as period_month,
    jl.account_id,
    coa.code,
    coa.name,
    coalesce(coa.type, 'UNCLASSIFIED') as account_type,
    round(sum(coalesce(jl.debit, 0)), 2),
    round(sum(coalesce(jl.credit, 0)), 2),
    round(sum(coalesce(jl.debit, 0) - coalesce(jl.credit, 0)), 2),
    max(je.created_at)
  from public.journal_lines jl
  join public.journal_entries je on je.id = jl.entry_id
  join public.chart_of_accounts coa on coa.id = jl.account_id
  where jl.tenant_id = p_tenant_id
    and je.tenant_id = p_tenant_id
    and coa.tenant_id = p_tenant_id
  group by
    jl.tenant_id,
    date_trunc('month', coalesce(je.jv_date, je.created_at::date))::date,
    jl.account_id,
    coa.code,
    coa.name,
    coa.type;
end;
$$;

grant execute on function public.rpt_trial_balance(uuid,jsonb) to authenticated;
grant execute on function public.rpt_ar_aging(uuid,jsonb) to authenticated;
grant execute on function public.aeds_run_report(text,text,jsonb) to authenticated;
grant execute on function public.refresh_mv_monthly_account_balances(uuid) to authenticated;

commit;
