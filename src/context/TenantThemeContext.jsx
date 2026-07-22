import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const TenantThemeContext = createContext(null)

const DEFAULT_THEME = {
  tenantName: 'Aura Stay ERP',
  propertyName: null,
  logoUrl: null,
  primaryColor: '#1B4D2E',
  secondaryColor: '#2E7D32',
  accentColor: '#D4A017',
  sidebarBgColor: '#1B4D2E',
  sidebarTextColor: '#F7F4EC',
  buttonColor: '#2E7D32',
  tableHeaderColor: '#F4F2EC',
  reportHeaderColor: '#1B4D2E',
  fontFamily: 'Inter, sans-serif',
  themeMode: 'light',
}

export function TenantThemeProvider({ tenantId, children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tenantId) {
      setLoading(false)
      return
    }

    let cancelled = false

    supabase
      .from('tenant_branding')
      .select(
        'tenant_name, property_name, logo_url, primary_color, secondary_color, accent_color, sidebar_bg_color, sidebar_text_color, button_color, table_header_color, report_header_color, font_family, theme_mode',
      )
      .eq('tenant_id', tenantId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return

        if (!error && data) {
          setTheme({
            tenantName: data.tenant_name || DEFAULT_THEME.tenantName,
            propertyName: data.property_name,
            logoUrl: data.logo_url,
            primaryColor: data.primary_color || DEFAULT_THEME.primaryColor,
            secondaryColor: data.secondary_color || DEFAULT_THEME.secondaryColor,
            accentColor: data.accent_color || DEFAULT_THEME.accentColor,
            sidebarBgColor: data.sidebar_bg_color || DEFAULT_THEME.sidebarBgColor,
            sidebarTextColor: data.sidebar_text_color || DEFAULT_THEME.sidebarTextColor,
            buttonColor: data.button_color || DEFAULT_THEME.buttonColor,
            tableHeaderColor: data.table_header_color || DEFAULT_THEME.tableHeaderColor,
            reportHeaderColor: data.report_header_color || DEFAULT_THEME.reportHeaderColor,
            fontFamily: data.font_family || DEFAULT_THEME.fontFamily,
            themeMode: data.theme_mode || DEFAULT_THEME.themeMode,
          })
        }

        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [tenantId])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--tenant-primary', theme.primaryColor)
    root.style.setProperty('--tenant-secondary', theme.secondaryColor)
    root.style.setProperty('--tenant-accent', theme.accentColor)
    root.style.setProperty('--tenant-sidebar-bg', theme.sidebarBgColor)
    root.style.setProperty('--tenant-sidebar-text', theme.sidebarTextColor)
    root.style.setProperty('--tenant-button', theme.buttonColor)
    root.style.setProperty('--tenant-table-header', theme.tableHeaderColor)
    root.style.setProperty('--tenant-report-header', theme.reportHeaderColor)
    root.style.setProperty('--tenant-font', theme.fontFamily)
    root.dataset.themeMode = theme.themeMode
  }, [theme])

  return (
    <TenantThemeContext.Provider value={{ theme, loading }}>{children}</TenantThemeContext.Provider>
  )
}

export const useTenantTheme = () => useContext(TenantThemeContext)
