# Web App Build Plan — Shareef Money

Bring `apps/web` to feature parity with the mobile app. Decisions already made:
**online-only REST** (no browser offline/sync), **shared compute logic** extracted to
`@shareef-money/shared`, build reviewed/approved before coding.

## Architecture

- **Separate web app, NOT React Native Web.** Share *logic*, not *UI*. RNW would force either
  offline-first-in-browser (rejected) or a full data-layer rewrite, drags in native-only deps
  (expo-sqlite / secure-store / notifications / gifted-charts), and yields phone-shaped desktop
  UI. The web keeps its web-native stack; we maximize sharing through the non-UI layers.
- **Online REST SPA.** The backend is the shared source of truth. The web app reads/writes
  over HTTP; changes made on web land on the server and show up on mobile at its next sync
  (and vice-versa). The web app does **not** reimplement the sync protocol or keep a local DB.
- **Existing stack (keep):** React 19 + Vite + TanStack Router (file routes) + React Query +
  Mantine + Tailwind v4 + Recharts. Auth is already done (cookie + refresh, route guards,
  sidebar/layout, dark mode).
- **Consistency model:** web edits are immediately authoritative on the server. Mobile's
  conflict resolution (server-newer-wins on `updatedAt`) already handles concurrent edits.

### Shared vs per-app (maximize sharing)

- **Shared (`@shareef-money/shared`):** TypeScript types, zod validation, constants, formatting
  utils (currency / date / error), and the new `calc` layer (balances, net worth, stats
  derives, debt ledger, budgets). One source of truth.
- **Per-app (not shareable without RNW):** UI components (RN + NativeWind vs Mantine + DOM),
  navigation, and the data-fetch layer (local SQLite vs REST). Query-keys and returned data
  shapes are kept aligned so the two mirror each other.

## Shared compute (`packages/shared/src/calc/`)

Extract the **pure** calculation logic (currently inside mobile services, some already pure)
into framework-free functions that operate on plain row arrays — no Drizzle/db dependency —
so mobile and web share one implementation:

- `types.ts` — plain row types (`TxnRow`, `AccountRow`, `CategoryRow`, …).
- `accounts.ts` — `computeAccountBalances(accounts, txns)` → balances + total.
- `networth.ts` — `balanceBefore`, `cashFlow`, `netWorthSeries`, net worth.
- `stats.ts` — `summarize`, `breakdownBy`, `timeSeries`, `stackedByCategory`, `flow` (sankey),
  `transferMatrix`, `dailyTotals`, `debtTrend` (derive half).
- `debts.ts` — debt ledger + per-contact running balance.
- `budgets.ts` — `effectiveBudget`.

Then **refactor the mobile services** to fetch rows (db) and delegate to these — keeping their
public signatures unchanged. The db-querying functions split into "fetch rows" (stays in the
app) + "compute" (shared). Re-verify mobile (typecheck + device smoke) after the refactor.
*Risk:* touching working mobile code — mitigated by pure extraction + re-verification.

## Phase 0 — Backend + shared prep (no web UI yet)

1. **Backend REST gaps** (thin handlers; service logic mostly mirrors mobile):
   - `GET /api/categories` (list — currently missing).
   - Contacts: `GET/POST/PATCH/DELETE /api/contacts`.
   - Locations: `GET/POST/PATCH/DELETE /api/locations`.
   - Settings: `GET /api/settings`, `PATCH /api/settings` (key-value).
   - (No recurring endpoint — recurring is out of scope on web; see below.)
2. **Soft-delete correctness on the server:** add `deletedAt IS NULL` to the backend
   transaction & recurring REST reads (they currently return tombstoned rows).
3. **Shared calc extraction** + mobile refactor + re-verify (above).
4. Stats stay client-computed (no backend stats endpoint).

## Phase 1 — Web data layer + Transactions

