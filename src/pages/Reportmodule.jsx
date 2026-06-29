import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabase'
import { exportXLSX, fmtBDT, fmtDate, todayISO } from '../lib/helpers'
import { getTenantId } from '../lib/tenant'
import {
  BarChart3,
  RefreshCw,
  LayoutDashboard,
  Landmark,
  HandCoins,
  BedDouble,
  CalendarCheck2,
  TrendingUp,
  AlertCircle,
  Download,
  Building2,
  Printer,
  FileDown,
  Search,
  CalendarRange,
  Mail,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'

const REPORT_CYCLES = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'quarterly', label: 'Quarterly' },
  { id: 'half-yearly', label: 'Half-Yearly' },
  { id: 'yearly', label: 'Yearly' },
  { id: 'custom', label: 'Custom Date Range' },
]

const REPORT_SECTIONS = [
  { id: 'all', label: 'All Reports', desc: 'Complete reporting catalogue', icon: LayoutDashboard },
  { id: 'accounts', label: 'Accounts', desc: 'Financial statements, tax, books, ledgers, and aging', icon: Landmark },
  { id: 'inventory', label: 'Accounts/Inventory', desc: 'Stock, purchase, warehouse, and reorder reporting', icon: BarChart3 },
  { id: 'admin', label: 'Admin', desc: 'Executive controls, audit, maintenance, and property performance', icon: Building2 },
  { id: 'housekeeping', label: 'Housekeeping', desc: 'Room status, consumption, and lost/found reporting', icon: BedDouble },
  { id: 'pos', label: 'Restaurant/POS', desc: 'POS sales, payments, COGS, voids, and day close', icon: HandCoins },
  { id: 'sales', label: 'Sales', desc: 'Bookings, occupancy, revenue, arrivals, departures, and channels', icon: TrendingUp },
  { id: 'other', label: 'Other Sales', desc: 'Cross-department sales reports', icon: CalendarCheck2 },
]

const RAW_REPORTS = [
  ['Accounts', 'Accounts Payable Aging Report'],
  ['Accounts', 'Accounts Receivable Aging Report'],
  ['Accounts', 'Balance Sheet'],
  ['Accounts', 'Bank Book Report'],
  ['Accounts', 'Bank Reconciliation Report'],
  ['Accounts', 'Cash Book Report'],
  ['Accounts', 'Cash Flow Statement'],
  ['Accounts', 'Depreciation Report'],
  ['Accounts', 'Due Balance Report'],
  ['Accounts', 'Expense Report (By Category/Department)'],
  ['Accounts', 'Ledger Report'],
  ['Accounts', 'Net Asset Value Report'],
  ['Accounts', 'Profit & Loss Statement'],
  ['Accounts', 'Trial Balance Report'],
  ['Accounts', 'Vat & Tax Collection Report'],
  ['Accounts', 'Vat & Tax Collection vs. Payment Report'],
  ['Accounts', 'Vat & Tax Payment Report'],
  ['Accounts/Inventory', 'Item Wise Stock Report'],
  ['Accounts/Inventory', 'Low Stock / Reorder Alert Report'],
  ['Accounts/Inventory', 'Price Comparison Report'],
  ['Accounts/Inventory', 'Product In Report'],
  ['Accounts/Inventory', 'Product Out Report'],
  ['Accounts/Inventory', 'Purchase Report'],
  ['Accounts/Inventory', 'Warehouse Wise Stock Report'],
  ['Admin', 'Cost Controller Report'],
  ['Admin', 'Executive Summary Dashboard (KPI Snapshot)'],
  ['Admin', 'Multi-Property Consolidated Performance Report'],
  ['Admin', 'Out-of-Order / Maintenance Room Report'],
  ['Admin', 'User Activity / Audit Trail Log'],
  ['Housekeeping', 'Consumption Report'],
  ['Housekeeping', 'Lost & Found Report'],
  ['Housekeeping', 'Room Status Report (Live)', true],
  ['Restaurant/POS', 'Component Wise Sales Summary Report'],
  ['Restaurant/POS', 'Consumption Report'],
  ['Restaurant/POS', 'Cost of Goods Sold Report'],
  ['Restaurant/POS', 'Night Audit/Day Closing Report', true],
  ['Restaurant/POS', 'Payment Transaction Report'],
  ['Restaurant/POS', 'Sales Report'],
  ['Restaurant/POS', 'Table/Section Wise Sales Report'],
  ['Restaurant/POS', 'Void & Discount Report (POS)'],
  ['Sales', 'ADR & RevPAR / Hotel KPI Report'],
  ['Sales', 'Agency Booking Report'],
  ['Sales', 'Average Daily Revenue Report'],
  ['Sales', 'Booking Cancellation Income Report'],
  ['Sales', 'Check-In Log Report'],
  ['Sales', 'Check-Out Log Report'],
  ['Sales', 'Complimentary & House-Use Room Report'],
  ['Sales', 'Component Wise Sales Summary Report'],
  ['Sales', 'Cost of Room Sold Report'],
  ['Sales', 'Discount & Void Transaction Report'],
  ['Sales', 'Group/Block Booking Report'],
  ['Sales', 'Guest Advance Report'],
  ['Sales', 'Guest Loyalty & Repeat Stay Report'],
  ['Sales', 'Guest Refund Report'],
  ['Sales', 'In-House Guest Report'],
  ['Sales', 'Night Audit/Day Closing Report', true],
  ['Sales', 'No Show Charge Report'],
  ['Sales', 'OTA/Agency Commission Report'],
  ['Sales', 'Occupancy Report'],
  ['Sales', 'Payment Transaction Report'],
  ['Sales', 'Reservation Entry Log Report (Sales Person Wise)'],
  ['Sales', 'Reservation No History with Missing Reservation Numbers'],
  ['Sales', 'Revenue Projection Report'],
  ['Sales', 'Room Type / Rate Plan Wise Sales Report'],
  ['Sales', 'Rooms on Books / Booking Pace Report'],
  ['Sales', 'Sales Report'],
  ['Sales', 'Shareholder Commission Report'],
  ['Sales', 'Shareholder Entitlement Usage Report'],
  ['Sales', 'Source/Channel-Wise Booking & Revenue Report'],
  ['Sales', "Today's Arrival List", true],
  ['Sales', "Today's Departure List", true],
  ['Sales/Restaurant/POS', 'Other Items Sales Report (Excluding, Room Sales & Restaurant Sales, Vat & Tax)'],
]

