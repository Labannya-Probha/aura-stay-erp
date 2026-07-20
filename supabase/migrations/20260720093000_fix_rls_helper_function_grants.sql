-- Fix runtime 42501 errors: permission denied for function current_tenant_id
-- These helpers are used by many RLS policies and must be executable by authenticated users.

DO $$
BEGIN
  IF to_regprocedure('public.current_tenant_id()') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
    REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM anon;
  END IF;

  IF to_regprocedure('public.is_admin()') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
    REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
  END IF;

  IF to_regprocedure('public.my_role()') IS NOT NULL THEN
    GRANT EXECUTE ON FUNCTION public.my_role() TO authenticated;
    REVOKE EXECUTE ON FUNCTION public.my_role() FROM anon;
  END IF;
END
$$;
