import { CheckCircle2, MessageSquareText, X, XCircle } from "lucide-react"
import { useState } from "react"

export default function AedsApprovalDialog({ dialog, onClose }) {
  const [comment, setComment] = useState("")

  const approve = async () => {
    await dialog.onApprove?.({ comment })
    onClose()
  }

  const reject = async () => {
    await dialog.onReject?.({ comment })
    onClose()
  }

  return (
    <div className="aeds-dialog-center-wrap">
      <div className="aeds-dialog-backdrop" onClick={onClose} />

      <section className="aeds-approval-dialog" role="dialog" aria-modal="true">
        <header className="aeds-dialog-header">
          <div>
            <p className="aeds-dialog-eyebrow">{dialog.eyebrow || "Approval Workflow"}</p>
            <h2>{dialog.title || "Approval Required"}</h2>
            <p>{dialog.description || "Review the request and add a comment before approval or rejection."}</p>
          </div>

          <button type="button" className="aeds-dialog-icon-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

        <div className="aeds-dialog-body">
          <label className="aeds-dialog-label">
            <span><MessageSquareText size={16} /> Comment</span>
            <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Write approval or rejection comment..." />
          </label>

          {dialog.auditTrail && (
            <div className="aeds-audit-box">
              <strong>Audit Trail</strong>
              {dialog.auditTrail.map((item) => (
                <div key={`${item.label}-${item.time}`}>
                  <span>{item.label}</span>
                  <em>{item.time}</em>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="aeds-dialog-footer">
          <button type="button" className="aeds-dialog-btn danger" onClick={reject}>
            <XCircle size={16} />
            Reject
          </button>
          <button type="button" className="aeds-dialog-btn primary" onClick={approve}>
            <CheckCircle2 size={16} />
            Approve
          </button>
        </footer>
      </section>
    </div>
  )
}
