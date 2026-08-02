-- Phase A: secure export storage + richer audit metadata for report exports.
-- Idempotent migration: safe to run multiple times.

insert into storage.buckets (id, name, public)
values ('exports', 'exports', false)
on conflict (id) do update
set
  name = excluded.name,
  public = false;

-- Defensive cleanup if old broad policies were introduced manually.
do $$
begin
  execute 'drop policy if exists "Export files are publicly readable" on storage.objects';
  execute 'drop policy if exists "Exports are publicly readable" on storage.objects';
  execute 'drop policy if exists "Public exports read" on storage.objects';
end
$$;

alter table if exists public.report_export_logs
  add column if not exists export_job_id text;

alter table if exists public.report_export_logs
  add column if not exists storage_path text;

alter table if exists public.report_export_logs
  add column if not exists mime_type text;

alter table if exists public.report_export_logs
  add column if not exists size_bytes bigint;

alter table if exists public.report_export_logs
  add column if not exists export_status text;

alter table if exists public.report_export_logs
  add column if not exists error_message text;

create index if not exists idx_report_export_logs_tenant_job
  on public.report_export_logs (tenant_id, export_job_id);

create index if not exists idx_report_export_logs_tenant_status
  on public.report_export_logs (tenant_id, export_status, generated_at desc);
