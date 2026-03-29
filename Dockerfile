# Stage 1: Build frontend
FROM node:22-slim AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Stage 2: Base image with system dependencies
FROM node:22-slim AS base

# Install chromium (Puppeteer), nginx, and supervisor
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
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
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Remove default nginx site
RUN rm -f /etc/nginx/sites-enabled/default

# Backend dependencies
WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json* ./
RUN npm ci

COPY backend/ .
RUN mkdir -p uploads fonts

# Entrypoint
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

# Stage 3: Development image
FROM base AS dev

# Frontend dependencies (needed for vite dev server)
WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ .

# Dev supervisord config
COPY supervisord.dev.conf /etc/supervisor/conf.d/supervisord.dev.conf

EXPOSE 5173

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.dev.conf"]

# Stage 4: Production image
FROM base AS production

# Frontend static files (pre-built)
COPY --from=frontend-build /app/frontend/dist /var/www/html

# Production configs
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 80

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
