CREATE OR REPLACE FUNCTION public.front_office_arrivals(p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'reservationId', r.id,
    'guestName', COALESCE(to_jsonb(r)->>'guest_name', to_jsonb(r)->>'guestName', 'Guest'),
    'arrivalTime', COALESCE(to_jsonb(r)->>'arrival_time', 'Expected'),
    'roomType', COALESCE(to_jsonb(r)->>'room_type', '-'),
    'roomNumber', COALESCE(to_jsonb(r)->>'room_number', to_jsonb(r)->>'room_no', '-'),
    'source', COALESCE(to_jsonb(r)->>'source', to_jsonb(r)->>'booking_source', '-')
  )), '[]'::jsonb)
  FROM public.reservations r
  WHERE r.tenant_id = public.current_tenant_id()
    AND r.check_in = current_date
    AND r.status IN ('CONFIRMED','GUARANTEED','QUERY','QUOTED');
$$;

CREATE OR REPLACE FUNCTION public.front_office_departures(p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'reservationId', r.id,
    'guestName', COALESCE(to_jsonb(r)->>'guest_name', to_jsonb(r)->>'guestName', 'Guest'),
    'roomNumber', COALESCE(to_jsonb(r)->>'room_number', to_jsonb(r)->>'room_no', '-'),
    'departureTime', COALESCE(to_jsonb(r)->>'departure_time', 'Expected'),
    'balance', COALESCE(NULLIF(to_jsonb(r)->>'balance_due','')::numeric, 0)
  )), '[]'::jsonb)
  FROM public.reservations r
  WHERE r.tenant_id = public.current_tenant_id()
    AND r.check_out = current_date
    AND r.status = 'CHECKED_IN';
$$;

CREATE OR REPLACE FUNCTION public.front_office_in_house(p_filters jsonb DEFAULT '{}'::jsonb)
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'reservationId', r.id,
    'guestName', COALESCE(to_jsonb(r)->>'guest_name', to_jsonb(r)->>'guestName', 'Guest'),
    'roomNumber', COALESCE(to_jsonb(r)->>'room_number', to_jsonb(r)->>'room_no', '-'),
    'checkIn', r.check_in,
    'checkOut', r.check_out,
    'balance', COALESCE(NULLIF(to_jsonb(r)->>'balance_due','')::numeric, 0)
  )), '[]'::jsonb)
  FROM public.reservations r
  WHERE r.tenant_id = public.current_tenant_id()
    AND r.status = 'CHECKED_IN';
$$;