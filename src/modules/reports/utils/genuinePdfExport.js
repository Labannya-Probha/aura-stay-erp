import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

/**
 * Phase 7 (genuine PDF) — sprint step 1.
 *
 * The existing print/export path (src/components/PrintPortal.jsx) uses
 * html2canvas to rasterize the on-screen DOM into an image embedded in a
 * jsPDF document. That guarantees the PDF matches the screen exactly, but
 * produces an image, not a true PDF — no selectable text, no
 * accessibility, and it fails this project's own stated rule ("Never
 * generate HTML pretending to be PDF. Always generate true PDF.").
 *
 * This is a genuinely additive, standalone alternative: it builds a real
 * vector/text PDF directly from a financial statement report's `rows`
 * array (the same shape returned by aeds_run_report for
 * rpt_ifrs_profit_or_loss / rpt_ifrs_balance_sheet / etc.), using jsPDF's
 * native text and table APIs. It does not touch PrintPortal.jsx or any
 * existing print/export call site — nothing currently working is at risk
 * from this addition. Wiring it into the UI (a new "Export Genuine PDF"
 * button) is a separate, later step.
 *
 * @param {object} params
 * @param {string} params.title            e.g. "Profit & Loss Statement"
 * @param {string} params.periodLabel      e.g. "For the period 2026-01-01 to 2026-07-31"
 * @param {Array<{account_name?: string, particulars?: string, amount?: number, current?: number}>} params.rows
 * @param {{ tenantName?: string, preparedBy?: string }} [params.meta]
 * @returns {jsPDF} the generated document — caller decides whether to
 *          .save(), .output('blob'), or upload it.
 */
// Fetches a remote logo image and converts it to a data URL jsPDF can
// embed via addImage — jsPDF cannot take a bare remote URL directly.
// Fails silently (returns null) so a broken/missing logo never blocks
// PDF generation — the header still renders correctly without an image.
async function loadLogoAsDataUrl(logoUrl) {
  if (!logoUrl) return null
  try {
    const response = await fetch(logoUrl, { mode: 'cors' })
    const blob = await response.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

export async function generateGenuineFinancialStatementPdf({ title, periodLabel, rows, meta = {} }) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const logoDataUrl = await loadLogoAsDataUrl(meta.logoUrl)

  let headerTextX = 14
  if (logoDataUrl) {
    try {
      // 12mm square logo, top-left — real embedded image data, not a
      // screenshot of the page.
      doc.addImage(logoDataUrl, 14, 8, 12, 12)
      headerTextX = 29
    } catch {
      // Unsupported image format (e.g. SVG) — fall back to text-only
      // header rather than failing the whole PDF.
    }
  }

  // Header: tenant identity + report title + period — real, selectable
  // text, not a screenshot.
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(meta.tenantName || '', headerTextX, 14)

  doc.setFontSize(16)
  doc.setTextColor(20)
  doc.text(title || 'Financial Statement', pageWidth / 2, 20, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor(90)
  doc.text(periodLabel || '', pageWidth / 2, 27, { align: 'center' })

  const tableRows = (rows || []).map((row) => {
    const label = row.account_name ?? row.particulars ?? ''
    const amount = row.amount ?? row.current ?? 0
    const formatted = amount === null || amount === undefined
      ? ''
      : Number(amount) < 0
        ? `(৳${Math.abs(Number(amount)).toLocaleString('en-BD')})` // negative -> parentheses, per this project's own display rule
        : Number(amount) === 0
          ? '-' // zero -> dash, per this project's own display rule
          : `৳${Number(amount).toLocaleString('en-BD')}`
    return [label, formatted]
  })

  autoTable(doc, {
    startY: 34,
    head: [['Particulars', 'Amount']],
    body: tableRows,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [30, 41, 59] },
    columnStyles: { 1: { halign: 'right' } },
    didDrawPage: () => {
      // Repeating footer on every page, per the framework's page-numbering
      // and prepared-by requirements.
      const pageCount = doc.internal.getNumberOfPages()
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber
      doc.setFontSize(8)
      doc.setTextColor(140)
      doc.text(
        `Prepared by: ${meta.preparedBy || '—'}    Generated: ${new Date().toLocaleString('en-GB')}`,
        14,
        doc.internal.pageSize.getHeight() - 10,
      )
      doc.text(
        `Page ${currentPage} of ${pageCount}`,
        pageWidth - 14,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'right' },
      )
    },
  })

  return doc
}
