import { useEffect, useMemo, useState } from 'react'
import { supabase } from 'src/lib/supabase'
import { getTenantId } from 'src/lib/tenant'
import { fmtBDT, fmtDate, todayISO } from 'src/lib/helpers'
import AedsDataGrid from 'src/components/data-grid/AedsDataGrid.jsx'
import { LegacyButton } from 'src/components/ui/legacy-controls'
import { RotateCcw } from 'lucide-react'

const NO_TENANT_SENTINEL = '00000000-0000-0000-0000-000000000000'

const withTenant = (query) => {
  const tenantId = getTenantId()
  return query.eq('tenant_id', tenantId || NO_TENANT_SENTINEL)
}

const PAYMENT_METHOD_KEYS = ['CASH', 'CARD', 'BKASH', 'NAGAD', 'BANK', 'OTHER']

function parsePaymentLabel(label = '') {
  const upper = String(label).toUpperCase()
  return PAYMENT_METHOD_KEYS.find((key) => upper.includes(key)) || 'OTHER'
}

export default function DayCloseReportsTab() {
  const [day, setDay] = useState(todayISO())
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [payments, setPayments] = useState([])
  const [dayClose, setDayClose] = useState(null)

  const load = async () => {
    setLoading(true)
    const dayStart = `${day}T00:00:00+06:00`
    const dayEnd = `${day}T23:59:59+06:00`

    const [{ data: rows }, { data: paymentRows }, { data: closeRow }] = await Promise.all([
      withTenant(
        supabase
          .from('pos_orders')
          .select(
            'id, order_no, created_at, guest_name, payment_method, status, total, base_amount, service_charge, vat, table_no',
          )
          .gte('created_at', dayStart)
          .lte('created_at', dayEnd),
      ).order('created_at', { ascending: false }),
      withTenant(
        supabase
          .from('payments')
          .select('id, amount, method, reference, received_date, created_at')
          .gte('received_date', day)
          .lte('received_date', day),
      ).order('received_date', { ascending: false }),
      withTenant(
        supabase
          .from('day_closes')
          .select('close_date, closed_at, closed_by, settled_amount, settled_orders')
          .eq('close_date', day)
          .eq('type', 'RESTAURANT')
          .maybeSingle(),
      ),
    ])

    setOrders(rows || [])
    setPayments(paymentRows || [])
    setDayClose(closeRow || null)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [day])

  const metrics = useMemo(() => {
    const settled = orders.filter((row) => row.status === 'SETTLED')
    const chargedToRoom = orders.filter((row) => row.status === 'CHARGED_TO_ROOM')
    const openOrders = orders.filter((row) =>
      ['DRAFT', 'OPEN', 'ACCEPTED', 'READY', 'SERVED'].includes(row.status),
    )
    const cancelled = orders.filter((row) => row.status === 'CANCELLED')

    const grossSales = settled.reduce((sum, row) => sum + Number(row.total || 0), 0)
    const roomChargeSales = chargedToRoom.reduce((sum, row) => sum + Number(row.total || 0), 0)
    const vat = settled.reduce((sum, row) => sum + Number(row.vat || 0), 0)
    const service = settled.reduce((sum, row) => sum + Number(row.service_charge || 0), 0)

    const paymentMix = PAYMENT_METHOD_KEYS.reduce((acc, key) => ({ ...acc, [key]: 0 }), {})
    for (const row of payments) {
      const key = parsePaymentLabel(row.method)
      paymentMix[key] = (paymentMix[key] || 0) + Number(row.amount || 0)
    }

    return {
      grossSales,
      roomChargeSales,
      vat,
      service,
      settledCount: settled.length,
      openCount: openOrders.length,
      cancelledCount: cancelled.length,
      paymentMix,
    }
  }, [orders, payments])

  const rows = useMemo(() => {
    return orders.map((row) => ({
      ...row,
      order_time: row.created_at,
      table_label: row.table_no ? `Table ${row.table_no}` : 'Walk-in',
      total_amount: Number(row.total || 0),
      base_amount_num: Number(row.base_amount || 0),
      vat_num: Number(row.vat || 0),
      service_num: Number(row.service_charge || 0),
    }))
  }, [orders])

  return (
    <div className="space-y-4">
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div>
          <label className="label">Business date</label>
          <input
            type="date"
            className="input"
            value={day}
            onChange={(event) => setDay(event.target.value)}
          />
        </div>
        <LegacyButton variant="ghost" size="xs" className="mt-6" onClick={load}>
          <RotateCcw size={14} /> Refresh
        </LegacyButton>
        {dayClose && (
          <div className="ml-auto text-xs text-pine/70">
            Closed by <span className="font-semibold text-pine">{dayClose.closed_by || '—'}</span>{' '}
            at <span className="font-semibold text-pine">{fmtDate(dayClose.closed_at || day)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="card p-4">
          <div className="label">Settled sales</div>
          <div className="font-display text-xl font-bold text-forest money">
            {fmtBDT(metrics.grossSales)}
          </div>
          <div className="text-xs text-pine/60 mt-1">{metrics.settledCount} orders</div>
        </div>
        <div className="card p-4">
          <div className="label">Charged to room</div>
          <div className="font-display text-xl font-bold text-pine money">
            {fmtBDT(metrics.roomChargeSales)}
          </div>
          <div className="text-xs text-pine/60 mt-1">Folio pending settlement</div>
        </div>
        <div className="card p-4">
          <div className="label">Tax + service</div>
          <div className="font-display text-xl font-bold text-amber money">
            {fmtBDT(metrics.vat + metrics.service)}
          </div>
          <div className="text-xs text-pine/60 mt-1">
            VAT {fmtBDT(metrics.vat)} · Service {fmtBDT(metrics.service)}
          </div>
        </div>
        <div className="card p-4">
          <div className="label">Open / cancelled</div>
          <div className="font-display text-xl font-bold text-pine">
            {metrics.openCount} / {metrics.cancelledCount}
          </div>
          <div className="text-xs text-pine/60 mt-1">Operational queue health</div>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-pine mb-2">Payment Mix</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {PAYMENT_METHOD_KEYS.map((key) => (
            <div key={key} className="rounded-lg border border-leaf px-3 py-2 bg-white">
              <div className="text-xs text-pine/60">{key}</div>
              <div className="font-semibold text-pine money">
                {fmtBDT(metrics.paymentMix[key] || 0)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AedsDataGrid
        title="Restaurant Day Transactions"
        subtitle={`Operational register for ${fmtDate(day)}`}
        data={rows}
        columns={[
          { accessorKey: 'order_no', header: 'Order', width: 150 },
          { accessorKey: 'order_time', header: 'Time', type: 'date', width: 140 },
          { accessorKey: 'table_label', header: 'Table / Context', width: 170 },
          { accessorKey: 'guest_name', header: 'Guest', width: 180 },
          { accessorKey: 'payment_method', header: 'Payment', width: 150 },
          {
            accessorKey: 'base_amount_num',
            header: 'Base',
            type: 'currency',
            aggregation: 'sum',
            width: 140,
          },
          {
            accessorKey: 'service_num',
            header: 'Service',
            type: 'currency',
            aggregation: 'sum',
            width: 140,
          },
          {
            accessorKey: 'vat_num',
            header: 'VAT',
            type: 'currency',
            aggregation: 'sum',
            width: 140,
          },
          {
            accessorKey: 'total_amount',
            header: 'Total',
            type: 'currency',
            aggregation: 'sum',
            width: 150,
          },
          { accessorKey: 'status', header: 'Status', type: 'status', width: 150 },
        ]}
        pageSize={80}
        emptyText={loading ? 'Loading day transactions...' : 'No transactions for this date.'}
        getRowId={(row) => row.id}
      />
    </div>
  )
}
