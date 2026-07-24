# Stage 1: Build frontend
FROM node:22-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Stage 2: Base image with system dependencies + backend
FROM node:22-slim AS base

# Install chromium (Puppeteer), nginx, supervisor, and the toolchain
# better-sqlite3 needs to compile its native addon (python3/make/g++)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    fonts-noto-cjk \
    libnss3 \
    libatk-bridge2.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libgtk-3-0 \
    nginx \
    supervisor \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Remove default nginx site
RUN rm -f /etc/nginx/sites-enabled/default

# Backend dependencies (devDependencies included: `pg` is used by the one-time
# cutover import that the entrypoint runs when MIGRATE_FROM_POSTGRES_URL is set)
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json* ./
# better-sqlite3 ships a prebuilt binary targeting a newer glibc than this base
# image (bookworm). Remove it and compile from source against our glibc so the
# native addon loads at runtime. The test -f fails the build loudly if the
# source compile did not produce the binary (rather than silently falling back).
RUN npm ci \
 && rm -rf node_modules/better-sqlite3/prebuilds \
 && npm rebuild better-sqlite3 --build-from-source \
 && test -f node_modules/better-sqlite3/build/Release/better_sqlite3.node

COPY backend/ .
RUN mkdir -p uploads fonts data

# Entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Stage 3: Production image
FROM base AS production

# Frontend static files (pre-built)
COPY --from=frontend-build /app/frontend/dist /var/www/html

# Production configs
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
