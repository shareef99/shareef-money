# Backlog

Deferred work items, captured so they aren't lost.

## Shareef Money marketing site — `money.shareefsolutions.in`

Build the product marketing site (Cloudflare Pages, like the agency site at
`shareefsolutions.in`). Must include **Privacy Policy** and **Terms of Service**
pages.

### `/privacy` and `/terms` pages — also required for the Play Store listing

Google Play requires a **hosted privacy policy URL** to finish "App content" and
publish. Until this site exists there's no public policy page. (A minimal interim
`/privacy` page may be needed sooner to unblock closed testing / production — see
note in chat.)

**Privacy policy — already drafted** (accurate to the local-only, no-data-collection
app; drop into the `/privacy` page):

> **Shareef Money — Privacy Policy**
> _Last updated: 4 July 2026_
>
> Shareef Money is an offline, on-device personal finance app. We do not collect,
> transmit, store on our servers, or share any of your personal or financial data.
> The app has no user accounts and does not connect to any backend.
>
> Data you enter — transactions, accounts, categories, budgets, contacts, and
> settings — is stored only in the app's local database on your device. It never
> leaves your device unless you explicitly export it.
>
> **Backups.** You can export your data to a file and save/share it wherever you
> choose (Google Drive, email, …). These exports are fully under your control; we
> never receive or access them.
>
> **Permissions.** Optional biometric/PIN unlock uses your device's security only.
> File access is used solely when you choose to export or import a backup.
>
> **No tracking.** No analytics, no advertising, no third-party data-collection SDKs.
>
> **Deleting your data.** Uninstalling the app or clearing its storage permanently
> removes all data on the device — export a backup first to keep it.
>
> **Children.** Not directed at children under 13.
>
> **Changes.** We may update this policy; changes will be posted on this page.
>
> **Contact:** nadeemshareef934@gmail.com

**Terms of Service** — still to draft.

## Deferred with the "add backend later" plan (~1 month out)

- **Cloud sync / accounts** — re-enable the dormant sync pipeline
  (`SYNC_ENABLED = false` in `apps/mobile/src/providers/sync-provider.tsx`) via a
  BaaS (Firebase / Supabase) or the parked libSQL/Turso backend. On first sign-in,
  claim the local guest data (the persisted local-user UUID) onto the account.
- **Dashboards** — `dashboard.money` / `dev-dashboard.money` (Cloudflare Pages);
  need the backend/data layer first.
- **Standalone dev APK** currently bakes the laptop's LAN IP as the API URL; rebuild
  it against the deployed dev backend URL once that exists.
