-- Restore authenticated execute privilege for wipe_module RPC.
-- This fixes "permission denied for function wipe_module" in Settings -> Data Wipe.

DO $$
DECLARE
  fn_rec RECORD;
BEGIN
  FOR fn_rec IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'wipe_module'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', fn_rec.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', fn_rec.sig);
  END LOOP;
END
$$;
