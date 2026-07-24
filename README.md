# Invoice Manager

A self-hosted invoice management app with live preview, PDF export, custom fonts, and OIDC authentication.

## Screenshots

| Login | Invoice Dashboard |
|:---:|:---:|
| ![Login](docs/image/login.png) | ![Invoice Dashboard](docs/image/invoice_dashboard.png) |

| Invoice Editor | Font Management |
|:---:|:---:|
| ![Invoice Editor](docs/image/invoice_editor.png) | ![Font Management](docs/image/font_dashboard.png) |

## Quick Start

The same `docker-compose.yml` builds and runs the app for both local use and production:

```bash
git clone <repo-url> && cd invoice_manager
cp .env.example .env  # configure OIDC (leave blank for BYPASS_LOGIN local use)
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000). The container runs schema migrations, seeds default fonts, and starts automatically. State persists in local folders next to the compose file — `./data` (SQLite database), `./uploads` (signatures), `./fonts` (uploaded fonts). There is no separate database service.

### Environment Variables

Copy `.env.example` and configure as needed. Key variables:

| Variable | Description |
|---|---|
| `DATABASE_PATH` | SQLite file path in the container |
| `MIGRATE_FROM_POSTGRES_URL` | One-time Postgres import (see Migrating below) |
| `OIDC_DISCOVERY_URL` | OIDC provider discovery URL |
| `OIDC_CLIENT_ID` | OIDC client ID |
| `OIDC_CLIENT_SECRET` | OIDC client secret |
| `OIDC_REDIRECT_URI` | OAuth callback URL (optional, auto-detected) |
| `BYPASS_LOGIN` | Set `true` to skip OIDC (dev only) |

See `.env.example` for the full list.

## Development

The Docker workflow is build-only (no hot reload). For live-reload coding, run the frontend and backend natively:

```bash
# Backend (port 3000) — SQLite file is created automatically
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev

# Frontend (port 5173) — proxies /api to the backend
cd frontend
npm install
npm run dev
```

### Tests

```bash
cd backend
npm test                 # SQLite persistence tests (no external services)

# Data-migration test needs a throwaway Postgres:
docker compose -f docker-compose.migration_test.yml up -d
npm run test:migration
```

## Migrating existing Postgres data to SQLite

To move data from a previous Postgres deployment, point the container at it once:

```bash
MIGRATE_FROM_POSTGRES_URL=postgresql://user:pass@old-host:5432/invoice_manager \
  docker compose up -d --build
```

The import is guarded (skips tables that already have rows), so it is safe to leave set — but remove it after the first successful boot. The old Postgres is read-only during import and remains a rollback.

## Migrating from Docker volumes to local folders

Earlier versions stored state in Docker named volumes (`dbdata`, `uploads`, `fonts`). To move that data into the local `./data`, `./uploads`, and `./fonts` folders used now:

```bash
# 1. Stop the app (keep the volumes)
docker compose down

# 2. Copy each named volume's contents into the matching local folder.
#    Replace the "invoice_manager_" prefix if your compose project name differs
#    (check with: docker volume ls | grep -E 'dbdata|uploads|fonts').
for v in dbdata:data uploads:uploads fonts:fonts; do
  vol="invoice_manager_${v%%:*}"; dir="${v##*:}"
  mkdir -p "$dir"
  docker run --rm -v "$vol":/from -v "$PWD/$dir":/to alpine sh -c 'cp -a /from/. /to/'
done

# 3. Start again — now backed by the local folders
docker compose up -d

# 4. Once verified, remove the old volumes
docker volume rm invoice_manager_dbdata invoice_manager_uploads invoice_manager_fonts
```

Stop the app before copying so the SQLite WAL is checkpointed and the copy is consistent.

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS 4, shadcn
- **Backend**: Express 5, Drizzle ORM, SQLite (better-sqlite3), Puppeteer
- **Auth**: OIDC (any provider -- Authentik, Keycloak, etc.)
- **Infra**: Single-container Docker (Nginx + Node + Supervisor)
