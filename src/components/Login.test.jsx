import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it, vi } from 'vitest'

const storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
}

describe('Login', () => {
  beforeAll(() => {
    vi.stubGlobal('window', { sessionStorage: storage })
  })

  it('keeps the password visibility toggle keyboard focusable', async () => {
    const { default: Login } = await import('./Login')
    const markup = renderToStaticMarkup(<Login slug="demo-property" />)

    expect(markup).toContain('aria-pressed="false"')
    expect(markup).not.toContain('tabindex="-1"')
  })

  it('prioritizes tenant code and removes social sign-in options', async () => {
    const { default: Login } = await import('./Login')
    const markup = renderToStaticMarkup(<Login slug="demo-property" />)

    expect(markup.indexOf('login-tenant')).toBeLessThan(markup.indexOf('login-email'))
    expect(markup).not.toContain('or continue with')
    expect(markup).not.toContain('Sign in with Google')
    expect(markup).not.toContain('Sign in with Microsoft')
  })

  it('renders the requested video treatment and updated footer copy', async () => {
    const { default: Login } = await import('./Login')
    const markup = renderToStaticMarkup(<Login slug="demo-property" />)

    expect(markup).toContain('Aura_Stay_ERP_er_jonno_Hotel_R.mp4')
    expect(markup).toContain('© 2026 Aura Stay  ·  Powered by Aura Stay ERP')
  })
})
