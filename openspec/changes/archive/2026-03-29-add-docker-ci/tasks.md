## 1. GitHub Actions Workflow

- [x] 1.1 Create `.github/workflows/docker-build.yml` with tag trigger (`on: push: tags: ['v*']`)
- [x] 1.2 Add checkout, buildx setup, and GHCR login steps using `GITHUB_TOKEN`
- [x] 1.3 Add metadata step to derive `v*` tag and `latest` from git ref
- [x] 1.4 Add build-push step targeting `production` stage, platform `linux/amd64`

## 2. Docker Compose Update

- [x] 2.1 Update `docker-compose.yml` image from `invoice_manager:latest` to `ghcr.io/thomaslty/invoice_manager:latest`

## 3. README Update

- [x] 3.1 Update Quick Start section to use `docker compose pull` instead of `docker build`
