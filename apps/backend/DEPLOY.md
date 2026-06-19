# Deploying the backend

The backend is a stateless Node (Hono) server backed by a **libSQL/Turso**
database. Because the database lives off the instance, the app can run on any
Node host — Render, Fly, a VM, a container, AWS — with no persistent disk.

## Environments (dev + prod)

An "environment" is just a set of env-var values — the code is identical. There
are only **two hosted databases**; the web and mobile apps are clients with no
database of their own (mobile keeps a local on-device `expo-sqlite` cache that
syncs from whichever backend it points at).

| | Prod | Dev / staging |
| --- | --- | --- |
| Turso DB | `shareef-money` | `shareef-money-dev` |
| Backend (Render) | service deploying `main` | service deploying `dev` |
| `WEB_URL` | prod web origin | dev web origin |
| `JWT_SECRET` | prod secret | a different dev secret |
| Web `VITE_API_URL` | prod backend URL | dev backend URL |
| Mobile `EXPO_PUBLIC_API_URL` | prod backend URL | dev backend URL |

Real users live on prod; dev is freely writable (seed/reset it anytime — see
"Seeding dev data"). The two Render services are configured identically except
for branch + the env vars above.

## Build & run (any platform)

```bash
pnpm install --frozen-lockfile   # installs deps (incl. devDeps for the build)
pnpm --filter backend build      # → dist/index.js, dist/migrate.js, dist/drizzle
pnpm --filter backend migrate    # apply migrations (node dist/migrate.js)
pnpm --filter backend start      # run the server (node dist/index.js)
```

`build` bundles the workspace packages (`@shareef-money/*`, which export raw
`.ts`) into `dist/` and copies the migration SQL alongside it, so `node
dist/index.js` runs without `tsx` or pnpm-workspace resolution at runtime.

## 1. Create the Turso databases (prod + dev)

```bash
# Install the CLI (https://docs.turso.tech) and sign up (free, no card)
turso db create shareef-money            # prod
turso db create shareef-money-dev        # dev

# For each, grab the URL + a token:
turso db show shareef-money --url        # → libsql://shareef-money-<org>.turso.io
turso db tokens create shareef-money
turso db show shareef-money-dev --url
turso db tokens create shareef-money-dev
```

Apply the schema to each (from your machine):

```bash
cd apps/backend
DATABASE_URL="libsql://…prod…turso.io" DATABASE_AUTH_TOKEN="…" pnpm db:migrate
DATABASE_URL="libsql://…dev…turso.io"  DATABASE_AUTH_TOKEN="…" pnpm db:migrate
```

## 2. Render (two Web Services)

Create the **prod** and **dev** services with the same settings below, changing
only the branch and the per-environment env vars.

| Field | Value |
| --- | --- |
| Branch | `main` (prod) · `dev` (dev) |
| Root Directory | _(blank — repo root, so pnpm can link the workspace)_ |
| Build Command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter backend build` |
| Start Command | `pnpm --filter backend migrate && pnpm --filter backend start` |
| Health Check Path | `/health` |
| Auto-Deploy | On Commit |

### Environment variables (per service)

| Key | Prod | Dev |
| --- | --- | --- |
| `DATABASE_URL` | prod Turso URL | dev Turso URL |
| `DATABASE_AUTH_TOKEN` | prod token | dev token |
| `JWT_SECRET` | prod secret (>= 32 chars) | a different dev secret |
| `WEB_URL` | prod web origin | dev web origin |
| `NODE_VERSION` | `24` | `24` |
| `NODE_ENV` | `production` | `production` |

Do **not** set `PORT` — Render injects it and the server reads it.

## 3. Point the clients at each backend

- **Web:** set `VITE_API_URL` per build — prod web → prod backend URL, dev web →
  dev backend URL (Vite reads `.env.production` / `.env.development`, or set it
  in the host's env). Locally, `apps/web/.env.local` already targets
  `http://localhost:3001`.
- **Mobile:** set `EXPO_PUBLIC_API_URL` per build profile — a dev build points at
  the dev backend, a prod build at the prod backend. Keep them as separate
  installs so each device's local `expo-sqlite` only ever syncs with one
  environment.

## Seeding dev data

The dev database is yours to fill/reset at will. `src/seed.ts` creates a demo
user (`demo@dev.local` / `demo12345`) and a month of sample transactions —
edit it to inject whatever you need:

```bash
cd apps/backend
# against the dev Turso DB
DATABASE_URL="libsql://…dev…turso.io" DATABASE_AUTH_TOKEN="…" NODE_ENV=development pnpm db:seed
```

It refuses to run when `NODE_ENV=production`, so it can't touch prod by mistake.
To wipe dev and start clean, drop + recreate it: `turso db destroy shareef-money-dev` then re-create + `pnpm db:migrate` + `pnpm db:seed`.

## Notes

- **Migrations on serverless** (Vercel/Lambda): don't run `migrate` on every
  invocation. Run `pnpm --filter backend migrate` once in your deploy/CI step;
  the long-lived-server start command above is fine for Render/Fly/containers.
- **Cross-site auth cookies:** the web app and API are on different origins, so
  the auth cookies must be `SameSite=None; Secure` for browsers to keep them.
  Verify the cookie attributes in `src/lib/cookies.ts` before going live.
