import { Printer, X } from "lucide-react"

export default function AedsPrintPreview({ dialog, onClose }) {
  const Content = dialog.content

  return (
    <div className="aeds-dialog-center-wrap">
      <div className="aeds-dialog-backdrop" onClick={onClose} />

      <section className={`aeds-print-preview ${dialog.paper || "a4"}`} role="dialog" aria-modal="true">
        <header className="aeds-print-preview-header no-print">
          <div>
            <p className="aeds-dialog-eyebrow">{dialog.eyebrow || "Print Preview"}</p>
            <h2>{dialog.title || "Print Preview"}</h2>
          </div>

          <div className="aeds-print-actions">
            <button type="button" className="aeds-dialog-btn primary" onClick={() => window.print()}>
              <Printer size={16} />
              Print
            </button>

            <button type="button" className="aeds-dialog-icon-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="aeds-print-paper">
          {typeof Content === "function" ? <Content close={onClose} /> : Content || dialog.children}
        </div>
      </section>
    </div>
  )
}
