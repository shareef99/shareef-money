# Shareef Money — Implementation Progress

## Current status — 2026-07-04 (pre-Play-Store release)

The app pivoted to **local-first** (no accounts, no cloud sync) to ship to the Play
Store now. The cloud backend / sync / web items in the phase checklist below are
built but **parked** — sync is dormant behind `SYNC_ENABLED = false` in
`apps/mobile/src/providers/sync-provider.tsx` — for a post-launch pass. Treat the
`[ ]` items below as reflecting the *old* cloud-first plan, not current TODOs.

**Done**
- Local-first conversion: device-local synthesized user, cloud auth/sync removed or
  dormant, `(auth)` routes deleted. Package renamed to `com.shareef.money`.
- New brand identity (infinity mark) across icon / splash / adaptive assets.
- Pre-release code audit (strict typecheck + multi-area review): 8 bugs + 3 nits
  found and **all fixed** in commit `16c8ec0`:
  - Recurring auto-post revived (had gone dead when sync went dormant), transfer
    now requires a distinct destination, backup restore due-date fix, account-edit
    balance no longer double-counts, passcode lock engages on cold start, edit
    modals load by id, soft-deleted recurring templates stop regenerating,
    recurring clones carry the counterparty; + search-join / color-picker /
    biometric-recheck nits.

**Builds (EAS · `com.shareef.money` · new icon + audit fixes)**
- Production `.aab` **versionCode 5** — the artifact to upload to Play (supersedes
  the stale v4 icon-only builds).
- Preview `.apk` — for on-device QA.

**Next up (resume here)**
- Install the preview APK, run the full on-device QA pass (esp. the fixed paths:
  recurring posts, transfer-without-destination is blocked, backup with a due-dated
  debt round-trips, edit an old transaction via Search).
- Upload AAB **v5** to Play → closed testing (personal account = 12 testers / 14 days).
- **Blocker for Play "App content":** a hosted **privacy policy URL** — draft is
  ready in [BACKLOG.md](../BACKLOG.md).
- Then: marketing site + privacy/terms pages; later (~1 month) re-enable sync +
  dashboards (see BACKLOG.md).

---

## Phase 1: Foundation (no UI)

- [x] `packages/db` — Drizzle schema for all tables (users, sessions, accounts, categories, contacts, locations, transactions, transaction_contacts, recurring_rules, settings, sync_log)
- [x] `packages/db` — Add contacts, locations, transaction_contacts tables + update transactions with location_id
- [x] `packages/db` — Drizzle migrations setup
- [x] `packages/shared` — Const arrays and derived types (transactionTypes, categoryTypes, frequencies, weekDays, themes, etc.)
- [x] `packages/shared` — Zod validation schemas (transaction, account, category, auth, settings)
- [x] `packages/shared` — Zod validation schemas for contact and location (Tags)
- [x] `packages/shared` — Utility functions (formatCurrency, date-utils, aggregation) — deferred, user will add later
- [x] `packages/shared` — Seed data definitions (default categories, default settings)
- [x] `apps/backend` — Auth endpoints (POST /auth/register, /auth/login, /auth/refresh, /auth/logout)
- [x] `apps/backend` — Auth middleware (JWT verification, user_id injection)
- [x] `apps/backend` — GET /auth/me
- [x] `apps/backend` — POST /auth/google (Google OAuth token exchange)

## Phase 2: Mobile Auth + First Screen

- [x] Mobile — Auth screens (welcome screen + login/register bottom sheets)
- [ ] Mobile — Google Sign-In integration (expo-auth-session)
- [x] Mobile — Token storage (expo-secure-store) + auto-refresh
- [x] Mobile — Database provider (expo-sqlite + Drizzle, run migrations)
- [x] Mobile — Bottom tab navigator shell (Trans., Stats, Accounts, More)
- [x] Mobile — Auth gate (redirect to login if not authenticated)
- [ ] Mobile — Passcode gate (lock screen if enabled) — deferred to Phase 6

## Phase 3: Transactions (mobile → web)

### Mobile

- [x] Add Transaction modal — segmented control (Income / Expense / Transfer)
- [x] Add Transaction modal — numeric keypad for amount input
- [x] Add Transaction modal — date/time picker
- [x] Add Transaction modal — category picker modal
- [x] Add Transaction modal — account picker modal
- [ ] Add Transaction modal — contact picker (Tags: Who — if enabled)
- [ ] Add Transaction modal — location picker (Tags: Where — if enabled)
- [x] Add Transaction modal — note + description fields
- [x] Add Transaction modal — Save / Continue buttons
- [x] Add Transaction modal — Transfer: from/to accounts, fees, swap button
- [x] Daily View — transaction list grouped by date
- [x] Daily View — summary bar (income, expenses, total)
- [x] Daily View — month/year navigation
- [x] Daily View — FAB (+ button) to open add transaction
- [x] Calendar View — month grid with daily totals
- [x] Calendar View — tap day to navigate to daily view
- [x] Monthly View — year navigation, monthly income/expense/net
- [ ] Monthly View — expandable weekly breakdowns
- [x] Total View — all-time aggregated totals
- [x] Edit transaction (tap to open pre-filled form)
- [x] Delete transaction (delete button in edit modal)

### Backend

- [x] GET /api/transactions (list with filters, pagination)
- [x] POST /api/transactions (create)
- [x] GET /api/transactions/:id (get one)
- [x] PATCH /api/transactions/:id (update)
- [x] DELETE /api/transactions/:id (soft delete)
- [x] GET /api/accounts (list), POST, PATCH /:id, DELETE /:id
- [x] GET /api/categories (list), POST, PATCH /:id, DELETE /:id
- [x] Seed default categories, account, settings on registration

