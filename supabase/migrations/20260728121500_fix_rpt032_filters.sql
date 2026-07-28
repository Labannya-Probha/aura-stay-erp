-- Align RPT-032 filters with rpt_multi_property_consolidated_performance inputs.

DO $$
DECLARE
  v_report_id uuid;
BEGIN
  SELECT id
  INTO v_report_id
  FROM public.report_catalog
  WHERE report_code = 'RPT-032'
  LIMIT 1;

  IF v_report_id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.report_filters
  WHERE report_id = v_report_id
    AND coalesce(is_global, false) = false;

  INSERT INTO public.report_filters (
    report_id,
    filter_key,
    label,
    filter_type,
    source_options,
    default_value,
    required,
    display_order,
    is_global
  )
  VALUES
    (v_report_id, 'cycle', 'Cycle', 'cycle', 'Daily,Weekly,Monthly,Quarterly,Half-Yearly,Yearly,Custom Date Range', 'Monthly', false, 1, false),
    (v_report_id, 'start_date', 'Start Date', 'date', NULL, NULL, false, 2, false),
    (v_report_id, 'end_date', 'End Date', 'date', NULL, NULL, false, 3, false),
    (v_report_id, 'property', 'Property/Branch', 'entity', NULL, NULL, false, 4, false);
END
$$;