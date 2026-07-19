
create table if not exists workflow_definitions(
 id uuid primary key default gen_random_uuid(),
 code text unique,
 name text,
 module text,
 active boolean default true
);

create table if not exists workflow_instances(
 id uuid primary key default gen_random_uuid(),
 definition_id uuid references workflow_definitions(id),
 document_id text,
 current_step int default 1,
 status text default 'Pending',
 created_at timestamptz default now()
);

create table if not exists workflow_approvals(
 id uuid primary key default gen_random_uuid(),
 instance_id uuid references workflow_instances(id),
 step_no int,
 approver_role text,
 decision text,
 remarks text,
 approved_at timestamptz
);
