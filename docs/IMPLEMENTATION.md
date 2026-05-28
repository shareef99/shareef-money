# Shareef Money — Implementation Document

## Overview

A personal finance tracker with a local-first mobile app and a full-featured web dashboard. The mobile app works offline and syncs to a server when online. The web dashboard connects directly to the server database.

**Architecture:**

```bash
Mobile (expo-sqlite)  ←──sync──→  Hono Backend (SQLite)  ←──API──→  Web Dashboard (React)
     ↓                                  ↓                              ↓
works offline                   source of truth                  always online
local-first                     auth + sync API                  full mirror of mobile
```

**Tech Stack:**

| Layer    | Technology                                                                   |
| -------- | ---------------------------------------------------------------------------- |
| Mobile   | Expo SDK 56, React Native 0.85, expo-router, NativeWind v5 + Tailwind CSS v4 |
| Backend  | Hono, Node.js, @hono/zod-openapi, Swagger UI                                 |
| Web      | React (Vite), Mantine UI + Tailwind CSS v4, TanStack Router, TanStack Query  |
| Database | Drizzle ORM — expo-sqlite (mobile), better-sqlite3 (server)                  |
| Auth     | Custom JWT (jose) + argon2, Google OAuth                                     |
| Language | TypeScript (strict mode) everywhere                                          |

**Monorepo Structure:**

```bash
shareef-money/
├── apps/
│   ├── mobile/          # Expo React Native app
│   ├── backend/         # Hono API server
│   └── web/             # React (Vite) dashboard
├── packages/
│   ├── db/              # Shared Drizzle schema + types
│   └── shared/          # Shared types, Zod schemas, const arrays, pure utilities
├── pnpm-workspace.yaml
└── package.json
```

---

## 1. Database Schema

All tables use `integer` primary keys with auto-increment, except `users` and `sessions` which use UUID text primary keys (for security — auto-increment IDs are guessable and leak user count; UUIDs are globally unique which also prevents sync ID collisions).

Timestamps are stored as Unix epoch integers. Monetary amounts are stored as integers in the smallest currency unit (paise for INR) to avoid floating-point precision issues.

The schema is defined once in `packages/db` and shared across mobile (expo-sqlite) and backend (better-sqlite3). Both use Drizzle ORM.

### 1.1 `users`

User accounts for authentication. Server-only table — does not sync to mobile.

| Column        | Type    | Constraints               | Description                        |
| ------------- | ------- | ------------------------- | ---------------------------------- |
| id            | text    | PK                        | UUID                               |
| email         | text    | NOT NULL, UNIQUE          | Login email                        |
| password_hash | text    |                           | bcrypt hash (NULL for OAuth users) |
| name          | text    | NOT NULL                  | Display name                       |
| avatar_url    | text    |                           | Profile picture URL                |
| auth_provider | text    | NOT NULL, DEFAULT "email" | `"email"` or `"google"`            |
| google_id     | text    | UNIQUE                    | Google OAuth subject ID            |
| created_at    | integer | NOT NULL                  | Unix timestamp                     |
| updated_at    | integer | NOT NULL                  | Unix timestamp                     |

**Relationships:**

- Referenced by all user-owned tables via `user_id`

---

### 1.2 `sessions`

Active login sessions for JWT refresh token management. Server-only table.

| Column        | Type    | Constraints          | Description               |
| ------------- | ------- | -------------------- | ------------------------- |
| id            | text    | PK                   | UUID                      |
| user_id       | text    | NOT NULL, FK → users | Session owner             |
| refresh_token | text    | NOT NULL, UNIQUE     | Hashed refresh token      |
| device_name   | text    |                      | e.g., "Pixel 7", "Chrome" |
| device_type   | text    | NOT NULL             | `"mobile"` or `"web"`     |
| expires_at    | integer | NOT NULL             | Unix timestamp            |
| created_at    | integer | NOT NULL             | Unix timestamp            |

**Relationships:**

- `user_id` → `users.id` (many-to-one)

---

### 1.3 `accounts`

Individual financial accounts (e.g., "HDFC Savings", "Wallet Cash", "Credit Card").

| Column          | Type    | Constraints          | Description                         |
| --------------- | ------- | -------------------- | ----------------------------------- |
| id              | integer | PK, auto-increment   |                                     |
| user_id         | text    | NOT NULL, FK → users | Owner                               |
| name            | text    | NOT NULL             | e.g., "HDFC Savings"                |
| initial_balance | integer | NOT NULL, DEFAULT 0  | Starting balance (in smallest unit) |
| description     | text    |                      | Optional description                |
| icon            | text    |                      | Icon identifier                     |
| color           | text    |                      | Hex color code                      |
| sort_order      | integer | NOT NULL, DEFAULT 0  | User-defined ordering               |
| is_hidden       | integer | NOT NULL, DEFAULT 0  | Boolean — hidden from main list     |
| is_archived     | integer | NOT NULL, DEFAULT 0  | Boolean — soft delete               |
| created_at      | integer | NOT NULL             | Unix timestamp                      |
| updated_at      | integer | NOT NULL             | Unix timestamp                      |

**Relationships:**

- `user_id` → `users.id` (many-to-one)
- Referenced by `transactions.account_id`, `transactions.to_account_id`

---

### 1.4 `categories`

Transaction categories. Supports two levels: parent categories and subcategories.

| Column      | Type    | Constraints                | Description                         |
| ----------- | ------- | -------------------------- | ----------------------------------- |
| id          | integer | PK, auto-increment         |                                     |
| user_id     | text    | NOT NULL, FK → users       | Owner                               |
| parent_id   | integer | FK → categories (nullable) | NULL = top-level, set = subcategory |
| name        | text    | NOT NULL                   | e.g., "Food", "Transport"           |
| type        | text    | NOT NULL                   | `"income"` or `"expense"`           |
| icon        | text    |                            | Emoji or icon identifier            |
| color       | text    |                            | Hex color code for charts           |
| sort_order  | integer | NOT NULL, DEFAULT 0        | User-defined ordering               |
| is_default  | integer | NOT NULL, DEFAULT 0        | Boolean — preloaded category flag   |
| is_archived | integer | NOT NULL, DEFAULT 0        | Boolean — soft delete               |
| created_at  | integer | NOT NULL                   | Unix timestamp                      |
| updated_at  | integer | NOT NULL                   | Unix timestamp                      |

