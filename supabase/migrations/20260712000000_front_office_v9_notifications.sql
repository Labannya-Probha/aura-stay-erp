CREATE TABLE IF NOT EXISTS public.lost_found_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
  item_name text NOT NULL,
  room_no text,
  found_location text,
  storage_location text,
  found_by text,
  status text NOT NULL DEFAULT 'FOUND',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.guest_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
  reservation_id uuid REFERENCES public.reservations(id) ON DELETE SET NULL,
  guest_name text,
  room_no text,
  message_type text NOT NULL DEFAULT 'MESSAGE',
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'NORMAL',
  status text NOT NULL DEFAULT 'OPEN',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL DEFAULT public.current_tenant_id(),
  user_id uuid,
  module text NOT NULL,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'INFO',
  title text NOT NULL,
  description text,
  target_url text,
  entity_type text,
  entity_id text,
  dedupe_key text,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_notifications_tenant_dedupe
ON public.notifications (tenant_id, dedupe_key)
WHERE dedupe_key IS NOT NULL AND is_read = false;

ALTER TABLE public.lost_found_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guest_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS lost_found_items_tenant ON public.lost_found_items;
CREATE POLICY lost_found_items_tenant
ON public.lost_found_items
FOR ALL TO authenticated
USING (tenant_id = public.current_tenant_id())
WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS guest_messages_tenant ON public.guest_messages;
CREATE POLICY guest_messages_tenant
ON public.guest_messages
FOR ALL TO authenticated
USING (tenant_id = public.current_tenant_id())
WITH CHECK (tenant_id = public.current_tenant_id());

DROP POLICY IF EXISTS notifications_tenant ON public.notifications;
CREATE POLICY notifications_tenant
ON public.notifications
FOR ALL TO authenticated
USING (
  tenant_id = public.current_tenant_id()
  AND (user_id IS NULL OR user_id = auth.uid())
)
WITH CHECK (tenant_id = public.current_tenant_id());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lost_found_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;

CREATE OR REPLACE FUNCTION public.notification_center_feed(p_limit integer DEFAULT 100)
RETURNS TABLE (
  id uuid,
  module text,
  category text,
  severity text,
  title text,
  description text,
  target_url text,
  entity_type text,
  entity_id text,
  is_read boolean,
  created_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    n.id,
    n.module,
    n.category,
    n.severity,
    n.title,
    n.description,
    n.target_url,
    n.entity_type,
    n.entity_id,
    n.is_read,
    n.created_at
  FROM public.notifications n
  WHERE n.tenant_id = public.current_tenant_id()
    AND (n.user_id IS NULL OR n.user_id = auth.uid())
    AND (n.expires_at IS NULL OR n.expires_at > now())
  ORDER BY
    n.is_read ASC,
    CASE n.severity
      WHEN 'CRITICAL' THEN 1
      WHEN 'HIGH' THEN 2
      WHEN 'MEDIUM' THEN 3
      ELSE 4
    END,
    n.created_at DESC
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 100), 1), 500);
$$;

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE id = p_notification_id
    AND tenant_id = public.current_tenant_id()
    AND (user_id IS NULL OR user_id = auth.uid());

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_all_notifications_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.notifications
  SET is_read = true, read_at = now()
  WHERE tenant_id = public.current_tenant_id()
    AND is_read = false
    AND (user_id IS NULL OR user_id = auth.uid());

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.refresh_operational_notifications()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant uuid := public.current_tenant_id();
  v_count integer := 0;
BEGIN
  INSERT INTO public.notifications (
    tenant_id, module, category, severity, title,
    description, target_url, entity_type, entity_id, dedupe_key
  )
  SELECT
    v_tenant,
    'Front Office',
    'Arrival',
    'HIGH',
    'Today arrival pending',
    r.res_no || ' · ' || COALESCE(r.reservation_name, g.full_name, 'Guest'),
    '/front-office?tab=arrival-board',
    'reservation',
    r.id::text,
    'arrival:' || r.id::text
  FROM public.reservations r
  LEFT JOIN public.guests g ON g.id = r.primary_guest_id
  WHERE r.tenant_id = v_tenant
    AND r.check_in = current_date
    AND r.status IN ('QUERY', 'QUOTED', 'CONFIRMED')
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.notifications (
    tenant_id, module, category, severity, title,
    description, target_url, entity_type, entity_id, dedupe_key
  )
  SELECT
    v_tenant,
    'Housekeeping',
    'Dirty Room',
    'HIGH',
    'Dirty room requires attention',
    room.room_no || ' · ' || COALESCE(room.room_name, room.room_type, 'Room'),
    '/housekeeping',
    'room',
    room.id::text,
    'dirty-room:' || room.id::text
  FROM public.rooms room
  WHERE room.tenant_id = v_tenant
    AND upper(COALESCE(room.hk_status, '')) = 'DIRTY'
  ON CONFLICT DO NOTHING;

  INSERT INTO public.notifications (
    tenant_id, module, category, severity, title,
    description, target_url, entity_type, entity_id, dedupe_key
  )
  SELECT
    v_tenant,
    'Front Office',
    'Departure',
    CASE
      WHEN COALESCE(folio.total, 0) > COALESCE(payment.total, 0)
        THEN 'CRITICAL'
      ELSE 'MEDIUM'
    END,
    'Today departure pending',
    r.res_no || ' · Due ' || GREATEST(
      COALESCE(folio.total, 0) - COALESCE(payment.total, 0),
      0
    )::text,
    '/front-office?tab=departure-board',
    'reservation',
    r.id::text,
    'departure:' || r.id::text
  FROM public.reservations r
  LEFT JOIN (
    SELECT reservation_id, sum(total) AS total
    FROM public.folio_charges
    WHERE tenant_id = v_tenant
    GROUP BY reservation_id
  ) folio ON folio.reservation_id = r.id
  LEFT JOIN (
    SELECT reservation_id, sum(amount) AS total
    FROM public.payments
    WHERE tenant_id = v_tenant
    GROUP BY reservation_id
  ) payment ON payment.reservation_id = r.id
  WHERE r.tenant_id = v_tenant
    AND r.check_out = current_date
    AND r.status = 'CHECKED_IN'
  ON CONFLICT DO NOTHING;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.notification_center_feed(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mark_all_notifications_read() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refresh_operational_notifications() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.notification_center_feed(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_all_notifications_read() TO authenticated;
GRANT EXECUTE ON FUNCTION public.refresh_operational_notifications() TO authenticated;
