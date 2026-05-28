# Shareef Money — Implementation Progress

## Phase 1: Foundation (no UI)

- [x] `packages/db` — Drizzle schema for all tables (users, sessions, accounts, categories, contacts, locations, transactions, transaction_contacts, recurring_rules, settings, sync_log)
- [ ] `packages/db` — Add contacts, locations, transaction_contacts tables + update transactions with location_id
- [x] `packages/db` — Drizzle migrations setup
- [x] `packages/shared` — Const arrays and derived types (transactionTypes, categoryTypes, frequencies, weekDays, themes, etc.)
- [x] `packages/shared` — Zod validation schemas (transaction, account, category, auth, settings)
- [ ] `packages/shared` — Zod validation schemas for contact and location (Tags)
- [ ] `packages/shared` — Utility functions (formatCurrency, date-utils, aggregation) — deferred, user will add later
- [x] `packages/shared` — Seed data definitions (default categories, default settings)
- [ ] `apps/backend` — Auth endpoints (POST /auth/register, /auth/login, /auth/google, /auth/refresh, /auth/logout)
- [ ] `apps/backend` — Auth middleware (JWT verification, user_id injection)
- [ ] `apps/backend` — GET /auth/me, PATCH /auth/me, DELETE /auth/me

## Phase 2: Mobile Auth + First Screen

- [ ] Mobile — Auth screens (login, register with email/password)
- [ ] Mobile — Google Sign-In integration (expo-auth-session)
- [ ] Mobile — Token storage (expo-secure-store) + auto-refresh
- [ ] Mobile — Database provider (expo-sqlite + Drizzle, run migrations, seed on first login)
- [ ] Mobile — Bottom tab navigator shell (Trans., Stats, Accounts, More)
- [ ] Mobile — Auth gate (redirect to login if not authenticated)
- [ ] Mobile — Passcode gate (lock screen if enabled)

## Phase 3: Transactions (mobile → web)

### Mobile

- [ ] Add Transaction modal — segmented control (Income / Expense / Transfer)
- [ ] Add Transaction modal — numeric keypad for amount input
- [ ] Add Transaction modal — date/time picker
- [ ] Add Transaction modal — category picker modal
- [ ] Add Transaction modal — account picker modal
- [ ] Add Transaction modal — contact picker (Tags: Who — if enabled)
- [ ] Add Transaction modal — location picker (Tags: Where — if enabled)
- [ ] Add Transaction modal — note + description fields
- [ ] Add Transaction modal — Save / Continue buttons
- [ ] Add Transaction modal — Transfer: from/to accounts, fees, swap button
- [ ] Daily View — transaction list grouped by date
- [ ] Daily View — summary bar (income, expenses, total)
- [ ] Daily View — month/year navigation
- [ ] Daily View — FAB (+ button) to open add transaction
- [ ] Calendar View — month grid with daily totals
- [ ] Calendar View — tap day to navigate to daily view
- [ ] Monthly View — year navigation, monthly income/expense/net
- [ ] Monthly View — expandable weekly breakdowns
- [ ] Total View — all-time aggregated totals
- [ ] Edit transaction (tap to open pre-filled form)
- [ ] Delete transaction (swipe or long-press)

### Backend

- [ ] GET /api/transactions (list with filters, pagination)
- [ ] POST /api/transactions (create)
- [ ] GET /api/transactions/:id (get one)
- [ ] PATCH /api/transactions/:id (update)
- [ ] DELETE /api/transactions/:id (soft delete)

### Sync

- [ ] POST /sync/push — upload local changes
- [ ] POST /sync/pull — download server changes
- [ ] POST /sync/ack — confirm sync completion
- [ ] GET /sync/status — last sync timestamps
- [ ] Mobile sync triggers (foreground, after write, manual, on login)

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
