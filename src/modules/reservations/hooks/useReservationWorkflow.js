import { useCallback, useEffect, useState } from "react"
import { listPendingReservationApprovals } from "../services/reservationWorkflow.service"
import { supabase } from "../../../lib/supabase"

export function useReservationWorkflow() {
  const [approvals, setApprovals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      setApprovals(await listPendingReservationApprovals())
    } catch (err) {
      setError(err.message || "Unable to load reservation approvals.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    if (!supabase) return undefined
    const channel = supabase
      .channel("reservation-workflow-approvals")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservation_approvals" }, refresh)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [refresh])

  return { approvals, loading, error, refresh }
}
