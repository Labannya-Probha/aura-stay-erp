begin;

-- Re-apply execution grants in case prior deployment drift/revokes removed them.
revoke all on function public.notification_center_feed(integer) from public;
revoke all on function public.mark_notification_read(uuid) from public;
revoke all on function public.mark_all_notifications_read() from public;
revoke all on function public.refresh_operational_notifications() from public;

grant execute on function public.notification_center_feed(integer) to authenticated;
grant execute on function public.mark_notification_read(uuid) to authenticated;
grant execute on function public.mark_all_notifications_read() to authenticated;
grant execute on function public.refresh_operational_notifications() to authenticated;

-- Useful for trusted backend jobs/services using service-role credentials.
grant execute on function public.notification_center_feed(integer) to service_role;
grant execute on function public.mark_notification_read(uuid) to service_role;
grant execute on function public.mark_all_notifications_read() to service_role;
grant execute on function public.refresh_operational_notifications() to service_role;

commit;
