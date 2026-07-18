# Supabase Front Office 401 / 42501 Checklist

Use this checklist when Front Office pages fail with errors like:

- HTTP 401 from PostgREST
- `code: 42501 permission denied for table ...`

## 1) Confirm you are using authenticated session (not anon fallback)

In app startup/session code, verify:

- You call `supabase.auth.getSession()` or equivalent
- API requests include the logged-in JWT
- You are not accidentally using publishable/anon key without session

## 2) Run privilege + RLS diagnostics

```sql
-- A. Which roles can access key front-office tables?
select
  table_schema,
  table_name,
  grantee,
  privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in (
    'reservations',
    'reservation_rooms',
    'guests',
    'rooms',
    'folio_transactions'
  )
order by table_name, grantee, privilege_type;

-- B. Is RLS enabled?
select
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  forcerowsecurity as rls_forced
from pg_tables
where schemaname = 'public'
  and tablename in (
    'reservations',
    'reservation_rooms',
    'guests',
    'rooms',
    'folio_transactions'
  )
order by tablename;

-- C. Existing policies
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'reservations',
    'reservation_rooms',
    'guests',
    'rooms',
    'folio_transactions'
  )
order by tablename, policyname;
```

## 3) Minimum grants for Data API access

```sql
grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on table public.reservations to authenticated;
grant select, insert, update, delete on table public.reservation_rooms to authenticated;
grant select, insert, update, delete on table public.guests to authenticated;
grant select on table public.rooms to authenticated;
grant select, insert, update on table public.folio_transactions to authenticated;

-- Optional read-only public access (only if truly needed):
-- grant select on table public.rooms to anon;
```

## 4) Enable RLS on exposed tables

```sql
alter table public.reservations enable row level security;
alter table public.reservation_rooms enable row level security;
alter table public.guests enable row level security;
alter table public.rooms enable row level security;
alter table public.folio_transactions enable row level security;
```

## 5) Add baseline policies (tenant-safe pattern)

Assumes each table has `tenant_id` and JWT contains `tenant_id` in app metadata.

```sql
-- Reservations
create policy if not exists reservations_select_tenant
on public.reservations
for select
to authenticated
using (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

create policy if not exists reservations_write_tenant
on public.reservations
for all
to authenticated
using (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
with check (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- Reservation rooms
create policy if not exists reservation_rooms_select_tenant
on public.reservation_rooms
for select
to authenticated
using (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

create policy if not exists reservation_rooms_write_tenant
on public.reservation_rooms
for all
to authenticated
using (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
with check (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- Guests
create policy if not exists guests_select_tenant
on public.guests
for select
to authenticated
using (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

create policy if not exists guests_write_tenant
on public.guests
for all
to authenticated
using (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
with check (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- Rooms (usually read-only in front office)
create policy if not exists rooms_select_tenant
on public.rooms
for select
to authenticated
using (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

-- Folio transactions
create policy if not exists folio_tx_select_tenant
on public.folio_transactions
for select
to authenticated
using (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

create policy if not exists folio_tx_write_tenant
on public.folio_transactions
for all
to authenticated
using (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
with check (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
```

## 6) If table has no tenant_id

Use ownership/user based policies instead, for example:

```sql
create policy if not exists reservations_owner_select
on public.reservations
for select
to authenticated
using (created_by = auth.uid());
```

## 7) Post-fix smoke tests

```sql
-- as authenticated user in app:
-- 1) open /front-office/room-rack
-- 2) confirm reservations query returns rows
-- 3) create/update one reservation
-- 4) verify no 401 and no 42501 in browser console
```

## 8) Common mistakes to avoid

- Using `auth.role()` in policies instead of `TO authenticated`
- Missing `with check` on update/insert policies
- RLS enabled but no `select` policy (updates will silently affect 0 rows)
- Using user-editable `raw_user_meta_data` for authorization logic
- Granting broad `anon` access without strict RLS
