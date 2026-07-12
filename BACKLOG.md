# Backlog

Deferred work items, captured so they aren't lost.

## Deferred with the "add backend later" plan (~1 month out)

- **Cloud sync / accounts** — re-enable the dormant sync pipeline
  (`SYNC_ENABLED = false` in `apps/mobile/src/providers/sync-provider.tsx`) via a
  BaaS (Firebase / Supabase) or the parked libSQL/Turso backend. On first sign-in,
  claim the local guest data (the persisted local-user UUID) onto the account.
- **Dashboards** — `dashboard.money` / `dev-dashboard.money` (Cloudflare Pages);
  need the backend/data layer first.