**Relationships:**

- `user_id` → `users.id` (many-to-one)
- `parent_id` → `categories.id` (self-referencing, many-to-one)
- Referenced by `transactions.category_id`

**Preloaded expense categories:** Food, Transport, Mobile, Family, Entertainment, Charity, Games, Flowers, My Self, Arshiya.
**Preloaded income categories:** Salary.

---

### 1.5 `contacts`

People or groups that a transaction is associated with (who you transacted with/for). Part of the Tags feature.

| Column      | Type    | Constraints          | Description                             |
| ----------- | ------- | -------------------- | --------------------------------------- |
| id          | integer | PK, auto-increment   |                                         |
| user_id     | text    | NOT NULL, FK → users | Owner                                   |
| name        | text    | NOT NULL             | e.g., "Arbaaz", "Mom", "Office friends" |
| is_archived | integer | NOT NULL, DEFAULT 0  | Boolean — soft delete                   |
| created_at  | integer | NOT NULL             | Unix timestamp                          |
| updated_at  | integer | NOT NULL             | Unix timestamp                          |

**Relationships:**

- `user_id` → `users.id` (many-to-one)
- Referenced by `transaction_contacts.contact_id` (many-to-many with transactions)

---

### 1.6 `locations`

Places where a transaction occurred. Part of the Tags feature.

| Column      | Type    | Constraints          | Description                                 |
| ----------- | ------- | -------------------- | ------------------------------------------- |
| id          | integer | PK, auto-increment   |                                             |
| user_id     | text    | NOT NULL, FK → users | Owner                                       |
| name        | text    | NOT NULL             | e.g., "Paradise Biryani", "DMart", "Amazon" |
| is_archived | integer | NOT NULL, DEFAULT 0  | Boolean — soft delete                       |
| created_at  | integer | NOT NULL             | Unix timestamp                              |
| updated_at  | integer | NOT NULL             | Unix timestamp                              |

**Relationships:**

- `user_id` → `users.id` (many-to-one)
- Referenced by `transactions.location_id` (one-to-many)

---

### 1.7 `transactions`

The core table. Supports three types: income, expense, and transfer.

| Column        | Type    | Constraints                | Description                              |
| ------------- | ------- | -------------------------- | ---------------------------------------- |
| id            | integer | PK, auto-increment         |                                          |
| user_id       | text    | NOT NULL, FK → users       | Owner                                    |
| type          | text    | NOT NULL                   | `"income"`, `"expense"`, or `"transfer"` |
| amount        | integer | NOT NULL                   | Amount in smallest currency unit         |
| fee           | integer | NOT NULL, DEFAULT 0        | Transfer fee (only for transfers)        |
| category_id   | integer | FK → categories (nullable) | NULL for transfers                       |
| account_id    | integer | NOT NULL, FK → accounts    | Source account ("from" for transfers)    |
| to_account_id | integer | FK → accounts (nullable)   | Destination account (transfers only)     |
| location_id   | integer | FK → locations (nullable)  | Where the transaction happened           |
| note          | text    |                            | Short note                               |
| description   | text    |                            | Longer description                       |
| date          | integer | NOT NULL                   | Transaction date (Unix timestamp)        |
| created_at    | integer | NOT NULL                   | Unix timestamp                           |
| updated_at    | integer | NOT NULL                   | Unix timestamp                           |

**Relationships:**

- `user_id` → `users.id` (many-to-one)
- `category_id` → `categories.id` (many-to-one, nullable for transfers)
- `account_id` → `accounts.id` (many-to-one)
- `to_account_id` → `accounts.id` (many-to-one, nullable)
- `location_id` → `locations.id` (many-to-one, nullable)
- Referenced by `recurring_rules.transaction_id` (one-to-many)
- Referenced by `transaction_contacts` (many-to-many with contacts)

**Indexes:**

- `idx_transactions_user_date` on `(user_id, date)`
- `idx_transactions_type` on `type`
- `idx_transactions_account` on `account_id`
- `idx_transactions_category` on `category_id`

---

### 1.8 `transaction_contacts`

Join table linking transactions to contacts (many-to-many). A transaction can have multiple contacts.

| Column         | Type    | Constraints           | Description |
| -------------- | ------- | --------------------- | ----------- |
| transaction_id | integer | PK, FK → transactions |             |
| contact_id     | integer | PK, FK → contacts     |             |

Composite primary key: `(transaction_id, contact_id)`.

**Relationships:**

- `transaction_id` → `transactions.id` (many-to-one, cascade delete)
- `contact_id` → `contacts.id` (many-to-one, cascade delete)

---

### 1.10 `recurring_rules`

Defines repeating transaction schedules. Each rule references a template transaction.

| Column          | Type    | Constraints                 | Description                                    |
| --------------- | ------- | --------------------------- | ---------------------------------------------- |
| id              | integer | PK, auto-increment          |                                                |
| user_id         | text    | NOT NULL, FK → users        | Owner                                          |
| transaction_id  | integer | NOT NULL, FK → transactions | The template transaction to repeat             |
| frequency       | text    | NOT NULL                    | `"daily"`, `"weekly"`, `"monthly"`, `"yearly"` |
| interval        | integer | NOT NULL, DEFAULT 1         | Every N periods (e.g., every 2 weeks)          |
| start_date      | integer | NOT NULL                    | Unix timestamp — first occurrence              |
| end_date        | integer |                             | Unix timestamp — NULL = never ends             |
| next_occurrence | integer | NOT NULL                    | Unix timestamp — next auto-create date         |
| is_active       | integer | NOT NULL, DEFAULT 1         | Boolean — paused or active                     |
| created_at      | integer | NOT NULL                    | Unix timestamp                                 |
| updated_at      | integer | NOT NULL                    | Unix timestamp                                 |

**Relationships:**

- `user_id` → `users.id` (many-to-one)
- `transaction_id` → `transactions.id` (many-to-one)

---

### 1.11 `settings`

Per-user key-value store for preferences.

