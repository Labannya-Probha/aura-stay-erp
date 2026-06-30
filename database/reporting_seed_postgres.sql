INSERT INTO report_categories (code, name, description, sort_order) VALUES
('IFRS', 'IFRS Financial Reports', 'IAS/IFRS financial statements and schedules.', 10),
('HOTEL_KPI', 'Hotel KPI & Operations', 'Occupancy, reservation, rooms, guest ledger, housekeeping, and night audit reports.', 20),
('POS', 'Restaurant POS', 'Restaurant sales, outlet collection, and POS control reports.', 30),
('ACCOUNTING', 'Accounting Control', 'Ledger, receivable, payable, payment, and daily control reports.', 40)
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, sort_order = EXCLUDED.sort_order;

WITH category AS (
  SELECT id, code, name FROM report_categories
), inserted AS (
  INSERT INTO report_templates (
    category_id, report_code, report_name, report_category, ifrs_reference,
    data_source, grouping_option, sorting_option, export_permission, print_permission
  )
  SELECT c.id, v.report_code, v.report_name, c.name, v.ifrs_reference,
         v.data_source, v.grouping_option::jsonb, v.sorting_option::jsonb, TRUE, TRUE
  FROM (VALUES
    ('IFRS', 'IFRS-SFP', 'Statement of Financial Position', 'IAS 1', 'reporting.vw_statement_financial_position', '["classification"]', '[{"key":"accountCode","direction":"asc"}]'),
    ('IFRS', 'IFRS-PNL', 'Statement of Profit or Loss', 'IAS 1', 'reporting.vw_profit_or_loss', '["statementLine"]', '[{"key":"accountCode","direction":"asc"}]'),
    ('IFRS', 'IFRS-CFS', 'Statement of Cash Flows', 'IAS 7', 'reporting.vw_cash_flows', '["cashFlowClass"]', '[{"key":"accountCode","direction":"asc"}]'),
    ('IFRS', 'IFRS-REV-REC', 'Revenue Recognition Report', 'IFRS 15', 'reporting.vw_revenue_recognition', '["performanceObligation"]', '[{"key":"transactionDate","direction":"desc"}]'),
    ('HOTEL_KPI', 'OCC-RPT', 'Occupancy Report', NULL, 'reporting.vw_occupancy', '["roomType"]', '[{"key":"transactionDate","direction":"desc"}]'),
    ('HOTEL_KPI', 'REVPAR-RPT', 'RevPAR Report', NULL, 'reporting.vw_revpar', '["roomType"]', '[{"key":"transactionDate","direction":"desc"}]'),
    ('POS', 'REST-SALES', 'Restaurant Sales Report', NULL, 'reporting.vw_restaurant_sales', '["outlet"]', '[{"key":"transactionDate","direction":"desc"}]'),
    ('ACCOUNTING', 'AR-AGING', 'Accounts Receivable Aging', NULL, 'reporting.vw_ar_aging', '["agingBucket"]', '[{"key":"balance","direction":"desc"}]')
  ) AS v(category_code, report_code, report_name, ifrs_reference, data_source, grouping_option, sorting_option)
  JOIN category c ON c.code = v.category_code
  ON CONFLICT (report_code) DO UPDATE SET
    report_name = EXCLUDED.report_name,
    ifrs_reference = EXCLUDED.ifrs_reference,
    data_source = EXCLUDED.data_source,
    grouping_option = EXCLUDED.grouping_option,
    sorting_option = EXCLUDED.sorting_option
  RETURNING id, report_code
)
INSERT INTO report_user_access (report_template_id, role, can_view, can_export, can_print)
SELECT id, role_name, TRUE, TRUE, TRUE
FROM inserted
CROSS JOIN (VALUES ('SUPERUSER'), ('ADMIN'), ('MANAGER'), ('ACCOUNTS')) AS roles(role_name)
ON CONFLICT (report_template_id, user_id, role) DO NOTHING;
