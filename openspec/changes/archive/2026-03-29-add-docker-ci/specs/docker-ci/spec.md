## ADDED Requirements

### Requirement: Automated Docker image build on version tag
The system SHALL provide a GitHub Actions workflow at `.github/workflows/docker-build.yml` that builds and pushes the production Docker image when a version tag is pushed.

#### Scenario: Tag push triggers build
- **WHEN** a git tag matching `v*` is pushed (e.g., `v0.1.0`)
- **THEN** the workflow SHALL build the `production` target of the Dockerfile and push to GHCR

#### Scenario: Non-tag push does not trigger
- **WHEN** a regular commit is pushed to any branch
- **THEN** the workflow SHALL NOT run

### Requirement: GHCR image tagging
The workflow SHALL tag pushed images with the git tag (including `v` prefix) and `latest`.

#### Scenario: Image tags for v0.1.0
- **WHEN** tag `v0.1.0` is pushed
- **THEN** the workflow SHALL push `ghcr.io/thomaslty/invoice_manager:v0.1.0` and `ghcr.io/thomaslty/invoice_manager:latest`

### Requirement: GHCR authentication
The workflow SHALL authenticate to GHCR using the built-in `GITHUB_TOKEN`. No additional secrets SHALL be required.

#### Scenario: Auth with default token
- **WHEN** the workflow runs
- **THEN** it SHALL use `github.actor` and `secrets.GITHUB_TOKEN` to login to `ghcr.io`

### Requirement: Build platform
The workflow SHALL build for `linux/amd64` only.

#### Scenario: Single platform build
- **WHEN** the workflow builds the image
- **THEN** the platform SHALL be `linux/amd64`
