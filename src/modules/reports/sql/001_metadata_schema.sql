-- PostgreSQL
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.report_departments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  slug text unique not null,
  icon text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.report_catalog (
  id uuid primary key default gen_random_uuid(),
  report_code text unique not null,
  department_id uuid not null references public.report_departments(id) on delete cascade,
  title text not null,
  slug text not null,
  description text,
  module_owner text,
  cycle text not null default 'Monthly',
  primary_tables text[] not null default '{}',
  route text,
  display_order int not null default 0,
  cache_minutes int not null default 5,
  supports_table boolean not null default true,
  supports_chart boolean not null default false,
  supports_kpi boolean not null default false,
  supports_print boolean not null default true,
  supports_export_pdf boolean not null default true,
  supports_export_excel boolean not null default true,
  supports_schedule boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(department_id, slug)
);

create table if not exists public.report_fields (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.report_catalog(id) on delete cascade,
  field_key text not null,
  label text not null,
  data_type text not null default 'Text',
  source_table text,
  source_column text,
  formula text,
  display_format text,
  aggregation text,
  alignment text not null default 'left',
  sortable boolean not null default true,
  filterable boolean not null default false,
  required boolean not null default false,
  display_order int not null default 0,
  is_visible boolean not null default true
);

create table if not exists public.report_filters (
  id uuid primary key default gen_random_uuid(),
  report_id uuid references public.report_catalog(id) on delete cascade,
  filter_key text not null,
  label text not null,
  filter_type text not null,
  source_options text,
  default_value text,
  required boolean not null default false,
  display_order int not null default 0,
  is_global boolean not null default false
);

create table if not exists public.report_role_access (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.report_catalog(id) on delete cascade,
  role text not null,
  can_view boolean not null default false,
  can_export boolean not null default false,
  can_print boolean not null default false,
  can_schedule boolean not null default false,
  unique(report_id, role)
);

create table if not exists public.report_actions (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.report_catalog(id) on delete cascade,
  action_key text not null,
  label text not null,
  is_enabled boolean not null default true,
  display_order int not null default 0
);

create table if not exists public.report_schedules (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  user_id uuid,
  report_id uuid not null references public.report_catalog(id) on delete cascade,
  schedule_name text not null,
  recipient_emails text[] not null default '{}',
  frequency text not null default 'Daily',
  scheduled_time time not null default '08:00',
  filters jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.report_schedules enable row level security;
