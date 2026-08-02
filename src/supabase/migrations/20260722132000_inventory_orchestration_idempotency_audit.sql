begin;

create table if not exists public.orchestration_idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  module_code text not null check (module_code in ('POS', 'SALES', 'CONSUMPTION')),
  operation_code text not null,
  idempotency_key text not null,
  request_hash text not null,
  request_payload jsonb not null default '{}'::jsonb,
  status text not null check (status in ('PROCESSING', 'SUCCEEDED', 'FAILED')),
  http_status integer,
  response_payload jsonb,
  error_payload jsonb,
  request_id text,
  created_by uuid,
  created_by_name text,
  created_at timestamptz not null default now(),
  locked_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (tenant_id, module_code, operation_code, idempotency_key)
);

create index if not exists idx_orchestration_idempotency_status
  on public.orchestration_idempotency_keys (tenant_id, module_code, operation_code, status, created_at desc);

create table if not exists public.orchestration_audit_logs (
  id bigserial primary key,
  tenant_id uuid not null,
  request_id text,
  idempotency_key text,
  module_code text not null,
  operation_code text not null,
  actor_user_id uuid,
  actor_email text,
  entity_type text,
  entity_id text,
  reference_type text,
  reference_id text,
  outcome text not null check (outcome in ('SUCCESS', 'FAILED', 'REPLAYED')),
  status_code integer,
  duration_ms numeric(12,2),
  request_payload jsonb not null default '{}'::jsonb,
  response_payload jsonb,
  error_payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_orchestration_audit_tenant_time
  on public.orchestration_audit_logs (tenant_id, created_at desc);

create index if not exists idx_orchestration_audit_request
  on public.orchestration_audit_logs (request_id, idempotency_key, created_at desc);

alter table public.orchestration_idempotency_keys enable row level security;
alter table public.orchestration_audit_logs enable row level security;

drop policy if exists orchestration_idempotency_keys_tenant_select on public.orchestration_idempotency_keys;
create policy orchestration_idempotency_keys_tenant_select
  on public.orchestration_idempotency_keys
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists orchestration_idempotency_keys_tenant_write on public.orchestration_idempotency_keys;
create policy orchestration_idempotency_keys_tenant_write
  on public.orchestration_idempotency_keys
  for all to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser())
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists orchestration_audit_logs_tenant_select on public.orchestration_audit_logs;
create policy orchestration_audit_logs_tenant_select
  on public.orchestration_audit_logs
  for select to authenticated
  using (tenant_id = public.current_tenant_id() or public.is_superuser());

drop policy if exists orchestration_audit_logs_tenant_insert on public.orchestration_audit_logs;
create policy orchestration_audit_logs_tenant_insert
  on public.orchestration_audit_logs
  for insert to authenticated
  with check (tenant_id = public.current_tenant_id() or public.is_superuser());

grant select, insert, update on public.orchestration_idempotency_keys to authenticated, service_role;
grant select, insert on public.orchestration_audit_logs to authenticated, service_role;

commit;
