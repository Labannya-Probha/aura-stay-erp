import { X } from "lucide-react"

export default function AedsSideDrawer({ dialog, onClose }) {
  const Content = dialog.content

  return (
    <>
      <div className="aeds-dialog-backdrop" onClick={onClose} />

      <aside className={`aeds-side-drawer ${dialog.size || "md"}`} role="dialog" aria-modal="true">
        <header className="aeds-dialog-header">
          <div>
            <p className="aeds-dialog-eyebrow">{dialog.eyebrow || "Aura Stay ERP"}</p>
            <h2>{dialog.title || "Details"}</h2>
            {dialog.description && <p>{dialog.description}</p>}
          </div>

          <button type="button" className="aeds-dialog-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="aeds-dialog-body">
          {typeof Content === "function" ? <Content close={onClose} /> : Content || dialog.children}
        </div>

        {dialog.footer && (
          <footer className="aeds-dialog-footer">
            {typeof dialog.footer === "function" ? dialog.footer({ close: onClose }) : dialog.footer}
          </footer>
        )}
      </aside>
    </>
  )
}
