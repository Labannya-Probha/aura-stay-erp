import { DATE_PRESETS } from "./filterUtils"

export default function AedsDateRangePicker({ values, set }) {
  const cycle = values.cycle || "this_month"

  return (
    <>
      <div className="aeds-filter-field">
        <label>Cycle</label>
        <select value={cycle} onChange={(event) => set("cycle", event.target.value)}>
          {DATE_PRESETS.map((preset) => (
            <option key={preset.key} value={preset.key}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      {cycle === "custom" && (
        <>
          <div className="aeds-filter-field">
            <label>Start Date</label>
            <input
              type="date"
              value={values.startDate || ""}
              onChange={(event) => set("startDate", event.target.value)}
            />
          </div>

          <div className="aeds-filter-field">
            <label>End Date</label>
            <input
              type="date"
              value={values.endDate || ""}
              onChange={(event) => set("endDate", event.target.value)}
            />
          </div>
        </>
      )}
    </>
  )
}
