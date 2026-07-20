
create table if not exists notifications(
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid,
 user_id uuid,
 title text,
 body text,
 type text,
 is_read boolean default false,
 created_at timestamptz default now()
);

create table if not exists activity_logs(
 id uuid primary key default gen_random_uuid(),
 tenant_id uuid,
 actor_id uuid,
 module text,
 action text,
 entity text,
 entity_id text,
 payload jsonb,
 created_at timestamptz default now()
);
