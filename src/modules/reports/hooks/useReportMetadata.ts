import { useEffect, useState } from "react"
import { loadReportMetadata } from "../sdk/reportMetadata.service"

export function useReportMetadata(role) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    Promise.resolve().then(async () => {
      const next = await loadReportMetadata(role)
      if (!active) return
      setGroups(next)
      setLoading(false)
    })

    return () => {
      active = false
    }
  }, [role])

  return { groups, loading }
}
