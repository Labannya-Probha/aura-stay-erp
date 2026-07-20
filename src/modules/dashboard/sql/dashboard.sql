-- Dashboard RPC wrappers. The implementations are moved into the private
-- schema by the matching migration so the public RPC surface stays invoker-only.

CREATE OR REPLACE FUNCTION public.dashboard_summary()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, public, pg_temp
AS $$
  SELECT private.dashboard_summary();
$$;

CREATE OR REPLACE FUNCTION public.dashboard_revenue_trend()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, public, pg_temp
AS $$
  SELECT private.dashboard_revenue_trend();
$$;

CREATE OR REPLACE FUNCTION public.dashboard_occupancy_trend()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, public, pg_temp
AS $$
  SELECT private.dashboard_occupancy_trend();
$$;

CREATE OR REPLACE FUNCTION public.dashboard_housekeeping_summary()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, public, pg_temp
AS $$
  SELECT private.dashboard_housekeeping_summary();
$$;

CREATE OR REPLACE FUNCTION public.dashboard_restaurant_summary()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, public, pg_temp
AS $$
  SELECT private.dashboard_restaurant_summary();
$$;

CREATE OR REPLACE FUNCTION public.dashboard_operational_tasks()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, public, pg_temp
AS $$
  SELECT private.dashboard_operational_tasks();
$$;

CREATE OR REPLACE FUNCTION public.dashboard_recent_activities()
RETURNS jsonb
LANGUAGE sql
SECURITY INVOKER
SET search_path = private, public, pg_temp
AS $$
  SELECT private.dashboard_recent_activities();
$$;

REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_role() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_superuser() FROM PUBLIC;

REVOKE EXECUTE ON FUNCTION public.dashboard_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dashboard_revenue_trend() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dashboard_occupancy_trend() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dashboard_housekeeping_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dashboard_restaurant_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dashboard_operational_tasks() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dashboard_recent_activities() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superuser() TO authenticated;

GRANT EXECUTE ON FUNCTION public.dashboard_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_revenue_trend() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_occupancy_trend() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_housekeeping_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_restaurant_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_operational_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_recent_activities() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.email_for_username(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.email_for_username(text, text) TO anon, authenticated;
