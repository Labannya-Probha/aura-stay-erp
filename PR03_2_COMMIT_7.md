# PR03.2 Commit-7 — Payment Settlement Engine

Adds card/mobile-provider settlement profiles and settlement posting. A settlement posts net cash to bank, processing fees/tax to expense accounts, and clears the gross provider receivable. It supports idempotency and linking settled `payment_postings` records.

Migration: `20260720030000_payment_settlement_engine.sql`.
