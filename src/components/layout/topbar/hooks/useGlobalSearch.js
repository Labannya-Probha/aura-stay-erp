import { useMemo, useState } from "react"
import { COMMANDS } from "../services/globalSearch.service"

export function useGlobalSearch() {
  const [query, setQuery] = useState("")

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return COMMANDS
    return COMMANDS.filter((item) =>
      item.title.toLowerCase().includes(term) ||
      item.group.toLowerCase().includes(term) ||
      item.keywords.some((keyword) => keyword.toLowerCase().includes(term))
    )
  }, [query])

  return { query, setQuery, results }
}
