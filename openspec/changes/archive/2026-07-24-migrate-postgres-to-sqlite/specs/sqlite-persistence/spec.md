## ADDED Requirements

### Requirement: SQLite is the backend datastore
The backend SHALL use embedded SQLite via the `better-sqlite3` driver as its sole datastore. Drizzle SHALL be configured with dialect `sqlite`. The database file location SHALL be read from the `DATABASE_PATH` environment variable; the `pg`/`node-postgres` runtime dependency and `DATABASE_URL` SHALL be removed from the running application.

#### Scenario: Application connects to SQLite
- **WHEN** the backend starts with `DATABASE_PATH` set to a writable file path
- **THEN** it opens that SQLite database via better-sqlite3 and serves all queries from it, with no Postgres connection attempted

#### Scenario: No Postgres runtime dependency
- **WHEN** the production image is built
- **THEN** `pg` is absent from runtime dependencies and only `better-sqlite3` is used for data access

### Requirement: Connection enables modern SQLite pragmas
On opening the database connection, the backend SHALL set `foreign_keys=ON`, `journal_mode=WAL`, `busy_timeout=5000`, and `synchronous=NORMAL` before serving queries.

#### Scenario: Pragmas are active
- **WHEN** the connection is established
- **THEN** `PRAGMA foreign_keys` returns 1, `PRAGMA journal_mode` returns `wal`, and `PRAGMA busy_timeout` returns 5000

### Requirement: Foreign key delete policies are enforced
The schema SHALL preserve the existing referential actions (ON DELETE CASCADE for sessions, templates, invoices, and snapshots; ON DELETE SET NULL for font references) and these SHALL be enforced at runtime.

#### Scenario: Cascade delete removes dependents
- **WHEN** a user row is deleted
- **THEN** that user's sessions, templates, invoices, and invoice snapshots are also deleted

#### Scenario: Set-null on font delete
- **WHEN** a referenced font is deleted
- **THEN** rows referencing it have their `font_id` set to NULL rather than being deleted

### Requirement: Schema mapping preserves JSON and numeric behavior
The sqlite-core schema SHALL store `json_data` as `text` in JSON mode so reads return parsed objects, and SHALL store `total_amount` with NUMERIC affinity so ordering is numeric rather than lexicographic.

#### Scenario: JSON round-trips as an object
- **WHEN** an invoice with a nested `sections` object is saved and re-read
- **THEN** `jsonData.sections` is a JavaScript object, not a string

#### Scenario: Total amount orders numerically
- **WHEN** invoices with totals 9, 100, and 20 are sorted by `total_amount` ascending
- **THEN** the order is 9, 20, 100

### Requirement: Case-insensitive invoice search
Invoice search over `ref_no` and `client_name` SHALL be case-insensitive using SQLite `LIKE`, replacing the Postgres-only `ilike`.

#### Scenario: Search ignores case
- **WHEN** the user searches `acme` against an invoice with client name `ACME Corp`
- **THEN** the invoice is returned
