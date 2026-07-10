import { AlertTriangle, CheckCircle2, X } from "lucide-react"

export default function AedsConfirmDialog({ dialog, onClose }) {
  const danger = dialog.tone === "danger"

  const confirm = async () => {
    await dialog.onConfirm?.()
    onClose()
  }

  return (
    <div className="aeds-dialog-center-wrap">
      <div className="aeds-dialog-backdrop" onClick={onClose} />

      <section className="aeds-confirm-dialog" role="alertdialog" aria-modal="true">
        <button type="button" className="aeds-dialog-icon-btn aeds-confirm-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div className={`aeds-confirm-icon ${danger ? "danger" : "success"}`}>
          {danger ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
        </div>

        <h2>{dialog.title || "Are you sure?"}</h2>
        <p>{dialog.description || "Please confirm this action."}</p>

        <div className="aeds-confirm-actions">
          <button type="button" className="aeds-dialog-btn" onClick={onClose}>
            {dialog.cancelLabel || "Cancel"}
          </button>

          <button type="button" className={`aeds-dialog-btn ${danger ? "danger" : "primary"}`} onClick={confirm}>
            {dialog.confirmLabel || "Confirm"}
          </button>
        </div>
      </section>
    </div>
  )
}
