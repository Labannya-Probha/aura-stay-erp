export default function ConfirmDeleteDialog({ open, terminal, busy, onCancel, onConfirm }) {
  if (!open || !terminal) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation"
        className="absolute inset-0 bg-slate-950/45"
        onClick={onCancel}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-900">Delete payment terminal?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          <strong>{terminal.terminal_name ?? terminal.name}</strong> will be removed. Historical
          transactions should continue to retain their original terminal reference.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="aeds-button-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button
            type="button"
            className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Deleting…' : 'Delete terminal'}
          </button>
        </div>
      </div>
    </div>
  )
}
