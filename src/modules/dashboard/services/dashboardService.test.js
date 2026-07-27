import { describe, expect, it } from 'vitest'
import { withTimeoutFallback } from './dashboardService'

describe('withTimeoutFallback', () => {
  it('returns the fallback quickly when a promise hangs', async () => {
    const fallback = { summary: { source: 'fallback' } }
    const startedAt = Date.now()
    const result = await withTimeoutFallback(new Promise(() => {}), fallback, 50)
    const elapsed = Date.now() - startedAt

    expect(result).toEqual(fallback)
    expect(elapsed).toBeLessThan(200)
  })

  it('returns the resolved value when it completes before timeout', async () => {
    const result = await withTimeoutFallback(
      Promise.resolve({ summary: { source: 'live' } }),
      { summary: { source: 'fallback' } },
      100,
    )
    expect(result).toEqual({ summary: { source: 'live' } })
  })
})