| Column  | Type | Constraints    | Description        |
| ------- | ---- | -------------- | ------------------ |
| user_id | text | PK, FK → users | Owner              |
| key     | text | PK             | Setting identifier |
| value   | text | NOT NULL       | JSON-encoded value |

Composite primary key: `(user_id, key)`.

**Default settings:**

| Key                   | Default Value                                            | Description                              |
| --------------------- | -------------------------------------------------------- | ---------------------------------------- |
| `currency_symbol`     | `"₹"`                                                    | Display currency symbol                  |
| `currency_code`       | `"INR"`                                                  | ISO currency code                        |
| `start_screen`        | `"daily"`                                                | Default transactions view                |
| `monthly_start_date`  | `1`                                                      | Day of month period starts               |
| `weekly_start_day`    | `"monday"`                                               | Day of week period starts                |
| `carry_over`          | `true`                                                   | Carry over balance to next period        |
| `passcode`            | `null`                                                   | App lock passcode (hashed, mobile only)  |
| `passcode_enabled`    | `false`                                                  | Whether app lock is active (mobile only) |
| `alarm_enabled`       | `true`                                                   | Daily reminder (mobile only)             |
| `alarm_time`          | `"21:00"`                                                | Reminder time (mobile only)              |
| `show_description`    | `true`                                                   | Show description field in form           |
| `autocomplete`        | `true`                                                   | Autocomplete suggestions                 |
| `input_order`         | `"amount"`                                               | First field focus in transaction form    |
| `subcategory_enabled` | `true`                                                   | Enable subcategories                     |
| `swipe_action`        | `"change_date"`                                          | Swipe gesture behavior (mobile only)     |
| `theme`               | `"system"`                                               | `"light"`, `"dark"`, or `"system"`       |
| `contacts_enabled`    | `false`                                                  | Global toggle for Tags: Contact          |
| `contacts_required`   | `{"income": false, "expense": false, "transfer": false}` | Per-type mandatory toggle                |
| `locations_enabled`   | `false`                                                  | Global toggle for Tags: Location         |
| `locations_required`  | `{"income": false, "expense": false, "transfer": false}` | Per-type mandatory toggle                |

---

### 1.12 `sync_log`

Tracks sync state between mobile and server. Server-only table.

| Column       | Type    | Constraints          | Description                            |
| ------------ | ------- | -------------------- | -------------------------------------- |
| id           | integer | PK, auto-increment   |                                        |
| user_id      | text    | NOT NULL, FK → users | Owner                                  |
| device_id    | text    | NOT NULL             | Unique device identifier               |
| table_name   | text    | NOT NULL             | Which table was synced                 |
| last_sync_at | integer | NOT NULL             | Unix timestamp of last successful sync |
| created_at   | integer | NOT NULL             | Unix timestamp                         |

---

## 2. Entity Relationship Diagram

```bash
┌──────────────┐
│    users      │
│──────────────│
│ id (PK/UUID) │───────────────────────────────────────────────┐
│ email        │                                               │
│ password_hash│     ┌──────────────┐                          │
│ name         │     │   sessions    │                          │
│ auth_provider│     │──────────────│                          │
│ google_id    │◄────│ user_id (FK) │                          │
│ created_at   │     │ refresh_token│                          │
│ updated_at   │     │ device_name  │                          │
└──────┬───────┘     │ device_type  │                          │
       │             │ expires_at   │                          │
       │             └──────────────┘                          │
       │ 1:N                                                   │
       ├──────────────────┐                                    │
       │                  │                                    │
       ▼                  ▼                                    │
┌─────────────────┐  ┌──────────────────┐                      │
│    accounts      │  │    categories     │                      │
│─────────────────│  │──────────────────│                      │
│ id (PK)         │  │ id (PK)          │                      │
│ user_id (FK)    │  │ user_id (FK)     │                      │
│ name            │  │ parent_id (FK) ──┤──→ self              │
│ initial_balance │  │ name             │                      │
│ description     │  │ type             │                      │
│ icon, color     │  │ icon, color      │                      │
│ sort_order      │  │ sort_order       │                      │
│ is_hidden       │  │ is_default       │                      │
│ is_archived     │  │ is_archived      │                      │
│ created_at      │  │ created_at       │                      │
│ updated_at      │  │ updated_at       │                      │
└────────┬────────┘  └────────┬─────────┘                      │
         │                    │                                │
         │ 1:N                │ 1:N                            │
         │                    │                                │
         ▼                    ▼                                │
       ┌──────────────────────────┐     ┌──────────────────┐   │
       │      transactions        │     │  recurring_rules  │   │
       │──────────────────────────│     │──────────────────│   │
       │ id (PK)                  │◄────│ transaction_id   │(FK)│
       │ user_id (FK) ────────────┤─────┤ user_id (FK) ────┤───┘
       │ type                     │     │ id (PK)          │
       │ amount, fee              │     │ frequency        │
       │ category_id (FK) ───→    │     │ interval         │
       │ account_id (FK) ────→    │     │ start_date       │
       │ to_account_id (FK) ──→   │     │ end_date         │
       │ location_id (FK) ────→   │     │ next_occurrence  │
       │ note, description        │     │ is_active        │
       │ date                     │     │ created_at       │
       │ created_at, updated_at   │     │ updated_at       │
       └──────────┬───────────────┘     └──────────────────┘
                  │
                  │ M:N                    1:N
        ┌─────────┴─────────┐    ┌─────────────────┐
        │transaction_contacts│    │    locations      │
        │───────────────────│    │─────────────────│
        │ transaction_id(PK)│    │ id (PK)         │
        │ contact_id (PK)   │    │ user_id (FK)    │
        └─────────┬─────────┘    │ name            │
                  │              │ is_archived     │
                  │ M:N          │ created_at      │
                  ▼              │ updated_at      │
        ┌─────────────────┐      └─────────────────┘
        │    contacts      │
        │─────────────────│
        │ id (PK)         │
        │ user_id (FK)    │
        │ name            │
        │ is_archived     │
        │ created_at      │
        │ updated_at      │
        └─────────────────┘

┌──────────────────┐     ┌──────────────────┐
│     settings      │     │     sync_log      │
│──────────────────│     │──────────────────│
│ user_id (PK, FK) │     │ id (PK)          │
│ key (PK)         │     │ user_id (FK)     │
│ value            │     │ device_id        │
└──────────────────┘     │ table_name       │
                         │ last_sync_at     │
                         │ created_at       │
                         └──────────────────┘
```

