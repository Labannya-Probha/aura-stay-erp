import { randomUUID } from 'node:crypto'

const HEADER = 'x-correlation-id'

export function requestContext(req, res, next) {
  const incoming = req.get(HEADER)
  const requestId = incoming && incoming.trim() ? incoming.trim() : randomUUID()

  req.requestId = requestId
  res.setHeader(HEADER, requestId)

  const startedAt = process.hrtime.bigint()
  res.on('finish', () => {
    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000
    const method = req.method
    const url = req.originalUrl || req.url
    const status = res.statusCode
    const contentLength = res.getHeader('content-length') || 0

    // Lightweight structured logs for correlation and latency diagnostics.
    console.info(
      JSON.stringify({
        level: 'info',
        type: 'http_request',
        requestId,
        method,
        url,
        status,
        elapsedMs: Number(elapsedMs.toFixed(2)),
        contentLength,
        timestamp: new Date().toISOString(),
      }),
    )
  })

  next()
}
