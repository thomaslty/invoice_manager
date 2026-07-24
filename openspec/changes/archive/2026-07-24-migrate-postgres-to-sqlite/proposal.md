## Why

Postgres is a heavyweight dependency for a single-user, single-container personal app: it needs a separate service, a healthcheck, a data volume, and a running server just to store a handful of invoices. Embedded SQLite (`better-sqlite3`) removes the entire database service while keeping relational integrity — provided SQLite's backward-compatibility defaults (foreign keys, concurrency) are explicitly re-enabled.

## What Changes

- **BREAKING**: Backend persistence moves from PostgreSQL (`pg` + `node-postgres`) to embedded SQLite via `better-sqlite3`. Drizzle dialect changes from `postgresql` to `sqlite`.
- Drizzle schema rewritten to `sqlite-core` types: `serial`→autoincrement `integer`, `jsonb`→`text({ mode: 'json' })`, `timestamp`→`integer({ mode: 'timestamp' })`, `date`→`text`, `numeric` kept (NUMERIC affinity), `varchar`→`text`.
- SQLite connection opens with four modern pragmas: `foreign_keys=ON`, `journal_mode=WAL`, `busy_timeout=5000`, `synchronous=NORMAL`.
- `ilike` search replaced with `like`; health-check query replaced with a SQLite-compatible call.
- Existing Postgres migration files regenerated as a single SQLite baseline; the old Postgres SQL is preserved as a test fixture.
- **BREAKING**: `docker-compose.dev.yml` removed. A single build-only `docker-compose.yml` serves both local and production — one service, `production` build target, no profiles, no hot reload, no Postgres service.
- Dockerfile `dev` stage and `supervisord.dev.conf` removed.
- `DATABASE_URL` replaced with `DATABASE_PATH` (SQLite file on a `dbdata` volume mounting the directory, not the file, for WAL sidecars).
- Container entrypoint auto-runs schema migration on every `up`, seeds default fonts, and runs a **guarded one-time** data import when `MIGRATE_FROM_POSTGRES_URL` is set.
- New `scripts/migrate-pg-to-sqlite.js` data-migration script, covered by a `node:test` suite that seeds a throwaway Postgres (`docker-compose.migration_test.yml`) and asserts row counts, JSON round-trip, FK cascade, and numeric ordering.
- `pg` demoted from runtime dependency to devDependency (used only by the migration script and its test).

## Capabilities

### New Capabilities
- `sqlite-persistence`: SQLite as the backend datastore via better-sqlite3, including the modern-pragma connection contract and the sqlite-core schema mapping.
- `postgres-data-migration`: one-time, guarded, idempotent import of existing Postgres data into SQLite, with an automated test harness.

### Modified Capabilities
- `single-container-build`: collapses to a single build-only compose file with no Postgres service, no dev compose, no hot reload; entrypoint gains conditional data import and font seeding.

## Impact

- **Code**: `backend/src/db/{index,schema,seed}.js`, `backend/src/services/invoiceService.js`, `backend/src/routes/index.js`, `backend/drizzle.config.js`, `backend/drizzle/*`, new `backend/scripts/` and `backend/test/`.
- **Dependencies**: add `better-sqlite3`; move `pg` to devDependencies.
- **Infra**: `docker-compose.yml`, delete `docker-compose.dev.yml`, new `docker-compose.migration_test.yml`, `Dockerfile`, `docker-entrypoint.sh`, delete `supervisord.dev.conf`.
- **Docs/config**: `.env.example`, `backend/.env.example`, `README.md`, `CLAUDE.md`.
- **Data**: production Postgres data migrated once via cutover; local/fresh installs start empty.