**Relationship Summary:**

- `users` 1 → N `sessions`
- `users` 1 → N `accounts`
- `users` 1 → N `categories`
- `users` 1 → N `contacts`
- `users` 1 → N `locations`
- `users` 1 → N `transactions`
- `users` 1 → N `recurring_rules`
- `users` 1 → N `settings`
- `users` 1 → N `sync_log`
- `accounts` 1 → N `transactions` (via `account_id`)
- `accounts` 1 → N `transactions` (via `to_account_id`, transfers only)
- `categories` 1 → N `categories` (self-referencing: parent → subcategories)
- `categories` 1 → N `transactions` (via `category_id`)
- `locations` 1 → N `transactions` (via `location_id`)
- `transactions` M → N `contacts` (via `transaction_contacts`)
- `transactions` 1 → N `recurring_rules` (via `transaction_id`)

---

## 3. Authentication

### 3.1 Strategy

Custom JWT-based auth with email/password and Google OAuth.

**Token flow:**

```bash
Login/Register → Server returns { accessToken (15min), refreshToken (30 days) }
                     ↓
Mobile stores tokens in expo-secure-store
Web stores accessToken in memory, refreshToken in httpOnly cookie
                     ↓
Every API request sends: Authorization: Bearer <accessToken>
                     ↓
On 401 → auto-refresh using refreshToken → new accessToken
```

### 3.2 Auth Endpoints (Hono Backend)

| Method | Path             | Description                   |
| ------ | ---------------- | ----------------------------- |
| POST   | `/auth/register` | Email + password registration |
| POST   | `/auth/login`    | Email + password login        |
| POST   | `/auth/google`   | Google OAuth token exchange   |
| POST   | `/auth/refresh`  | Refresh access token          |
| POST   | `/auth/logout`   | Invalidate session            |
| GET    | `/auth/me`       | Get current user profile      |

### 3.3 Password Handling

- Hash with argon2id (memory: 64MB, iterations: 3, parallelism: 1)
- Minimum 8 characters
- Server-side validation with Zod

### 3.4 Google OAuth Flow (Mobile)

1. Mobile app uses `expo-auth-session` to get Google ID token
2. Sends ID token to `POST /auth/google`
3. Server verifies token with Google, creates/finds user, returns JWT pair

### 3.5 Auth Middleware

All API routes except `/auth/*` and `/health` require a valid access token. The middleware:

1. Extracts Bearer token from Authorization header
2. Verifies JWT signature and expiry
3. Attaches `user_id` to the request context
4. All database queries filter by `user_id` — users can never access other users' data

---

## 4. Sync Strategy

### 4.1 Approach: Last-Write-Wins with Timestamps

The mobile app is the primary data entry point. It works fully offline. When connectivity is available, it syncs with the server.

**Key principles:**

- Every row has an `updated_at` timestamp
- On conflict, the row with the latest `updated_at` wins
- Deletes are soft-deletes (`is_archived = 1`) so they can propagate via sync
- The server is the source of truth after sync completes

### 4.2 Sync Flow

```bash
Mobile App                          Server
    │                                  │
    ├── POST /sync/push ──────────────→│  Send local changes since last sync
    │   { changes: [...],              │  Server applies changes (last-write-wins)
    │     lastSyncAt: timestamp }      │  Server returns conflicts resolved
    │                                  │
    │←── POST /sync/pull ──────────────┤  Request server changes since last sync
    │   { lastSyncAt: timestamp }      │  Server returns all rows updated after timestamp
    │                                  │  Mobile applies changes to local DB
    │                                  │
    ├── POST /sync/ack ───────────────→│  Confirm sync completed
    │   { syncedAt: timestamp }        │  Server updates sync_log
    │                                  │
```

### 4.3 Sync Endpoints

| Method | Path           | Description                                   |
| ------ | -------------- | --------------------------------------------- |
| POST   | `/sync/push`   | Upload local changes to server                |
| POST   | `/sync/pull`   | Download server changes since last sync       |
| POST   | `/sync/ack`    | Confirm sync completion, update sync_log      |
| GET    | `/sync/status` | Get last sync timestamps per table per device |

### 4.4 What Syncs

All user-owned tables sync: `accounts`, `categories`, `contacts`, `locations`, `transactions`, `transaction_contacts`, `recurring_rules`, `settings`.

Auth tables (`users`, `sessions`) and `sync_log` do NOT sync — they exist only on the server.

### 4.5 Mobile Sync Triggers

- On app foreground (if > 5 minutes since last sync)
- After creating/updating/deleting any record (debounced 10 seconds)
- Manual pull-to-refresh
- On successful login

---

## 5. Backend API (Hono)

### 5.1 API Structure

All data endpoints are RESTful and scoped to the authenticated user.

| Method | Path                       | Description                     |
| ------ | -------------------------- | ------------------------------- |
| GET    | `/api/transactions`        | List (with filters, pagination) |
| POST   | `/api/transactions`        | Create                          |
| GET    | `/api/transactions/:id`    | Get one                         |
| PATCH  | `/api/transactions/:id`    | Update                          |
| DELETE | `/api/transactions/:id`    | Soft delete                     |
| GET    | `/api/accounts`            | List all accounts               |
| POST   | `/api/accounts`            | Create                          |
| PATCH  | `/api/accounts/:id`        | Update                          |
| DELETE | `/api/accounts/:id`        | Soft delete                     |
| GET    | `/api/categories`          | List all categories             |
| POST   | `/api/categories`          | Create                          |
| PATCH  | `/api/categories/:id`      | Update                          |
| DELETE | `/api/categories/:id`      | Soft delete                     |
| GET    | `/api/contacts`            | List all contacts               |
| POST   | `/api/contacts`            | Create                          |
| PATCH  | `/api/contacts/:id`        | Update                          |
| DELETE | `/api/contacts/:id`        | Soft delete                     |
| GET    | `/api/locations`           | List all locations              |
| POST   | `/api/locations`           | Create                          |
| PATCH  | `/api/locations/:id`       | Update                          |
| DELETE | `/api/locations/:id`       | Soft delete                     |
| GET    | `/api/recurring-rules`     | List all rules                  |
| POST   | `/api/recurring-rules`     | Create                          |
| PATCH  | `/api/recurring-rules/:id` | Update                          |
| DELETE | `/api/recurring-rules/:id` | Delete                          |
| GET    | `/api/settings`            | Get all settings                |
| PUT    | `/api/settings`            | Bulk update settings            |
| GET    | `/api/stats/categories`    | Category breakdown for period   |
| GET    | `/api/stats/account/:id`   | Account balance trend           |

