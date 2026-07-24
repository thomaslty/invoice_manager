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

```bash
git clone <repo-url> && cd invoice_manager
cp .env.example .env   # configure OIDC, or leave blank and set BYPASS_LOGIN=true for local use
docker compose up -d --build
```

Open [http://localhost:3000](http://localhost:3000). The container runs schema migrations, seeds default fonts, and starts automatically — there is no separate database service.

State persists in local folders next to the compose file: `./data` (SQLite database), `./uploads` (signatures), `./fonts` (uploaded fonts).

To run a pinned release instead of building locally, replace the service's `build:` block with a pre-built image:

```yaml
    image: ghcr.io/thomaslty/invoice_manager:v0.3.2
```

### Environment Variables

Copy `.env.example` and configure as needed. Common variables:

| Variable | Description |
|---|---|
| `OIDC_DISCOVERY_URL` | OIDC provider discovery URL |
| `OIDC_CLIENT_ID` | OIDC client ID |
| `OIDC_CLIENT_SECRET` | OIDC client secret |
| `OIDC_REDIRECT_URI` | OAuth callback URL (optional, auto-detected) |
| `BYPASS_LOGIN` | `true` skips OIDC, auto-logs in as admin (dev only) |
| `MIGRATE_FROM_POSTGRES_URL` | One-time Postgres import (see below) |

`DATABASE_PATH` is an optional override; by default the DB lives at `data/invoice.db` inside the container, on the `./data` mount. See `.env.example` for the full list.

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

A one-time import copies data from an old Postgres deployment into SQLite. Set `MIGRATE_FROM_POSTGRES_URL` and boot once — the entrypoint runs the import before starting the app. It is **guarded** (skips tables that already contain rows) and **non-fatal** (if Postgres is unreachable it warns and starts on SQLite), so it's safe to leave set; remove it after the first successful import. Your old Postgres is only read, never modified.

The URL must be reachable **from inside the container**. Note: `postgres` as a hostname only resolves if a service by that name is on the same compose network — use the actual host otherwise.

### Case A — old Postgres is running on a reachable host

```bash
MIGRATE_FROM_POSTGRES_URL=postgresql://user:pass@HOST:5432/invoice_manager \
  docker compose up -d
```

Use the machine's LAN IP, or `host.docker.internal` if Postgres runs on the Docker host.

### Case B — old data only exists as a Docker volume

Run Postgres alongside the app on one network just for the cutover. Find the old volume:

```bash
docker volume ls | grep -iE 'pg|postgres'
```

Create `docker-compose.cutover.yml` (fill in the volume name):

```yaml
services:
  postgres:
    image: postgres:18
    environment:
      POSTGRES_USER: invoice_user
      POSTGRES_PASSWORD: invoice_pass
      POSTGRES_DB: invoice_manager
    volumes:
      - oldpg:/var/lib/postgresql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U invoice_user -d invoice_manager"]
      interval: 5s
      timeout: 3s
      retries: 5

  app:
    image: ghcr.io/thomaslty/invoice_manager:v0.3.2
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "3000:80"
    environment:
      MIGRATE_FROM_POSTGRES_URL: postgresql://invoice_user:invoice_pass@postgres:5432/invoice_manager
    env_file: .env
    volumes:
      - ./data:/app/backend/data
      - ./uploads:/app/backend/uploads
      - ./fonts:/app/backend/fonts

volumes:
  oldpg:
    external: true
    name: YOUR_OLD_PG_VOLUME
```

```bash
docker compose -f docker-compose.cutover.yml up -d       # imports once, waits for Postgres
docker compose -f docker-compose.cutover.yml logs -f app # watch for "Import complete"
docker compose -f docker-compose.cutover.yml down        # stop the cutover stack
docker compose up -d                                     # back to the SQLite-only compose
```

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
