import EnterpriseReportHeader, {
  ReportAuditStrip,
  ReportMetaStrip,
  ReportSignatureFooter,
} from '../../../components/reports/EnterpriseReportHeader'
import { formatReportCell, resolveFieldValue } from '../utils/reportFormatters'

type PrintPreviewModel = {
  orientation: 'portrait' | 'landscape'
  report: { name: string; reportCategory?: string }
  filters: {
    dateFrom?: string
    dateTo?: string
    cycle?: string
    currency?: string
    compareTo?: string
  }
  generatedBy: string
  validation: {
    valid: boolean
    errors: string[]
    warnings: string[]
  }
  signatures: {
    preparedBy: string
    reviewedBy: string
    approvedBy: string
    printedBy: string
  }
  financial?: {
    hasComparison: boolean
    lines: Array<{
      key: string
      label: string
      indentLevel: number
      lineType: string
      isBold: boolean
      isUnderlined: boolean
      isDoubleUnderlined: boolean
      currentAmount: number
      comparisonAmount: number
    }>
  }
  tabular?: {
    fields: Array<{
      fieldKey: string
      label: string
      dataType?: string
      displayFormat?: string
      alignment?: string
    }>
    rows: Record<string, any>[]
  }
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function safeText(value: unknown, fallback = '') {
  if (value === null || value === undefined) return fallback
  const text = String(value).replace(/\s+/g, ' ').trim()
  return text || fallback
}

function isFinancial(definition: any, data: any) {
  const displayMode = String(definition?.report?.displayMode || '').toLowerCase()
  if (displayMode === 'financial_statement') return true
  return Array.isArray(data?.rows)
    ? data.rows.some((row: any) => row?.line_code || row?.current_amount !== undefined)
    : false
}

function formatBdt(value: unknown) {
  const amount = toNumber(value)
  if (amount === 0) return '-'

  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  return amount < 0 ? `(BDT ${formatted})` : `BDT ${formatted}`
}

export function buildReportPrintPreviewModel({
  definition,
  data,
  filters,
  company,
  role,
  userName,
}: {
  definition: any
  data: any
  filters: any
  company: any
  role?: string
  userName?: string
}): PrintPreviewModel {
  const report = definition?.report || {}
  const summary = data?.summary || {}
  const audit = data?.audit || {}
  const modeFinancial = isFinancial(definition, data)

  const generatedBy = safeText(audit.generatedBy || userName || role, 'System')

  const signatures = {
    preparedBy: safeText(summary.prepared_by || generatedBy, '-'),
    reviewedBy: safeText(summary.reviewed_by, '-'),
    approvedBy: safeText(summary.approved_by, '-'),
    printedBy: safeText(summary.printed_by || generatedBy, '-'),
  }

  const validationErrors = Array.isArray(data?.validation?.errors)
    ? data.validation.errors.map((item: any) => safeText(item?.message || item?.code)).filter(Boolean)
    : []

  const validationWarnings = Array.isArray(data?.validation?.warnings)
    ? data.validation.warnings
        .map((item: any) => safeText(item?.message || item?.code))
        .filter(Boolean)
    : []

  const model: PrintPreviewModel = {
    orientation: modeFinancial
      ? 'portrait'
      : Array.isArray(definition?.fields) && definition.fields.length > 9
        ? 'landscape'
        : 'portrait',
    report: {
      name: safeText(report.title || report.name, 'Report'),
      reportCategory: safeText(definition?.department?.name || report.reportCategory, 'Reports'),
    },
    filters: {
      dateFrom: filters?.start_date || filters?.dateFrom,
      dateTo: filters?.end_date || filters?.dateTo,
      cycle: filters?.cycle || 'Monthly',
      currency: safeText(summary.currency || filters?.currency, 'BDT'),
      compareTo: filters?.compare_to || 'Off',
    },
    generatedBy,
    validation: {
      valid: data?.validation?.valid !== false,
      errors: validationErrors,
      warnings: validationWarnings,
    },
    signatures,
  }

  if (modeFinancial) {
    const sourceLines = Array.isArray(data?.lines) && data.lines.length ? data.lines : data?.rows || []

    const normalizedLines = sourceLines.map((line: any, index: number) => ({
      key: safeText(line?.line_code || line?.id, `line-${index}`),
      label: safeText(line?.label || line?.line_item || line?.account_name, 'Unlabelled'),
      indentLevel: Math.max(0, toNumber(line?.indent_level)),
      lineType: safeText(line?.line_type, 'LINE').toUpperCase(),
      isBold: Boolean(line?.is_bold),
      isUnderlined: Boolean(line?.is_underlined),
      isDoubleUnderlined: Boolean(line?.is_double_underlined),
      currentAmount: toNumber(line?.current_amount ?? line?.amount ?? line?.value),
      comparisonAmount: toNumber(line?.comparison_amount),
    }))

    model.financial = {
      hasComparison:
        normalizedLines.some((line) => line.comparisonAmount !== 0) ||
        Boolean(summary?.comparison_start || summary?.comparison_end),
      lines: normalizedLines,
    }
  } else {
    const fields = Array.isArray(definition?.fields) ? definition.fields : []
    model.tabular = {
      fields: fields.map((field: any) => ({
        fieldKey: field.fieldKey,
        label: safeText(field.label || field.fieldKey),
        dataType: field.dataType,
        displayFormat: field.displayFormat,
        alignment: field.alignment === 'right' ? 'right' : 'left',
      })),
      rows: Array.isArray(data?.rows) ? data.rows : [],
    }
  }

  return model
}

function renderFinancialRows(model: PrintPreviewModel) {
  if (!model.financial) return null

  return model.financial.lines.map((line) => {
    const isHeader = line.lineType === 'HEADER'
    const isSubtotal = line.lineType === 'SUBTOTAL' || line.isUnderlined
    const isGrandTotal = line.lineType === 'GRAND_TOTAL' || line.isDoubleUnderlined

    const rowClass = [
      'report-print-preview__row',
      isHeader ? 'report-print-preview__row--header' : '',
      isSubtotal ? 'report-print-preview__row--subtotal' : '',
      isGrandTotal ? 'report-print-preview__row--grand-total' : '',
      line.isBold ? 'report-print-preview__row--bold' : '',
    ]
      .filter(Boolean)
      .join(' ')

    if (isHeader) {
      return (
        <tr key={line.key} className={rowClass}>
          <th scope="row" colSpan={model.financial?.hasComparison ? 3 : 2}>
            {line.label}
          </th>
        </tr>
      )
    }

    return (
      <tr key={line.key} className={rowClass}>
        <td>
          <div style={{ paddingInlineStart: `${line.indentLevel * 1.25}rem` }}>{line.label}</div>
        </td>
        <td className="report-print-preview__amount">{formatBdt(line.currentAmount)}</td>
        {model.financial?.hasComparison ? (
          <td className="report-print-preview__amount">{formatBdt(line.comparisonAmount)}</td>
        ) : null}
      </tr>
    )
  })
}

function renderTabularRows(model: PrintPreviewModel) {
  if (!model.tabular) return null

  const { fields, rows } = model.tabular

  return rows.map((row, rowIndex) => (
    <tr key={`row-${rowIndex}`} className="report-print-preview__row">
      {fields.map((field) => {
        const raw = resolveFieldValue(row, field.fieldKey)
        const value =
          field.dataType === 'Currency' || field.dataType === 'Number'
            ? formatBdt(raw)
            : formatReportCell(raw, field.dataType, field.displayFormat)

        return (
          <td
            key={`${rowIndex}-${field.fieldKey}`}
            className={field.alignment === 'right' ? 'report-print-preview__amount' : ''}
          >
            {value}
          </td>
        )
      })}
    </tr>
  ))
}

export default function ReportPrintPreview({
  model,
  company,
}: {
  model: PrintPreviewModel
  company: any
}) {
  const signatureRoles = [
    `Prepared By: ${model.signatures.preparedBy}`,
    `Reviewed By: ${model.signatures.reviewedBy}`,
    `Approved By: ${model.signatures.approvedBy}`,
    `Printed By: ${model.signatures.printedBy}`,
  ]

  return (
    <article
      className={`report-print-preview report-print-preview--${model.orientation}`}
      data-testid="report-print-preview"
    >
      <EnterpriseReportHeader company={company} report={model.report} filters={model.filters} />
      <ReportMetaStrip filters={model.filters} />
      <ReportAuditStrip generatedBy={model.generatedBy} />

      {!model.validation.valid ? (
        <section className="report-print-preview__validation report-print-preview__validation--error">
          <p>Validation Status: Failed</p>
          {model.validation.errors.map((error, index) => (
            <p key={`error-${index}`}>{error}</p>
          ))}
        </section>
      ) : (
        <section className="report-print-preview__validation report-print-preview__validation--ok">
          <p>Validation Status: Validated</p>
          {model.validation.warnings.map((warning, index) => (
            <p key={`warning-${index}`}>{warning}</p>
          ))}
        </section>
      )}

      <div className="report-print-preview__table-wrap">
        <table className="report-print-preview__table">
          <thead>
            {model.financial ? (
              <tr>
                <th>Particulars</th>
                <th className="report-print-preview__amount">Current</th>
                {model.financial.hasComparison ? (
                  <th className="report-print-preview__amount">Comparative</th>
                ) : null}
              </tr>
            ) : (
              <tr>
                {model.tabular?.fields.map((field) => (
                  <th
                    key={field.fieldKey}
                    className={field.alignment === 'right' ? 'report-print-preview__amount' : ''}
                  >
                    {field.label}
                  </th>
                ))}
              </tr>
            )}
          </thead>
          <tbody>{model.financial ? renderFinancialRows(model) : renderTabularRows(model)}</tbody>
        </table>
      </div>

      <ReportSignatureFooter roles={signatureRoles} />
    </article>
  )
}
