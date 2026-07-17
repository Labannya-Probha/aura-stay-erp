import { useEffect, useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  DEFAULT_FRONT_OFFICE_PAGE,
  frontOfficePath,
  getFrontOfficePage,
  normalizeFrontOfficeSlug,
} from '../frontOffice.config'

export function useFrontOfficeTabs() {
  const navigate = useNavigate()
  const location = useLocation()
  const { pageSlug } = useParams()

  const querySlug = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return params.get('tab')
  }, [location.search])

  const activeSlug = normalizeFrontOfficeSlug(pageSlug || querySlug || DEFAULT_FRONT_OFFICE_PAGE)
  const activePage = getFrontOfficePage(activeSlug)

  // Canonical URL: /front-office/:pageSlug. Old ?tab= links remain compatible.
  useEffect(() => {
    const canonical = frontOfficePath(activeSlug)
    if (location.pathname !== canonical || location.search) {
      navigate(canonical, { replace: true })
    }
  }, [activeSlug, location.pathname, location.search, navigate])

  const setActiveTab = (slug) => navigate(frontOfficePath(slug))

  return {
    activeTab: activeSlug,
    activeSlug,
    activePage,
    setActiveTab,
  }
}
