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

Open [http://localhost:3000](http://localhost:3000). The container runs schema migrations, seeds default fonts, and starts automatically. Data is stored in an embedded SQLite database on the `dbdata` volume — there is no separate database service.

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

## Tech Stack

- **Frontend**: React 19, Vite 7, Tailwind CSS 4, shadcn
- **Backend**: Express 5, Drizzle ORM, SQLite (better-sqlite3), Puppeteer
- **Auth**: OIDC (any provider -- Authentik, Keycloak, etc.)
- **Infra**: Single-container Docker (Nginx + Node + Supervisor)
