# Platform Sprint-1 — Dashboard & Notification Centre

Implemented:
- tenant-scoped Supabase realtime subscriptions
- debounced dashboard refresh and duplicate-request protection
- online/tab-visibility recovery refresh
- partial RPC failure tolerance
- backward-compatible tenant-aware RPC calls
- optimistic notification read/read-all actions
- instant INSERT notification rendering
- notification dashboard integration
- loading, error and live-status improvements
- unit test for safe dashboard state merging

Database note: existing dashboard/notification RPCs remain supported. Newer RPCs may accept `p_tenant_id` for explicit tenant scoping.
