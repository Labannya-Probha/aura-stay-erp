create or replace function public.aeds_report_metadata(p_role text default 'FRONT_OFFICE')
returns jsonb
language plpgsql
security definer
as $$
begin
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'department', jsonb_build_object('code', d.code, 'name', d.name, 'slug', d.slug, 'icon', d.icon),
      'reports', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'id', r.id,
          'reportCode', r.report_code,
          'title', r.title,
          'slug', r.slug,
          'route', r.route,
          'description', r.description,
          'cycle', r.cycle,
          'access', jsonb_build_object(
            'canView', coalesce(a.can_view, p_role in ('SUPERUSER','ADMIN')),
            'canExport', coalesce(a.can_export, p_role in ('SUPERUSER','ADMIN')),
            'canPrint', coalesce(a.can_print, p_role in ('SUPERUSER','ADMIN')),
            'canSchedule', coalesce(a.can_schedule, false)
          )
        ) order by r.display_order), '[]'::jsonb)
        from public.report_catalog r
        left join public.report_role_access a on a.report_id = r.id and a.role = p_role
        where r.department_id = d.id and r.is_active = true
          and coalesce(a.can_view, p_role in ('SUPERUSER','ADMIN')) = true
      )
    ) order by d.display_order)
    from public.report_departments d
    where d.is_active = true
  ), '[]'::jsonb);
end;
$$;

create or replace function public.aeds_report_definition(p_department_slug text, p_report_slug text, p_role text default 'FRONT_OFFICE')
returns jsonb
language plpgsql
security definer
as $$
declare v_report_id uuid;
begin
  select r.id into v_report_id
  from public.report_catalog r
  join public.report_departments d on d.id = r.department_id
  left join public.report_role_access a on a.report_id = r.id and a.role = p_role
  where d.slug = p_department_slug and r.slug = p_report_slug and r.is_active = true
    and coalesce(a.can_view, p_role in ('SUPERUSER','ADMIN')) = true
  limit 1;

  if v_report_id is null then return null; end if;

  return (
    select jsonb_build_object(
      'department', jsonb_build_object('code', d.code, 'name', d.name, 'slug', d.slug, 'icon', d.icon),
      'report', jsonb_build_object('id', r.id, 'reportCode', r.report_code, 'title', r.title, 'slug', r.slug, 'route', r.route, 'description', r.description, 'supportsPrint', r.supports_print, 'supportsExportPdf', r.supports_export_pdf, 'supportsExportExcel', r.supports_export_excel),
      'fields', (select coalesce(jsonb_agg(jsonb_build_object('fieldKey', field_key, 'label', label, 'dataType', data_type, 'displayFormat', display_format, 'aggregation', aggregation, 'alignment', alignment, 'sortable', sortable, 'filterable', filterable) order by display_order), '[]'::jsonb) from public.report_fields where report_id = r.id and is_visible = true),
      'filters', (select coalesce(jsonb_agg(jsonb_build_object('filterKey', filter_key, 'label', label, 'filterType', filter_type, 'sourceOptions', source_options, 'defaultValue', default_value, 'required', required, 'isGlobal', is_global) order by display_order), '[]'::jsonb) from public.report_filters where report_id = r.id or is_global = true),
      'actions', (select coalesce(jsonb_agg(jsonb_build_object('actionKey', action_key, 'label', label) order by display_order), '[]'::jsonb) from public.report_actions where report_id = r.id and is_enabled = true)
    )
    from public.report_catalog r join public.report_departments d on d.id = r.department_id
    where r.id = v_report_id
  );
end;
$$;

create or replace function public.aeds_run_report(p_department_slug text, p_report_slug text, p_filters jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
as $$
begin
  return jsonb_build_object(
    'rows', jsonb_build_array(
      jsonb_build_object('transaction_date', current_date::text, 'reference_no', 'JV-0001', 'account_name', 'Cash', 'particulars', 'Opening balance', 'debit', 25000, 'credit', 0, 'balance', 25000, 'status', 'Posted'),
      jsonb_build_object('transaction_date', current_date::text, 'reference_no', 'JV-0002', 'account_name', 'Room Revenue', 'particulars', 'Room sales posted', 'debit', 0, 'credit', 18000, 'balance', 7000, 'status', 'Posted'),
      jsonb_build_object('transaction_date', current_date::text, 'reference_no', 'JV-0003', 'account_name', 'Restaurant Revenue', 'particulars', 'POS sales posted', 'debit', 0, 'credit', 7200, 'balance', -200, 'status', 'Posted')
    ),
    'summary', jsonb_build_object('demoMode', true, 'filters', p_filters)
  );
end;
$$;

grant execute on function public.aeds_report_metadata(text) to authenticated;
grant execute on function public.aeds_report_definition(text,text,text) to authenticated;
grant execute on function public.aeds_run_report(text,text,jsonb) to authenticated;
