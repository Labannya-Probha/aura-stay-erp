-- Move exposed SECURITY DEFINER implementations out of public and re-expose
-- them through SECURITY INVOKER wrappers so Supabase lint findings clear
-- without changing RPC names used by the app.

CREATE SCHEMA IF NOT EXISTS private;

DO $$
DECLARE
  fn_name text;
  fn_oid oid;
BEGIN
  FOREACH fn_name IN ARRAY ARRAY[
    'current_tenant_id',
    'is_admin',
    'my_role',
    'is_superuser',
    'email_for_username',
    'dashboard_summary',
    'dashboard_revenue_trend',
    'dashboard_occupancy_trend',
    'dashboard_housekeeping_summary',
    'dashboard_restaurant_summary',
    'dashboard_operational_tasks',
    'dashboard_recent_activities'
  ] LOOP
    FOR fn_oid IN
      SELECT p.oid
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public'
        AND p.proname = fn_name
    LOOP
      EXECUTE format('ALTER FUNCTION %s SET SCHEMA private', fn_oid::regprocedure);
    END LOOP;
  END LOOP;
END
$$;

DO $$
DECLARE
  fn_oid oid;
BEGIN
  FOR fn_oid IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'private'
      AND p.proname IN (
        'current_tenant_id',
        'is_admin',
        'my_role',
        'is_superuser',
        'email_for_username'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, auth, pg_temp', fn_oid::regprocedure);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn_oid::regprocedure);
  END LOOP;
END
$$;

DO $$
DECLARE
  fn_oid oid;
BEGIN
  FOR fn_oid IN
    SELECT p.oid
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'private'
      AND p.proname IN (
        'dashboard_summary',
        'dashboard_revenue_trend',
        'dashboard_occupancy_trend',
        'dashboard_housekeeping_summary',
        'dashboard_restaurant_summary',
        'dashboard_operational_tasks',
        'dashboard_recent_activities'
      )
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', fn_oid::regprocedure);
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', fn_oid::regprocedure);
  END LOOP;
END
$$;

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = private, public, auth, pg_temp
AS $$
  SELECT private.current_tenant_id();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = private, public, auth, pg_temp
AS $$
  SELECT private.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = private, public, auth, pg_temp
AS $$
  SELECT private.my_role();
$$;

CREATE OR REPLACE FUNCTION public.is_superuser()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = private, public, auth, pg_temp
AS $$
  SELECT private.is_superuser();
$$;

CREATE OR REPLACE FUNCTION public.email_for_username(p_username text, p_slug text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = private, public, auth, pg_temp
AS $$
  SELECT private.email_for_username(p_username, p_slug)::text;
$$;

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

GRANT USAGE ON SCHEMA private TO anon, authenticated;

GRANT EXECUTE ON FUNCTION private.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_superuser() TO authenticated;

GRANT EXECUTE ON FUNCTION private.email_for_username(text, text) TO anon, authenticated;

GRANT EXECUTE ON FUNCTION private.dashboard_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION private.dashboard_revenue_trend() TO authenticated;
GRANT EXECUTE ON FUNCTION private.dashboard_occupancy_trend() TO authenticated;
GRANT EXECUTE ON FUNCTION private.dashboard_housekeeping_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION private.dashboard_restaurant_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION private.dashboard_operational_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION private.dashboard_recent_activities() TO authenticated;