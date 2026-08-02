begin;

do $$
declare
  v_tenant_id uuid;
  v_today date := current_date;
  v_year int := extract(year from current_date)::int;
  v_month int := extract(month from current_date)::int;
  v_invoice_no text := 'SAMPLE-AR-' || to_char(current_date, 'YYYYMMDD');
  v_reservation_id uuid;
begin
  v_tenant_id := coalesce(
    public.current_tenant_id(),
    (select id from public.properties order by created_at asc limit 1)
  );

  if v_tenant_id is null then
    raise notice 'Skipping sample reporting seeds: no tenant context could be resolved.';
    return;
  end if;

  -- Seed sample FX rates for Reporting FX Snapshot.
  insert into public.reporting_fx_rates (
    tenant_id,
    rate_date,
    base_currency,
    quote_currency,
    rate,
    source_system,
    notes
  )
  values
    (v_tenant_id, v_today, 'BDT', 'USD', 0.008500, 'sample_seed', 'Sample reporting seed'),
    (v_tenant_id, v_today, 'BDT', 'EUR', 0.007900, 'sample_seed', 'Sample reporting seed'),
    (v_tenant_id, v_today, 'BDT', 'GBP', 0.006700, 'sample_seed', 'Sample reporting seed')
  on conflict (tenant_id, rate_date, base_currency, quote_currency)
  do update set
    rate = excluded.rate,
    source_system = excluded.source_system,
    notes = excluded.notes,
    updated_at = now();

  -- Seed sample departmental budgets for USALI Departmental Statement.
  insert into public.reporting_budgets (
    tenant_id,
    scope_type,
    scope_key,
    budget_year,
    budget_month,
    currency_code,
    amount,
    notes
  )
  values
    (v_tenant_id, 'department', 'UNCLASSIFIED', v_year, v_month, 'BDT', 1250000, 'Sample reporting seed'),
    (v_tenant_id, 'department', 'ROOMS', v_year, v_month, 'BDT', 1850000, 'Sample reporting seed'),
    (v_tenant_id, 'department', 'FOOD_AND_BEVERAGE', v_year, v_month, 'BDT', 980000, 'Sample reporting seed')
  on conflict (tenant_id, scope_type, scope_key, budget_year, budget_month, currency_code)
  do update set
    amount = excluded.amount,
    notes = excluded.notes,
    updated_at = now();

  -- Seed minimal AR row for AR/AP Aging Schedule via invoices.
  select r.id
    into v_reservation_id
  from public.reservations r
  where r.tenant_id = v_tenant_id
  order by r.created_at desc nulls last, r.id desc
  limit 1;

  begin
    insert into public.invoices (
      tenant_id,
      reservation_id,
      invoice_no,
      issued_at,
      invoice_type,
      charges,
      totals,
      paid,
      due,
      status,
      is_void
    )
    select
      v_tenant_id,
      v_reservation_id,
      v_invoice_no,
      now() - interval '35 days',
      'GUEST_BILL',
      '[]'::jsonb,
      jsonb_build_object('grand_total', 15000, 'currency', 'BDT'),
      0,
      15000,
      'PARTIAL',
      false
    where not exists (
      select 1
      from public.invoices i
      where i.tenant_id = v_tenant_id
        and i.invoice_no = v_invoice_no
    );
  exception when undefined_column then
    begin
      insert into public.invoices (
        tenant_id,
        invoice_no,
        issued_at,
        paid,
        due,
        status,
        is_void
      )
      select
        v_tenant_id,
        v_invoice_no,
        now() - interval '35 days',
        0,
        15000,
        'PARTIAL',
        false
      where not exists (
        select 1
        from public.invoices i
        where i.tenant_id = v_tenant_id
          and i.invoice_no = v_invoice_no
      );
    exception when others then
      raise notice 'Skipping invoice sample seed (fallback insert failed): %', sqlerrm;
    end;
  when others then
    raise notice 'Skipping invoice sample seed (primary insert failed): %', sqlerrm;
  end;
end $$;

commit;
