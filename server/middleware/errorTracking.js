let sentry = null

async function getSentry() {
  if (sentry !== null) return sentry
  try {
    // Optional dependency. If not installed, tracking no-ops.
    const mod = await import('@sentry/node')
    sentry = mod.default || mod
    return sentry
  } catch {
    sentry = false
    return false
  }
}

export async function initErrorTracking() {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return false

  const sdk = await getSentry()
  if (!sdk) return false

  sdk.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    sendDefaultPii: false,
  })

  return true
}

export async function captureException(error, context = {}) {
  const sdk = await getSentry()
  if (!sdk || !process.env.SENTRY_DSN) return

  sdk.withScope((scope) => {
    for (const [k, v] of Object.entries(context)) {
      scope.setExtra(k, v)
    }
    sdk.captureException(error)
  })
}

export function errorHandler() {
  return async (error, req, res, _next) => {
    const requestId = req.requestId || req.get('x-correlation-id') || null
    await captureException(error, {
      requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      userId: req.authUser?.id || null,
      role: req.authUser?.role || null,
    })

    const status = Number(error.status || error.code || 500)
    res.status(status).json({
      error: error.message || 'Internal server error',
      code: status,
      requestId,
    })
  }
}
