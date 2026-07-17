import { useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { DEFAULT_FRONT_OFFICE_TAB, resolveFrontOfficeTab } from "../frontOffice.config"
import { PATHS } from "../../../app/paths"

export function useFrontOfficeTabs() {
  const navigate = useNavigate()
  const location = useLocation()

  const activeTab = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return resolveFrontOfficeTab(params.get("tab") || DEFAULT_FRONT_OFFICE_TAB)
  }, [location.search])

  const setActiveTab = (tab) => {
    const next = resolveFrontOfficeTab(tab)
    navigate(`${PATHS.FRONT_OFFICE}?tab=${encodeURIComponent(next)}`)
  }

  return { activeTab, setActiveTab }
}