All endpoints use `@hono/zod-openapi` for request/response validation and auto-generated OpenAPI docs at `/docs`.

### 5.2 Backend Architecture Decisions

**File structure: Routes + Services (2-layer, folder-per-feature)**

Each feature gets a folder with two files:
- `*.route.ts` — Hono OpenAPI route definitions, request/response handling
- `*.service.ts` — Pure TypeScript business logic, receives `db` as parameter, no Hono dependency

No barrel files (`index.ts`) — imports reference files directly (e.g., `./routes/auth/auth.route.js`).

**DB access: Hono context variable**

The Drizzle client is created once in `src/db.ts` and injected into every request via a middleware that sets `c.set("db", db)`. Services receive `db` as a parameter — making them testable and decoupled from Hono.

**Error handling: Centralized `AppError`**

A single `AppError` class in `src/lib/error.ts` is used by all services. The HTTP status code differentiates error types — no per-feature error classes.

**JWT: `jose` library**

Modern, standards-compliant, TypeScript-first. Access tokens (15min) + refresh tokens (30 days) with SHA-256 hashed storage in sessions table. Refresh tokens include a `jti` (JWT ID) claim for uniqueness.

**Password hashing: `argon2` (native C)**

Using argon2id via the `argon2` npm package. Configured with 64MB memory, 3 iterations, 1 parallelism.

**Type conventions:**
- Use `type` instead of `interface` for type definitions
- Service function arguments use `Payload` suffix (e.g., `RegisterPayload`, not `RegisterInput`)
- Service argument names use `payload` (e.g., `register(db, payload)`)

### 5.3 Backend File Structure

```bash
apps/backend/
├── src/
│   ├── index.ts                          # Server entry point
│   ├── app.ts                            # Hono app, global middleware, route wiring
│   ├── env.ts                            # Environment validation (Zod)
│   ├── db.ts                             # Drizzle client singleton (better-sqlite3)
│   ├── migrate.ts                        # Migration runner script
│   ├── middleware/
│   │   ├── auth.ts                       # JWT verification → sets userId in context
│   │   └── db.ts                         # Injects db into Hono context
│   ├── lib/
│   │   ├── error.ts                      # Centralized AppError class
│   │   ├── jwt.ts                        # jose: sign/verify access + refresh tokens
│   │   ├── password.ts                   # argon2: hash/verify
│   │   └── google-auth.ts               # Google ID token verification
│   └── routes/
│       ├── health/
│       │   └── health.route.ts           # GET /health
│       ├── auth/
│       │   ├── auth.route.ts             # OpenAPI route definitions
│       │   └── auth.service.ts           # register, login, refresh, logout, me
│       ├── transactions/
│       │   ├── transactions.route.ts     # Transaction CRUD routes
│       │   └── transactions.service.ts   # Transaction business logic
│       ├── accounts/
│       │   ├── accounts.route.ts         # Account CRUD routes
│       │   └── accounts.service.ts       # Account business logic
│       ├── categories/
│       │   ├── categories.route.ts       # Category CRUD routes
│       │   └── categories.service.ts     # Category business logic
│       ├── contacts/
│       │   ├── contacts.route.ts         # Contact CRUD routes (Tags)
│       │   └── contacts.service.ts       # Contact business logic
│       ├── locations/
│       │   ├── locations.route.ts        # Location CRUD routes (Tags)
│       │   └── locations.service.ts      # Location business logic
│       ├── recurring-rules/
│       │   ├── recurring-rules.route.ts  # Recurring rule CRUD routes
│       │   └── recurring-rules.service.ts
│       ├── settings/
│       │   ├── settings.route.ts         # Settings read/write routes
│       │   └── settings.service.ts       # Settings business logic
│       ├── stats/
│       │   ├── stats.route.ts            # Stats aggregation routes
│       │   └── stats.service.ts          # Stats queries
│       └── sync/
│           ├── sync.route.ts             # Sync push/pull/ack routes
│           └── sync.service.ts           # Sync business logic
├── .env                                  # Environment variables (not committed)
├── package.json
└── tsconfig.json
```

---

## 6. Mobile App — Screen Architecture

### 6.1 Navigation Structure

```bash
Root (_layout.tsx)
├── (auth)/                          ← Unauthenticated screens
│   ├── login.tsx                    ← Email/password + Google sign-in
│   └── register.tsx                 ← Registration form
│
├── (app)/                           ← Authenticated screens (behind auth gate)
│   ├── _layout.tsx                  ← Passcode gate + DB provider
│   ├── (tabs)/
│   │   ├── _layout.tsx              ← Bottom tab navigator
│   │   ├── transactions/
│   │   │   ├── _layout.tsx          ← Top tab nav (Daily/Calendar/Monthly/Total)
│   │   │   ├── index.tsx            ← Daily view (default)
│   │   │   ├── calendar.tsx         ← Calendar grid view
│   │   │   ├── monthly.tsx          ← Monthly aggregation view
│   │   │   └── total.tsx            ← All-time totals
│   │   ├── stats/
│   │   │   └── index.tsx            ← Stats with period selector + pie chart
│   │   ├── accounts/
│   │   │   └── index.tsx            ← Account list
│   │   └── more/
│   │       └── index.tsx            ← Settings list
│   │
│   ├── account-detail/
│   │   └── [id].tsx                 ← Account statement + stats
│   │
│   ├── (modals)/
│   │   ├── add-transaction.tsx      ← Income/Expense/Transfer form
│   │   ├── add-account.tsx          ← Add/edit account form
│   │   ├── category-picker.tsx      ← Category selection modal
│   │   ├── account-picker.tsx       ← Account selection modal
│   │   ├── filter.tsx               ← Transaction filter modal
│   │   └── recurring.tsx            ← Recurring rule setup
│   │
│   └── settings/
│       ├── categories.tsx           ← Category management (CRUD)
│       ├── passcode.tsx             ← Set/change passcode
│       ├── alarm.tsx                ← Reminder settings
│       ├── theme.tsx                ← Theme selection
│       └── profile.tsx              ← User profile + logout
```

