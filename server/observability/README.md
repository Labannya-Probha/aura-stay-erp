# Observability Bootstrap

This API now supports correlation IDs, OpenTelemetry auto-instrumentation, and optional Sentry error tracking.

## Enable Correlation IDs

`server/middleware/requestContext.js` injects `x-correlation-id` for every request.

## Enable OpenTelemetry

Set at least:

- `OTEL_EXPORTER_OTLP_ENDPOINT`
- `OTEL_SERVICE_NAME`

When endpoint is missing, telemetry remains disabled and server boot continues.

## Enable Sentry

Set:

- `SENTRY_DSN`
- `SENTRY_TRACES_SAMPLE_RATE` (optional, default `0.1`)

When DSN is absent, Sentry remains disabled and server boot continues.
