-- Fixes two real bugs found by testing classify_account_for_reporting()
-- against the live chart of accounts, and re-syncs the 575 existing
-- account_department_mapping rows that were seeded using the buggy version.
--
-- Bug 1: usali_line_group had no early-exit for ASSET/LIABILITY/EQUITY/OTHER
--        account types, so every non-revenue/expense account (cash, bank,
--        receivables, etc.) fell through to 'OTHER_EXPENSE' — corrupting any
--        USALI/IFRS P&L rollup that sums by line_group.
--
-- Bug 2: the department regex's bare `it ` alternative (meant to catch "IT"/
--        Information Technology) matched as a raw substring, so any word
--        ending in "it" followed by a space — "credit ", "deposit ",
--        "profit ", "audit " — false-matched into "Information & Telecom
--        Systems". Replaced with a proper word-boundary match.
--
-- Must run AFTER 20260727020000_widen_usali_line_group_check_constraint.sql,
-- since this migration writes the 'NOT_APPLICABLE' value that constraint allows.

begin;

create or replace function public.classify_account_for_reporting(
  p_account_name text,
  p_account_code text,
  p_account_type text
)
returns table(usali_department text, usali_line_group text, ifrs_statement_class text)
language sql
immutable
set search_path to 'public', 'pg_temp'
as $function$
with n as (
  select
    lower(coalesce(p_account_name, '')) as name,
    upper(coalesce(p_account_type, '')) as account_type
)
select
  case
    when name ~ '(room revenue|rooms?|accommodation|lodging|front office|guest room|suite|villa|occupancy)' then 'Rooms'
    when name ~ '(restaurant|food|beverage|bar|banquet|kitchen|cafe|coffee|dining|room service|catering|f\&b)' then 'Food & Beverage'
    when name ~ '(telecom|telephone|internet|wifi|network|computer|software|\ysystems?\y|\yit\y|information technology|pbx)' then 'Information & Telecom Systems'
    when name ~ '(sales|marketing|advertis|promotion|commission|distribution|ota|travel agent)' then 'Sales & Marketing'
    when name ~ '(maintenance|repair|engineering|property operations|grounds|janitorial|housekeeping supplies)' then 'Property Operations & Maintenance'
    when name ~ '(utility|electric|power|water|gas|fuel|diesel|generator|sewage|steam)' then 'Utility Costs'
    else 'Administrative & General'
  end,
  case
    -- 'NOT_APPLICABLE' sentinel (not NULL): usali_line_group is NOT NULL
    -- with a CHECK constraint, widened by the companion migration to allow
    -- this value for non-P&L account types.
    when account_type not in ('REVENUE', 'EXPENSE') then 'NOT_APPLICABLE'
    when name ~ '(salary|salaries|wage|payroll|bonus|benefit|\ypf\y|provident|insurance|gratuity|overtime|allowance)' then 'PAYROLL_AND_RELATED'
    when account_type = 'REVENUE' then 'REVENUE'
    else 'OTHER_EXPENSE'
  end,
  case
    when account_type in ('ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE', 'OTHER') then account_type
    when name ~ '(cash|bank|receivable|inventory|prepaid|advance|deposit|asset|property|equipment|building|vehicle)' then 'ASSET'
    when name ~ '(payable|accrued|loan|borrow|tax payable|deferred revenue|liability|vendor credit)' then 'LIABILITY'
    when name ~ '(equity|capital|retained earnings|reserve|shareholder|owners? capital)' then 'EQUITY'
    when name ~ '(revenue|income|sales|fee|charge|room revenue|restaurant revenue|other income)' then 'REVENUE'
    else 'EXPENSE'
  end
from n;
$function$;

-- One-time re-sync of existing mapping rows seeded by the buggy classifier.
-- Safe to run repeatedly (idempotent — only updates rows that differ from
-- what the corrected classifier would now produce).
update public.account_department_mapping m
set
  usali_department = cr.usali_department,
  usali_line_group = cr.usali_line_group,
  ifrs_statement_class = cr.ifrs_statement_class,
  classification_source = 'heuristic_resync_20260727',
  updated_at = now()
from public.chart_of_accounts c
cross join lateral public.classify_account_for_reporting(c.name, c.code, c.type) cr
where m.account_id = c.id
  and (m.usali_department, coalesce(m.usali_line_group, ''), m.ifrs_statement_class)
      is distinct from
      (cr.usali_department, coalesce(cr.usali_line_group, ''), cr.ifrs_statement_class);

commit;
