begin;

create or replace function public.rpt_multi_property_consolidated_performance(
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
  v_property_filter text;
  v_rows jsonb;
  v_total_properties int;
  v_avg_occupancy numeric(20,2);
  v_avg_adr numeric(20,2);
  v_avg_revpar numeric(20,2);
  v_total_room_revenue numeric(20,2);
  v_total_gop numeric(20,2);
  v_total_ebitda numeric(20,2);
  v_total_net_profit numeric(20,2);
  v_total_working_capital numeric(20,2);
begin
  if p_tenant_id is null then
    raise exception 'Tenant context missing for multi-property consolidated performance report' using errcode = 'P0001';
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
  v_property_filter := nullif(trim(coalesce(p_filters ->> 'property', p_filters ->> 'property_name', '')), '');

  with property_scope as (
    select
      p.id,
      p.slug,
      p.name
    from public.properties p
    where p.id = p_tenant_id
      and (
        v_property_filter is null
        or p.name = v_property_filter
        or p.slug = v_property_filter
      )
  ),
  metrics as (
    select
      ps.id as property_id,
      ps.slug as property_slug,
      ps.name as property_name,
      coalesce((report.summary ->> 'occupancy_rate')::numeric, 0) as occupancy_rate,
      coalesce((report.summary ->> 'adr')::numeric, 0) as adr,
      coalesce((report.summary ->> 'revpar')::numeric, 0) as revpar,
      coalesce((report.summary ->> 'room_revenue')::numeric, 0) as room_revenue,
      coalesce((report.summary ->> 'gop')::numeric, 0) as gop,
      coalesce((report.summary ->> 'ebitda')::numeric, 0) as ebitda,
      coalesce((report.summary ->> 'net_profit')::numeric, 0) as net_profit,
      coalesce((report.summary ->> 'working_capital')::numeric, 0) as working_capital
    from property_scope ps
    cross join lateral public.rpt_hospitality_kpis(
      ps.id,
      jsonb_build_object(
        'start_date', v_start_date,
        'end_date', v_end_date
      )
    ) report
  )
  select
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'property_id', m.property_id,
          'property_slug', m.property_slug,
          'property_name', m.property_name,
          'occupancy_rate', m.occupancy_rate,
          'adr', m.adr,
          'revpar', m.revpar,
          'room_revenue', m.room_revenue,
          'gop', m.gop,
          'ebitda', m.ebitda,
          'net_profit', m.net_profit,
          'working_capital', m.working_capital
        )
        order by m.property_name
      ),
      '[]'::jsonb
    ),
    count(*)::int,
    coalesce(round(avg(m.occupancy_rate), 2), 0),
    coalesce(round(avg(m.adr), 2), 0),
    coalesce(round(avg(m.revpar), 2), 0),
    coalesce(round(sum(m.room_revenue), 2), 0),
    coalesce(round(sum(m.gop), 2), 0),
    coalesce(round(sum(m.ebitda), 2), 0),
    coalesce(round(sum(m.net_profit), 2), 0),
    coalesce(round(sum(m.working_capital), 2), 0)
  into v_rows, v_total_properties, v_avg_occupancy, v_avg_adr, v_avg_revpar, v_total_room_revenue, v_total_gop, v_total_ebitda, v_total_net_profit, v_total_working_capital
  from metrics m;

  return jsonb_build_object(
    'rows', v_rows,
    'summary', jsonb_build_object(
      'report', 'multi_property_consolidated_performance',
      'tenant_id', p_tenant_id,
      'start_date', v_start_date,
      'end_date', v_end_date,
      'property_filter', v_property_filter,
      'total_properties', coalesce(v_total_properties, 0),
      'avg_occupancy_rate', coalesce(v_avg_occupancy, 0),
      'avg_adr', coalesce(v_avg_adr, 0),
      'avg_revpar', coalesce(v_avg_revpar, 0),
      'total_room_revenue', coalesce(v_total_room_revenue, 0),
      'total_gop', coalesce(v_total_gop, 0),
      'total_ebitda', coalesce(v_total_ebitda, 0),
      'total_net_profit', coalesce(v_total_net_profit, 0),
      'total_working_capital', coalesce(v_total_working_capital, 0),
      'generated_at', now()
    )
  );
end;
$$;

insert into public.report_definitions (department, name, key_fields, status)
values (
  'Admin & Audit',
  'Multi Property Consolidated Performance',
  'Property, Occupancy %, ADR, RevPAR, Room Revenue, GOP, EBITDA, Net Profit, Working Capital',
  'READY'
)
on conflict (department, name) do update set
  key_fields = excluded.key_fields,
  status = 'READY',
  updated_at = now();

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
  'RPT-032',
  d.id,
  'Multi Property Consolidated Performance',
  'multi-property-consolidated-performance',
  'Consolidated hospitality performance across all properties.',
  'reporting',
  'Monthly',
  array['properties', 'reservations', 'reservation_rooms', 'rooms', 'journal_entries', 'journal_lines', 'invoices', 'payments', 'pos_orders'],
  '/reports/' || d.slug || '/multi-property-consolidated-performance',
  40,
  5,
  true,
  true,
  true,
  true,
  true,
  true,
  false,
  true,
  'rpt_multi_property_consolidated_performance'
from public.report_departments d
where d.slug = 'admin'
on conflict (department_id, slug) do update set
  report_code = excluded.report_code,
  title = excluded.title,
  description = excluded.description,
  module_owner = excluded.module_owner,
  cycle = excluded.cycle,
  primary_tables = excluded.primary_tables,
  route = excluded.route,
  display_order = excluded.display_order,
  cache_minutes = excluded.cache_minutes,
  supports_table = excluded.supports_table,
  supports_chart = excluded.supports_chart,
  supports_kpi = excluded.supports_kpi,
  supports_print = excluded.supports_print,
  supports_export_pdf = excluded.supports_export_pdf,
  supports_export_excel = excluded.supports_export_excel,
  supports_schedule = excluded.supports_schedule,
  is_active = true,
  source_function = excluded.source_function;

grant execute on function public.rpt_multi_property_consolidated_performance(uuid, jsonb) to authenticated;

commit;
