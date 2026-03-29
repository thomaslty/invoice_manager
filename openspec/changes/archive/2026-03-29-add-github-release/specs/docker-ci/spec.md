## ADDED Requirements

### Requirement: Release workflow runs independently of Docker build
The release workflow SHALL be a separate workflow file from the Docker build workflow. Both trigger on `v*` tags but operate independently.

#### Scenario: Docker build failure does not block release
- **WHEN** a `v*` tag is pushed and the Docker build workflow fails
- **THEN** the release workflow SHALL still create the GitHub Release
