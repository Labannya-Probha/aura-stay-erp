# PR03.2 Commit-6 — Auto Journal Posting Queue

Adds a tenant-scoped, retryable payment posting queue, queue processor, and React hook. Source modules can either call `postNow(payment)` or `queue(payment)` through `usePaymentPosting(tenantId)`. Queue items use an idempotency key and retry with bounded exponential delay.

Migration: `20260720020000_payment_posting_queue.sql`.
