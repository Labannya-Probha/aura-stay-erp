import { useCallback, useEffect, useRef, useState } from "react"
import { fetchAvailability } from "../services/availability.service"

export function useAvailability(criteria, { enabled = true } = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const requestRef = useRef(0)

  const refresh = useCallback(async () => {
    if (!enabled || !criteria?.checkIn || !criteria?.checkOut || criteria.checkOut <= criteria.checkIn) return
    const requestId = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const result = await fetchAvailability(criteria)
      if (requestId === requestRef.current) setData(result)
    } catch (err) {
      if (requestId === requestRef.current) setError(err)
    } finally {
      if (requestId === requestRef.current) setLoading(false)
    }
  }, [criteria, enabled])

  useEffect(() => { refresh() }, [refresh])
  return { data, loading, error, refresh }
}
