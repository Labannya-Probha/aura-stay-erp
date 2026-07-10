import { Eye, EyeOff } from "lucide-react"
import { getFieldKey, getFieldLabel } from "../utils/reportTableUtils"

export default function ReportColumnManager({ fields, visibleKeys, setVisibleKeys }) {
  const toggle = (key) => {
    setVisibleKeys((current) => (
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key]
    ))
  }

  return (
    <details className="aeds-report-dropdown">
      <summary>Columns</summary>

      <div className="aeds-report-dropdown-panel">
        {fields.map((field) => {
          const key = getFieldKey(field)
          const visible = visibleKeys.includes(key)

          return (
            <button type="button" key={key} className="aeds-column-toggle" onClick={() => toggle(key)}>
              {visible ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>{getFieldLabel(field)}</span>
            </button>
          )
        })}
      </div>
    </details>
  )
}
