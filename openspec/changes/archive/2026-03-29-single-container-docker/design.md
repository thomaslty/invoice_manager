## Context

Currently the app runs as 3 Docker services: `postgres`, `backend` (node:22-slim + Chromium/Puppeteer), and `frontend` (nginx:alpine serving static files + reverse proxy to backend). The backend is never accessed directly by users — all traffic flows through nginx. This makes the two-container split unnecessary overhead.

Key files:
- `backend/Dockerfile` — node:22-slim, installs Chromium, runs migrations via `docker-entrypoint.sh`
- `frontend/Dockerfile` — multi-stage: node build → nginx:alpine, serves dist + proxies `/api/`, `/uploads/`, `/fonts/`
- `frontend/nginx.conf` — reverse proxy config pointing to `http://backend:3000`
- `docker-compose.yml` — prod: postgres + backend + frontend, only frontend port 3001:80 exposed
- `docker-compose.dev.yml` — dev: postgres + backend (nodemon :3000) + frontend (vite :5173)

## Goals / Non-Goals

**Goals:**
- Combine frontend and backend into a single `invoice_manager` container
- Only expose the frontend-facing port (nginx :80) from the container
- Support both production (nginx + node) and development (vite + nodemon) modes
- Maintain hot reload in dev (vite HMR for frontend, nodemon for backend)
- Keep migration-on-startup behavior

**Non-Goals:**
- Changing any application code (Express routes, React components, DB schema)
- Optimizing Docker image size (Chromium already makes it large)
- Adding health checks beyond what currently exists
- Kubernetes or multi-replica concerns

## Decisions

### 1. Process manager: supervisord

**Choice**: Use `supervisor` (Python-based) to manage nginx + node processes.

**Alternatives considered**:
- **Shell script with `&` + `wait`**: Simpler but no process restart on crash, poor signal handling, no log management
- **s6-overlay**: Lighter than supervisord but less familiar, more complex init setup
- **tini + shell**: Good for single process, insufficient for two long-running services

**Rationale**: supervisord is the standard for multi-process containers, well-documented, handles restart policies, and log routing. The Python dependency is negligible given the image already has node + chromium.

### 2. Single Dockerfile at repo root with multi-stage build

```
Stage 1: "frontend-build" (node:22-slim)
  - npm ci + npm run build → produces dist/

Stage 2: "production" (node:22-slim)
  - Install: chromium, puppeteer deps, nginx, supervisor
  - COPY backend/ → /app/backend/
  - COPY --from=frontend-build dist/ → /var/www/html/
  - COPY nginx.conf, supervisord configs, entrypoint
  - npm ci in /app/backend/
  - ENTRYPOINT: docker-entrypoint.sh (migrate → exec supervisord)
```

**Rationale**: Multi-stage keeps the frontend build toolchain out of the final image. Using the root context lets us access both `frontend/` and `backend/` directories.

### 3. nginx config: proxy to localhost

Change `proxy_pass http://backend:3000` → `proxy_pass http://127.0.0.1:3000` in `nginx.conf`.

The config file moves to the repo root (alongside the Dockerfile) since it's now a shared concern, not frontend-specific.

### 4. Dev mode via docker-compose override + separate supervisord config

**Production** (`docker-compose.yml`):
- supervisord runs nginx (serving static dist/) + node (Express)
- Port mapping: `3001:80`

**Development** (`docker-compose.dev.yml`):
- supervisord runs vite dev server + nodemon
- Bind-mounts: `./frontend/src` → `/app/frontend/src`, `./backend/src` → `/app/backend/src`
- Port mapping: `5173:5173` (vite with `--host 0.0.0.0`)
- Vite proxy handles `/api/`, `/uploads/`, `/fonts/` → `localhost:3000` (already configured in `vite.config.js`)
- No nginx needed in dev — vite serves + proxies

### 5. Entrypoint flow

```
docker-entrypoint.sh
  ├── cd /app/backend
  ├── npx drizzle-kit migrate
  └── exec supervisord -c /etc/supervisor/supervisord.conf
```

In dev, the compose overrides the command/entrypoint to use the dev supervisord config.

## Risks / Trade-offs

**[Container restart kills both services]** → Acceptable: if either nginx or node crashes, supervisord restarts it. If the container itself dies, Docker's `restart: unless-stopped` handles it. Same reliability as before.

**[Larger single image]** → The image was already ~800MB+ due to Chromium. Adding nginx (~5MB) and supervisor (~2MB) is negligible.

**[Dev HMR port exposure]** → In dev mode, vite's port 5173 must be exposed for the browser. This is dev-only and matches the current setup.

**[supervisord adds complexity]** → Minimal: two simple config files. The alternative (separate containers) has its own complexity in networking and compose orchestration.

**[Frontend build in Dockerfile]** → If only backend code changes, the frontend stage is cached by Docker layer caching. No rebuild penalty.
