## ADDED Requirements

### Requirement: One-time guarded data import from Postgres
The system SHALL provide a migration script that reads all rows from an existing Postgres database (given by `MIGRATE_FROM_POSTGRES_URL`) and writes them into the SQLite database. The container entrypoint SHALL invoke this import only when `MIGRATE_FROM_POSTGRES_URL` is set, after the schema migration has created the tables.

#### Scenario: Import runs on cutover
- **WHEN** the container starts with `MIGRATE_FROM_POSTGRES_URL` pointing at a populated Postgres
- **THEN** the schema migration runs first, then the import copies all rows into SQLite, then the app starts

#### Scenario: Import skipped by default
- **WHEN** the container starts without `MIGRATE_FROM_POSTGRES_URL`
- **THEN** no Postgres connection is attempted and only schema migration and font seeding run

### Requirement: Import is idempotent and guarded
The migration script SHALL skip importing into any table that already contains rows, so that re-running `up` with the variable still set does not duplicate data.

#### Scenario: Re-run does not duplicate
- **WHEN** the import runs a second time against a SQLite database that already holds imported rows
- **THEN** it detects existing data and skips the copy, leaving row counts unchanged

### Requirement: Import preserves data fidelity
The import SHALL copy rows in foreign-key-safe order and transform types so that JSON data round-trips as objects, timestamps and dates are preserved, numeric totals remain numerically ordered, and all foreign key relationships remain intact.

#### Scenario: Row counts match
- **WHEN** the import completes
- **THEN** each SQLite table has the same row count as its Postgres source table

#### Scenario: Relationships intact after import
- **WHEN** an imported user is deleted from SQLite
- **THEN** the user's imported invoices and snapshots cascade-delete, proving foreign keys were imported correctly

### Requirement: Automated test harness validates the migration
The migration SHALL be covered by a `node:test` suite that seeds a throwaway Postgres (via `docker-compose.migration_test.yml`) with edge-case rows — including null font references, unicode client names, and decimal totals — runs the script, and asserts row counts, JSON round-trip, foreign-key cascade, and numeric ordering.

#### Scenario: Test suite passes against a real Postgres
- **WHEN** the migration test suite is run with the throwaway Postgres available
- **THEN** all assertions pass, confirming the script correctly migrates edge-case data
