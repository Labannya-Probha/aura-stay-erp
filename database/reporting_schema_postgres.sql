CREATE TABLE IF NOT EXISTS report_categories (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(40) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_templates (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES report_categories(id),
  report_code VARCHAR(60) UNIQUE NOT NULL,
  report_name VARCHAR(220) NOT NULL,
  report_category VARCHAR(80) NOT NULL,
  ifrs_reference VARCHAR(40),
  data_source TEXT NOT NULL,
  grouping_option JSONB NOT NULL DEFAULT '[]',
  sorting_option JSONB NOT NULL DEFAULT '[]',
  export_permission BOOLEAN NOT NULL DEFAULT TRUE,
  print_permission BOOLEAN NOT NULL DEFAULT TRUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS report_fields (
  id BIGSERIAL PRIMARY KEY,
  report_template_id BIGINT NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  field_key VARCHAR(80) NOT NULL,
  field_label VARCHAR(160) NOT NULL,
  data_type VARCHAR(40) NOT NULL,
  alignment VARCHAR(20) NOT NULL DEFAULT 'left',
  column_width INTEGER NOT NULL DEFAULT 120,
  is_visible BOOLEAN NOT NULL DEFAULT TRUE,
  is_total BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (report_template_id, field_key)
);

CREATE TABLE IF NOT EXISTS report_filters (
  id BIGSERIAL PRIMARY KEY,
  report_template_id BIGINT NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  filter_key VARCHAR(80) NOT NULL,
  filter_label VARCHAR(160) NOT NULL,
  filter_type VARCHAR(40) NOT NULL,
  default_value TEXT,
  options JSONB NOT NULL DEFAULT '[]',
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (report_template_id, filter_key)
);

CREATE TABLE IF NOT EXISTS report_kpis (
  id BIGSERIAL PRIMARY KEY,
  report_template_id BIGINT NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  kpi_key VARCHAR(80) NOT NULL,
  kpi_label VARCHAR(160) NOT NULL,
  calculation_expression TEXT,
  value_type VARCHAR(40) NOT NULL DEFAULT 'number',
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (report_template_id, kpi_key)
);

CREATE TABLE IF NOT EXISTS report_user_access (
  id BIGSERIAL PRIMARY KEY,
  report_template_id BIGINT NOT NULL REFERENCES report_templates(id) ON DELETE CASCADE,
  user_id UUID,
  role VARCHAR(60),
  can_view BOOLEAN NOT NULL DEFAULT TRUE,
  can_export BOOLEAN NOT NULL DEFAULT FALSE,
  can_print BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (report_template_id, user_id, role)
);

CREATE TABLE IF NOT EXISTS report_export_logs (
  id BIGSERIAL PRIMARY KEY,
  report_template_id BIGINT REFERENCES report_templates(id),
  report_code VARCHAR(60) NOT NULL,
  export_format VARCHAR(20) NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  generated_by UUID,
  generated_by_name VARCHAR(160),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS report_print_logs (
  id BIGSERIAL PRIMARY KEY,
  report_template_id BIGINT REFERENCES report_templates(id),
  report_code VARCHAR(60) NOT NULL,
  page_size VARCHAR(20) NOT NULL DEFAULT 'A4',
  filters JSONB NOT NULL DEFAULT '{}',
  printed_by UUID,
  printed_by_name VARCHAR(160),
  printed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category_id);
CREATE INDEX IF NOT EXISTS idx_report_export_logs_report_date ON report_export_logs(report_code, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_print_logs_report_date ON report_print_logs(report_code, printed_at DESC);
