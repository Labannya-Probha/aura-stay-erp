export default function MetadataReportFilters({ filters = [], values = {}, onChange }) {
  const update = (key, value) => onChange({ ...values, [key]: value })

  return (
    <div className="flex flex-wrap items-end gap-3">
      {filters.map((filter) => (
        <label key={filter.filterKey} className="text-xs font-black uppercase tracking-wide text-slate-500">
          {filter.label}

          {filter.filterType === "cycle" ? (
            <select
              value={values[filter.filterKey] || filter.defaultValue || "Monthly"}
              onChange={(event) => update(filter.filterKey, event.target.value)}
              className="mt-1 h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#2E7D32]"
            >
              {(filter.sourceOptions || "Daily,Weekly,Monthly,Quarterly,Half-Yearly,Yearly,Custom Date Range")
                .split(",")
                .map((option) => (
                  <option key={option.trim()} value={option.trim()}>
                    {option.trim()}
                  </option>
                ))}
            </select>
          ) : (
            <input
              type={filter.filterType === "date" ? "date" : "text"}
              value={values[filter.filterKey] || ""}
              onChange={(event) => update(filter.filterKey, event.target.value)}
              className="mt-1 h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#2E7D32]"
            />
          )}
        </label>
      ))}
    </div>
  )
}
