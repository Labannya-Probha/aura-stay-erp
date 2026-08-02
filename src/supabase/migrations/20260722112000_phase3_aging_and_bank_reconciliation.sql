begin;

create or replace function public.get_aging_buckets(
  p_tenant_id uuid,
  p_as_of date default current_date,
  p_ledger text default 'ALL'
)
returns table (
  ledger_type text,
  entity_id uuid,
  entity_name text,
  document_id uuid,
  document_no text,
  document_date date,
  due_date date,
  days_overdue integer,
  outstanding numeric(20,2),
  bucket_0_30 numeric(20,2),
  bucket_31_60 numeric(20,2),
  bucket_61_90 numeric(20,2),
  bucket_91_plus numeric(20,2)
)
language sql
stable
security definer
set search_path = public
as $$
  with ap as (
    select
      'AP'::text as ledger_type,
      a.vendor_id as entity_id,
      coalesce(a.vendor_name, 'Unknown Vendor') as entity_name,
      a.grn_id as document_id,
      a.grn_no as document_no,
      a.grn_date as document_date,
      a.due_date::date as due_date,
      greatest((p_as_of - a.due_date::date), 0)::int as days_overdue,
      round(a.outstanding, 2) as outstanding
    from public.v_ap_aging a
    where a.tenant_id = p_tenant_id
      and a.outstanding > 0
  ),
  ar as (
    select
      'AR'::text as ledger_type,
      i.reservation_id as entity_id,
      coalesce(r.reservation_name, 'Reservation') as entity_name,
      i.id as document_id,
      i.invoice_no as document_no,
      coalesce(i.issued_at::date, current_date) as document_date,
      coalesce(i.issued_at::date, current_date) as due_date,
      greatest((p_as_of - coalesce(i.issued_at::date, current_date)), 0)::int as days_overdue,
      round(coalesce(i.due, 0), 2) as outstanding
    from public.invoices i
    left join public.reservations r on r.id = i.reservation_id
    where i.tenant_id = p_tenant_id
      and coalesce(i.due, 0) > 0
      and coalesce(i.is_void, false) = false
  ),
  all_rows as (
    select * from ap
    union all
    select * from ar
  )
  select
    x.ledger_type,
    x.entity_id,
    x.entity_name,
    x.document_id,
    x.document_no,
    x.document_date,
    x.due_date,
    x.days_overdue,
    x.outstanding,
    case when x.days_overdue between 0 and 30 then x.outstanding else 0 end as bucket_0_30,
    case when x.days_overdue between 31 and 60 then x.outstanding else 0 end as bucket_31_60,
    case when x.days_overdue between 61 and 90 then x.outstanding else 0 end as bucket_61_90,
    case when x.days_overdue >= 91 then x.outstanding else 0 end as bucket_91_plus
  from all_rows x
  where p_ledger = 'ALL' or x.ledger_type = upper(p_ledger)
  order by x.ledger_type, x.entity_name, x.document_date;
$$;

create table if not exists public.reconciliation_sessions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  bank_account_id uuid not null references public.chart_of_accounts(id) on delete restrict,
  statement_start_date date not null,
  statement_end_date date not null,
  opening_balance numeric(20,2) null,
  closing_balance numeric(20,2) null,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED', 'ARCHIVED')),
  opened_by text null,
  closed_by text null,
  closed_at timestamptz null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (statement_start_date <= statement_end_date)
);

create index if not exists idx_reconciliation_sessions_lookup
  on public.reconciliation_sessions (tenant_id, bank_account_id, status, statement_end_date desc);

create table if not exists public.bank_statement_lines (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.reconciliation_sessions(id) on delete cascade,
  tenant_id uuid not null,
  txn_date date not null,
  value_date date null,
  reference text null,
  description text null,
  debit numeric(20,2) not null default 0,
  credit numeric(20,2) not null default 0,
  amount_signed numeric(20,2) generated always as (coalesce(credit, 0) - coalesce(debit, 0)) stored,
  statement_balance numeric(20,2) null,
  match_status text not null default 'UNMATCHED' check (match_status in ('UNMATCHED', 'PARTIAL', 'MATCHED', 'EXCEPTION')),
  external_txn_id text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bank_statement_lines_session_status
  on public.bank_statement_lines (session_id, match_status, txn_date);

create table if not exists public.bank_reconciliation_matches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  session_id uuid not null references public.reconciliation_sessions(id) on delete cascade,
  statement_line_id uuid not null references public.bank_statement_lines(id) on delete cascade,
  journal_line_id uuid not null references public.journal_lines(id) on delete restrict,
  matched_amount numeric(20,2) not null check (matched_amount > 0),
  confidence numeric(5,2) not null default 0,
  matched_by text null,
  matched_at timestamptz not null default now(),
  notes text null,
  unique (statement_line_id, journal_line_id)
);

