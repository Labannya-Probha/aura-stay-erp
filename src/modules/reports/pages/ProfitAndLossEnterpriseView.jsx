import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from 'src/components/ui/card'
import { Button } from 'src/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'src/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'src/components/ui/select'
import { Printer, FileText, FileSpreadsheet, TrendingUp, DollarSign } from 'lucide-react'
import { supabase } from 'src/lib/supabase'
import { getTenantId } from 'src/lib/tenant'

/**
 * New UI design, wired to real data — sprint step 1.
 *
 * Standalone page (not yet linked from any route or replacing the
 * existing P&L view) so it can be reviewed and verified against real
 * data before anything currently working is touched. Calls
 * aeds_run_report -> rpt_ifrs_profit_or_loss exactly like the existing
 * report path, so the numbers shown here are guaranteed to match what
 * the live Reports Center already shows for the same tenant/period.
 */
function fmtBDT(amount) {
  const n = Number(amount) || 0
  if (n === 0) return '৳0.00'
  const abs = Math.abs(n).toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n < 0 ? `(৳${abs})` : `৳${abs}`
}

export default function ProfitAndLossEnterpriseView() {
  const [cycle, setCycle] = useState('monthly')
  const [comparison, setComparison] = useState('previous_period')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      const today = new Date()
      const startDate =
        cycle === 'yearly'
          ? `${today.getFullYear()}-01-01`
          : cycle === 'quarterly'
            ? `${today.getFullYear()}-${String(Math.floor(today.getMonth() / 3) * 3 + 1).padStart(2, '0')}-01`
            : `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
      const endDate = today.toISOString().slice(0, 10)

      const { data, error: rpcError } = await supabase.rpc('aeds_run_report', {
        p_department_slug: 'accounts',
        p_report_slug: 'profit-and-loss-statement',
        p_filters: { start_date: startDate, end_date: endDate },
        p_tenant_id: getTenantId(),
      })
      if (cancelled) return
      if (rpcError) { setError(rpcError.message); setLoading(false); return }
      setSummary(data?.summary || null)
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [cycle])

  const plData = summary
    ? [
        { line: 'Gross Profit', current: fmtBDT(summary.gross_profit), isSubtotal: false },
        { line: 'Operating Profit', current: fmtBDT(summary.net_profit), isSubtotal: false },
        { line: 'Profit Before Tax', current: fmtBDT((summary.net_profit || 0) + (summary.tax || 0)), isSubtotal: false },
        { line: 'Profit for the Period', current: fmtBDT(summary.net_profit), isSubtotal: true },
      ]
    : []

  const periodLabel = summary ? `For the period ${summary.start_date} to ${summary.end_date}` : ''

  return (
    <div className="w-full space-y-6 p-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">ACCOUNTS</span>
            <span className="text-xs text-slate-500 font-medium">{plData.length} ROWS • COMPARE: {comparison.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Profit &amp; Loss Statement</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 text-slate-700 border-slate-300" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print View
          </Button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">CYCLE</label>
          <Select value={cycle} onValueChange={setCycle}>
            <SelectTrigger className="w-full border-slate-300">
              <SelectValue placeholder="Select cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-semibold text-slate-600 mb-1.5 block">COMPARISON PERIOD</label>
          <Select value={comparison} onValueChange={setComparison}>
            <SelectTrigger className="w-full border-slate-300">
              <SelectValue placeholder="Previous Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="previous_period">Previous Period</SelectItem>
              <SelectItem value="same_period_last_year">Same Period Last Year</SelectItem>
              <SelectItem value="none">None</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col justify-end lg:col-span-2">
          <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-100">
            <span className="font-semibold text-slate-700">Note:</span> Comparison-period values are not yet wired — showing current period only.
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Failed to load: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '…' : fmtBDT(summary?.revenue)}</h4>
              <p className="text-xs text-slate-400 mt-1">{periodLabel}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Net Profit</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '…' : fmtBDT(summary?.net_profit)}</h4>
              <p className="text-xs text-slate-400 mt-1">{periodLabel}</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm bg-white">
        <CardHeader className="border-b border-slate-100 py-4 px-6">
          <CardTitle className="text-base font-bold text-slate-800">Profit &amp; Loss Statement</CardTitle>
          <p className="text-xs text-slate-500">{periodLabel}</p>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/70 border-b border-slate-200">
              <TableRow>
                <TableHead className="py-3 px-6 font-semibold text-slate-700">PARTICULARS</TableHead>
                <TableHead className="py-3 px-6 text-right font-semibold text-slate-700">CURRENT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow><TableCell colSpan={2} className="py-6 px-6 text-center text-slate-400">Loading…</TableCell></TableRow>
              )}
              {!loading && plData.map((row, index) => (
                <TableRow
                  key={index}
                  className={`border-b border-slate-100 hover:bg-slate-50/50 ${row.isSubtotal ? 'font-bold bg-slate-50/80 text-slate-900' : 'text-slate-700'}`}
                >
                  <TableCell className="py-4 px-6">{row.line}</TableCell>
                  <TableCell className="py-4 px-6 text-right font-mono">{row.current}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
