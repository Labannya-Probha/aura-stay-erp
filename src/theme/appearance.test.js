import { describe, expect, it } from 'vitest'
import { resolveThemeMode, getStoredThemeMode } from './appearance'

describe('appearance theme helpers', () => {
  it('resolves a system preference to light or dark based on the browser setting', () => {
    expect(resolveThemeMode('system', 'light')).toBe('light')
    expect(resolveThemeMode('system', 'dark')).toBe('dark')
  })

  it('keeps explicit overrides intact', () => {
    expect(resolveThemeMode('dark', 'light')).toBe('dark')
    expect(resolveThemeMode('light', 'dark')).toBe('light')
  })

  it('falls back to system when no stored value exists', () => {
    expect(getStoredThemeMode(null)).toBe('system')
    expect(getStoredThemeMode('')).toBe('system')
  })
})