### 6.2 Tab 1: Transactions (`transactions/`)

**Main screen** with a segmented header: **Daily | Calendar | Monthly | Total**

#### 6.2.1 Daily View (default)

- **Header:** Month/year navigation (`< Aug 2025 >`), star/search/filter icons
- **Summary bar:** Income total (green), Expenses total (red), Net total
- **Transaction list:** Grouped by date
  - Each date header shows: day number, day name, date, total income, total expense
  - Each transaction row: category icon + name, subcategory, account name, amount (red for expense, green for income)
- **FAB:** "+" button to add transaction
- **Quick-add button:** Clipboard/quick entry icon

#### 6.2.2 Calendar View

- **Month grid:** Mon–Sun columns
- **Each day cell:** Shows total amount for that day (red = net expense, green = net income)
- Tap a day → navigates to daily view for that date

#### 6.2.3 Monthly View

- **Year navigation** (`< 2025 >`)
- **List of months** with:
  - Monthly income, expenses, and net total
  - Expandable: shows weekly breakdowns within each month
  - Each week shows its own income/expense/net

#### 6.2.4 Total View

- Aggregated totals across all time
- Income, Expense, Net — same layout as monthly but without time grouping

#### 6.2.5 Filter Modal

- Filter by: categories (multi-select with checkboxes), accounts, date range
- Toggle between Income / Expenses / Account tabs
- Shows pie charts for income % and expense %
- Shows filtered total

---

### 6.3 Tab 2: Stats (`stats/`)

**Main screen** with period selector dropdown: **Weekly | Monthly | Annually | Period (custom)**

#### 6.3.1 Stats Overview

- **Period navigation:** `< Aug 2025 >` with left/right arrows
- **Toggle:** Income | Expenses tabs
- **Pie chart:** Category breakdown with percentage labels
- **Category list:** Sorted by percentage descending
  - Each row: percentage badge, category icon, category name, total amount

#### 6.3.2 Weekly Stats

- Date range header (e.g., `28.07.2025 ~ 03.08`)
- Same pie chart + category list layout

#### 6.3.3 Monthly Stats

- Month navigation with pie chart breakdown

#### 6.3.4 Annually Stats

- Year navigation (e.g., `< 2025 >`)
- Full year pie chart + category totals

#### 6.3.5 Custom Period Stats

- Date range picker (from → to) with calendar icons
- Same pie chart + list layout for the custom range

---

### 6.4 Tab 3: Accounts (`accounts/`)

#### 6.4.1 Accounts List

- **Summary bar:** Total Assets (green), Total Liabilities (red), Net Total
- **Account list:** Flat list of all accounts
  - Each row: account name + balance
- **Menu (three dots):** Add, Show/Hide, Delete, Modify Orders
- **Chart icon:** Navigate to total account stats

#### 6.4.2 Account Detail (`account-detail/[id]`)

- **Header:** Account name, month navigation
- **Statement header:** Date range, deposit total, withdrawal total, net total, running balance
- **Transaction list:** Same format as daily transactions view but filtered to this account
  - Each row also shows running balance
- **Stats button:** Navigate to account-specific stats (line chart + bar chart)

#### 6.4.3 Account Stats

- **Balance line chart:** Monthly balance trend over time
- **Bar chart:** Monthly income vs. expense bars side by side
- Month labels on x-axis, amounts on y-axis

#### 6.4.4 Add/Edit Account Modal

- Fields: Name, Amount (initial balance), Description
- Save button

---

### 6.5 Tab 4: More (`more/`)

#### 6.5.1 Settings Screen

Settings organized in sections:

**Category/Repeat Section:**

- Income Category Setting → category management screen (CRUD)
- Expenses Category Setting → category management screen (CRUD)
- Subcategory toggle (ON/OFF)
- Repeat Setting → manage recurring rules

**Tags Section:**

- Contact (Tags: Who) toggle (ON/OFF)
- Contact required per type (Income / Expense / Transfer toggles)
- Location (Tags: Where) toggle (ON/OFF)
- Location required per type (Income / Expense / Transfer toggles)
- Manage Contacts → contact list (CRUD)
- Manage Locations → location list (CRUD)

**Configuration Section:**

- Main Currency Setting (display symbol, e.g., INR ₹)
- Start Screen preference (Daily/Calendar)
- Monthly Start Date (1–28)
- Weekly Start Day (Monday–Sunday)
- Carry-over Setting (ON/OFF)
- Swipe behavior (Change Date / Change Tab)
- Income-Expenses Color Setting
- Time Input mode
- Show Description toggle
- Autocomplete toggle
- Input Order (From Amount / From Category)
- Note Button Setting

**Other Section:**

- Passcode (ON/OFF, set/change PIN)
- Alarm Setting (ON/OFF, set time)
- Style/Theme (Light / Dark / System)
- Language Setting

**Account Section:**

- Profile (name, email, avatar)
- Sync status + manual sync button
- Logout
- Delete account

---

### 6.6 Shared Modals & Components

#### 6.6.1 Add Transaction Modal

Unified form for all three transaction types, switchable via segmented control:

**Income tab:**

- Date + time picker, Rep/Inst. button
- Amount (numeric keypad)
- Category picker (income categories)
- Account picker
- Contact picker (Tags: Who — if enabled in settings, required/optional per type)
- Location picker (Tags: Where — if enabled in settings, required/optional per type)
- Note (text)
- Description (text)
- Save / Continue buttons

**Expense tab:**

- Same fields as income but uses expense categories
- Amount input line is red

**Transfer tab:**

