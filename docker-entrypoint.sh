#!/bin/sh
set -e

cd /app/backend

echo "Running schema migrations..."
npx drizzle-kit migrate

# One-time data import from an external Postgres. Guarded/idempotent: the script
# skips any table that already has rows, so leaving this set is safe.
# Non-fatal on failure: if Postgres is unreachable we warn and start anyway
# (empty tables mean the import simply retries on the next boot) rather than
# crash-looping the container on a connectivity/config error.
if [ -n "$MIGRATE_FROM_POSTGRES_URL" ]; then
  echo "Importing data from Postgres..."
  if node scripts/migrate-pg-to-sqlite.js; then
    echo "Import complete."
  else
    echo "WARNING: Postgres import failed (see error above)." >&2
    echo "         Starting with the current SQLite database. Fix connectivity and" >&2
    echo "         restart to retry, or unset MIGRATE_FROM_POSTGRES_URL." >&2
  fi
fi

echo "Seeding default fonts..."
node src/db/seed.js

echo "Starting services..."
exec "$@"
