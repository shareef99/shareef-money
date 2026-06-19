# Deploying the backend

The backend is a stateless Node (Hono) server backed by a **libSQL/Turso**
database. Because the database lives off the instance, the app can run on any
Node host — Render, Fly, a VM, a container, AWS — with no persistent disk.

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

## 1. Create the Turso database

```bash
# Install the CLI (https://docs.turso.tech) and sign up (free, no card)
turso db create shareef-money
turso db show shareef-money --url        # → libsql://shareef-money-<org>.turso.io
turso db tokens create shareef-money     # → the auth token
```

Apply the schema to it once (from your machine):

```bash
cd apps/backend
DATABASE_URL="libsql://…turso.io" DATABASE_AUTH_TOKEN="…" pnpm db:migrate
```

## 2. Render (Web Service)

| Field | Value |
| --- | --- |
| Root Directory | _(blank — repo root, so pnpm can link the workspace)_ |
| Build Command | `corepack enable && pnpm install --frozen-lockfile && pnpm --filter backend build` |
| Start Command | `pnpm --filter backend migrate && pnpm --filter backend start` |
| Health Check Path | `/health` |
| Auto-Deploy | On Commit |

### Environment variables

| Key | Value |
| --- | --- |
| `DATABASE_URL` | `libsql://…turso.io` |
| `DATABASE_AUTH_TOKEN` | the Turso token |
| `JWT_SECRET` | a long random string (>= 32 chars) |
| `WEB_URL` | the deployed web app origin (drives CORS) |
| `NODE_VERSION` | `24` |
| `NODE_ENV` | `production` |

Do **not** set `PORT` — Render injects it and the server reads it.

## Notes

- **Migrations on serverless** (Vercel/Lambda): don't run `migrate` on every
  invocation. Run `pnpm --filter backend migrate` once in your deploy/CI step;
  the long-lived-server start command above is fine for Render/Fly/containers.
- **Cross-site auth cookies:** the web app and API are on different origins, so
  the auth cookies must be `SameSite=None; Secure` for browsers to keep them.
  Verify the cookie attributes in `src/lib/cookies.ts` before going live.
