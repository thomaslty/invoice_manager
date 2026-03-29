## MODIFIED Requirements

### Requirement: Production Docker Compose configuration
The production `docker-compose.yml` SHALL reference the GHCR-hosted image instead of a locally-built image.

#### Scenario: Image pulled from GHCR
- **WHEN** `docker compose up` is run in production
- **THEN** Docker SHALL pull `ghcr.io/thomaslty/invoice_manager:latest` from GHCR
