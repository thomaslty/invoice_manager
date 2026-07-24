## Context

The backend is a layered Express 5 + Drizzle app storing invoices, templates, snapshots, users, sessions, and fonts in PostgreSQL 18. Postgres runs as a separate container service with a healthcheck and data volume. The `json_data` payload uses `jsonb`; extracted columns (`ref_no`, `client_name`, `date`, `total_amount`) support search/sort. There is a running production Postgres with real data that must survive the move. Development and production ship as one image (nginx + node + Chromium/Puppeteer via supervisord), currently split across `docker-compose.dev.yml` (Vite hot reload) and `docker-compose.yml` (GHCR image).

## Goals / Non-Goals

**Goals:**
- Replace the Postgres service with embedded SQLite (`better-sqlite3`), keeping relational integrity.
- Explicitly enable SQLite's backward-compat-disabled features that this app depends on.
- One build-only `docker-compose.yml` for both local and production; no profiles, no hot reload, no Postgres.
- Migrate existing production Postgres data into SQLite exactly once, automatically, during `docker compose up`.
- Prove the data migration with an automated test before trusting it on real data.

**Non-Goals:**
- STRICT tables / column-level type enforcement (app-layer validation already covers it; Drizzle can't emit STRICT cleanly).
- Preserving the ability to run Postgres and SQLite side by side.
- Keeping hot reload inside Docker (non-Docker `npm run dev` remains for that).
- Unicode-aware case-insensitive search (SQLite `LIKE` is ASCII-case-insensitive; acceptable).

## Decisions

### Driver: better-sqlite3
Synchronous, single-connection, battle-tested Drizzle default. Native module but ships prebuilds; the image already carries Chromium, so a small native dep is negligible. Single connection means pragmas are set once at startup — simpler than a Postgres pool. Alternatives: `node:sqlite` (zero-dep but still experimental in Node, weaker drizzle-kit tooling) and `libsql` (remote/replica features we don't need).

### Modern pragmas set at connection open
`foreign_keys=ON` (per-connection, else the schema's cascade/set-null actions silently no-op), `journal_mode=WAL` (concurrent reads during writes; persists in file header), `busy_timeout=5000` (wait instead of throwing SQLITE_BUSY), `synchronous=NORMAL` (safe and faster under WAL). Set via `sqlite.pragma(...)` before handing the connection to Drizzle.

### Schema type mapping
`serial`→`integer(...).primaryKey({ autoIncrement: true })`, `jsonb`→`text(..., { mode: 'json' })` (mandatory — node-postgres auto-parsed JSON; SQLite returns a string otherwise and `jsonData.sections` breaks), `timestamp().defaultNow()`→`integer(..., { mode: 'timestamp' }).default(sql\`(unixepoch())\`)`, `date`→`text`, `numeric`→`numeric` (NUMERIC affinity keeps ordering numeric), `varchar(n)`→`text`. Length limits drop (SQLite ignores them); app-layer validation remains the guard.

### One compose file, single production build
No profiles (user constraint). One `app` service with `build.target: production`, `ports: ["3000:80"]`, env for `DATABASE_PATH` + OIDC, and volumes `dbdata`, `uploads`, `fonts`. The Dockerfile `dev` stage and `supervisord.dev.conf` are deleted. `dbdata` mounts the **directory** `/app/backend/data`, not the file, so WAL sidecars (`-wal`, `-shm`) live on the volume.

### Two migrations, clearly separated
Schema migration (`drizzle-kit migrate`) runs every `up` and is idempotent. Data migration (Postgres→SQLite) is a one-time cutover, gated on `MIGRATE_FROM_POSTGRES_URL`. The entrypoint runs: schema migrate → (if var set) data import → seed fonts → exec supervisord. Postgres is reached by URL only; it is never a service in `docker-compose.yml`. Alternative rejected: putting Postgres in the compose file and auto-importing every boot — that re-runs a one-time job and permanently reintroduces the dependency we are removing.

### Data migration script and its test
`scripts/migrate-pg-to-sqlite.js` reads Postgres with `pg` (raw SELECTs, no drizzle pg schema needed) and writes SQLite via the drizzle sqlite `db`, in FK-safe order: users → fonts → templates → invoices → invoice_snapshots → sessions. It is guarded: any target table that already has rows is skipped. `pg` moves to devDependencies since only this script and its test use it. The `node:test` suite uses `docker-compose.migration_test.yml` (throwaway Postgres) as the source, applies the preserved old PG migration SQL as a fixture to build the source schema, seeds edge-case rows, runs the script, and asserts.

### Existing PG migrations preserved as a fixture
The three Postgres `.sql` files can't stay in `backend/drizzle/` (dialect changes to sqlite; migrations regenerate as one baseline). They move to a test fixture so the migration test can rebuild a realistic source Postgres.

## Risks / Trade-offs

- [WAL sidecar files lost if the file, not the dir, is mounted] → Mount the `data` directory as the named volume.
- [`foreign_keys` resets per connection] → better-sqlite3 uses one connection; pragma set once at open covers all queries.
- [`total_amount` stored as text would sort lexicographically] → Keep NUMERIC affinity via drizzle `numeric`; assert numeric ordering in tests.
- [Native `better-sqlite3` build in the slim image] → prebuilt binaries cover node:22-slim/Debian; `npm ci` runs in the build stage where toolchain is available if a source build is needed.
- [Data import run twice duplicates rows] → Guard on existing row counts; idempotent skip.
- [Losing production data during cutover] → Import is additive into a fresh SQLite; the Postgres source is untouched and remains the rollback.
- [Regenerated migrations diverge from the live PG schema] → The migration test builds the source PG from the preserved PG SQL, catching schema drift.

## Migration Plan

1. Land the code + single compose + migration script with the test suite green.
2. Cutover (production, one time): bring up the new stack with `MIGRATE_FROM_POSTGRES_URL` pointing at the live Postgres; verify data in the app; then remove the variable.
3. Decommission the production Postgres container once verified.
4. Rollback: if the import looks wrong, stop the SQLite stack and restart the old Postgres stack (its data was never mutated).

## Open Questions

- None blocking. Font seeding at startup is adopted (idempotent) so fresh installs aren't fontless.
