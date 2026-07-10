import { Filter, Save } from "lucide-react"
import AedsDateRangePicker from "./AedsDateRangePicker"

function CompactField({ field, values, set }) {
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

export default function AedsFilterBar({
  schema = [],
  values,
  set,
  onOpenAdvanced,
  onSave,
}) {
  const compactFields = schema.filter((field) => field.compact !== false).slice(0, 3)

  return (
    <div className="aeds-filter-bar">
      <AedsDateRangePicker values={values} set={set} />

      {compactFields.map((field) => (
        <CompactField key={field.name} field={field} values={values} set={set} />
      ))}

      <div className="aeds-filter-actions">
        <button type="button" className="aeds-filter-btn" onClick={onOpenAdvanced}>
          <Filter size={16} />
          Advanced
        </button>

        <button type="button" className="aeds-filter-btn primary" onClick={onSave}>
          <Save size={16} />
          Save
        </button>
      </div>
    </div>
  )
}
