CREATE OR REPLACE FUNCTION public.booking_calendar_data(
  p_start_date date,
  p_end_date date,
  p_filters jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant uuid := public.current_tenant_id();
BEGIN
  RETURN jsonb_build_object(
    'rooms', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', r.id,
        'number', COALESCE(r.room_no::text, r.room_number::text, r.name::text),
        'type', COALESCE(rt.name, r.room_type::text, 'Room')
      ) ORDER BY COALESCE(r.room_no::text, r.room_number::text, r.name::text))
      FROM public.rooms r
      LEFT JOIN public.room_types rt ON rt.id = r.room_type_id
      WHERE r.tenant_id = v_tenant
        AND COALESCE(r.is_active, true) = true
    ), '[]'::jsonb),

    'reservations', COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', res.id,
        'roomId', COALESCE(res.room_id, rr.room_id),
        'roomNumber', COALESCE(r.room_no::text, r.room_number::text, r.name::text),
        'guestName', COALESCE(g.full_name, g.name, res.guest_name, 'Guest'),
        'checkIn', res.check_in,
        'checkOut', res.check_out,
        'status', res.status,
        'source', COALESCE(res.source, res.booking_source, ''),
        'balance', COALESCE(res.balance_due, 0)
      ))
      FROM public.reservations res
      LEFT JOIN public.reservation_rooms rr ON rr.reservation_id = res.id
      LEFT JOIN public.rooms r ON r.id = COALESCE(res.room_id, rr.room_id)
      LEFT JOIN public.guests g ON g.id = res.guest_id
      WHERE res.tenant_id = v_tenant
        AND res.check_in <= p_end_date
        AND res.check_out >= p_start_date
        AND res.status NOT IN ('CANCELLED')
    ), '[]'::jsonb),

    'kpis', jsonb_build_object(
      'availableRooms', COALESCE((SELECT COUNT(*) FROM public.rooms WHERE tenant_id = v_tenant AND COALESCE(is_active, true) = true), 0),
      'occupiedRooms', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = v_tenant AND status = 'CHECKED_IN'), 0),
      'arrivals', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = v_tenant AND check_in = current_date), 0),
      'departures', COALESCE((SELECT COUNT(*) FROM public.reservations WHERE tenant_id = v_tenant AND check_out = current_date), 0),
      'outOfOrder', COALESCE((SELECT COUNT(*) FROM public.rooms WHERE tenant_id = v_tenant AND status IN ('OOO','OUT_OF_ORDER')), 0),
      'occupancy', 0
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.booking_calendar_data(date, date, jsonb) TO authenticated;
