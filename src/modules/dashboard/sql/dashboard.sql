CREATE OR REPLACE FUNCTION public.dashboard_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant uuid := public.current_tenant_id();
  v_today date := current_date;
  v_total_rooms numeric := 0;
  v_in_house numeric := 0;
  v_adr numeric := 0;
BEGIN
  SELECT COALESCE(COUNT(*), 0)
  INTO v_total_rooms
  FROM public.rooms
  WHERE tenant_id = v_tenant
    AND COALESCE(is_active, true) = true;

  SELECT COALESCE(COUNT(*), 0)
  INTO v_in_house
  FROM public.reservations
  WHERE tenant_id = v_tenant
    AND status = 'CHECKED_IN';

  SELECT COALESCE(AVG(COALESCE(NULLIF(to_jsonb(r)->>'room_rate','')::numeric, 0)), 0)
  INTO v_adr
  FROM public.reservations r
  WHERE tenant_id = v_tenant
    AND status = 'CHECKED_IN';

  RETURN jsonb_build_object(
    'occupancy', CASE WHEN v_total_rooms > 0 THEN ROUND((v_in_house / v_total_rooms) * 100) ELSE 0 END,
    'adr', ROUND(v_adr),
    'revpar', CASE WHEN v_total_rooms > 0 THEN ROUND(v_adr * (v_in_house / v_total_rooms)) ELSE 0 END,
    'roomRevenue', 0,
    'restaurantRevenue', 0,
    'cashCollection', 0,
    'arrivals', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = v_tenant AND check_in = v_today), 0),
    'departures', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = v_tenant AND check_out = v_today), 0),
    'inHouseGuests', v_in_house,
    'availableRooms', GREATEST(v_total_rooms - v_in_house, 0),
    'dirtyRooms', COALESCE((SELECT COUNT(*) FROM public.rooms WHERE tenant_id = v_tenant AND status = 'DIRTY'), 0),
    'pendingTasks', 0
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.dashboard_revenue_trend()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'day', d::date::text,
    'room', 0,
    'pos', 0
  ) ORDER BY d), '[]'::jsonb)
  FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') d;
$$;

CREATE OR REPLACE FUNCTION public.dashboard_occupancy_trend()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'day', d::date::text,
    'value', COALESCE((
      SELECT COUNT(*)
      FROM public.reservations r
      WHERE r.tenant_id = public.current_tenant_id()
        AND r.status = 'CHECKED_IN'
        AND d::date BETWEEN r.check_in AND r.check_out
    ), 0)
  ) ORDER BY d), '[]'::jsonb)
  FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') d;
$$;

CREATE OR REPLACE FUNCTION public.dashboard_housekeeping_summary()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'clean', COUNT(*) FILTER (WHERE status = 'CLEAN'),
    'dirty', COUNT(*) FILTER (WHERE status = 'DIRTY'),
    'inspection', COUNT(*) FILTER (WHERE status = 'INSPECTION'),
    'outOfOrder', COUNT(*) FILTER (WHERE status IN ('OOO','OUT_OF_ORDER'))
  )
  FROM public.rooms
  WHERE tenant_id = public.current_tenant_id();
$$;

CREATE OR REPLACE FUNCTION public.dashboard_restaurant_summary()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_object(
    'sales', 0,
    'orders', 0,
    'openKot', 0,
    'averageBill', 0,
    'topItem', '-'
  );
$$;

CREATE OR REPLACE FUNCTION public.dashboard_operational_tasks()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_array(
    jsonb_build_object('label', 'Pending Check-ins', 'value',
      (SELECT COUNT(*) FROM public.reservations WHERE tenant_id = public.current_tenant_id() AND check_in = current_date)
    ),
    jsonb_build_object('label', 'Pending Check-outs', 'value',
      (SELECT COUNT(*) FROM public.reservations WHERE tenant_id = public.current_tenant_id() AND check_out = current_date)
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.dashboard_recent_activities()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT jsonb_build_array(
    jsonb_build_object('time', to_char(now(), 'HH24:MI'), 'title', 'Dashboard refreshed', 'meta', 'System')
  );
$$;

GRANT EXECUTE ON FUNCTION public.dashboard_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_revenue_trend() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_occupancy_trend() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_housekeeping_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_restaurant_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_operational_tasks() TO authenticated;
GRANT EXECUTE ON FUNCTION public.dashboard_recent_activities() TO authenticated;
