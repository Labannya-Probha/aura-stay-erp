import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { buildTenantTheme, themeToCssVars } from "./tenantTheme"
import { extractLogoPalette } from "./logoColor.service"
import { getCompanyLogo } from "./branding.service"
import "./theme.css"

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [company, setCompanyState] = useState(null)
  const [logoPalette, setLogoPalette] = useState(null)
  const [paletteStatus, setPaletteStatus] = useState("idle")

  const logoUrl = getCompanyLogo(company)

  const setCompany = useCallback((nextCompany) => {
    setCompanyState(nextCompany || null)
  }, [])

  const clearCompany = useCallback(() => {
    setCompanyState(null)
    setLogoPalette(null)
    setPaletteStatus("idle")
  }, [])

  useEffect(() => {
    let active = true

    if (!logoUrl) {
      setLogoPalette(null)
      setPaletteStatus("idle")
      return undefined
    }

    setPaletteStatus("loading")

    extractLogoPalette(logoUrl)
      .then((palette) => {
        if (!active) return
        setLogoPalette(palette)
        setPaletteStatus(palette?.primary ? "ready" : "fallback")
      })
      .catch(() => {
        if (!active) return
        setLogoPalette(null)
        setPaletteStatus("fallback")
      })

    return () => {
      active = false
    }
  }, [logoUrl])

  const theme = useMemo(() => buildTenantTheme(company, logoPalette), [company, logoPalette])
  const cssVars = useMemo(() => themeToCssVars(theme), [theme])

  useEffect(() => {
    Object.entries(cssVars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value)
    })

    document.documentElement.dataset.themeMode = theme.themeMode || "light"
    document.documentElement.classList.toggle("tenant-dark", theme.themeMode === "dark")
  }, [cssVars, theme.themeMode])

  const value = useMemo(
    () => ({ company, setCompany, clearCompany, theme, cssVars, logoPalette, paletteStatus }),
    [clearCompany, company, cssVars, logoPalette, paletteStatus, setCompany, theme]
  )

  return (
    <ThemeContext.Provider value={value}>
      <div className="aeds-theme-root">{children}</div>
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
      paletteStatus: "idle",
    }
  }
  return context
}
