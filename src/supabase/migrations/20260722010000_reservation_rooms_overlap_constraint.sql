-- Prevent overlapping room assignments at the database layer.
-- This migration is idempotent and supports schemas where reservation_rooms
-- may or may not have its own status column.

begin;

create extension if not exists btree_gist;

do $$
declare
  v_has_status_column boolean;
  v_overlap_count integer;
begin
  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reservation_rooms'
      and column_name = 'status'
  ) into v_has_status_column;

  if v_has_status_column then
    select count(*) into v_overlap_count
    from public.reservation_rooms r1
    join public.reservation_rooms r2
      on r1.tenant_id = r2.tenant_id
     and r1.room_id = r2.room_id
     and r1.id < r2.id
     and daterange(r1.from_date, r1.to_date, '[)') && daterange(r2.from_date, r2.to_date, '[)')
    where upper(coalesce(r1.status, '')) not in ('CANCELLED', 'NO_SHOW')
      and upper(coalesce(r2.status, '')) not in ('CANCELLED', 'NO_SHOW');
  else
    select count(*) into v_overlap_count
    from public.reservation_rooms r1
    join public.reservation_rooms r2
      on r1.tenant_id = r2.tenant_id
     and r1.room_id = r2.room_id
     and r1.id < r2.id
     and daterange(r1.from_date, r1.to_date, '[)') && daterange(r2.from_date, r2.to_date, '[)');
  end if;

  if v_overlap_count > 0 then
    raise exception
      'Found % overlapping reservation_rooms rows. Resolve overlaps before adding no-overlap constraint.',
      v_overlap_count;
  end if;
end $$;

do $$
declare
  v_has_status_column boolean;
  v_constraint_exists boolean;
begin
  select exists (
    select 1
    from pg_constraint
    where conname = 'reservation_rooms_no_overlap'
      and conrelid = 'public.reservation_rooms'::regclass
  ) into v_constraint_exists;

  if v_constraint_exists then
    raise notice 'Constraint reservation_rooms_no_overlap already exists, skipping.';
    return;
  end if;

  select exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'reservation_rooms'
      and column_name = 'status'
  ) into v_has_status_column;

  if v_has_status_column then
    execute $sql$
      alter table public.reservation_rooms
      add constraint reservation_rooms_no_overlap
      exclude using gist (
        tenant_id with =,
        room_id with =,
        daterange(from_date, to_date, '[)') with &&
      )
      where (upper(coalesce(status, '')) not in ('CANCELLED', 'NO_SHOW'))
    $sql$;
  else
    execute $sql$
      alter table public.reservation_rooms
      add constraint reservation_rooms_no_overlap
      exclude using gist (
        tenant_id with =,
        room_id with =,
        daterange(from_date, to_date, '[)') with &&
      )
    $sql$;
  end if;
end $$;

commit;
