## MODIFIED Requirements

### Requirement: Database migrations run on container startup
The system SHALL run `npx drizzle-kit migrate` in the backend directory before starting application processes. After schema migration it SHALL seed default fonts (idempotently) and, only when `MIGRATE_FROM_POSTGRES_URL` is set, run the one-time Postgres→SQLite data import.

#### Scenario: Migrations execute before app starts
- **WHEN** the container starts
- **THEN** schema migrations run to completion before supervisord launches nginx/node

#### Scenario: Fonts seeded on startup
- **WHEN** the container starts against a fresh SQLite database
- **THEN** default fonts are seeded so the app is usable immediately

#### Scenario: Conditional data import
- **WHEN** the container starts with `MIGRATE_FROM_POSTGRES_URL` set
- **THEN** the data import runs after schema migration and before the app starts

### Requirement: Only the frontend port is exposed
The system SHALL expose only port 80 (nginx) from the container, mapped to host port 3000. The backend port 3000 inside the container SHALL remain internal and not be reachable from the host.

#### Scenario: Only nginx port is exposed
- **WHEN** the container is running
- **THEN** only host port 3000 (mapped to container port 80) is accessible; the container's internal backend port is not reachable from outside

### Requirement: Single-service build-only Docker Compose configuration
The repository SHALL provide exactly one `docker-compose.yml` that defines a single service built locally from the repo `Dockerfile` `production` target. It SHALL NOT reference a prebuilt GHCR image, SHALL NOT define a Postgres service, and SHALL NOT use compose profiles. The SQLite database SHALL persist on a named volume mounting the database directory (not the file), alongside the uploads and fonts volumes.

#### Scenario: Compose has a single service
- **WHEN** `docker compose config --services` is run
- **THEN** exactly one service is listed and it has a `build` section targeting `production`

#### Scenario: No Postgres service
- **WHEN** `docker compose config --services` is run
- **THEN** no `postgres` service is present

#### Scenario: Same file serves local and production
- **WHEN** `docker compose up --build` is run locally or in production
- **THEN** the same single service builds and runs with no hot reload and no separate dev configuration

## REMOVED Requirements

### Requirement: Development container supports hot reload
**Reason**: Dev now equals prod — the compose story is build-only with no hot reload, so the separate dev container and `docker-compose.dev.yml` are removed.
**Migration**: For a full container run use `docker compose up --build`. For live-reload local coding, run `cd frontend && npm run dev` and `cd backend && npm run dev` directly on the host (Vite proxies `/api` to the backend), outside Docker.

### Requirement: Docker compose reduces to two services
**Reason**: SQLite replaces the Postgres service, so the compose file collapses from two services to a single build-only service.
**Migration**: Replaced by the "Single-service build-only Docker Compose configuration" requirement.

### Requirement: Production Docker Compose configuration
**Reason**: The single compose file now builds locally from the `production` target rather than pulling a prebuilt image, per the all-build requirement.
**Migration**: Replaced by the "Single-service build-only Docker Compose configuration" requirement; GHCR images remain published by CI but are no longer referenced by the compose file.