const REPORT_CATALOG = RAW_REPORTS.map(([department, name, schedulable], index) => ({
  id: `report-${index + 1}`,
  code: `RPT-${String(index + 1).padStart(3, '0')}`,
  department,
  name,
  cycle: 'Daily / Weekly / Monthly / Quarterly / Half-Yearly / Yearly / Custom Date Range',
  actions: schedulable ? 'Print, Export PDF/Excel, Schedule/Email' : 'Print, Export PDF/Excel',
  schedulable: !!schedulable,
  status: 'Ready',
}))

const money = (v) => Number(v || 0)
const dayStart = (d) => `${d}T00:00:00`
const dayEnd = (d) => `${d}T23:59:59`
const monthStart = (d) => `${d.slice(0, 8)}01`

function emptySnapshot() {
  return {
    generatedAt: null,
    kpis: {
      totalRevenue: 0,
      totalReceipts: 0,
      outstandingDue: 0,
      occupancyRate: 0,
      collectionRate: 0,
      closeCoverage: 0,
      closedDays: 0,
      rangeDays: 0,
    },
    revenueLines: [],
    receiptLines: [],
    reservationLines: [],
    topReceivables: [],
  }
}

function daysBetweenInclusive(fromDate, toDate) {
  const from = new Date(`${fromDate}T00:00:00`)
  const to = new Date(`${toDate}T00:00:00`)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return 0
  return Math.floor((to.getTime() - from.getTime()) / 86400000) + 1
}

function normalizeMethod(method) {
  return (method || 'UNSPECIFIED').toString().trim().toUpperCase()
}

function reportSectionId(department) {
  if (department === 'Accounts') return 'accounts'
  if (department === 'Accounts/Inventory') return 'inventory'
  if (department === 'Admin') return 'admin'
  if (department === 'Housekeeping') return 'housekeeping'
  if (department === 'Restaurant/POS') return 'pos'
  if (department === 'Sales') return 'sales'
  return 'other'
}

