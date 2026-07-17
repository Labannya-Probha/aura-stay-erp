import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import { PATHS } from "../../../app/paths"
import {
  DEFAULT_FRONT_OFFICE_TAB,
  FRONT_OFFICE_TABS,
  resolveFrontOfficeTab,
} from "../frontOffice.config"

export function useFrontOfficeTabs() {
  const navigate = useNavigate()
  const location = useLocation()

  const activeTab = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const resolved = resolveFrontOfficeTab(
      params.get("tab") || DEFAULT_FRONT_OFFICE_TAB,
      FRONT_OFFICE_TABS
    )

    return resolved?.id || DEFAULT_FRONT_OFFICE_TAB
  }, [location.search])

  const setActiveTab = (tabId) => {
    const resolved = resolveFrontOfficeTab(
      tabId,
      FRONT_OFFICE_TABS
    )

    navigate(
      `${PATHS.FRONT_OFFICE}?tab=${encodeURIComponent(
        resolved?.id || DEFAULT_FRONT_OFFICE_TAB
      )}`
    )
  }

  return { activeTab, setActiveTab }
}
