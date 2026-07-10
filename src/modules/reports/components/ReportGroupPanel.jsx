import { getFieldKey, getFieldLabel } from "../utils/reportTableUtils"

export default function ReportGroupPanel({ fields, groupKey, setGroupKey }) {
  return (
    <label className="aeds-group-select">
      <span>Group by</span>
      <select value={groupKey || ""} onChange={(event) => setGroupKey(event.target.value || "")}>
        <option value="">None</option>
        {fields.map((field) => {
          const key = getFieldKey(field)
          return <option key={key} value={key}>{getFieldLabel(field)}</option>
        })}
      </select>
    </label>
  )
}
