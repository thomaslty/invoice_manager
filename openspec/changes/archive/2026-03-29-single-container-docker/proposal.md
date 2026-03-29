## Why

The current Docker setup runs frontend (nginx) and backend (node/Express) as separate containers. Since the backend is never exposed publicly — nginx always sits in front — there's no need for the overhead of separate containers and inter-container networking. Combining them into a single `invoice_manager` container simplifies deployment, reduces the service count in docker-compose from 3 to 2, and eliminates Docker network hops between frontend proxy and backend.

## What Changes

- **New root Dockerfile**: Multi-stage build that compiles the frontend and packages it alongside the backend (node + nginx + chromium/puppeteer) into one image
- **Supervisord process management**: nginx and node run as managed processes within the single container
- **Simplified docker-compose.yml**: Only `postgres` + `invoice_manager` services; port 3001:80 exposed on the app container
- **Simplified docker-compose.dev.yml**: Single `invoice_manager` dev container running vite + nodemon via supervisord, with bind-mounts for hot reload
- **nginx proxy target change**: `proxy_pass` switches from `http://backend:3000` to `http://localhost:3000` (same container)
- **BREAKING**: Existing `backend/Dockerfile` and `frontend/Dockerfile` become unused (kept temporarily for reference, then removed)

## Capabilities

### New Capabilities
- `single-container-build`: Combined Dockerfile, supervisord configs, and entrypoint for running nginx + node in one container for both prod and dev modes

### Modified Capabilities
<!-- No existing spec-level requirements are changing -->

## Impact

- **Docker configs**: Root `Dockerfile`, `supervisord.conf`, `supervisord.dev.conf` created; both docker-compose files rewritten
- **nginx.conf**: Proxy upstream changes from `backend:3000` to `localhost:3000`
- **Entrypoint**: `docker-entrypoint.sh` moves to repo root, updated to start supervisord after migrations
- **Removed files**: `backend/Dockerfile`, `frontend/Dockerfile` no longer used
- **No application code changes**: Express routes, frontend code, and DB schema are untouched
- **Dependencies**: `supervisor` package added to the Docker image
