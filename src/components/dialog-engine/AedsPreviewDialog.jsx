import { Download, Printer, X } from "lucide-react"

export default function AedsPreviewDialog({ dialog, onClose }) {
  const Content = dialog.content

  return (
    <div className="aeds-dialog-center-wrap">
      <div className="aeds-dialog-backdrop" onClick={onClose} />

      <section className="aeds-preview-dialog" role="dialog" aria-modal="true">
        <header className="aeds-dialog-header">
          <div>
            <p className="aeds-dialog-eyebrow">{dialog.eyebrow || "Preview"}</p>
            <h2>{dialog.title || "Document Preview"}</h2>
            {dialog.description && <p>{dialog.description}</p>}
          </div>

          <button type="button" className="aeds-dialog-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="aeds-preview-toolbar">
          <button type="button" className="aeds-dialog-btn" onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </button>
          <button type="button" className="aeds-dialog-btn">
            <Download size={16} />
            Download
          </button>
        </div>

        <div className="aeds-preview-body">
          {typeof Content === "function" ? <Content close={onClose} /> : Content || dialog.children}
        </div>
      </section>
    </div>
  )
}
