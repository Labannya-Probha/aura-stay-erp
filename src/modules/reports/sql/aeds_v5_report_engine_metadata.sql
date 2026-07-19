-- AEDS v5 Report Engine Metadata Support

create table if not exists public.report_saved_views (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  user_id uuid,
  report_slug text not null,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  columns jsonb not null default '[]'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists report_saved_views_report_slug_idx
on public.report_saved_views(report_slug);

alter table public.report_saved_views enable row level security;

drop policy if exists report_saved_views_select on public.report_saved_views;
create policy report_saved_views_select
on public.report_saved_views for select
to authenticated
using (true);

drop policy if exists report_saved_views_insert on public.report_saved_views;
create policy report_saved_views_insert
on public.report_saved_views for insert
to authenticated
with check (true);
