## ADDED Requirements

### Requirement: Combined Docker image builds and runs both frontend and backend
The system SHALL provide a single Dockerfile at the repo root that produces an `invoice_manager` image containing nginx, node/Express, and Chromium/Puppeteer. The frontend SHALL be built in a multi-stage step and served as static files by nginx. The backend SHALL run as a node process managed by supervisord alongside nginx.

#### Scenario: Production image build succeeds
- **WHEN** `docker compose -f docker-compose.yml build` is run
- **THEN** a single `invoice_manager` image is built containing nginx, node, chromium, supervisord, the compiled frontend dist, and the backend application code

#### Scenario: Production container starts and serves the app
- **WHEN** `docker compose -f docker-compose.yml up -d` is run
- **THEN** the container runs database migrations, starts supervisord which launches nginx on port 80 and node on port 3000 internally, and the app is accessible on the mapped host port (3001)

#### Scenario: Frontend static files served by nginx
- **WHEN** a browser requests `/` or any frontend route on the exposed port
- **THEN** nginx serves the pre-built static files from the dist directory and returns the SPA HTML

#### Scenario: API requests proxied to backend
- **WHEN** a browser requests `/api/*`, `/uploads/*`, or `/fonts/*`
- **THEN** nginx proxies the request to `127.0.0.1:3000` where the Express backend handles it

### Requirement: Development container supports hot reload
The system SHALL provide a dev docker-compose configuration that runs vite dev server and nodemon inside a single container with bind-mounted source directories for live reloading.

#### Scenario: Dev container starts with hot reload
- **WHEN** `docker compose -f docker-compose.dev.yml up -d --build` is run
- **THEN** the container starts supervisord managing vite (port 5173) and nodemon (port 3000), with frontend and backend source bind-mounted for live editing

#### Scenario: Frontend changes trigger HMR in dev
- **WHEN** a file in `frontend/src/` is modified on the host
- **THEN** vite detects the change via the bind-mount and pushes an HMR update to the browser

#### Scenario: Backend changes trigger restart in dev
- **WHEN** a file in `backend/src/` is modified on the host
- **THEN** nodemon detects the change via the bind-mount and restarts the Express server

### Requirement: Only the frontend port is exposed
The system SHALL only expose port 80 (nginx) from the container in production. The backend port 3000 SHALL remain internal to the container. In dev, only port 5173 (vite) SHALL be exposed.

#### Scenario: Production exposes only nginx port
- **WHEN** the production docker-compose is running
- **THEN** only port 3001 (mapped to container port 80) is accessible from the host; port 3000 is not reachable from outside the container

#### Scenario: Dev exposes only vite port
- **WHEN** the dev docker-compose is running
- **THEN** only port 5173 is accessible from the host for frontend access; port 3000 is not exposed to the host

### Requirement: Database migrations run on container startup
The system SHALL run `npx drizzle-kit migrate` in the backend directory before starting application processes, preserving the existing migration-on-startup behavior.

#### Scenario: Migrations execute before app starts
- **WHEN** the container starts (prod or dev)
- **THEN** database migrations run to completion before supervisord launches nginx/node (or vite/nodemon in dev)

### Requirement: Production Docker Compose configuration
The production `docker-compose.yml` SHALL reference the GHCR-hosted image instead of a locally-built image.

#### Scenario: Image pulled from GHCR
- **WHEN** `docker compose up` is run in production
- **THEN** Docker SHALL pull `ghcr.io/thomaslty/invoice_manager:latest` from GHCR

### Requirement: Docker compose reduces to two services
The production and dev docker-compose files SHALL define exactly two services: `postgres` and `invoice_manager`. The separate `backend` and `frontend` services SHALL be removed.

#### Scenario: Production compose has two services
- **WHEN** `docker compose -f docker-compose.yml config --services` is run
- **THEN** exactly two services are listed: `postgres` and `invoice_manager`

#### Scenario: Dev compose has two services
- **WHEN** `docker compose -f docker-compose.dev.yml config --services` is run
- **THEN** exactly two services are listed: `postgres` and `invoice_manager`
