import { useEffect, useState } from 'react'
import { loadReportMetadata } from '../sdk/reportMetadata.service'

export function useReportMetadata(role) {
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const next = await loadReportMetadata(role)
        if (!active) return
        setGroups(next)
      } catch (loadError) {
        if (!active) return
        setGroups([])
        setError(loadError instanceof Error ? loadError.message : 'Failed to load report catalog')
      } finally {
        if (!active) return
        setLoading(false)
      }
    })()

    return () => {
      active = false
    }
  }, [role])

  return { groups, loading, error }
}
