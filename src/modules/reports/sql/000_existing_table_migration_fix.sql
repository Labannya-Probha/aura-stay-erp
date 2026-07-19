-- AEDS v4 Reports existing-table migration fix
-- Run this before 002_seed_accounts_reports.sql if report_filters/report_catalog already existed.
-- dialect: postgres

alter table public.report_filters add column if not exists report_id uuid;
alter table public.report_filters add column if not exists filter_key text;
alter table public.report_filters add column if not exists label text;
alter table public.report_filters add column if not exists filter_type text;
alter table public.report_filters add column if not exists source_options text;
alter table public.report_filters add column if not exists default_value text;
alter table public.report_filters add column if not exists required boolean default false;
alter table public.report_filters add column if not exists display_order int default 0;
alter table public.report_filters add column if not exists is_global boolean default false;

alter table public.report_catalog add column if not exists department_id uuid;
alter table public.report_catalog add column if not exists report_code text;
alter table public.report_catalog add column if not exists title text;
alter table public.report_catalog add column if not exists slug text;
alter table public.report_catalog add column if not exists description text;
alter table public.report_catalog add column if not exists module_owner text;
alter table public.report_catalog add column if not exists cycle text default 'Monthly';
alter table public.report_catalog add column if not exists primary_tables text[] default '{}';
alter table public.report_catalog add column if not exists route text;
alter table public.report_catalog add column if not exists display_order int default 0;
alter table public.report_catalog add column if not exists cache_minutes int default 5;
alter table public.report_catalog add column if not exists supports_table boolean default true;
alter table public.report_catalog add column if not exists supports_chart boolean default false;
alter table public.report_catalog add column if not exists supports_kpi boolean default false;
alter table public.report_catalog add column if not exists supports_print boolean default true;
alter table public.report_catalog add column if not exists supports_export_pdf boolean default true;
alter table public.report_catalog add column if not exists supports_export_excel boolean default true;
alter table public.report_catalog add column if not exists supports_schedule boolean default false;
alter table public.report_catalog add column if not exists is_active boolean default true;

alter table public.report_fields add column if not exists report_id uuid;
alter table public.report_fields add column if not exists field_key text;
alter table public.report_fields add column if not exists label text;
alter table public.report_fields add column if not exists data_type text default 'Text';
alter table public.report_fields add column if not exists source_table text;
alter table public.report_fields add column if not exists source_column text;
alter table public.report_fields add column if not exists formula text;
alter table public.report_fields add column if not exists display_format text;
alter table public.report_fields add column if not exists aggregation text;
alter table public.report_fields add column if not exists alignment text default 'left';
alter table public.report_fields add column if not exists sortable boolean default true;
alter table public.report_fields add column if not exists filterable boolean default false;
alter table public.report_fields add column if not exists required boolean default false;
alter table public.report_fields add column if not exists display_order int default 0;
alter table public.report_fields add column if not exists is_visible boolean default true;