### Sync

- [x] POST /sync/push — upload local changes
- [x] POST /sync/pull — download server changes
- [x] POST /sync/ack — confirm sync completion
- [x] GET /sync/status — last sync timestamps
- [x] Mobile sync triggers (foreground, after write, manual, on login)

### Web

- [ ] Daily transactions page (data table with sorting/filtering)
- [ ] Add/edit transaction modal (Mantine form)
- [ ] Calendar view page
- [ ] Monthly summary page
- [ ] Total view page

## Phase 4: Accounts (mobile → web)

### Mobile

- [ ] Account list — flat list with balances
- [ ] Account list — summary bar (total assets, liabilities, net)
- [ ] Account list — menu (Add, Show/Hide, Delete, Modify Orders)
- [ ] Add/edit account modal (name, initial balance, description)
- [ ] Account detail — statement view (date range, deposits, withdrawals, balance)
- [ ] Account detail — transaction list filtered to account with running balance
- [ ] Account detail — month navigation
- [ ] Account stats — balance line chart (monthly trend)
- [ ] Account stats — bar chart (income vs expense per month)

### Backend

- [ ] GET /api/accounts (list all)
- [ ] POST /api/accounts (create)
- [ ] PATCH /api/accounts/:id (update)
- [ ] DELETE /api/accounts/:id (soft delete)
- [ ] GET /api/stats/account/:id (balance trend)

### Web

- [ ] Account list page with cards
- [ ] Add/edit account modal
- [ ] Account detail page (statement + charts)

## Phase 5: Stats (mobile → web)

### Mobile

- [ ] Stats screen — period selector dropdown (Weekly / Monthly / Annually / Custom)
- [ ] Stats screen — period navigation (< Aug 2025 >)
- [ ] Stats screen — Income / Expenses toggle
- [ ] Stats screen — pie chart (category breakdown with percentages)
- [ ] Stats screen — category list (percentage badge, icon, name, total)
- [ ] Weekly stats — date range header + pie chart
- [ ] Monthly stats — month navigation + pie chart
- [ ] Annually stats — year navigation + pie chart
- [ ] Custom period stats — date range picker + pie chart

### Backend

- [ ] GET /api/stats/categories (category breakdown for period)

### Web

- [ ] Stats page with pie charts + category lists
- [ ] Period selector + navigation
- [ ] Side-by-side income/expense pie charts

## Phase 6: Settings + Polish

### Mobile — Categories

- [ ] Income category management screen (list, add, edit, delete, reorder)
- [ ] Expense category management screen (list, add, edit, delete, reorder)
- [ ] Subcategory support (add/edit subcategories under parent)

### Mobile — Recurring Transactions

- [ ] Recurring rule form (frequency, interval, start/end date)
- [ ] Recurring rule list (manage active rules)
- [ ] Auto-generate transactions from active rules

### Mobile — Filters

- [ ] Filter modal — category multi-select with checkboxes
- [ ] Filter modal — account filter
- [ ] Filter modal — date range filter
- [ ] Filter modal — Income / Expenses / Account tabs
- [ ] Filter modal — pie charts for filtered data

### Mobile — Settings

- [ ] Currency setting
- [ ] Start screen preference (Daily/Calendar)
- [ ] Monthly start date (1–28)
- [ ] Weekly start day
- [ ] Carry-over setting
- [ ] Swipe behavior
- [ ] Income-Expenses color setting
- [ ] Time input mode
- [ ] Show description toggle
- [ ] Autocomplete toggle
- [ ] Input order preference
- [ ] Note button setting
- [ ] Tags: Contact toggle (ON/OFF) + required per type (Income/Expense/Transfer)
- [ ] Tags: Location toggle (ON/OFF) + required per type (Income/Expense/Transfer)
- [ ] Tags: Manage Contacts screen (list, add, edit, delete)
- [ ] Tags: Manage Locations screen (list, add, edit, delete)
- [ ] Passcode (set/change/remove PIN)
- [ ] Alarm setting (enable/disable, set time)
- [ ] Theme (Light / Dark / System)
- [ ] Language setting
- [ ] Profile screen (name, email, avatar, logout, delete account)
- [ ] Sync status display + manual sync button

### Backend — Settings & Categories

- [ ] GET /api/categories (list all)
- [ ] POST /api/categories (create)
- [ ] PATCH /api/categories/:id (update)
- [ ] DELETE /api/categories/:id (soft delete)
- [ ] GET /api/contacts (list all)
- [ ] POST /api/contacts (create)
- [ ] PATCH /api/contacts/:id (update)
- [ ] DELETE /api/contacts/:id (soft delete)
- [ ] GET /api/locations (list all)
- [ ] POST /api/locations (create)
- [ ] PATCH /api/locations/:id (update)
- [ ] DELETE /api/locations/:id (soft delete)
- [ ] GET /api/recurring-rules (list all)
- [ ] POST /api/recurring-rules (create)
- [ ] PATCH /api/recurring-rules/:id (update)
- [ ] DELETE /api/recurring-rules/:id (delete)
- [ ] GET /api/settings (get all)
- [ ] PUT /api/settings (bulk update)

### Web — Settings & Polish

- [ ] Settings page (general configuration)
- [ ] Category management page
- [ ] Profile page
- [ ] Keyboard shortcuts for quick transaction entry
- [ ] Responsive layout polish
