#!/bin/sh
set -e

cd /app/backend

echo "Running schema migrations..."
npx drizzle-kit migrate

# One-time data import from an external Postgres. Guarded/idempotent: the script
# skips any table that already has rows, so leaving this set is safe.
if [ -n "$MIGRATE_FROM_POSTGRES_URL" ]; then
  echo "Importing data from Postgres..."
  node scripts/migrate-pg-to-sqlite.js
fi

echo "Seeding default fonts..."
node src/db/seed.js

echo "Starting services..."
exec "$@"
