import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { buildTenantTheme, themeToCssVars } from './tenantTheme'
import { extractLogoPalette } from './logoColor.service'
import { getCompanyLogo } from './branding.service'
import {
  getStoredThemeMode,
  getThemeModePreference,
  persistThemeMode,
  readStoredThemeMode,
} from './appearance'
import './theme.css'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [company, setCompanyState] = useState(null)
  const [logoPalette, setLogoPalette] = useState(null)
  const [paletteStatus, setPaletteStatus] = useState('idle')
  const [themeMode, setThemeModeState] = useState(() => readStoredThemeMode())
  const [systemTheme, setSystemTheme] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light',
  )

  const logoUrl = getCompanyLogo(company)

  const setCompany = useCallback((nextCompany) => {
    setCompanyState(nextCompany || null)
  }, [])

  const clearCompany = useCallback(() => {
    setCompanyState(null)
    setLogoPalette(null)
    setPaletteStatus('idle')
  }, [])

  const setThemeMode = useCallback((nextMode) => {
    const normalized = getStoredThemeMode(nextMode)
    setThemeModeState(normalized)
    persistThemeMode(normalized)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event) => setSystemTheme(event.matches ? 'dark' : 'light')
    handleChange(media)

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', handleChange)
      return () => media.removeEventListener('change', handleChange)
    }

    media.addListener(handleChange)
    return () => media.removeListener(handleChange)
  }, [])

  useEffect(() => {
    let active = true

    if (!logoUrl) {
      setLogoPalette(null)
      setPaletteStatus('idle')
      return undefined
    }

    setPaletteStatus('loading')

    extractLogoPalette(logoUrl)
      .then((palette) => {
        if (!active) return
        setLogoPalette(palette)
        setPaletteStatus(palette?.primary ? 'ready' : 'fallback')
      })
      .catch(() => {
        if (!active) return
        setLogoPalette(null)
        setPaletteStatus('fallback')
      })

    return () => {
      active = false
    }
  }, [logoUrl])

  const effectiveMode = useMemo(
    () => getThemeModePreference(themeMode, systemTheme),
    [systemTheme, themeMode],
  )

  const theme = useMemo(
    () => buildTenantTheme({ ...(company || {}), theme_mode: effectiveMode }, logoPalette),
    [company, effectiveMode, logoPalette],
  )
  const cssVars = useMemo(() => themeToCssVars(theme), [theme])

  useEffect(() => {
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })

    document.documentElement.dataset.themeMode = theme.themeMode || 'light'
    document.documentElement.classList.toggle('tenant-dark', theme.themeMode === 'dark')
  }, [cssVars, theme.themeMode])

  const value = useMemo(
    () => ({
      company,
      setCompany,
      clearCompany,
      theme,
      cssVars,
      logoPalette,
      paletteStatus,
      themeMode,
      setThemeMode,
      effectiveMode,
    }),
    [
      clearCompany,
      company,
      cssVars,
      effectiveMode,
      logoPalette,
      paletteStatus,
      setCompany,
      setThemeMode,
      theme,
      themeMode,
    ],
  )

  return (
    <ThemeContext.Provider value={value}>
      <div className="aeds-theme-root" data-theme-mode={effectiveMode}>
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    return {
      company: null,
      setCompany: () => {},
      clearCompany: () => {},
      theme: buildTenantTheme(),
      cssVars: themeToCssVars(buildTenantTheme()),
      logoPalette: null,
      paletteStatus: 'idle',
      themeMode: 'system',
      setThemeMode: () => {},
      effectiveMode: 'light',
    }
  }
  return context
}
