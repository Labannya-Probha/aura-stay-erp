-- Keep reports visible and align Facility Items with the Service Bills UI.

DO $$
BEGIN
  IF to_regclass('public.facility_items') IS NOT NULL THEN
    ALTER TABLE public.facility_items
      DROP CONSTRAINT IF EXISTS facility_items_category_check;

    UPDATE public.facility_items
    SET category = CASE
      WHEN category IS NULL OR trim(category) = '' THEN NULL
      WHEN upper(replace(replace(trim(category), ' ', '_'), '-', '_')) IN (
        'OTHER', 'GENERAL', 'SERVICE', 'SHOP', 'LAUNDRY', 'SPA',
        'TRANSPORT', 'MINIBAR', 'FOOD', 'ROOM_SERVICE', 'MISC'
      ) THEN upper(replace(replace(trim(category), ' ', '_'), '-', '_'))
      WHEN upper(trim(category)) IN ('ROOMSERVICE', 'ROOM/SERVICE') THEN 'ROOM_SERVICE'
      ELSE 'OTHER'
    END
    WHERE category IS DISTINCT FROM CASE
      WHEN category IS NULL OR trim(category) = '' THEN NULL
      WHEN upper(replace(replace(trim(category), ' ', '_'), '-', '_')) IN (
        'OTHER', 'GENERAL', 'SERVICE', 'SHOP', 'LAUNDRY', 'SPA',
        'TRANSPORT', 'MINIBAR', 'FOOD', 'ROOM_SERVICE', 'MISC'
      ) THEN upper(replace(replace(trim(category), ' ', '_'), '-', '_'))
      WHEN upper(trim(category)) IN ('ROOMSERVICE', 'ROOM/SERVICE') THEN 'ROOM_SERVICE'
      ELSE 'OTHER'
    END;

    ALTER TABLE public.facility_items
      ADD CONSTRAINT facility_items_category_check
      CHECK (
        category IS NULL OR category IN (
          'OTHER', 'GENERAL', 'SERVICE', 'SHOP', 'LAUNDRY', 'SPA',
          'TRANSPORT', 'MINIBAR', 'FOOD', 'ROOM_SERVICE', 'MISC'
        )
      );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.report_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  report_name text NOT NULL,
  name text NOT NULL,
  key_fields text,
  status text NOT NULL DEFAULT 'READY',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (department, name)
);

ALTER TABLE public.report_definitions
  ADD COLUMN IF NOT EXISTS tenant_id uuid,
  ADD COLUMN IF NOT EXISTS report_key text;

GRANT SELECT ON public.report_definitions TO authenticated;
ALTER TABLE public.report_definitions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS report_definitions_authenticated_select ON public.report_definitions;
CREATE POLICY report_definitions_authenticated_select
  ON public.report_definitions FOR SELECT TO authenticated
  USING (true);

