-- AEDS PR03.2 Commit-6: retryable tenant-safe payment posting queue.
-- PostgreSQL migration

CREATE TABLE IF NOT EXISTS public.payment_posting_queue (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  idempotency_key text not null,
  source_module text not null,
  source_reference text not null,
  payload jsonb not null,
  status text not null default 'PENDING',
  attempts integer not null default 0,
  available_at timestamptz not null default now(),
  locked_at timestamptz null,
  processed_at timestamptz null,
  journal_entry_id uuid null references public.journal_entries(id) on delete restrict,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_posting_queue_status_check
    check (status in ('PENDING','PROCESSING','RETRY','COMPLETED','FAILED','CANCELLED')),
  unique (tenant_id, idempotency_key)
);

create index if not exists idx_payment_posting_queue_work
  on public.payment_posting_queue (tenant_id, status, available_at, created_at);

create or replace function public.touch_payment_posting_queue_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

drop trigger if exists trg_touch_payment_posting_queue on public.payment_posting_queue;
create trigger trg_touch_payment_posting_queue
before update on public.payment_posting_queue
for each row execute function public.touch_payment_posting_queue_updated_at();

alter table public.payment_posting_queue enable row level security;
drop policy if exists payment_posting_queue_tenant_guard on public.payment_posting_queue;
create policy payment_posting_queue_tenant_guard on public.payment_posting_queue
for all to authenticated
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

grant select, insert, update on public.payment_posting_queue to authenticated;
notify pgrst, 'reload schema';
