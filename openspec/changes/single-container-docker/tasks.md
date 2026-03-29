## 1. Root Dockerfile and configs

- [ ] 1.1 Create root `Dockerfile` with multi-stage build (frontend-build stage → production stage with node + nginx + chromium + supervisord)
- [ ] 1.2 Create `supervisord.conf` for production (nginx + node processes)
- [ ] 1.3 Create `supervisord.dev.conf` for development (vite + nodemon processes)
- [ ] 1.4 Move and update `docker-entrypoint.sh` to repo root (migrate → exec supervisord)

## 2. Nginx config

- [ ] 2.1 Create root `nginx.conf` with proxy_pass to `127.0.0.1:3000` (replacing `backend:3000`), static file serving from `/var/www/html`, and SPA fallback

## 3. Docker Compose files

- [ ] 3.1 Rewrite `docker-compose.yml` with two services: `postgres` + `invoice_manager` (build from root Dockerfile, port 3001:80, volumes for uploads/fonts)
- [ ] 3.2 Rewrite `docker-compose.dev.yml` with two services: `postgres` + `invoice_manager` (bind-mounts for frontend/src + backend/src, port 5173, dev supervisord config, BYPASS_LOGIN=true)

## 4. Cleanup

- [ ] 4.1 Remove `backend/Dockerfile` and `frontend/Dockerfile` (no longer used)
- [ ] 4.2 Remove `frontend/nginx.conf` (replaced by root nginx.conf)

## 5. Testing

- [ ] 5.1 Build and start prod container (`docker compose up -d --build`), verify app loads on port 3001, API calls work, PDF generation works
- [ ] 5.2 Build and start dev container (`docker compose -f docker-compose.dev.yml up -d --build`), verify vite HMR works, backend hot reload works, API calls work
