CREATE OR REPLACE FUNCTION public.reservation_kpis()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'arrivals', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = public.current_tenant_id() AND check_in = current_date), 0),
    'departures', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = public.current_tenant_id() AND check_out = current_date), 0),
    'confirmed', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = public.current_tenant_id() AND status = 'CONFIRMED'), 0),
    'tentative', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = public.current_tenant_id() AND status IN ('TENTATIVE','QUERY','QUOTED')), 0),
    'cancelled', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = public.current_tenant_id() AND status = 'CANCELLED'), 0),
    'noShow', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = public.current_tenant_id() AND status = 'NO_SHOW'), 0)
  );
$$;

CREATE OR REPLACE FUNCTION public.reservation_list(p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'guestName', COALESCE(to_jsonb(r)->>'guest_name', to_jsonb(r)->>'guestName', 'Guest'),
    'checkIn', r.check_in,
    'checkOut', r.check_out,
    'roomNumber', COALESCE(to_jsonb(r)->>'room_number', to_jsonb(r)->>'room_no', '-'),
    'status', r.status
  ) ORDER BY r.check_in DESC), '[]'::jsonb)
  FROM public.reservations r
  WHERE r.tenant_id = public.current_tenant_id();
$$;

GRANT EXECUTE ON FUNCTION public.reservation_kpis() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reservation_list(jsonb) TO authenticated;
