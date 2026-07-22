# Reservation Sprint-2 — Phase 1

Implemented:

- Enterprise reservation lifecycle state machine
- Reservation payload normalization and field-level validation
- Tenant-scoped create/status/cancel command service
- Supabase realtime subscription for reservations and room allocations
- Live reservation register refresh with debounce and reconnect recovery
- Live KPI refresh
- Reservation status history migration and indexes
- Unit tests for lifecycle and validation

## Database

Run:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

Review the migration against the target database before applying it in production.
