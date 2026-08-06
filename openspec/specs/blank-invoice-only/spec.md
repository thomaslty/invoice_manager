# blank-invoice-only Specification

## Purpose
Creating an invoice always opens a blank editor, with no template step.
## Requirements
### Requirement: Creating an invoice always opens a blank editor
Starting a new invoice SHALL open an empty invoice editor directly, and SHALL NOT present a template chooser or any other intermediate step.

#### Scenario: New Invoice from the dashboard
- **WHEN** the user clicks "New Invoice" on the invoices dashboard
- **THEN** the invoice editor opens immediately at `/invoices/new`
- **THEN** no template selection dialog appears
- **THEN** all invoice fields are empty

### Requirement: The template system is not reachable
The application SHALL NOT expose any template screen, navigation item, or HTTP endpoint.

#### Scenario: Template navigation is gone
- **WHEN** the user views the sidebar
- **THEN** only "Invoices" and "Fonts" navigation items are present

#### Scenario: Template routes no longer resolve
- **WHEN** the user navigates directly to `/templates`
- **THEN** no template listing is rendered

#### Scenario: Template API is removed
- **WHEN** a client requests `GET /api/templates`
- **THEN** the server does not serve a template listing