WITH tenant_ctx AS (
  SELECT coalesce(public.current_tenant_id(), (SELECT id FROM public.properties ORDER BY created_at ASC LIMIT 1)) AS tenant_id
), seed_rows AS (
  SELECT *
  FROM (VALUES
    ('Operations', 'Management Dashboard', 'Management Dashboard', 'Occupancy %, ADR, RevPAR, Total F&B Rev, Satisfaction Score', 'READY'),
    ('Operations', 'Sales & Reservations', 'Sales & Reservations', 'Date, Guest Name, Room Type, Source, Status, Total Amount, Deposit, Balance', 'READY'),
    ('Operations', 'Occupancy & RevPAR', 'Occupancy & RevPAR', 'Date, Rooms Sold, Total Rooms, Occupancy %, Room Revenue, RevPAR', 'READY'),
    ('Operations', 'Guest Ledger', 'Guest Ledger', 'Room No., Guest Name, Opening Bal, Room Charges, F&B Charges, Taxes, Payments, Closing Bal', 'READY'),
    ('Operations', 'City Ledger', 'City Ledger', 'Account Name, Invoice Date, Service, Due Date, Amount, Aging (0-30, 31-60, 60+)', 'READY'),
    ('Operations', 'Agency Commission', 'Agency Commission', 'Date, Booking Ref, Guest Name, Gross Rev, Comm %, Comm Amount, Net Revenue', 'READY'),
    ('Operations', 'Shareholder Entitlement', 'Shareholder Entitlement', 'Period, Net Profit, Distribution %, Entitlement Amount, Payout Status', 'READY'),
    ('Restaurant', 'POS Sales Summary', 'POS Sales Summary', 'Category, Qty Sold, Gross Sales, Discount, Net Sales, Taxes, Total', 'READY'),
    ('Restaurant', 'KOT Register', 'KOT Register', 'Date/Time, KOT No., Table No., Waiter, Item, Qty, Status (Served/Void), Signature', 'READY'),
    ('Restaurant', 'F&B Daily Revenue', 'F&B Daily Revenue', 'Total POS Sales, Add: Room Service, Less: Comp/Staff Meals, Net F&B Revenue', 'READY'),
    ('Accounting', 'Profit & Loss', 'Profit & Loss', 'Revenue, COGS, Gross Profit, Operating Expenses, Net Profit/Loss', 'READY'),
    ('Accounting', 'Balance Sheet', 'Balance Sheet', 'Assets (Current/Fixed), Liabilities (Current/Long-term), Equity', 'READY'),
    ('Accounting', 'Cash Flow Statement', 'Cash Flow Statement', 'Operating Activities, Investing Activities, Financing Activities, Net Cash Flow', 'READY'),
    ('Accounting', 'Trial Balance', 'Trial Balance', 'Account Name, Account Type, Debit Balance, Credit Balance', 'READY'),
    ('Accounting', 'General Ledger', 'General Ledger', 'Date, Ref/Voucher No., Description, Account, Debit, Credit, Balance', 'READY'),
    ('Accounting', 'Bank Book', 'Bank Book', 'Date, Particulars, Chq No., Deposit, Withdrawal, Bank Balance', 'READY'),
    ('Accounting', 'Cash Book', 'Cash Book', 'Date, Particulars, Cash In, Cash Out, Closing Cash Balance', 'READY'),
    ('Accounting', 'Bank Reconciliation', 'Bank Reconciliation', 'Book Balance, Bank Statement Balance, Uncleared Chqs, Deposits in Transit', 'READY'),
    ('Accounting', 'Retained Earnings', 'Retained Earnings', 'Opening Retained Earnings, Net Income, Dividends Paid, Ending Balance', 'READY'),
    ('Accounting', 'NAV / Equity Report', 'NAV / Equity Report', 'Total Assets, Total Liabilities, Net Assets, Shares Outstanding, NAV per Share', 'READY'),
    ('Accounting', 'AP Aging', 'AP Aging', 'Vendor Name, Due Date, Total Due, Current, 30 Days, 60 Days, 90+ Days', 'READY'),
    ('Accounting', 'AR Aging', 'AR Aging', 'Customer Name, Invoice Date, Total Due, Current, 30 Days, 60 Days, 90+ Days', 'READY')
  ) AS t(department, report_name, name, key_fields, status)
)
INSERT INTO public.report_definitions (tenant_id, department, report_name, report_key, name, key_fields, status)
SELECT
  tc.tenant_id,
  s.department,
  s.report_name,
  lower(regexp_replace(regexp_replace(s.name, '[^a-zA-Z0-9]+', '_', 'g'), '(^_+|_+$)', '', 'g')),
  s.name,
  s.key_fields,
  s.status
FROM seed_rows s
CROSS JOIN tenant_ctx tc
WHERE tc.tenant_id IS NOT NULL
ON CONFLICT (department, name) DO UPDATE
SET report_name = EXCLUDED.report_name,
    report_key = coalesce(public.report_definitions.report_key, EXCLUDED.report_key),
    key_fields = EXCLUDED.key_fields,
    status = 'READY',
    updated_at = now();
