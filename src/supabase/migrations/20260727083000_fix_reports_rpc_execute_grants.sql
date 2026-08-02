begin;

-- Ensure reports RPC endpoints remain callable for logged-in users even after
-- broad hardening migrations or manual privilege drift.
do $$
declare
  fn record;
begin
  for fn in
    select p.oid::regprocedure as signature
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'aeds_report_metadata',
        'aeds_report_definition',
        'aeds_run_report'
      )
  loop
    execute format('revoke execute on function %s from public', fn.signature);
    execute format('revoke execute on function %s from anon', fn.signature);
    execute format('grant execute on function %s to authenticated', fn.signature);
    execute format('grant execute on function %s to service_role', fn.signature);
  end loop;
end $$;

commit;
