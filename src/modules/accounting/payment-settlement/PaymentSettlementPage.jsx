import { useMemo, useState } from 'react'
import { ReceiptText, Send, ListChecks } from 'lucide-react'
import { supabase } from 'src/lib/supabase'
import { getTenantId } from 'src/lib/tenant'
import Breadcrumb from 'src/components/layout/Breadcrumb'
import ModuleLayout from 'src/components/shared/ModuleLayout'
import ModuleDataTable from 'src/components/shared/ModuleDataTable'
import ModuleStatusPill from 'src/components/shared/ModuleStatusPill'
import { paymentSettlementEngine } from './PaymentSettlementEngine'

const DEFAULT_SETTLEMENT_PAYLOAD = {
  terminalId: null,
  provider: 'CARD',
  settlementReference: '',
  settlementDate: new Date().toISOString().slice(0, 10),
  currency: 'BDT',
  grossAmount: 0,
  feeAmount: 0,
  taxAmount: 0,
  netAmount: 0,
  postingIds: [],
}

const STATUS_TONES = {
  PROCESSING: 'warning',
  POSTED: 'success',
  FAILED: 'danger',
}

export default function PaymentSettlementPage() {
  const tenantId = getTenantId()
  const [payloadText, setPayloadText] = useState(
    JSON.stringify(DEFAULT_SETTLEMENT_PAYLOAD, null, 2),
  )
  const [rows, setRows] = useState([])
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)

  const loadRows = async () => {
    const { data } = await supabase
      .from('payment_settlements')
      .select(
        'id, settlement_reference, provider, gross_amount, net_amount, status, posted_at, created_at',
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100)
    setRows(data || [])
  }

  const postSettlement = async () => {
    setPosting(true)
    setError('')
    try {
      const settlement = JSON.parse(payloadText)
      await paymentSettlementEngine.post({ tenantId, settlement })
      setNotice('Settlement posted successfully.')
      window.setTimeout(() => setNotice(''), 2600)
      await loadRows()
    } catch (cause) {
      setError(cause?.message || 'Settlement posting failed.')
    } finally {
      setPosting(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'settlement_reference',
        label: 'Settlement Ref',
        render: (row) => (
          <span className="font-data text-xs">{row.settlement_reference || '—'}</span>
        ),
      },
      { key: 'provider', label: 'Provider' },
      {
        key: 'gross_amount',
        label: 'Gross',
        align: 'right',
        render: (row) => (
          <span className="font-data">{Number(row.gross_amount || 0).toFixed(2)}</span>
        ),
      },
      {
        key: 'net_amount',
        label: 'Net',
        align: 'right',
        render: (row) => (
          <span className="font-data">{Number(row.net_amount || 0).toFixed(2)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <ModuleStatusPill status={row.status} toneMap={STATUS_TONES} />,
      },
      {
        key: 'posted_at',
        label: 'Posted At',
        render: (row) => (row.posted_at ? new Date(row.posted_at).toLocaleString() : '—'),
      },
    ],
    [],
  )

  return (
    <ModuleLayout
      moduleName="Accounting"
      routeKey="accounting-payment-settlement"
      eyebrow="Finance Operations"
      title="Payment Settlement"
      description="Post provider settlements and track journal posting state."
      icon={ReceiptText}
      breadcrumb={
        <Breadcrumb
          items={[
            { label: 'Modules' },
            { label: 'Accounting' },
            { label: 'Payment Settlement', current: true },
          ]}
        />
      }
      actions={
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold"
          onClick={loadRows}
        >
          <ListChecks size={15} /> Refresh
        </button>
      }
    >
      {notice ? (
        <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">{notice}</div>
      ) : null}
      {error ? (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Settlement Payload JSON
        </p>
        <textarea
          className="min-h-52 w-full rounded-lg border border-slate-300 p-3 font-data text-xs"
          value={payloadText}
          onChange={(event) => setPayloadText(event.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            disabled={posting}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white disabled:opacity-60"
            onClick={postSettlement}
          >
            <Send size={15} /> Post Settlement
          </button>
        </div>
      </div>

      <ModuleDataTable columns={columns} rows={rows} emptyText="No settlements found" />
    </ModuleLayout>
  )
}
