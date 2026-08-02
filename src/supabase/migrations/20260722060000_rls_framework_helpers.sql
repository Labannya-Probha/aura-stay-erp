-- Formalizes the existing, already-working RLS pattern into a documented,
-- reusable template — no behavior change, just consolidation + a generator
-- comment block for future Shop/Tax service databases to copy verbatim.
begin;

create or replace function public.current_tenant_id()
returns uuid
language sql stable
security definer
set search_path to 'public'
as $$
  select tenant_id from public.app_users where id = auth.uid() limit 1;
$$;

create or replace function public.current_role_name()
returns text
language sql stable
security definer
set search_path to 'public'
as $$
  select role from public.app_users where id = auth.uid() limit 1;
$$;

-- Matches the granular role_privileges table already in production
-- (role, module, can_create/view/edit/delete) rather than a static role list.
create or replace function public.has_module_privilege(p_module text, p_action text)
returns boolean
language sql stable
security invoker
as $$
  select coalesce(
    (
      select case p_action
        when 'create' then can_create
        when 'view'   then can_view
        when 'edit'   then can_edit
        when 'delete' then can_delete
        else false
      end
      from public.role_privileges
      where role = public.current_role_name()
        and module = p_module
        and (tenant_id = public.current_tenant_id() or tenant_id is null)
      order by tenant_id nulls last
      limit 1
    ),
    false
  );
$$;

-- ─── Reusable policy template — copy for every new tenant-scoped table ───
-- alter table public.<TABLE> enable row level security;
-- create policy <table>_tenant_select on public.<TABLE>
--   for select to authenticated
--   using (tenant_id = public.current_tenant_id());
-- create policy <table>_tenant_insert on public.<TABLE>
--   for insert to authenticated
--   with check (tenant_id = public.current_tenant_id());
-- create policy <table>_tenant_update on public.<TABLE>
--   for update to authenticated
--   using (tenant_id = public.current_tenant_id())
--   with check (tenant_id = public.current_tenant_id());
-- create policy <table>_tenant_delete on public.<TABLE>
--   for delete to authenticated
--   using (tenant_id = public.current_tenant_id());

commit;