- React Query hooks over REST for accounts, categories, transactions, contacts, locations,
  recurring, settings (mirroring mobile's query layer).
- **Transactions page:** day-grouped list with a month switcher + totals header; add/edit/
  delete modal supporting all types (income / expense / transfer / debt_lend / debt_borrow);
  pickers for account, category, contact, location, date; note; search/filter.
- Currency formatting via shared utils + the settings currency.

## Phase 2 — Accounts

- Accounts list with **computed balances** (shared calc) and a **net worth** card (folds in
  receivable − payable).
- Account detail (its transactions), create/edit/archive, color + hide.

## Phase 3 — Stats

- Dashboard: filter bar (period / type / account / category / location / contact / range),
  summary cards, category breakdown, income-vs-expense over time, net-worth line, debt summary
  + debt trend, transfers, top locations/people, budget-vs-actual. Charts via Recharts, all
  fed by the shared derive functions.

## Phase 4 — Debts + Budgets

- Debts: per-person ledger, add debt, settle up, write-off, due dates.
- Budgets: per-category monthly budgets with progress.

## Phase 5 — Management + Settings

- Categories (hierarchical), contacts, locations — list + CRUD.
- Settings: currency, week/month start, required-field toggles, carry-forward. CSV export.

## Explicitly skipped on web

- **Recurring transactions** — not on web at all (manage them on mobile). Recurring rows
  themselves still appear as normal transactions once materialized on mobile and synced.
- Passcode lock (browser session auth instead), local notifications, and file backup/restore
  (the server already holds the data; provide CSV export instead).

## Notes / known limitations

- **Settings are per-account and shared with mobile** (same `settings` table via the server),
  so e.g. changing currency on web also changes it on mobile. Intended for a single user.
- **ID space:** server REST inserts use autoincrement ids; mobile uses large timestamp ids.
  They coexist safely (autoincrement only ever goes above the current max).

## Verification per phase

- Typecheck every touched package. Run web dev (port 3100) against the running backend
  (port 3000), signed in with the test account; verify each screen end-to-end in the browser.

## Suggested order

Phase 0 → 1 → 2 → 3 → 4 → 5, shipping a usable app after Phase 3 (transactions + accounts +
stats) and iterating. Each phase: query hooks → UI → wire → verify.

## Charts

**Use `@mantine/charts` as the primary library; raw `recharts` as the escape hatch.** No third
charting dependency.

- Mantine Charts (v9.1+) covers **every** chart this app needs — Line/Area/Bar/Composite for
  the time series & income-vs-expense, Donut/Pie for breakdowns, **Sankey** for money flow,
  **Treemap** for category spend, **Heatmap** for the calendar — all built on Recharts with
  native Mantine theming + dark mode.
- Performance is a non-issue here: chart inputs are **pre-aggregated** by the shared `calc`
  layer (time series → ~30–365 buckets, breakdowns → ~10–20 slices, heatmap → ≤366 cells), so
  we never hit the 10k+ SVG-node range where Recharts degrades. Canvas libs (ECharts) and
  low-level libs (visx/nivo) solve large-dataset/real-time problems this app doesn't have, at
  the cost of a second paradigm, weaker theme integration, and bundle.
- If a specific chart needs a Recharts feature Mantine's wrapper doesn't expose, we drop to
  raw Recharts (same engine — no new dependency or paradigm).

## Responsive design (mobile / tablet / desktop)

Desktop-first, but fully usable down to a phone browser, via Mantine breakpoints:

- **Navigation (Mantine `AppShell`):** persistent left sidebar on desktop (≥ lg) → collapsible
  icon rail on tablet (md) → hamburger drawer + a bottom tab bar (mirroring the native app's
  tabs) on phones (< sm).
- **Content:** multi-column dashboards on desktop (e.g. stats in a 2–3 col grid; transactions
  table + side detail) → 1–2 columns on tablet → single stacked column on phone.
- **Transactions:** a sortable **data table** on desktop/tablet; below the `sm` breakpoint it
  renders as the day-grouped **card list** (like the native app).
- **Charts:** responsive containers that reflow to width; stack full-width on phone.
- **Modals/forms:** centered modals on desktop; full-screen sheets on phone.

The native mobile app remains the primary phone experience; phone-web is responsive CSS, not a
separate set of screens.

## Verification (overnight, autonomous)

Build runs unattended overnight. After each feature: drive the running web app
(`http://localhost:3100`) with **Playwright** (headless Chromium) — log in, navigate, screenshot
to `tmp/`, and read the screenshot back — exactly mirroring the adb screenshot workflow used on
mobile. Playwright + Chromium will be installed as a dev dependency (not currently present).
Commit per phase.

## Decisions log

**Decided:** online REST (not offline) · separate web app, not RNW · extract shared `calc` ·
email/password only for v1 (full Google OAuth later, web + mobile) · settings shared with
mobile via server · transactions as a **data table** (cards on phone) · **all** mobile stats
ported to web · **Mantine Charts** primary (+ raw Recharts escape hatch) · **optimistic
updates** on mutations · **recurring skipped** on web · skip passcode/notifications/file-backup
(CSV export instead) · build straight through all phases overnight with Playwright verification.

**Deferred:** deployment (hosting, prod API URL, cookie domain/CORS) — handled at ship time.
