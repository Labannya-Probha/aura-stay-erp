import { RotateCcw, Save, Send, UploadCloud } from "lucide-react"

export default function AedsFormToolbar({ dirty, onReset }) {
  return (
    <div className="aeds-form-toolbar">
      <button type="submit" className="aeds-form-btn primary">
        <Save size={16} />
        Save
      </button>

      <button type="button" className="aeds-form-btn">
        <Send size={16} />
        Submit for Approval
      </button>

      <button type="button" className="aeds-form-btn">
        <UploadCloud size={16} />
        Attachment
      </button>

      <button type="button" className={`aeds-form-btn ${dirty ? "warning" : ""}`} onClick={onReset}>
        <RotateCcw size={16} />
        Reset
      </button>
    </div>
  )
}
