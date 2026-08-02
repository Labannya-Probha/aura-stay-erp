begin;

-- Compatibility overload for the legacy frontend service that sends p_tenant_id.
-- The supplied tenant id is NEVER trusted. It must match current_tenant_id().
create or replace function public.aeds_run_report(
  p_department_slug text,
  p_report_slug text,
  p_filters jsonb default '{}'::jsonb,
  p_tenant_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_current_tenant_id uuid;
begin
  v_current_tenant_id := public.current_tenant_id();

  if v_current_tenant_id is null then
    raise exception 'Tenant context missing for report execution'
      using errcode = 'P0001';
  end if;

  if p_tenant_id is not null and p_tenant_id <> v_current_tenant_id then
    raise exception 'Tenant context mismatch for report execution'
      using errcode = '42501';
  end if;

  return public.aeds_run_report(
    p_department_slug,
    p_report_slug,
    coalesce(p_filters, '{}'::jsonb)
  );
end;
$$;

revoke all on function public.aeds_run_report(text, text, jsonb, uuid) from public;
grant execute on function public.aeds_run_report(text, text, jsonb, uuid) to authenticated;

commit;