- Date + time picker, Rep/Inst. button
- Amount + Fees field
- From account picker
- To account picker (with swap button)
- Contact picker (Tags: Who — if enabled)
- Location picker (Tags: Where — if enabled)
- Note
- Description
- Save / Continue buttons

#### 6.6.2 Category Picker Modal

- List of categories grouped by type (income/expense)
- Each row: icon + name
- Subcategories indented under parent
- Search/filter capability

#### 6.6.3 Account Picker Modal

- List of all accounts
- Each row: account name + balance

#### 6.6.4 Recurring Rule Form

- Frequency: Daily, Weekly, Monthly, Yearly
- Interval: every N periods
- Start date, End date (optional)
- Preview of next occurrences

---

## 7. Web Dashboard (React + Vite + Mantine UI)

### 7.1 Overview

The web dashboard is a full mirror of the mobile app. It connects directly to the Hono backend API. No local database — all data comes from the server.

**Tech stack:**

- React 19 + Vite
- Mantine UI v7 (component library)
- Tailwind CSS v4 (global customization, utility classes)
- TanStack Router (type-safe routing)
- TanStack Query (data fetching + caching)
- Recharts or Chart.js (charts)

### 7.2 Web File Structure

```bash
apps/web/
├── src/
│   ├── main.tsx                      # Entry point
│   ├── App.tsx                       # Root component, providers
│   ├── routes/
│   │   ├── login.tsx                 # Login page
│   │   ├── register.tsx              # Registration page
│   │   ├── dashboard/
│   │   │   ├── layout.tsx            # Sidebar + header shell
│   │   │   ├── transactions/
│   │   │   │   ├── daily.tsx         # Daily transaction list
│   │   │   │   ├── calendar.tsx      # Calendar view
│   │   │   │   ├── monthly.tsx       # Monthly summary
│   │   │   │   └── total.tsx         # All-time totals
│   │   │   ├── stats.tsx             # Stats + pie charts
│   │   │   ├── accounts/
│   │   │   │   ├── index.tsx         # Account list
│   │   │   │   └── [id].tsx          # Account detail + statement
│   │   │   └── settings/
│   │   │       ├── index.tsx         # General settings
│   │   │       ├── categories.tsx    # Category management
│   │   │       └── profile.tsx       # User profile
│   ├── components/
│   │   ├── transaction-table.tsx     # Transaction data table
│   │   ├── transaction-form.tsx      # Add/edit transaction modal
│   │   ├── account-card.tsx          # Account summary card
│   │   ├── category-badge.tsx        # Category with icon + color
│   │   ├── pie-chart.tsx             # Category breakdown chart
│   │   ├── line-chart.tsx            # Balance trend chart
│   │   ├── bar-chart.tsx             # Income vs expense chart
│   │   ├── calendar-grid.tsx         # Month calendar grid
│   │   ├── summary-cards.tsx         # Income/Expense/Total cards
│   │   └── period-selector.tsx       # Date range picker
│   ├── hooks/
│   │   ├── use-auth.ts              # Auth state + token management
│   │   ├── use-transactions.ts      # TanStack Query hooks
│   │   ├── use-accounts.ts          # TanStack Query hooks
│   │   ├── use-categories.ts        # TanStack Query hooks
│   │   ├── use-stats.ts             # TanStack Query hooks
│   │   └── use-settings.ts          # TanStack Query hooks
│   ├── lib/
│   │   ├── api.ts                   # Fetch wrapper with auth headers
│   │   └── query-client.ts          # TanStack Query client config
│   └── global.css                   # Tailwind CSS v4 + Mantine overrides
├── index.html
├── vite.config.ts
├── postcss.config.mjs
├── package.json
└── tsconfig.json
```

### 7.3 Web Dashboard Pages

The web dashboard maps 1:1 to mobile screens but uses a sidebar navigation instead of bottom tabs.

| Sidebar Item | Page                 | Mobile Equivalent    |
| ------------ | -------------------- | -------------------- |
| Transactions | Daily list (default) | Tab 1: Daily View    |
| Calendar     | Calendar grid        | Tab 1: Calendar View |
| Monthly      | Monthly summary      | Tab 1: Monthly View  |
| Statistics   | Pie charts + lists   | Tab 2: Stats         |
| Accounts     | Account list + cards | Tab 3: Accounts      |
| Settings     | Settings form        | Tab 4: More          |

**Additional web-specific features:**

- Data tables with sorting, filtering, and pagination (Mantine DataTable)
- Keyboard shortcuts for quick transaction entry
- Wider layout for charts — side-by-side pie charts for income + expense

---

## 8. Package Architecture

### 8.1 `packages/db`

Shared Drizzle schema used by both mobile and backend. Does NOT include a driver — each consumer provides its own.

```bash
packages/db/
├── src/
│   ├── schema/
│   │   ├── users.ts              # users + sessions tables
│   │   ├── accounts.ts           # accounts table
│   │   ├── categories.ts         # categories table
│   │   ├── contacts.ts           # contacts table (Tags)
│   │   ├── locations.ts          # locations table (Tags)
│   │   ├── transactions.ts       # transactions + transaction_contacts tables
│   │   ├── recurring-rules.ts    # recurring_rules table
│   │   ├── settings.ts           # settings table
│   │   ├── sync-log.ts           # sync_log table (server only)
│   │   └── index.ts              # Re-exports all schemas
│   └── index.ts                  # Package entry
├── drizzle.config.ts
├── package.json
└── tsconfig.json
```

### 8.2 `packages/shared`

Shared types, const arrays, Zod validation schemas, and pure utility functions used by all three apps (mobile, backend, web).

```bash
packages/shared/
├── src/
│   ├── types.ts                  # Inferred DB types + const arrays + derived types
│   ├── validation/
│   │   ├── transaction.ts        # Zod schemas for transaction create/update
│   │   ├── account.ts            # Zod schemas for account create/update
│   │   ├── category.ts           # Zod schemas for category create/update
│   │   ├── contact.ts            # Zod schemas for contact create/update (Tags)
│   │   ├── location.ts           # Zod schemas for location create/update (Tags)
│   │   ├── auth.ts               # Zod schemas for login/register
│   │   └── settings.ts           # Zod schemas for settings
│   ├── utils/
│   │   ├── format.ts             # Currency formatting, date formatting
│   │   ├── date-utils.ts         # Period calculations (weekly/monthly/yearly ranges)
│   │   ├── aggregation.ts        # Group transactions by category, compute percentages
│   │   └── recurring.ts          # Recurring transaction generation logic
│   ├── seed.ts                   # Default data definitions (categories, settings)
│   └── index.ts                  # Package entry
├── package.json
└── tsconfig.json
```

