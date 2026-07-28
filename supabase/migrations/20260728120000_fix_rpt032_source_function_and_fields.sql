-- Fix 0: re-attach Multi Property Consolidated Performance to RPT-032
-- and reset its report field metadata to the live function shape.

DO $$
DECLARE
  v_report_id uuid;
BEGIN
  UPDATE public.report_catalog
  SET source_function = 'rpt_multi_property_consolidated_performance'
  WHERE report_code = 'RPT-032';

  SELECT id
  INTO v_report_id
  FROM public.report_catalog
  WHERE report_code = 'RPT-032'
  LIMIT 1;

  IF v_report_id IS NULL THEN
    RETURN;
  END IF;

  DELETE FROM public.report_fields
  WHERE report_id = v_report_id;

  INSERT INTO public.report_fields (
    report_id,
    field_key,
    label,
    data_type,
    source_column,
    display_format,
    aggregation,
    alignment,
    sortable,
    filterable,
    required,
    display_order,
    is_visible
  )
  VALUES
    (v_report_id, 'property_name', 'Property', 'Text', 'property_name', NULL, NULL, 'left', true, true, false, 1, true),
    (v_report_id, 'occupancy_rate', 'Occupancy %', 'Percent', 'occupancy_rate', 'Percent-2', 'SUM', 'right', true, false, false, 2, true),
    (v_report_id, 'adr', 'ADR', 'Currency-BDT', 'adr', 'Currency-BDT', 'SUM', 'right', true, false, false, 3, true),
    (v_report_id, 'revpar', 'RevPAR', 'Currency-BDT', 'revpar', 'Currency-BDT', 'SUM', 'right', true, false, false, 4, true),
    (v_report_id, 'room_revenue', 'Room Revenue', 'Currency-BDT', 'room_revenue', 'Currency-BDT', 'SUM', 'right', true, false, false, 5, true),
    (v_report_id, 'gop', 'GOP', 'Currency-BDT', 'gop', 'Currency-BDT', 'SUM', 'right', true, false, false, 6, true),
    (v_report_id, 'net_profit', 'Net Profit', 'Currency-BDT', 'net_profit', 'Currency-BDT', 'SUM', 'right', true, false, false, 7, true);
END
$$;