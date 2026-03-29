## ADDED Requirements

### Requirement: Invoice user ownership
Every invoice SHALL have a `user_id` foreign key (NOT NULL) referencing the `users` table. An index SHALL exist on `user_id`.

#### Scenario: Create invoice with ownership
- **WHEN** a user creates a new invoice
- **THEN** the invoice SHALL be stored with `user_id` set to the authenticated user's ID

#### Scenario: Existing invoices migration
- **WHEN** the migration runs on a database with existing invoices
- **THEN** all existing invoices SHALL be assigned to the `__admin__` user (email: `admin@localhost`)

### Requirement: Invoice query scoping
All invoice queries (list, get by ID, update, delete, PDF download) SHALL be filtered by the authenticated user's ID.

#### Scenario: List invoices
- **WHEN** user A requests their invoice list
- **THEN** only invoices with `user_id = A.id` SHALL be returned

#### Scenario: Access other user's invoice
- **WHEN** user A requests an invoice belonging to user B (by ID)
- **THEN** the backend SHALL return HTTP 404

#### Scenario: Update other user's invoice
- **WHEN** user A attempts to update an invoice belonging to user B
- **THEN** the backend SHALL return HTTP 404

#### Scenario: Delete other user's invoice
- **WHEN** user A attempts to delete an invoice belonging to user B
- **THEN** the backend SHALL return HTTP 404

#### Scenario: Download other user's invoice PDF
- **WHEN** user A attempts to download a PDF for an invoice belonging to user B
- **THEN** the backend SHALL return HTTP 404

### Requirement: Template user ownership
Every template SHALL have a `user_id` foreign key (NOT NULL) referencing the `users` table.

#### Scenario: Create template with ownership
- **WHEN** a user creates a new template
- **THEN** the template SHALL be stored with `user_id` set to the authenticated user's ID

#### Scenario: Existing templates migration
- **WHEN** the migration runs on a database with existing templates
- **THEN** all existing templates SHALL be assigned to the `__admin__` user

### Requirement: Template query scoping
All template queries (list, get by ID, update, delete) SHALL be filtered by the authenticated user's ID.

#### Scenario: List templates
- **WHEN** user A requests their template list
- **THEN** only templates with `user_id = A.id` SHALL be returned

#### Scenario: Access other user's template
- **WHEN** user A requests a template belonging to user B
- **THEN** the backend SHALL return HTTP 404

### Requirement: Snapshot scoping via invoice ownership
Snapshot access SHALL be scoped through the parent invoice's ownership check. No `user_id` column is added to the `invoice_snapshots` table. For nested routes (`/invoices/:invoiceId/snapshots`), the invoice ID is in the URL. For direct routes (`/snapshots/:id`), the controller SHALL look up the snapshot's parent invoice and verify ownership before proceeding.

#### Scenario: List snapshots for own invoice
- **WHEN** user A requests snapshots for their own invoice via `GET /invoices/:invoiceId/snapshots`
- **THEN** the backend SHALL verify the invoice belongs to user A and return all snapshots for that invoice

#### Scenario: List snapshots for other user's invoice
- **WHEN** user A requests snapshots for an invoice belonging to user B via `GET /invoices/:invoiceId/snapshots`
- **THEN** the backend SHALL return HTTP 404

#### Scenario: Create snapshot for own invoice
- **WHEN** user A creates a snapshot via `POST /invoices/:invoiceId/snapshots`
- **THEN** the backend SHALL verify the invoice belongs to user A before creating the snapshot

#### Scenario: Create snapshot for other user's invoice
- **WHEN** user A attempts to create a snapshot for an invoice belonging to user B
- **THEN** the backend SHALL return HTTP 404

#### Scenario: Get snapshot by ID (direct route)
- **WHEN** user A requests `GET /snapshots/:id` for a snapshot whose parent invoice belongs to user A
- **THEN** the backend SHALL return the snapshot

#### Scenario: Get snapshot by ID for other user's invoice
- **WHEN** user A requests `GET /snapshots/:id` for a snapshot whose parent invoice belongs to user B
- **THEN** the backend SHALL return HTTP 404

#### Scenario: Delete snapshot by ID (direct route)
- **WHEN** user A requests `DELETE /snapshots/:id` for a snapshot whose parent invoice belongs to user A
- **THEN** the backend SHALL delete the snapshot and return success

#### Scenario: Delete snapshot by ID for other user's invoice
- **WHEN** user A requests `DELETE /snapshots/:id` for a snapshot whose parent invoice belongs to user B
- **THEN** the backend SHALL return HTTP 404

