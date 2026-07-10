import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { RESERVATION_TABS, resolveReservationTab } from "../reservations.config"

export function useReservationTabs(visibleTabs = RESERVATION_TABS) {
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = useMemo(() => {
    const requested = searchParams.get("tab") || "calendar"
    return resolveReservationTab(requested, visibleTabs).id
  }, [searchParams, visibleTabs])

  const setActiveTab = useCallback(
    (tabId) => {
      const next = new URLSearchParams(searchParams)
      next.set("tab", resolveReservationTab(tabId, visibleTabs).id)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams, visibleTabs]
  )

  return { activeTab, setActiveTab }
}
