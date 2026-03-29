#!/bin/sh
set -e

echo "Running database migrations..."
cd /app/backend
npx drizzle-kit migrate

echo "Starting services..."
exec "$@"
