import { useMemo } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import {
  DEFAULT_FRONT_OFFICE_TAB,
  FRONT_OFFICE_LEGACY_TAB_REDIRECTS,
  resolveFrontOfficeTab,
} from "../frontOffice.config"
import { PATHS } from "../../../app/paths"

function normalizeTab(value) {
  const requested = String(value || "").trim().toLowerCase()
  const mapped = FRONT_OFFICE_LEGACY_TAB_REDIRECTS[requested] || requested
  return resolveFrontOfficeTab(mapped)?.id || DEFAULT_FRONT_OFFICE_TAB
}

export function useFrontOfficeTabs() {
  const navigate = useNavigate()
  const location = useLocation()

  const activeTab = useMemo(() => {
    const params = new URLSearchParams(location.search)
    const queryTab = params.get("tab")
    const pathTab = location.pathname
      .replace(PATHS.FRONT_OFFICE, "")
      .split("/")
      .filter(Boolean)[0]

    return normalizeTab(queryTab || pathTab || DEFAULT_FRONT_OFFICE_TAB)
  }, [location.pathname, location.search])

  const setActiveTab = (tab) => {
    const nextTab = normalizeTab(typeof tab === "string" ? tab : tab?.id)
    navigate(`${PATHS.FRONT_OFFICE}/${encodeURIComponent(nextTab)}`)
  }

  return { activeTab, setActiveTab }
}
