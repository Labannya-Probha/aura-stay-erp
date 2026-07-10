CREATE OR REPLACE FUNCTION public.reservation_kpi_summary(
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant uuid := public.current_tenant_id();
  v_today date := current_date;
BEGIN
  RETURN jsonb_build_object(
    'arrivals', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = v_tenant AND DATE(check_in) = v_today), 0),
    'departures', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = v_tenant AND DATE(check_out) = v_today), 0),
    'inHouse', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = v_tenant AND status = 'CHECKED_IN'), 0),
    'pendingPayments', 0
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.reservation_kpi_summary() TO authenticated;
