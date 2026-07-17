const inflight = new Map()

/**
 * Coalesces concurrent requests by key. This keeps React StrictMode's
 * development-only remount from issuing duplicate Supabase requests.
 */
export function runSingleFlight(key, factory) {
  if (inflight.has(key)) return inflight.get(key)

  const promise = Promise.resolve()
    .then(factory)
    .finally(() => {
      if (inflight.get(key) === promise) inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}
