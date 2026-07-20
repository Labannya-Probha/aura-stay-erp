# Reservation Sprint 2 — Phase 2

Implemented enterprise reservation inventory and pricing foundation:

- Multi-night room-type availability engine
- Physical inventory, out-of-order and controlled overbooking calculations
- Stop-sell, CTA, CTD, minimum/maximum stay restrictions
- Atomic room allocation with overlap protection and advisory locking
- Rate plans and date/day based pricing rules
- Extra adult and child pricing
- Live availability matrix UI
- Rate plan simulator UI
- Supabase RPC services and React hook
- Unit tests for availability, pricing and room allocation

## Database

Apply migration:

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Migration file:

`supabase/migrations/20260720050000_reservation_availability_rate_allocation.sql`

## Validation

- 16 test files passed
- 90 tests passed
- Production Vite build passed
- Changed JavaScript files: zero ESLint errors