#### Scenario: Clone snapshot creates owned invoice
- **WHEN** user A clones a snapshot (from their own invoice) via `POST /snapshots/:id/clone`
- **THEN** the new invoice SHALL have `user_id = A.id`

#### Scenario: Clone snapshot for other user's invoice
- **WHEN** user A attempts to clone a snapshot whose parent invoice belongs to user B
- **THEN** the backend SHALL return HTTP 404

### Requirement: Font uploaded_by tracking
The `fonts` table SHALL have an `uploaded_by` column (nullable integer FK to users). System fonts (seeded) SHALL have `uploaded_by = NULL`. User-uploaded or user-created fonts SHALL have `uploaded_by` set to the authenticated user's ID.

#### Scenario: Upload font
- **WHEN** a user uploads a font file
- **THEN** the font row SHALL have `uploaded_by` set to the user's ID

#### Scenario: Create remote font
- **WHEN** a user creates a font with a remote URL
- **THEN** the font row SHALL have `uploaded_by` set to the user's ID

#### Scenario: System font
- **WHEN** fonts are seeded at startup
- **THEN** the font rows SHALL have `uploaded_by = NULL`

### Requirement: Font global visibility with canDelete flag
All fonts SHALL be visible to all users regardless of who uploaded them. The font list response SHALL include a `canDelete` boolean for each font, computed server-side based on the authenticated user.

#### Scenario: List fonts
- **WHEN** any authenticated user requests the font list
- **THEN** all fonts (system, remote, local — from any user) SHALL be returned

#### Scenario: canDelete flag for system font
- **WHEN** the font list includes a system font (`source = 'system'`)
- **THEN** the font object SHALL include `canDelete: false`

#### Scenario: canDelete flag for own uploaded font
- **WHEN** the font list includes a font where `uploaded_by` matches the authenticated user's ID
- **THEN** the font object SHALL include `canDelete: true`

#### Scenario: canDelete flag for other user's font
- **WHEN** the font list includes a font where `uploaded_by` does not match the authenticated user's ID and is not null
- **THEN** the font object SHALL include `canDelete: false`

### Requirement: Font delete restrictions
System fonts (source = 'system') SHALL NOT be deletable. Non-system fonts SHALL only be deletable by the user who uploaded them.

#### Scenario: Delete system font
- **WHEN** any user attempts to delete a font with `source = 'system'`
- **THEN** the backend SHALL return HTTP 403 with message "System fonts cannot be deleted"

#### Scenario: Delete own font
- **WHEN** a user attempts to delete a font where `uploaded_by` matches their user ID
- **THEN** the backend SHALL delete the font and return success

#### Scenario: Delete other user's font
- **WHEN** user A attempts to delete a font where `uploaded_by` is user B's ID
- **THEN** the backend SHALL return HTTP 403 with message "You can only delete your own fonts"

### Requirement: Invoice dashboard lifecycle
Users SHALL be able to create, view in list, edit, and delete invoices through the dashboard, with all operations scoped to the authenticated user.

#### Scenario: Created invoice appears in dashboard
- **WHEN** a user creates and saves a new invoice
- **THEN** the invoice SHALL appear in the dashboard invoice list

#### Scenario: Edit invoice from dashboard
- **WHEN** a user navigates to an invoice from the dashboard and edits it
- **THEN** the changes SHALL persist after save and be visible on reload

#### Scenario: Delete invoice from dashboard
- **WHEN** a user deletes an invoice from the dashboard
- **THEN** the invoice SHALL be removed from the list

### Requirement: Font management UI reflects ownership rules
The font management UI SHALL use the `canDelete` flag from the API response to determine whether to show or disable the delete button for each font.

#### Scenario: Font with canDelete false
- **WHEN** the fonts page renders a font with `canDelete: false` (system font or another user's upload)
- **THEN** the delete button SHALL be disabled for that font

#### Scenario: Font with canDelete true
- **WHEN** the fonts page renders a font with `canDelete: true` (own upload)
- **THEN** the delete button SHALL be enabled for that font

### Requirement: Preview endpoint no scoping
The `POST /api/preview` endpoint SHALL NOT apply user scoping — it is a stateless HTML render.

#### Scenario: Preview renders for any user
- **WHEN** any authenticated user posts invoice data to `/api/preview`
- **THEN** the backend SHALL return rendered HTML without ownership checks
