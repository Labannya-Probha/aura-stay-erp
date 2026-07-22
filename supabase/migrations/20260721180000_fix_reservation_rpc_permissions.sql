begin;

-- Prevent privilege drift for Reservation dashboard/calendar RPCs.
revoke all on function public.reservation_kpi_summary() from public;
revoke all on function public.booking_calendar_data(date, date, jsonb) from public;

grant execute on function public.reservation_kpi_summary() to authenticated;
grant execute on function public.booking_calendar_data(date, date, jsonb) to authenticated;

-- Useful for internal backend/service-role workflows.
grant execute on function public.reservation_kpi_summary() to service_role;
grant execute on function public.booking_calendar_data(date, date, jsonb) to service_role;

commit;
