# Observability Profile

This profile adds a local observability stack for tracing and log exploration:

- OpenTelemetry Collector
- Grafana Tempo
- Grafana Loki
- Grafana UI

## Start Core + Observability

```bash
docker compose -f compose.yaml --profile core --profile observability up -d
```

## Endpoints

- Grafana: <http://localhost:3001> (default `admin` / `admin`)
- Tempo API: <http://localhost:3200>
- Loki API: <http://localhost:3100>
- OTLP HTTP ingest: <http://localhost:4318>

## Environment Variables

Set these in your environment or `.env`:

- `OTEL_EXPORTER_OTLP_ENDPOINT` (default in compose: `http://otel-collector:4318`)
- `OTEL_SERVICE_NAME` (default in app code: `aura-stay-api`)
- `SENTRY_DSN` (optional)
- `SENTRY_TRACES_SAMPLE_RATE` (optional)
- `GF_SECURITY_ADMIN_USER` / `GF_SECURITY_ADMIN_PASSWORD` (optional)

## Notes

- `reporting-api` is already wired for OpenTelemetry bootstrap using env variables.
- If OTel env vars are missing, telemetry auto-disables without failing server startup.
