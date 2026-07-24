## 1. Dependencies & config

- [x] 1.1 Add `better-sqlite3` to backend dependencies; move `pg` to devDependencies
- [x] 1.2 Change `drizzle.config.js` dialect to `sqlite` and use `DATABASE_PATH` credentials
- [x] 1.3 Preserve the three existing Postgres migration `.sql` files as a test fixture, then clear `backend/drizzle/` (sql + meta) for regeneration

## 2. Schema & DB layer

- [x] 2.1 Rewrite `src/db/schema.js` to sqlite-core types (integer autoinc, text json mode, integer timestamp, text date, numeric, text) preserving all FK onDelete actions
- [x] 2.2 Rewrite `src/db/index.js` to open better-sqlite3 with pragmas foreign_keys/journal_mode(WAL)/busy_timeout/synchronous, then wrap with drizzle
- [x] 2.3 Replace `ilike` with `like` in `src/services/invoiceService.js`
- [x] 2.4 Replace the Postgres health-check query in `src/routes/index.js` with a SQLite-compatible call
- [x] 2.5 Regenerate the SQLite baseline migration with `drizzle-kit generate`

## 3. Data migration script (TDD)

- [x] 3.1 Write `node:test` in `backend/test/` that seeds a throwaway Postgres (docker-compose.migration_test.yml) with edge-case rows and asserts the import (counts, JSON round-trip, FK cascade, numeric order, idempotent re-run)
- [x] 3.2 Add `docker-compose.migration_test.yml` (throwaway Postgres only)
- [x] 3.3 Implement `scripts/migrate-pg-to-sqlite.js`: read PG via `pg`, write SQLite via drizzle in FK-safe order, guard-skip non-empty tables
- [x] 3.4 Run the test suite to green; add an `npm run test:migration` script

## 4. Docker & compose

- [x] 4.1 Remove the Dockerfile `dev` stage; keep `frontend-build`, `base`, `production` (+ toolchain to source-build better-sqlite3)
- [x] 4.2 Delete `docker-compose.dev.yml` and `supervisord.dev.conf`
- [x] 4.3 Rewrite `docker-compose.yml` to one build-only service (production target, 3000:80, dbdata/uploads/fonts volumes, DATABASE_PATH + OIDC env), no Postgres, no profiles
- [x] 4.4 Update `docker-entrypoint.sh`: schema migrate → conditional data import when `MIGRATE_FROM_POSTGRES_URL` set → seed fonts → exec

## 5. Docs & config

- [x] 5.1 Update `.env.example` and `backend/.env.example` (DATABASE_PATH, MIGRATE_FROM_POSTGRES_URL, drop DATABASE_URL)
- [x] 5.2 Update `README.md` and `CLAUDE.md` dev commands and remove Postgres references

## 6. Full verification

- [x] 6.1 Run the `node:test` migration suite green against the throwaway Postgres (12/12 backend tests pass)
- [x] 6.2 Build and boot the stack via `docker compose up --build`; confirm schema migrate + seed run and the app serves
- [x] 6.3 Run the e2e Playwright suite against the running app (26/26 pass)
- [x] 6.4 Visually confirm: create/list/search an invoice and download a PDF in the running app; capture screenshot evidence
- [x] 6.5 Verify cutover path: boot with `MIGRATE_FROM_POSTGRES_URL` against the test Postgres and confirm imported data appears
