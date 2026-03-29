## Context

The app runs as a single Docker container (Nginx + Node + Supervisor). Currently, deploying requires running `docker build` manually on the target machine. The Dockerfile already has a multi-stage build with a `production` target.

## Goals / Non-Goals

**Goals:**
- Automate Docker image build and push on version tag
- Publish to GHCR so deployment is a simple `docker compose pull && docker compose up -d`

**Non-Goals:**
- Multi-arch builds (arm64) — amd64 only for now
- Automated deployment / CD to any server
- Semantic version parsing or minor/major tags (e.g., no `v0.1` alias)

## Decisions

### Registry: GHCR
GHCR integrates natively with GitHub — `GITHUB_TOKEN` has write access, no extra secrets or accounts needed. Image lives alongside the repo at `ghcr.io/thomaslty/invoice_manager`.

### Tag strategy: `v*` tag + `latest`
Pushing `v0.1.0` produces two image tags:
- `ghcr.io/thomaslty/invoice_manager:v0.1.0` (immutable release)
- `ghcr.io/thomaslty/invoice_manager:latest` (rolling)

No stripped `0.1.0` variant — keep it simple, one format.

### Workflow actions
Use the standard Docker GitHub Actions ecosystem:
- `docker/metadata-action@v5` to derive tags from git ref
- `docker/build-push-action@v6` with `target: production` to build only the prod stage
- `docker/setup-buildx-action@v3` for buildx builder (required by build-push-action)

### docker-compose.yml update
Change `image: invoice_manager:latest` to `image: ghcr.io/thomaslty/invoice_manager:latest`. Users pull the pre-built image instead of building locally.

## Risks / Trade-offs

- **GHCR rate limits on pulls** → Not a concern for a private/small project. If the repo is private, pulling requires `docker login ghcr.io`.
- **No arm64 support** → Acceptable for now; can add `linux/arm64` to platforms later if needed.
- **`latest` tag is mutable** → Standard practice. Pinned version tags provide reproducibility when needed.
