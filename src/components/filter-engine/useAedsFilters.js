import { useEffect, useMemo, useState } from "react"
import { buildFilterQuery, readFilterQuery, resolveDatePreset } from "./filterUtils"

export function useAedsFilters({
  initialValues = {},
  syncUrl = true,
  storageKey = "aeds.filters.recent",
  onChange,
} = {}) {
  const [values, setValues] = useState(() => {
    if (syncUrl && typeof window !== "undefined") {
      return { ...initialValues, ...readFilterQuery(window.location.search) }
    }
    return initialValues
  })

  const cleanValues = useMemo(() => values, [values])

  useEffect(() => {
    if (values.cycle && values.cycle !== "custom") {
      const resolved = resolveDatePreset(values.cycle)
      if (resolved.startDate && resolved.endDate) {
        setValues((current) => ({
          ...current,
          startDate: resolved.startDate,
          endDate: resolved.endDate,
        }))
      }
    }
  }, [values.cycle])

  useEffect(() => {
    onChange?.(cleanValues)

    if (syncUrl && typeof window !== "undefined") {
      const query = buildFilterQuery(cleanValues)
      const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname
      window.history.replaceState(null, "", nextUrl)
    }
  }, [cleanValues, onChange, syncUrl])

  function set(key, value) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function reset() {
    setValues(initialValues)
  }

  function clear(key) {
    setValues((current) => {
      const next = { ...current }
      delete next[key]
      return next
    })
  }

  function save(name = "My Filter") {
    if (typeof localStorage === "undefined") return

    const previous = JSON.parse(localStorage.getItem(storageKey) || "[]")
    const next = [
      { name, values, savedAt: new Date().toISOString() },
      ...previous.filter((item) => item.name !== name),
    ].slice(0, 10)

    localStorage.setItem(storageKey, JSON.stringify(next))
  }

  function load(savedValues) {
    setValues(savedValues || {})
  }

  function recent() {
    if (typeof localStorage === "undefined") return []
    return JSON.parse(localStorage.getItem(storageKey) || "[]")
  }

  return {
    values,
    setValues,
    set,
    reset,
    clear,
    save,
    load,
    recent,
  }
}
