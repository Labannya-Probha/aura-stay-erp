import React, { useEffect, useRef, useState } from "react"
import { searchFilterOptions } from "../sdk/reportMetadata.service"
import { getTenantId } from "../../../lib/tenant"

export interface ReportFilterDef {
  filterKey: string
  label: string
  filterType: string
  sourceOptions?: string
  defaultValue?: string
  required?: boolean
  isGlobal?: boolean
}

export type FilterValues = Record<string, any>

interface FilterOption {
  value: string
  label: string
}

interface AsyncSearchSelectProps {
  sourceHint?: string
  value?: string
  displayValue?: string
  onSelect: (value: string | null, label: string) => void
  placeholder?: string
}

/**
 * A debounced, DB-backed searchable dropdown. Used for any filter whose
 * sourceOptions is a table reference (e.g. "vendors table",
 * "chart_of_accounts (subtype=Bank)") rather than a literal CSV list —
 * options are fetched live from aeds_filter_options as the user types.
 */
function AsyncSearchSelect({ sourceHint, value, displayValue, onSelect, placeholder }: AsyncSearchSelectProps) {
  const [query, setQuery] = useState<string>(displayValue || "")
  const [options, setOptions] = useState<FilterOption[]>([])
  const [open, setOpen] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(displayValue || "")
  }, [displayValue])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const results = await searchFilterOptions(sourceHint || "", query, getTenantId())
      setOptions(Array.isArray(results) ? results : [])
      setLoading(false)
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query, sourceHint])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setQuery(event.target.value)
          setOpen(true)
          if (event.target.value === "") onSelect(null, "")
        }}
        className="mt-1 h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#2E7D32]"
      />
      {open && (
        <div className="absolute z-20 mt-1 max-h-56 w-full min-w-[200px] overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {loading && (
            <div className="px-3 py-2 text-xs font-semibold text-slate-400">Searching...</div>
          )}
          {!loading && options.length === 0 && (
            <div className="px-3 py-2 text-xs font-semibold text-slate-400">No matches</div>
          )}
          {!loading &&
            options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onSelect(opt.value, opt.label)
                  setQuery(opt.label)
                  setOpen(false)
                }}
                className="cursor-pointer px-3 py-2 text-sm font-semibold normal-case text-slate-700 hover:bg-[#F7F4EC]"
              >
                {opt.label}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

interface MetadataReportFiltersProps {
  filters?: ReportFilterDef[]
  values?: FilterValues
  onChange: (values: FilterValues) => void
}

export default function MetadataReportFilters({
  filters = [],
  values = {},
  onChange,
}: MetadataReportFiltersProps) {
  const update = (key: string, value: any) => onChange({ ...values, [key]: value })

  const cycleValue: string =
    values.cycle || filters.find((f) => f.filterType === "cycle")?.defaultValue || "Monthly"

  const isLiteralOptionList = (raw?: string): boolean => {
    if (!raw) return false
    const s = raw.trim()
    if (!s || s === "-") return false
    if (/table|distinct|\(|\)/i.test(s)) return false
    return true
  }

  const parseOptions = (raw: string): string[] =>
    raw
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean)

  return (
    <div className="flex flex-wrap items-end gap-3">
      {filters.map((filter) => {
        if (filter.filterType === "Date Range Picker" && cycleValue !== "Custom Date Range") {
          return null
        }

        return (
          <label key={filter.filterKey} className="text-xs font-black uppercase tracking-wide text-slate-500">
            {filter.label}

            {filter.filterType === "cycle" && (
              <select
                value={values[filter.filterKey] || filter.defaultValue || "Monthly"}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) => update(filter.filterKey, event.target.value)}
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
            )}

            {filter.filterType === "Dropdown" && (
              isLiteralOptionList(filter.sourceOptions) ? (
                <select
                  value={values[filter.filterKey] ?? filter.defaultValue ?? "All"}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) => update(filter.filterKey, event.target.value)}
                  className="mt-1 h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#2E7D32]"
                >
                  {!parseOptions(filter.sourceOptions as string).includes("All") && (
                    <option value="All">All</option>
                  )}
                  {parseOptions(filter.sourceOptions as string).map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              ) : (
                <AsyncSearchSelect
                  sourceHint={filter.sourceOptions}
                  value={values[filter.filterKey]}
                  displayValue={values[`${filter.filterKey}_label`]}
                  placeholder="All"
                  onSelect={(val, label) => {
                    update(filter.filterKey, val)
                    update(`${filter.filterKey}_label`, label)
                  }}
                />
              )
            )}

            {filter.filterType === "Multi-select" && isLiteralOptionList(filter.sourceOptions) && (
              <select
                multiple
                value={values[filter.filterKey] || []}
                onChange={(event: React.ChangeEvent<HTMLSelectElement>) =>
                  update(
                    filter.filterKey,
                    Array.from(event.target.selectedOptions).map((o) => o.value)
                  )
                }
                className="mt-1 h-11 min-w-[140px] rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 outline-none focus:border-[#2E7D32]"
              >
                {parseOptions(filter.sourceOptions as string).map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}

            {filter.filterType === "Multi-select" && !isLiteralOptionList(filter.sourceOptions) && (
              <AsyncSearchSelect
                sourceHint={filter.sourceOptions}
                value={values[filter.filterKey]}
                displayValue={values[`${filter.filterKey}_label`]}
                placeholder="All"
                onSelect={(val, label) => {
                  update(filter.filterKey, val)
                  update(`${filter.filterKey}_label`, label)
                }}
              />
            )}

            {filter.filterType === "Searchable Dropdown" && (
              <AsyncSearchSelect
                sourceHint={filter.sourceOptions}
                value={values[filter.filterKey]}
                displayValue={values[`${filter.filterKey}_label`]}
                placeholder={`Search ${filter.label}...`}
                onSelect={(val, label) => {
                  update(filter.filterKey, val)
                  update(`${filter.filterKey}_label`, label)
                }}
              />
            )}

            {filter.filterType === "Date Picker" && (
              <input
                type="date"
                value={values[filter.filterKey] || ""}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => update(filter.filterKey, event.target.value)}
                className="mt-1 h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#2E7D32]"
              />
            )}

            {filter.filterType === "Date Range Picker" && (
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="date"
                  value={values[`${filter.filterKey}_from`] || ""}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    update(`${filter.filterKey}_from`, event.target.value)
                  }
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#2E7D32]"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={values[`${filter.filterKey}_to`] || ""}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                    update(`${filter.filterKey}_to`, event.target.value)
                  }
                  className="h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#2E7D32]"
                />
              </div>
            )}

            {!["cycle", "Dropdown", "Multi-select", "Searchable Dropdown", "Date Picker", "Date Range Picker"].includes(
              filter.filterType
            ) && (
              <input
                type={filter.filterType === "date" ? "date" : "text"}
                value={values[filter.filterKey] || ""}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => update(filter.filterKey, event.target.value)}
                className="mt-1 h-11 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 outline-none focus:border-[#2E7D32]"
              />
            )}
          </label>
        )
      })}
    </div>
  )
}
