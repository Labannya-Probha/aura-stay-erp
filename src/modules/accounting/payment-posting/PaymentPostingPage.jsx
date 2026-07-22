import { useMemo, useState } from 'react'
import { BookCheck, Send, ListChecks, Play } from 'lucide-react'
import { supabase } from 'src/lib/supabase'
import { getTenantId } from 'src/lib/tenant'
import Breadcrumb from 'src/components/layout/Breadcrumb'
import ModuleLayout from 'src/components/shared/ModuleLayout'
import ModuleDataTable from 'src/components/shared/ModuleDataTable'
import ModuleStatusPill from 'src/components/shared/ModuleStatusPill'
import usePaymentPosting from './hooks/usePaymentPosting'

const DEFAULT_POSTING_PAYLOAD = {
  paymentId: '',
  amount: 0,
  method: 'CARD',
  sourceModule: 'RESERVATION',
  sourceReference: '',
  terminalId: null,
  currency: 'BDT',
}

const STATUS_TONES = {
  PENDING: 'warning',
  PROCESSING: 'info',
  POSTED: 'success',
  FAILED: 'danger',
}

export default function PaymentPostingPage() {
  const tenantId = getTenantId()
  const { postNow, queue, processQueue, isPosting, error, lastResult } = usePaymentPosting(tenantId)

  const [payloadText, setPayloadText] = useState(JSON.stringify(DEFAULT_POSTING_PAYLOAD, null, 2))
  const [rows, setRows] = useState([])
  const [notice, setNotice] = useState('')

  const loadRows = async () => {
    const { data } = await supabase
      .from('payment_postings')
      .select(
        'id, idempotency_key, source_module, source_reference, payment_method, amount, status, posted_at, created_at',
      )
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100)
    setRows(data || [])
  }

  const parsePayload = () => JSON.parse(payloadText)

  const run = async (operation) => {
    try {
      const payload = parsePayload()
      await operation(payload)
      setNotice('Payment posting operation completed.')
      window.setTimeout(() => setNotice(''), 2600)
      await loadRows()
    } catch (cause) {
      setNotice(cause?.message || 'Payment posting operation failed.')
      window.setTimeout(() => setNotice(''), 4000)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'idempotency_key',
        label: 'Idempotency Key',
        render: (row) => <span className="font-data text-xs">{row.idempotency_key || '—'}</span>,
      },
      {
        key: 'source_module',
        label: 'Source',
        render: (row) => `${row.source_module || '-'} / ${row.source_reference || '-'}`,
      },
      { key: 'payment_method', label: 'Method' },
      {
        key: 'amount',
        label: 'Amount',
        align: 'right',
        render: (row) => <span className="font-data">{Number(row.amount || 0).toFixed(2)}</span>,
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
      routeKey="accounting-payment-posting"
      eyebrow="Finance Operations"
      title="Payment Posting"
      description="Run payment posting now, queue asynchronous posting, and monitor posting status."
      icon={BookCheck}
      breadcrumb={
        <Breadcrumb
          items={[
            { label: 'Modules' },
            { label: 'Accounting' },
            { label: 'Payment Posting', current: true },
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
          Posting Payload JSON
        </p>
        <textarea
          className="min-h-52 w-full rounded-lg border border-slate-300 p-3 font-data text-xs"
          value={payloadText}
          onChange={(event) => setPayloadText(event.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            disabled={isPosting}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-3 text-sm font-semibold text-white disabled:opacity-60"
            onClick={() => run(postNow)}
          >
            <Send size={15} /> Post Now
          </button>
          <button
            disabled={isPosting}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold disabled:opacity-60"
            onClick={() => run(queue)}
          >
            <Play size={15} /> Queue
          </button>
          <button
            disabled={isPosting}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold disabled:opacity-60"
            onClick={() => processQueue(25).then(loadRows)}
          >
            <ListChecks size={15} /> Process Queue
          </button>
        </div>
        {lastResult ? (
          <pre className="mt-3 overflow-auto rounded-lg bg-slate-900 p-3 text-xs text-slate-100">
            {JSON.stringify(lastResult, null, 2)}
          </pre>
        ) : null}
      </div>

      <ModuleDataTable columns={columns} rows={rows} emptyText="No payment postings found" />
    </ModuleLayout>
  )
}