function shiftDate(date, days) {
  const next = new Date(`${date}T00:00:00`)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

function startOfYear(date) {
  return `${date.slice(0, 4)}-01-01`
}

function startOfQuarter(date) {
  const month = Number(date.slice(5, 7))
  const quarterStartMonth = Math.floor((month - 1) / 3) * 3 + 1
  return `${date.slice(0, 4)}-${String(quarterStartMonth).padStart(2, '0')}-01`
}

function startOfHalfYear(date) {
  const month = Number(date.slice(5, 7))
  return `${date.slice(0, 4)}-${month <= 6 ? '01' : '07'}-01`
}

function safeFileName(value) {
  return value.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 80)
}

function KPIBox({ title, value, note, icon: Icon, variant = 'default' }) {
  const variantClass = variant === 'success'
    ? 'border-forest/30 bg-forest/[0.08]'
    : variant === 'warning'
      ? 'border-amber/40 bg-amber/[0.10]'
      : 'border-[--border-color] bg-white'

  return (
    <div className={`rounded-xl border p-4 ${variantClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-pine/60">{title}</p>
          <p className="mt-1 text-xl font-semibold text-pine">{value}</p>
          <p className="mt-1 text-xs text-pine/60">{note}</p>
        </div>
        <div className="rounded-lg bg-white p-2 border border-[--border-color]">
          <Icon size={16} className="text-pine" />
        </div>
      </div>
    </div>
  )
}

export default function Reports() {
  const today = useMemo(() => todayISO(), [])
  const tenantId = useMemo(() => getTenantId(), [])
  const [activeSection, setActiveSection] = useState('all')
  const [cycle, setCycle] = useState('monthly')
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState(monthStart(today))
  const [toDate, setToDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [snapshot, setSnapshot] = useState(emptySnapshot)
  const activeSectionMeta = REPORT_SECTIONS.find((section) => section.id === activeSection)
  const activePanelItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    return REPORT_CATALOG.filter((report) => {
      const sectionMatch = activeSection === 'all' || reportSectionId(report.department) === activeSection
      const searchMatch = !q
        || report.name.toLowerCase().includes(q)
        || report.department.toLowerCase().includes(q)
        || report.code.toLowerCase().includes(q)
      return sectionMatch && searchMatch
    })
  }, [activeSection, search])

  const setCycleRange = useCallback((nextCycle) => {
    setCycle(nextCycle)
    if (nextCycle === 'custom') return
    if (nextCycle === 'daily') setFromDate(today)
    if (nextCycle === 'weekly') setFromDate(shiftDate(today, -6))
    if (nextCycle === 'monthly') setFromDate(monthStart(today))
    if (nextCycle === 'quarterly') setFromDate(startOfQuarter(today))
    if (nextCycle === 'half-yearly') setFromDate(startOfHalfYear(today))
    if (nextCycle === 'yearly') setFromDate(startOfYear(today))
    setToDate(today)
  }, [today])

  const loadSnapshot = useCallback(async () => {
    if (!fromDate || !toDate || toDate < fromDate) {
      setError('Invalid date range. Please provide a valid From and To date.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const [
        folioRes,
        paymentRes,
        posRes,
        facilityRes,
        invoiceRes,
        reservationRes,
        roomsRes,
        inHouseRes,
        closeRes,
      ] = await Promise.all([
        supabase.from('folio_charges').select('charge_type,total,charge_date').gte('charge_date', fromDate).lte('charge_date', toDate),
        supabase.from('payments').select('method,amount,received_date').gte('received_date', fromDate).lte('received_date', toDate),
        supabase.from('pos_orders').select('status,total,payment_method,created_at').gte('created_at', dayStart(fromDate)).lte('created_at', dayEnd(toDate)),
        supabase.from('facility_sales').select('status,total,payment_method,sale_date,item_name').gte('sale_date', fromDate).lte('sale_date', toDate),
        supabase.from('invoices').select('id,invoice_no,reservation_id,issued_at,due,paid,status,is_void,totals').eq('is_void', false).order('issued_at', { ascending: false }).limit(300),
        supabase.from('reservations').select('id,status,check_in,check_out').gte('check_in', fromDate).lte('check_in', toDate),
        supabase.from('rooms').select('id').eq('is_active', true),
        supabase.from('reservations').select('id').eq('status', 'CHECKED_IN').lte('check_in', today).gt('check_out', today),
        supabase.from('day_closes').select('close_date').gte('close_date', fromDate).lte('close_date', toDate),
      ])

      const queryError = [
        folioRes.error,
        paymentRes.error,
        posRes.error,
        facilityRes.error,
        invoiceRes.error,
        reservationRes.error,
        roomsRes.error,
        inHouseRes.error,
        closeRes.error,
      ].find(Boolean)
      if (queryError) throw queryError

      const folio = folioRes.data || []
      const payments = paymentRes.data || []
      const posOrders = (posRes.data || []).filter((x) => x.status === 'SETTLED')
      const facilitySales = (facilityRes.data || []).filter((x) => x.status === 'SETTLED')
      const invoices = invoiceRes.data || []
      const reservations = reservationRes.data || []
      const activeRooms = roomsRes.data || []
      const inHouse = inHouseRes.data || []
      const dayCloses = closeRes.data || []

      const revenueMap = {}
      for (const row of folio) {
        const key = row.charge_type || 'OTHER'
        revenueMap[key] = (revenueMap[key] || 0) + money(row.total)
      }
      revenueMap.RESTAURANT_POS = (revenueMap.RESTAURANT_POS || 0) + posOrders.reduce((a, r) => a + money(r.total), 0)
      revenueMap.FACILITY = (revenueMap.FACILITY || 0) + facilitySales.reduce((a, r) => a + money(r.total), 0)

      const receiptMap = {}
      for (const row of payments) {
        const key = normalizeMethod(row.method)
        receiptMap[key] = (receiptMap[key] || 0) + money(row.amount)
      }
      for (const row of posOrders) {
        const key = normalizeMethod(row.payment_method)
        receiptMap[key] = (receiptMap[key] || 0) + money(row.total)
      }
      for (const row of facilitySales) {
        const key = normalizeMethod(row.payment_method)
        receiptMap[key] = (receiptMap[key] || 0) + money(row.total)
      }

      const revenueLines = Object.entries(revenueMap)
        .map(([label, amount]) => ({ label: label.replaceAll('_', ' '), amount }))
        .sort((a, b) => b.amount - a.amount)

      const receiptLines = Object.entries(receiptMap)
        .map(([label, amount]) => ({ label, amount }))
        .sort((a, b) => b.amount - a.amount)

      const totalRevenue = revenueLines.reduce((a, r) => a + r.amount, 0)
      const totalReceipts = receiptLines.reduce((a, r) => a + r.amount, 0)

      const receivableRows = invoices.map((inv) => {
        const fallbackDue = money(inv?.totals?.grand_total) - money(inv.paid)
        const due = Math.max(money(inv.due), fallbackDue, 0)
        return {
          invoiceNo: inv.invoice_no || `INV-${inv.id}`,
          issueDate: inv.issued_at,
          status: inv.status || 'OPEN',
          due,
        }
      }).filter((x) => x.due > 0)

      const outstandingDue = receivableRows.reduce((a, r) => a + r.due, 0)
      const topReceivables = receivableRows.sort((a, b) => b.due - a.due).slice(0, 12)

      const statusMap = {}
      for (const row of reservations) {
        const key = row.status || 'UNSPECIFIED'
        statusMap[key] = (statusMap[key] || 0) + 1
      }
      const reservationLines = Object.entries(statusMap)
        .map(([status, count]) => ({ status: status.replaceAll('_', ' '), count }))
        .sort((a, b) => b.count - a.count)

      const closeDays = new Set((dayCloses || []).map((x) => x.close_date)).size
      const rangeDays = daysBetweenInclusive(fromDate, toDate)
      const occupancyRate = activeRooms.length ? (inHouse.length / activeRooms.length) * 100 : 0
      const collectionRate = totalRevenue > 0 ? (totalReceipts / totalRevenue) * 100 : 0
      const closeCoverage = rangeDays > 0 ? (closeDays / rangeDays) * 100 : 0

      setSnapshot({
        generatedAt: new Date().toISOString(),
        kpis: {
          totalRevenue,
          totalReceipts,
          outstandingDue,
          occupancyRate,
          collectionRate,
          closeCoverage,
          closedDays: closeDays,
          rangeDays,
        },
        revenueLines,
        receiptLines,
        reservationLines,
        topReceivables,
      })
    } catch (e) {
      setError(e.message || 'Failed to load enterprise reporting snapshot.')
    } finally {
      setLoading(false)
    }
  }, [fromDate, toDate, today])

  useEffect(() => { loadSnapshot() }, [loadSnapshot])

  const exportWorkbook = useCallback(() => {
    const revRows = [
      ['Revenue Stream', 'Amount'],
      ...snapshot.revenueLines.map((r) => [r.label, r.amount]),
      ['TOTAL', snapshot.kpis.totalRevenue],
    ]
    const recRows = [
      ['Receipt Method', 'Amount'],
      ...snapshot.receiptLines.map((r) => [r.label, r.amount]),
      ['TOTAL', snapshot.kpis.totalReceipts],
    ]
    const opsRows = [
      ['Metric', 'Value'],
      ['Occupancy Rate (%)', snapshot.kpis.occupancyRate.toFixed(2)],
      ['Collection Rate (%)', snapshot.kpis.collectionRate.toFixed(2)],
      ['Night Close Coverage (%)', snapshot.kpis.closeCoverage.toFixed(2)],
      ['Closed Days', snapshot.kpis.closedDays],
      ['Range Days', snapshot.kpis.rangeDays],
      [],
      ['Reservation Status', 'Count'],
      ...snapshot.reservationLines.map((r) => [r.status, r.count]),
    ]
    const arRows = [
      ['Invoice', 'Issue Date', 'Status', 'Due'],
      ...snapshot.topReceivables.map((r) => [r.invoiceNo, r.issueDate ? fmtDate(r.issueDate.slice(0, 10)) : '—', r.status, r.due]),
      ['TOTAL DUE', '', '', snapshot.kpis.outstandingDue],
    ]

    exportXLSX(`Enterprise_Reports_${fromDate}_to_${toDate}.xlsx`, [
      { name: 'Revenue', rows: revRows },
      { name: 'Receipts', rows: recRows },
      { name: 'Operations', rows: opsRows },
      { name: 'Receivables', rows: arRows },
    ])
  }, [fromDate, toDate, snapshot])

  const buildReportRows = useCallback((report) => {
    const header = [
      [report.name],
      [`Department: ${report.department}`, `Cycle: ${REPORT_CYCLES.find((c) => c.id === cycle)?.label || cycle}`],
      [`Date Range: ${fmtDate(fromDate)} to ${fmtDate(toDate)}`, `Generated: ${new Date().toLocaleString()}`],
      [],
    ]

    const summaryRows = [
      ['Metric', 'Value'],
      ['Total Revenue', snapshot.kpis.totalRevenue],
      ['Total Receipts', snapshot.kpis.totalReceipts],
      ['Outstanding Due', snapshot.kpis.outstandingDue],
      ['Occupancy Rate (%)', snapshot.kpis.occupancyRate.toFixed(2)],
      ['Collection Rate (%)', snapshot.kpis.collectionRate.toFixed(2)],
      ['Night Close Coverage (%)', snapshot.kpis.closeCoverage.toFixed(2)],
    ]

    const name = report.name.toLowerCase()
    if (name.includes('receivable') || name.includes('aging') || name.includes('due balance')) {
      return [
        ...header,
        ['Invoice No', 'Issue Date', 'Status', 'Due Amount'],
        ...snapshot.topReceivables.map((r) => [r.invoiceNo, r.issueDate ? fmtDate(r.issueDate.slice(0, 10)) : '-', r.status, r.due]),
        ['TOTAL DUE', '', '', snapshot.kpis.outstandingDue],
      ]
    }

    if (name.includes('payment') || name.includes('collection') || name.includes('bank book') || name.includes('cash book')) {
      return [
        ...header,
        ['Payment Method', 'Amount'],
        ...snapshot.receiptLines.map((r) => [r.label, r.amount]),
        ['TOTAL', snapshot.kpis.totalReceipts],
      ]
    }

    if (name.includes('sales') || name.includes('revenue') || name.includes('profit') || name.includes('cost')) {
      return [
        ...header,
        ['Revenue Stream', 'Amount'],
        ...snapshot.revenueLines.map((r) => [r.label, r.amount]),
        ['TOTAL', snapshot.kpis.totalRevenue],
      ]
    }

    if (name.includes('occupancy') || name.includes('room') || name.includes('arrival') || name.includes('departure') || name.includes('check-in') || name.includes('check-out')) {
      return [
        ...header,
        ['Status', 'Count'],
        ...snapshot.reservationLines.map((r) => [r.status, r.count]),
        [],
        ['Live Occupancy (%)', snapshot.kpis.occupancyRate.toFixed(2)],
      ]
    }

    if (name.includes('night audit') || name.includes('day closing')) {
      return [
        ...header,
        ['Metric', 'Value'],
        ['Closed Days', snapshot.kpis.closedDays],
        ['Range Days', snapshot.kpis.rangeDays],
        ['Close Coverage (%)', snapshot.kpis.closeCoverage.toFixed(2)],
        ['Total Revenue', snapshot.kpis.totalRevenue],
        ['Total Receipts', snapshot.kpis.totalReceipts],
      ]
    }

    return [...header, ...summaryRows]
  }, [cycle, fromDate, snapshot, toDate])

  const exportReportXlsx = useCallback((report) => {
    exportXLSX(`${safeFileName(report.name)}_${fromDate}_to_${toDate}.xlsx`, [
      { name: report.name, rows: buildReportRows(report) },
    ])
  }, [buildReportRows, fromDate, toDate])

  const printReport = useCallback((report) => {
    const rows = buildReportRows(report)
    const tableRows = rows.map((row) => {
      if (row.length === 0) return '<tr><td colspan="4" style="height:12px"></td></tr>'
      return `<tr>${row.map((cell) => `<td>${cell ?? ''}</td>`).join('')}</tr>`
    }).join('')

    const win = window.open('', '_blank', 'width=1100,height=800')
    if (!win) return
    win.document.write(`
      <html>
        <head>
          <title>${report.name}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #1f332b; padding: 24px; }
            h1 { font-size: 20px; margin: 0 0 8px; }
            .meta { color: #60746a; font-size: 12px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            td { border: 1px solid #d8e2dc; padding: 7px 8px; vertical-align: top; }
            tr:first-child td { font-size: 16px; font-weight: 700; background: #eef5ef; }
            tr:nth-child(5) td { font-weight: 700; background: #f6f8f6; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h1>${report.name}</h1>
          <div class="meta">${report.department} | ${fmtDate(fromDate)} to ${fmtDate(toDate)}</div>
          <table>${tableRows}</table>
        </body>
      </html>
    `)
    win.document.close()
    win.focus()
    win.print()
  }, [buildReportRows, fromDate, toDate])

  return (
    <div className="space-y-5">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <BarChart3 size={23} className="text-forest" /> Enterprise Reporting Center
              </CardTitle>
              <CardDescription className="mt-1">
                Professional ERP-grade analytics for management, finance, and operations.
              </CardDescription>
              <div className="mt-2 flex items-center gap-2 text-xs text-pine/60">
                <Building2 size={14} />
                <span>Tenant Scope: {tenantId || 'RLS-managed tenant context'}</span>
              </div>
            </div>
            <Badge variant="info" className="whitespace-nowrap">
              Last refresh: {snapshot.generatedAt ? new Date(snapshot.generatedAt).toLocaleString() : 'Not generated'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label className="label">Cycle</label>
              <select
                className="input"
                value={cycle}
                onChange={(e) => setCycleRange(e.target.value)}
              >
                {REPORT_CYCLES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">From</label>
              <Input type="date" value={fromDate} onChange={(e) => { setFromDate(e.target.value); setCycle('custom') }} max={toDate} />
            </div>
            <div>
              <label className="label">To</label>
              <Input type="date" value={toDate} onChange={(e) => { setToDate(e.target.value); setCycle('custom') }} min={fromDate} max={today} />
            </div>
            <div className="relative">
              <label className="label">Search Reports</label>
              <Search size={15} className="absolute left-3 bottom-2.5 text-pine/40" />
              <Input className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Report name, code, department" />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" className="w-full sm:w-auto" onClick={loadSnapshot} disabled={loading}>
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
              </Button>
              <Button className="w-full sm:w-auto" onClick={exportWorkbook} disabled={loading}>
                <Download size={15} /> Export XLSX
              </Button>
            </div>
          </div>
          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm px-3 py-2 flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
            <div className="border-b lg:border-b-0 lg:border-r border-[--border-color] bg-leaf/[0.22]">
              <div className="px-4 pt-4 pb-2">
                <p className="text-[11px] uppercase tracking-wider text-pine/60">Report Groups</p>
                <p className="text-sm font-semibold text-pine">Department report navigation</p>
              </div>
              <div className="px-2 pb-3 space-y-1">
                {REPORT_SECTIONS.map((s) => {
                  const Icon = s.icon
                  const active = activeSection === s.id
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveSection(s.id)}
                      className={`w-full text-left rounded-lg border px-3 py-2.5 transition ${active ? 'border-primary bg-primary/10' : 'border-transparent hover:border-primary/35 hover:bg-white/70'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon size={16} className={active ? 'text-primary' : 'text-pine'} />
                          <span className="text-sm font-medium text-pine">{s.label}</span>
                        </div>
                        {active && <Badge variant="success">Open</Badge>}
                      </div>
                      <p className="mt-1 text-[11px] text-pine/60">{s.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-pine/60">Report Catalogue</p>
                  <h2 className="text-lg font-semibold text-pine">{activeSectionMeta?.label || 'Reports'}</h2>
                  <p className="text-sm text-pine/60">{activeSectionMeta?.desc}</p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Badge variant="outline">{activePanelItems.length} reports</Badge>
                  <Badge variant="info" className="gap-1"><CalendarRange size={12} /> {REPORT_CYCLES.find((c) => c.id === cycle)?.label}</Badge>
                </div>
              </div>

              <div className="mt-3 rounded-lg border border-[--border-color] overflow-hidden">
                <div className="hidden xl:grid grid-cols-[90px_160px_1fr_160px_230px] bg-leaf/30 px-3 py-2 text-[11px] uppercase tracking-wide text-pine/70">
                  <span>Code</span>
                  <span>Department</span>
                  <span>Report Name</span>
                  <span>Cycle</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-[--border-color] bg-white">
                  {activePanelItems.map((item) => (
                    <div key={item.code} className="grid grid-cols-1 xl:grid-cols-[90px_160px_1fr_160px_230px] px-3 py-2.5 gap-2 xl:items-center">
                      <span className="text-xs font-semibold text-pine/80">{item.code}</span>
                      <div className="text-xs text-pine/60">{item.department}</div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-pine">{item.name}</p>
                        <p className="text-xs text-pine/60">{item.actions}</p>
                      </div>
                      <div className="text-xs text-pine/60">{REPORT_CYCLES.find((c) => c.id === cycle)?.label}</div>
                      <div className="flex flex-wrap justify-start xl:justify-end gap-1.5">
                        <Button size="sm" variant="outline" onClick={() => printReport(item)} disabled={loading}>
                          <Printer size={13} /> Print
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => printReport(item)} disabled={loading}>
                          <FileDown size={13} /> PDF
                        </Button>
                        <Button size="sm" onClick={() => exportReportXlsx(item)} disabled={loading}>
                          <Download size={13} /> Excel
                        </Button>
                        {item.schedulable && (
                          <Button size="sm" variant="ghost" disabled title="Schedule/email setup requires mail automation configuration">
                            <Mail size={13} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                  {activePanelItems.length === 0 && (
                    <div className="px-3 py-6 text-center text-sm text-pine/60">
                      No reports match the current filters.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {['all', 'admin'].includes(activeSection) && (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Executive KPI Summary</CardTitle>
            <CardDescription>High-level ERP control metrics for leadership and board reporting.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            <KPIBox title="Total Revenue" value={fmtBDT(snapshot.kpis.totalRevenue)} note="Accrual + settled transactional streams" icon={TrendingUp} variant="success" />
            <KPIBox title="Total Receipts" value={fmtBDT(snapshot.kpis.totalReceipts)} note="Cash and digital collection volume" icon={HandCoins} variant="success" />
            <KPIBox title="Outstanding A/R" value={fmtBDT(snapshot.kpis.outstandingDue)} note="Uncollected invoice balances" icon={AlertCircle} variant="warning" />
            <KPIBox title="Occupancy Rate" value={`${snapshot.kpis.occupancyRate.toFixed(2)}%`} note="Current in-house vs active rooms" icon={BedDouble} />
            <KPIBox title="Collection Efficiency" value={`${snapshot.kpis.collectionRate.toFixed(2)}%`} note="Receipts as % of recognized revenue" icon={CalendarCheck2} />
            <KPIBox title="Night Close Coverage" value={`${snapshot.kpis.closeCoverage.toFixed(2)}%`} note={`${snapshot.kpis.closedDays}/${snapshot.kpis.rangeDays} days closed`} icon={BarChart3} />
          </CardContent>
        </Card>
      )}

      {['all', 'accounts', 'pos', 'sales', 'other'].includes(activeSection) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Revenue Stream Analysis</CardTitle>
              <CardDescription>Department-wise gross contribution for the selected period.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {snapshot.revenueLines.length === 0 && <p className="text-sm text-pine/60">No revenue data for the selected period.</p>}
              {snapshot.revenueLines.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border border-[--border-color] px-3 py-2 bg-white">
                  <span className="text-sm text-pine/80">{row.label}</span>
                  <span className="text-sm font-semibold money">{fmtBDT(row.amount)}</span>
                </div>
              ))}
              {snapshot.revenueLines.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
                  <span className="text-sm font-semibold text-pine">Total</span>
                  <span className="text-sm font-semibold money">{fmtBDT(snapshot.kpis.totalRevenue)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Receipts by Payment Method</CardTitle>
              <CardDescription>Collection distribution across payment channels.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {snapshot.receiptLines.length === 0 && <p className="text-sm text-pine/60">No collection data for the selected period.</p>}
              {snapshot.receiptLines.map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border border-[--border-color] px-3 py-2 bg-white">
                  <span className="text-sm text-pine/80">{row.label}</span>
                  <span className="text-sm font-semibold money">{fmtBDT(row.amount)}</span>
                </div>
              ))}
              {snapshot.receiptLines.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-primary/25 bg-primary/5 px-3 py-2">
                  <span className="text-sm font-semibold text-pine">Total</span>
                  <span className="text-sm font-semibold money">{fmtBDT(snapshot.kpis.totalReceipts)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {['all', 'admin', 'housekeeping', 'sales'].includes(activeSection) && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Reservation Status Mix</CardTitle>
              <CardDescription>Operational booking load distribution in this period.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {snapshot.reservationLines.length === 0 && <p className="text-sm text-pine/60">No reservation activity in selected date range.</p>}
              {snapshot.reservationLines.map((row) => (
                <div key={row.status} className="flex items-center justify-between rounded-lg border border-[--border-color] px-3 py-2 bg-white">
                  <span className="text-sm text-pine/80">{row.status}</span>
                  <Badge variant="outline" className="font-semibold">{row.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Day-Close Governance</CardTitle>
              <CardDescription>Controls health derived from operational day-closing entries.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-lg border border-[--border-color] px-3 py-2 bg-white flex items-center justify-between">
                <span className="text-sm text-pine/80">Closed Days</span>
                <span className="font-semibold">{snapshot.kpis.closedDays}</span>
              </div>
              <div className="rounded-lg border border-[--border-color] px-3 py-2 bg-white flex items-center justify-between">
                <span className="text-sm text-pine/80">Planned Days</span>
                <span className="font-semibold">{snapshot.kpis.rangeDays}</span>
              </div>
              <div className="rounded-lg border border-[--border-color] px-3 py-2 bg-white flex items-center justify-between">
                <span className="text-sm text-pine/80">Compliance Coverage</span>
                <span className="font-semibold">{snapshot.kpis.closeCoverage.toFixed(2)}%</span>
              </div>
              <div className="rounded-lg border border-[--border-color] px-3 py-2 bg-white flex items-center justify-between">
                <span className="text-sm text-pine/80">Live Occupancy</span>
                <span className="font-semibold">{snapshot.kpis.occupancyRate.toFixed(2)}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {['all', 'accounts'].includes(activeSection) && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="text-base">Receivables Action Queue</CardTitle>
            <CardDescription>Prioritized overdue invoices for collection follow-up.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="th">Invoice No</th>
                    <th className="th">Issue Date</th>
                    <th className="th">Status</th>
                    <th className="th text-right">Due Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshot.topReceivables.map((row) => (
                    <tr key={`${row.invoiceNo}-${row.issueDate || 'na'}`}>
                      <td className="td font-semibold text-xs">{row.invoiceNo}</td>
                      <td className="td text-xs text-pine/60">{row.issueDate ? fmtDate(row.issueDate.slice(0, 10)) : '—'}</td>
                      <td className="td"><Badge variant="warning">{row.status}</Badge></td>
                      <td className="td text-right money font-semibold">{fmtBDT(row.due)}</td>
                    </tr>
                  ))}
                  {snapshot.topReceivables.length === 0 && (
                    <tr>
                      <td className="td text-center text-pine/60" colSpan={4}>No outstanding invoices in current data snapshot.</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="td font-semibold" colSpan={3}>Total Outstanding Due</td>
                    <td className="td text-right money font-bold text-red-700">{fmtBDT(snapshot.kpis.outstandingDue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
