import { X } from "lucide-react"
import AedsDateRangePicker from "./AedsDateRangePicker"

function Field({ field, values, set }) {
  const value = values[field.name] || ""

  return (
    <div className="aeds-filter-field">
      <label>{field.label}</label>

      {field.type === "select" ? (
        <select value={value} onChange={(event) => set(field.name, event.target.value)}>
          <option value="">All</option>
          {(field.options || []).map((option) => (
            <option key={option.value || option} value={option.value || option}>
              {option.label || option}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={field.type || "text"}
          value={value}
          placeholder={field.placeholder || ""}
          onChange={(event) => set(field.name, event.target.value)}
        />
      )}
    </div>
  )
}

export default function AedsFilterDrawer({ open, onClose, schema, values, set, reset }) {
  if (!open) return null

  return (
    <>
      <div className="aeds-filter-drawer-backdrop" onClick={onClose} />

      <aside className="aeds-filter-drawer">
        <header className="aeds-filter-drawer-header">
          <button type="button" className="aeds-filter-btn" onClick={onClose}>
            <X size={16} />
            Close
          </button>
          <h3>Advanced Filters</h3>
          <p>Build precise filters for reports, operations and finance views.</p>
        </header>

        <div className="aeds-filter-drawer-body">
          <AedsDateRangePicker values={values} set={set} />

          {(schema || []).map((field) => (
            <Field key={field.name} field={field} values={values} set={set} />
          ))}
        </div>

        <footer className="aeds-filter-drawer-footer">
          <button type="button" className="aeds-filter-btn" onClick={reset}>
            Reset
          </button>
          <button type="button" className="aeds-filter-btn primary" onClick={onClose}>
            Apply Filters
          </button>
        </footer>
      </aside>
    </>
  )
}
