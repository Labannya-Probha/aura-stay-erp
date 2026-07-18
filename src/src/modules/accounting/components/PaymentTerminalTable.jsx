function formatMethod(value) {
  return String(value || '-')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatMdr(value) {
  const number = Number(value || 0)
  return `${number.toFixed(2)}%`
}

export default function PaymentTerminalTable({
  terminals,
  loading,
  saving,
  onEdit,
  onToggleStatus,
  onDelete,
}) {
  if (loading) return <TableSkeleton />

  if (!terminals.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
        <h3 className="text-base font-semibold text-slate-900">No payment terminal found</h3>
        <p className="mt-2 text-sm text-slate-500">
          Add a terminal to configure settlement, MDR and payment processing rules.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Terminal</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Settlement account</th>
              <th className="px-4 py-3">Rules</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {terminals.map((terminal) => (
              <tr key={terminal.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-4 align-top">
                  <p className="font-semibold text-slate-900">
                    {terminal.terminal_name ?? terminal.name ?? 'Unnamed terminal'}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {terminal.terminal_code ?? terminal.code ?? 'No code'}
                    {terminal.merchant_id ? ` · Merchant ${terminal.merchant_id}` : ''}
                  </p>
                  {terminal.provider_name ? (
                    <p className="mt-1 text-xs text-slate-500">{terminal.provider_name}</p>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top text-slate-700">
                  {formatMethod(terminal.payment_method)}
                </td>
                <td className="px-4 py-4 align-top">
                  <p className="text-slate-800">
                    {terminal.settlement_account?.name ?? terminal.settlement_account_name ?? 'Not assigned'}
                  </p>
                  {terminal.settlement_account?.code || terminal.settlement_account_code ? (
                    <p className="mt-1 text-xs text-slate-500">
                      {terminal.settlement_account?.code ?? terminal.settlement_account_code}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 align-top text-slate-700">
                  <p>{formatMdr(terminal.mdr_percent)} MDR</p>
                  <p className="mt-1 text-xs text-slate-500">
                    T+{Number(terminal.settlement_delay_days ?? 0)} day(s)
                    {terminal.is_auto_settlement ? ' · Auto' : ' · Manual'}
                  </p>
                </td>
                <td className="px-4 py-4 align-top">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                      terminal.is_active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {terminal.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-4 align-top">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="aeds-button-secondary px-3 py-1.5 text-xs"
                      onClick={() => onEdit(terminal)}
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="aeds-button-secondary px-3 py-1.5 text-xs"
                      onClick={() => onToggleStatus(terminal)}
                      disabled={saving}
                    >
                      {terminal.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      onClick={() => onDelete(terminal)}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {[1, 2, 3, 4].map((item) => (
        <div key={item} className="flex gap-4 border-b border-slate-100 p-4 last:border-b-0">
          <div className="h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}