create unique index if not exists uq_bank_recon_unique_journal_line
  on public.bank_reconciliation_matches (journal_line_id);

create or replace function public.sync_bank_statement_match_status()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_line record;
  v_matched numeric(20,2);
  v_abs_amount numeric(20,2);
begin
  select * into v_line from public.bank_statement_lines where id = coalesce(new.statement_line_id, old.statement_line_id);

  if not found then
    return coalesce(new, old);
  end if;

  select coalesce(sum(matched_amount), 0)
    into v_matched
  from public.bank_reconciliation_matches
  where statement_line_id = v_line.id;

  v_abs_amount := abs(coalesce(v_line.amount_signed, 0));

  update public.bank_statement_lines
  set
    match_status = case
      when v_matched = 0 then 'UNMATCHED'
      when round(v_matched, 2) >= round(v_abs_amount, 2) then 'MATCHED'
      else 'PARTIAL'
    end,
    updated_at = now()
  where id = v_line.id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_bank_statement_match_status on public.bank_reconciliation_matches;
create trigger trg_sync_bank_statement_match_status
  after insert or update or delete on public.bank_reconciliation_matches
  for each row
  execute function public.sync_bank_statement_match_status();

create or replace function public.auto_match_bank_statement_line(
  p_statement_line_id uuid,
  p_matched_by text default null,
  p_tolerance numeric default 0.05
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_line record;
  v_candidate record;
  v_amount numeric(20,2);
  v_conf numeric(5,2) := 0;
begin
  select l.*, s.bank_account_id
    into v_line
  from public.bank_statement_lines l
  join public.reconciliation_sessions s on s.id = l.session_id
  where l.id = p_statement_line_id;

  if not found then
    raise exception 'Bank statement line % not found', p_statement_line_id using errcode = 'P0001';
  end if;

  if v_line.match_status = 'MATCHED' then
    return jsonb_build_object('status', 'already_matched', 'statement_line_id', p_statement_line_id);
  end if;

  v_amount := abs(coalesce(v_line.amount_signed, 0));

  select
    jl.id as journal_line_id,
    je.id as journal_entry_id,
    je.jv_no,
    je.jv_date,
    abs(coalesce(jl.debit, 0) - coalesce(jl.credit, 0)) as abs_amount,
    jl.line_note
  into v_candidate
  from public.journal_lines jl
  join public.journal_entries je on je.id = jl.entry_id
  where je.tenant_id = v_line.tenant_id
    and jl.account_id = v_line.bank_account_id
    and abs(abs(coalesce(jl.debit, 0) - coalesce(jl.credit, 0)) - v_amount) <= p_tolerance
    and je.jv_date between (v_line.txn_date - interval '7 day')::date and (v_line.txn_date + interval '7 day')::date
    and not exists (
      select 1 from public.bank_reconciliation_matches m where m.journal_line_id = jl.id
    )
  order by
    case when coalesce(v_line.reference, '') <> '' and jl.line_note ilike ('%' || v_line.reference || '%') then 0 else 1 end,
    abs(extract(day from (je.jv_date::timestamp - v_line.txn_date::timestamp))),
    jl.id
  limit 1;

  if not found then
    return jsonb_build_object('status', 'no_match', 'statement_line_id', p_statement_line_id);
  end if;

  v_conf := 0.75;
  if coalesce(v_line.reference, '') <> '' and coalesce(v_candidate.line_note, '') ilike ('%' || v_line.reference || '%') then
    v_conf := 0.95;
  end if;

  insert into public.bank_reconciliation_matches (
    tenant_id,
    session_id,
    statement_line_id,
    journal_line_id,
    matched_amount,
    confidence,
    matched_by,
    notes
  )
  values (
    v_line.tenant_id,
    v_line.session_id,
    v_line.id,
    v_candidate.journal_line_id,
    v_amount,
    v_conf,
    p_matched_by,
    'Auto-matched by rule engine'
  );

  return jsonb_build_object(
    'status', 'matched',
    'statement_line_id', v_line.id,
    'journal_line_id', v_candidate.journal_line_id,
    'journal_entry_id', v_candidate.journal_entry_id,
    'jv_no', v_candidate.jv_no,
    'confidence', v_conf
  );
end;
$$;

commit;