### 8.3 How Each App Uses the Packages

**Backend (`apps/backend`):**

```typescript
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "@shareef-money/db/schema";
import { transactionCreateSchema } from "@shareef-money/shared/validation";

const sqlite = new Database("./server.db");
const db = drizzle(sqlite, { schema });
```

**Mobile (`apps/mobile`):**

```typescript
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "@shareef-money/db/schema";
import { formatCurrency } from "@shareef-money/shared/utils";

const sqlite = openDatabaseSync("shareef-money.db");
const db = drizzle(sqlite, { schema });
```

**Web (`apps/web`):**

```typescript
import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@shareef-money/shared/types";
import { formatCurrency, groupByCategory } from "@shareef-money/shared/utils";
import { transactionCreateSchema } from "@shareef-money/shared/validation";
```

Same schema, same types, same validation, same utilities — different data access layers.

---

## 9. TypeScript Type Safety Strategy

### 9.1 Database Types (from Drizzle schema)

```typescript
import {
  transactions,
  accounts,
  categories,
  users,
} from "@shareef-money/db/schema";

type Transaction = typeof transactions.$inferSelect;
type NewTransaction = typeof transactions.$inferInsert;
type Account = typeof accounts.$inferSelect;
type NewAccount = typeof accounts.$inferInsert;
type Category = typeof categories.$inferSelect;
type NewCategory = typeof categories.$inferInsert;
type User = typeof users.$inferSelect;
```

### 9.2 Const Arrays + Derived Types (not enums)

All string unions are defined as const arrays so they can be used at runtime (Zod validation, form dropdowns, etc.) AND as types.

```typescript
// Transaction types
export const transactionTypes = ["income", "expense", "transfer"] as const;
export type TransactionType = (typeof transactionTypes)[number];

// Category types
export const categoryTypes = ["income", "expense"] as const;
export type CategoryType = (typeof categoryTypes)[number];

// Recurring frequency
export const frequencies = ["daily", "weekly", "monthly", "yearly"] as const;
export type Frequency = (typeof frequencies)[number];

// Stats period
export const statsPeriods = [
  "weekly",
  "monthly",
  "annually",
  "custom",
] as const;
export type StatsPeriod = (typeof statsPeriods)[number];

// Auth provider
export const authProviders = ["email", "google"] as const;
export type AuthProvider = (typeof authProviders)[number];

// Device type
export const deviceTypes = ["mobile", "web"] as const;
export type DeviceType = (typeof deviceTypes)[number];

// Days of week
export const weekDays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type WeekDay = (typeof weekDays)[number];

// Themes
export const themes = ["light", "dark", "system"] as const;
export type Theme = (typeof themes)[number];

// Start screens
export const startScreens = ["daily", "calendar"] as const;
export type StartScreen = (typeof startScreens)[number];

// Input order
export const inputOrders = ["amount", "category"] as const;
export type InputOrder = (typeof inputOrders)[number];

// Swipe actions
export const swipeActions = ["change_date", "change_tab"] as const;
export type SwipeAction = (typeof swipeActions)[number];
```

**Usage with Zod:**

```typescript
import { z } from "zod";
import { transactionTypes, frequencies } from "@shareef-money/shared/types";

const transactionCreateSchema = z.object({
  type: z.enum(transactionTypes),
  amount: z.number().int().positive(),
  // ...
});

const recurringRuleSchema = z.object({
  frequency: z.enum(frequencies),
  interval: z.number().int().min(1),
  // ...
});
```

### 9.3 Typed Navigation

- **Mobile:** Expo Router's `typedRoutes` experiment — route params inferred from file paths
- **Web:** TanStack Router — fully type-safe route definitions, params, search params, and loaders

### 9.4 Typed Settings

All string union fields reference types from the const arrays in 9.2 — no inline string literals.

```typescript
import type {
  WeekDay,
  Theme,
  StartScreen,
  InputOrder,
  SwipeAction,
} from "@shareef-money/shared/types";

interface AppSettings {
  currency_symbol: string;
  currency_code: string;
  start_screen: StartScreen;
  monthly_start_date: number;
  weekly_start_day: WeekDay;
  carry_over: boolean;
  passcode: string | null;
  passcode_enabled: boolean;
  alarm_enabled: boolean;
  alarm_time: string;
  show_description: boolean;
  autocomplete: boolean;
  input_order: InputOrder;
  subcategory_enabled: boolean;
  swipe_action: SwipeAction;
  theme: Theme;
}
```

### 9.5 Typed Hooks

**Mobile (local DB + sync):**

```typescript
function useTransactions(filters: TransactionFilters): {
  data: Transaction[];
  isLoading: boolean;
  refetch: () => void;
  isSyncing: boolean;
};
```

**Web (TanStack Query):**

```typescript
function useTransactions(
  filters: TransactionFilters,
): UseQueryResult<Transaction[]>;
```

---

## 10. Amounts & Currency

- All monetary values stored as **integers in the smallest unit** (paise for INR, cents for USD)
- Display formatting handled by `formatCurrency()` in `packages/shared/utils/format.ts` using the `currency_symbol` setting
- Example: ₹ 27,104.00 is stored as `2710400`
- This avoids all floating-point precision issues in calculations
- SQLite integers are 64-bit, and JS `Number.MAX_SAFE_INTEGER` is 9,007,199,254,740,991 — that's ₹ 90,07,19,92,54,74,099.91 — effectively unlimited for personal finance

---

## 11. Seed Data

On first user registration, the server seeds their data with:

1. **Default expense categories:** Food, Transport, Mobile, Family, Entertainment, Charity, Games, Flowers, My Self, Arshiya
2. **Default income categories:** Salary
3. **Default settings:** All values from the settings table
4. **Default account:** "Account" with zero balance

On mobile first login, the initial sync pulls all this data to the local database.
