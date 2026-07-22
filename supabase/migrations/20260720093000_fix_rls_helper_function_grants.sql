-- Fix runtime 42501 errors from RLS helper function execution.
-- Keep statements explicit so migration stays simple and readable.

GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_superuser() TO authenticated;

REVOKE EXECUTE ON FUNCTION public.current_tenant_id() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.my_role() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_superuser() FROM anon;
