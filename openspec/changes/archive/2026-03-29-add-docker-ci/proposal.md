## Why

There is no automated way to build and publish the Docker image. Every release requires a manual `docker build` on the deployment machine. A GitHub Actions workflow triggered by version tags will automate this, producing ready-to-pull images on GHCR.

## What Changes

- Add a GitHub Actions workflow (`.github/workflows/docker-build.yml`) that builds and pushes the production Docker image to GHCR on tag push matching `v*`
- Update `docker-compose.yml` to pull from `ghcr.io/thomaslty/invoice_manager` instead of a locally-built image

## Capabilities

### New Capabilities
- `docker-ci`: GitHub Actions workflow for automated Docker image build and push to GHCR on version tag push

### Modified Capabilities
- `single-container-build`: Production docker-compose.yml image reference changes from local to GHCR

## Impact

- **New file**: `.github/workflows/docker-build.yml`
- **Modified file**: `docker-compose.yml` (image field)
- **External dependency**: GitHub Actions runners, GHCR
- **Auth**: Uses built-in `GITHUB_TOKEN` — no extra secrets required
