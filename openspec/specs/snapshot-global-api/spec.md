## ADDED Requirements

### Requirement: Global snapshot listing endpoint
The backend SHALL provide a `GET /api/snapshots` endpoint that returns all snapshots for the authenticated user, ordered by creation date descending.

#### Scenario: List all user snapshots
- **WHEN** an authenticated user sends `GET /api/snapshots`
- **THEN** the system SHALL return an array of snapshot objects, each including: `id`, `name`, `invoiceId`, `createdAt`, `fontId`, and the parent invoice's `ref_no` and `client_name`

#### Scenario: User isolation
- **WHEN** an authenticated user sends `GET /api/snapshots`
- **THEN** the system SHALL only return snapshots belonging to invoices owned by the requesting user

#### Scenario: No snapshots
- **WHEN** an authenticated user with no snapshots sends `GET /api/snapshots`
- **THEN** the system SHALL return an empty array
