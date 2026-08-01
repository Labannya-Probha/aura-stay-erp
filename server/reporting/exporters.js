import ExcelJS from 'exceljs'
import { jsPDF } from 'jspdf'

function resolveFieldValue(row, fieldKey) {
  return String(fieldKey || '')
    .split('.')
    .reduce((value, segment) => value?.[segment], row)
}

const escapeCsv = (value) => {
  const raw = value == null ? '' : String(value)
  return /[",\n]/.test(raw) ? `"${raw.replaceAll('"', '""')}"` : raw
}

const colKey = (col) => (typeof col === 'string' ? col : col.key)
const colLabel = (col) => (typeof col === 'string' ? col : col.label)
const colAlign = (col) => (typeof col === 'object' ? col.align || 'left' : 'left')

function safeText(value) {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value).replaceAll('\u0000', '').replace(/\s+/g, ' ').trim()
}

function numericValue(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatBdt(value) {
  const amount = numericValue(value)

  const formatted = new Intl.NumberFormat('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  if (amount < 0) {
    return `(BDT ${formatted})`
  }

  if (amount === 0) {
    return '-'
  }

  return `BDT ${formatted}`
}

function isFinancialStatement(reportPayload) {
  return (
    reportPayload?.report?.displayMode === 'financial_statement' ||
    reportPayload?.rows?.some((row) => row?.line_code || row?.current_amount !== undefined)
  )
}

function resolveReportContext(reportPayload = {}) {
  const summary = reportPayload.summary || {}
  const audit = reportPayload.audit || {}
  const filters = reportPayload.filters || {}

  return {
    companyName: safeText(
      summary.company_name ||
        audit.companyName ||
        filters.companyName ||
        filters.company ||
        'Aura Stay ERP',
    ),
    propertyName: safeText(
      summary.property_name ||
        audit.propertyName ||
        filters.property ||
        filters.propertyName ||
        'All Properties',
    ),
    currencyLabel: safeText(summary.currency || audit.currency || filters.currency || 'BDT'),
    legalNote: safeText(
      summary.legal_note ||
        audit.legalNote ||
        'This report is system generated and intended for internal use only.',
    ),
    generatedBy: safeText(audit.generatedBy || 'system'),
    generatedAt: safeText(audit.generatedAt || new Date().toISOString()),
    preparedBy: safeText(summary.prepared_by || audit.preparedBy || audit.generatedBy || 'system'),
    reviewedBy: safeText(summary.reviewed_by || audit.reviewedBy || ''),
    approvedBy: safeText(summary.approved_by || audit.approvedBy || ''),
    printedBy: safeText(summary.printed_by || audit.printedBy || audit.generatedBy || 'system'),
  }
}

function formatTabularCellValue(value, column) {
  const type = safeText(column?.type || '').toLowerCase()

  if (
    type.includes('currency') ||
    type.includes('amount') ||
    type.includes('debit') ||
    type.includes('credit')
  ) {
    return formatBdt(value)
  }

  if (type.includes('number')) {
    const amount = numericValue(value)
    if (amount === 0) return '-'
    return new Intl.NumberFormat('en-BD', { maximumFractionDigits: 2 }).format(amount)
  }

  return safeText(value)
}

export function toCsv(reportPayload) {
  const { report, rows, totals } = reportPayload
  const columns = report.columns
  const data = [
    [report.name],
    [`Category: ${report.category}`],
    [],
    columns.map(colLabel),
    ...rows.map((row) => columns.map((col) => resolveFieldValue(row, colKey(col)) ?? '')),
    columns.map((col, index) => (index === 0 ? 'Grand Total' : (totals[colKey(col)] ?? ''))),
  ]
  return data.map((row) => row.map(escapeCsv).join(',')).join('\n')
}

export async function toExcel(reportPayload) {
  const { report, rows, totals } = reportPayload
  const columns = report.columns
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(report.code)
  sheet.addRow([report.name])
  sheet.addRow([`Category: ${report.category}`])
  sheet.addRow([])
  sheet.addRow(columns.map(colLabel))
  rows.forEach((row) =>
    sheet.addRow(columns.map((col) => resolveFieldValue(row, colKey(col)) ?? '')),
  )
  sheet.addRow(
    columns.map((col, index) => (index === 0 ? 'Grand Total' : (totals[colKey(col)] ?? ''))),
  )
  sheet.views = [{ state: 'frozen', ySplit: 4 }]
  sheet.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  sheet.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F3A5F' } }
  sheet.columns.forEach((column) => {
    column.width = 18
  })
  return workbook.xlsx.writeBuffer()
}

function createFinancialStatementPdf(reportPayload) {
  const { report, rows = [], summary = {} } = reportPayload
  const context = resolveReportContext(reportPayload)

  const hasComparison = Boolean(
    summary.comparison_start ||
    summary.comparison_end ||
    rows.some((row) => numericValue(row.comparison_amount) !== 0),
  )

  const document = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const pageWidth = document.internal.pageSize.getWidth()
  const pageHeight = document.internal.pageSize.getHeight()

  const marginLeft = 14
  const marginRight = 14
  const contentWidth = pageWidth - marginLeft - marginRight

  const labelWidth = hasComparison ? 84 : 118
  const amountWidth = (contentWidth - labelWidth) / (hasComparison ? 3 : 1)

  let cursorY = 16
  let pageNumber = 1

  function drawHeader() {
    document.setFont('helvetica', 'bold')
    document.setFontSize(8)
    document.text(context.companyName, marginLeft, cursorY)
    document.text(context.propertyName, pageWidth - marginRight, cursorY, { align: 'right' })

    cursorY += 5

    document.setFontSize(14)

    document.text(
      safeText(report?.name || report?.title || 'Financial Statement'),
      pageWidth / 2,
      cursorY,
      {
        align: 'center',
      },
    )

    cursorY += 6

    document.setFont('helvetica', 'normal')
    document.setFontSize(8.5)

    const periodText =
      summary.start_date && summary.end_date
        ? `For the period ${summary.start_date} to ${summary.end_date}`
        : summary.as_of_date
          ? `As of ${summary.as_of_date}`
          : ''

    if (periodText) {
      document.text(periodText, pageWidth / 2, cursorY, {
        align: 'center',
      })

      cursorY += 5
    }

    document.setFontSize(7.5)
    document.text(`Currency: ${context.currencyLabel}`, marginLeft, cursorY)
    document.text(`Generated: ${context.generatedAt}`, pageWidth - marginRight, cursorY, {
      align: 'right',
    })

    cursorY += 4

    document.setDrawColor(45)
    document.setLineWidth(0.5)

    document.line(marginLeft, cursorY, pageWidth - marginRight, cursorY)

    cursorY += 7

    document.setFont('helvetica', 'bold')
    document.setFontSize(8)

    document.text('Particulars', marginLeft, cursorY)

    let x = marginLeft + labelWidth

    document.text('Current', x + amountWidth - 1, cursorY, {
      align: 'right',
    })

    if (hasComparison) {
      x += amountWidth

      document.text('Comparative', x + amountWidth - 1, cursorY, {
        align: 'right',
      })

      x += amountWidth

      document.text('Variance', x + amountWidth - 1, cursorY, {
        align: 'right',
      })
    }

    cursorY += 3

    document.line(marginLeft, cursorY, pageWidth - marginRight, cursorY)

    cursorY += 5
  }

  function drawFooter() {
    document.setFont('helvetica', 'normal')
    document.setFontSize(7)
    document.setTextColor(90)

    document.text(`Generated by ${context.generatedBy}`, marginLeft, pageHeight - 12)

    document.text(
      `Prepared: ${context.preparedBy || '-'}  Reviewed: ${context.reviewedBy || '-'}  Approved: ${context.approvedBy || '-'}  Printed: ${context.printedBy || '-'}`,
      marginLeft,
      pageHeight - 8,
    )

    document.text(context.legalNote, marginLeft, pageHeight - 4)

    document.text(`Page ${pageNumber}`, pageWidth - marginRight, pageHeight - 4, {
      align: 'right',
    })

    document.setTextColor(0)
  }

  function addPage() {
    drawFooter()
    document.addPage()
    pageNumber += 1
    cursorY = 16
    drawHeader()
  }

  drawHeader()

  const sortedRows = [...rows].sort(
    (left, right) => numericValue(left.display_order) - numericValue(right.display_order),
  )

  for (const row of sortedRows) {
    if (cursorY > pageHeight - 22) {
      addPage()
    }

    const lineType = safeText(row.line_type).toUpperCase()

    const isHeader = lineType === 'HEADER'
    const isGrandTotal = lineType === 'GRAND_TOTAL' || row.is_double_underlined

    const isBold =
      Boolean(row.is_bold) || lineType === 'CALCULATED' || lineType === 'SUBTOTAL' || isGrandTotal

    if (row.is_underlined) {
      document.line(marginLeft, cursorY - 3.5, pageWidth - marginRight, cursorY - 3.5)
    }

    if (isGrandTotal) {
      document.setLineWidth(0.35)

      document.line(marginLeft, cursorY - 4, pageWidth - marginRight, cursorY - 4)
      document.line(marginLeft, cursorY - 2.8, pageWidth - marginRight, cursorY - 2.8)
    }

    document.setFont('helvetica', isBold ? 'bold' : 'normal')
    document.setFontSize(isHeader ? 8.5 : 8)

    const indent = numericValue(row.indent_level) * 4

    document.text(
      safeText(row.label || row.account_name || row.line_item),
      marginLeft + indent,
      cursorY,
      {
        maxWidth: labelWidth - indent - 3,
      },
    )

    if (!isHeader) {
      let x = marginLeft + labelWidth

      document.text(formatBdt(row.current_amount ?? row.amount), x + amountWidth - 1, cursorY, {
        align: 'right',
      })

      if (hasComparison) {
        x += amountWidth

        document.text(formatBdt(row.comparison_amount), x + amountWidth - 1, cursorY, {
          align: 'right',
        })

        x += amountWidth

        document.text(formatBdt(row.variance_amount), x + amountWidth - 1, cursorY, {
          align: 'right',
        })
      }
    }

    cursorY += isHeader ? 7 : 5.5

    if (isGrandTotal) {
      document.line(marginLeft, cursorY - 3.5, pageWidth - marginRight, cursorY - 3.5)
      document.line(marginLeft, cursorY - 2.3, pageWidth - marginRight, cursorY - 2.3)

      cursorY += 3
    }
  }

  drawFooter()

  return Buffer.from(document.output('arraybuffer'))
}

function createTabularReportPdf(reportPayload) {
  const { report = {}, rows = [], totals = {}, summary = {} } = reportPayload
  const context = resolveReportContext(reportPayload)
  const columns = Array.isArray(report.columns) ? report.columns : []

  const document = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const pageWidth = document.internal.pageSize.getWidth()
  const pageHeight = document.internal.pageSize.getHeight()
  const marginLeft = 10
  const marginRight = 10
  const contentWidth = pageWidth - marginLeft - marginRight
  const minColumnWidth = 18
  const usableColumnCount = Math.max(columns.length, 1)
  const rawWidth = contentWidth / usableColumnCount
  const columnWidth = Math.max(Math.min(rawWidth, 55), minColumnWidth)

  let cursorY = 12
  let pageNumber = 1

  function drawFooter() {
    document.setFont('helvetica', 'normal')
    document.setFontSize(7)
    document.setTextColor(90)
    document.text(
      `Generated by ${context.generatedBy} at ${context.generatedAt}`,
      marginLeft,
      pageHeight - 10,
    )
    document.text(
      `Prepared: ${context.preparedBy || '-'}  Reviewed: ${context.reviewedBy || '-'}  Approved: ${context.approvedBy || '-'}  Printed: ${context.printedBy || '-'}`,
      marginLeft,
      pageHeight - 6,
    )
    document.text(context.legalNote, marginLeft, pageHeight - 2)
    document.text(`Page ${pageNumber}`, pageWidth - marginRight, pageHeight - 2, { align: 'right' })
    document.setTextColor(0)
  }

  function drawHeader() {
    document.setFont('helvetica', 'bold')
    document.setFontSize(8)
    document.text(context.companyName, marginLeft, cursorY)
    document.text(context.propertyName, pageWidth - marginRight, cursorY, { align: 'right' })
    cursorY += 4

    document.setFont('helvetica', 'bold')
    document.setFontSize(12)
    document.text(safeText(report.name || report.title || 'Report Export'), marginLeft, cursorY)
    cursorY += 5

    document.setFont('helvetica', 'normal')
    document.setFontSize(8)
    const periodText =
      summary.start_date && summary.end_date
        ? `${summary.start_date} to ${summary.end_date}`
        : summary.as_of_date
          ? `As of ${summary.as_of_date}`
          : ''
    if (periodText) {
      document.text(periodText, marginLeft, cursorY)
      cursorY += 4
    }

    document.text(`Currency: ${context.currencyLabel}`, marginLeft, cursorY)
    cursorY += 3

    document.line(marginLeft, cursorY, pageWidth - marginRight, cursorY)
    cursorY += 5
  }

  function drawTableHeader() {
    document.setFont('helvetica', 'bold')
    document.setFontSize(7.5)

    columns.forEach((column, index) => {
      const x = marginLeft + index * columnWidth
      if (x >= pageWidth - marginRight) return

      const label = safeText(colLabel(column))
      const lines = document.splitTextToSize(label, columnWidth - 2)
      document.text(lines.slice(0, 2), x, cursorY)
    })

    cursorY += 5.5
    document.line(marginLeft, cursorY, pageWidth - marginRight, cursorY)
    cursorY += 4
  }

  function addPage() {
    drawFooter()
    document.addPage()
    pageNumber += 1
    cursorY = 12
    drawHeader()
    drawTableHeader()
  }

  drawHeader()
  drawTableHeader()

  rows.forEach((row) => {
    if (cursorY > pageHeight - 14) {
      addPage()
    }

    columns.forEach((column, index) => {
      const x = marginLeft + index * columnWidth
      if (x >= pageWidth - marginRight) return

      const align = colAlign(column) === 'right' ? 'right' : 'left'
      const cell = formatTabularCellValue(resolveFieldValue(row, colKey(column)), column)
      const clipped = document.splitTextToSize(cell, columnWidth - 2).slice(0, 2)

      document.setFont('helvetica', 'normal')
      document.setFontSize(7.5)

      if (align === 'right') {
        document.text(clipped, x + columnWidth - 1, cursorY, { align: 'right' })
      } else {
        document.text(clipped, x, cursorY)
      }
    })

    cursorY += 5
  })

  if (totals && columns.length > 0) {
    if (cursorY > pageHeight - 14) {
      addPage()
    }

    document.line(marginLeft, cursorY, pageWidth - marginRight, cursorY)
    cursorY += 4

    document.setFont('helvetica', 'bold')
    document.setFontSize(7.5)

    columns.forEach((column, index) => {
      const x = marginLeft + index * columnWidth
      if (x >= pageWidth - marginRight) return

      const value =
        index === 0 ? 'Grand Total' : formatTabularCellValue(totals[colKey(column)], column)
      const text = safeText(value)
      if (colAlign(column) === 'right') {
        document.text(text, x + columnWidth - 1, cursorY, { align: 'right' })
      } else {
        document.text(text, x, cursorY)
      }
    })
  }

  drawFooter()

  return Buffer.from(document.output('arraybuffer'))
}

export function toPdf(reportPayload) {
  if (isFinancialStatement(reportPayload)) {
    return createFinancialStatementPdf(reportPayload)
  }

  return createTabularReportPdf(reportPayload)
}
