# AEDS Reservations Module Architecture

## Folders

- `booking-engine/` — visual booking calendar timeline engine.
- `availability/` — availability matrix and inventory visibility.
- `reservation-list/` — reservation search, filters, saved views and table.
- `new-reservation/` — reservation creation wizard.
- `guest-profile/` — guest profile, CRM and history panels.
- `rate-management/` — rate calendar and restrictions.
- `reports/` — reservation reports.
- `shared/` — shared UI components.
- `hooks/` — module hooks.
- `services/` — Supabase/RPC services.
- `types/` — constants and domain types.

## Rule

Reservation module does not own Check-In / Check-Out. Those belong to Front Office.
