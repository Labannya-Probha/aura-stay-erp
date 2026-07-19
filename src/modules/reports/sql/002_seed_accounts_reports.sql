alter table public.report_filters
add column if not exists report_id uuid;

alter table public.report_filters
add column if not exists filter_key text;

alter table public.report_filters
add column if not exists label text;

alter table public.report_filters
add column if not exists filter_type text;

alter table public.report_filters
add column if not exists source_options text;

alter table public.report_filters
add column if not exists default_value text;

alter table public.report_filters
add column if not exists required boolean default false;

alter table public.report_filters
add column if not exists display_order int default 0;

alter table public.report_filters
add column if not exists is_global boolean default false;