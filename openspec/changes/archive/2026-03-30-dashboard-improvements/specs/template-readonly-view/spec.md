## ADDED Requirements

### Requirement: Read-only template viewer page
The system SHALL provide a read-only template viewer at `/templates/:id` that displays the template using EditorLayout with `readOnly=true`. The viewer SHALL show the template name and data without any editable inputs or Save button.

#### Scenario: View template in read-only mode
- **WHEN** user navigates to `/templates/3`
- **THEN** the page displays the template form and preview in read-only mode with no editable fields

#### Scenario: Header actions on read-only viewer
- **WHEN** user views a template at `/templates/3`
- **THEN** the header shows an "Edit" button that navigates to `/templates/3/edit`

### Requirement: Templates dashboard as table
The templates dashboard SHALL display templates in a table layout (not card grid) with columns: Name, Last Updated, Actions. The Actions dropdown SHALL include View (→ `/templates/:id`), Edit (→ `/templates/:id/edit`), Duplicate, and Delete options.

#### Scenario: Template table layout
- **WHEN** user navigates to `/templates`
- **THEN** templates are displayed in a table with Name, Last Updated, and Actions columns

#### Scenario: View action in template table
- **WHEN** user clicks "View" in the Actions dropdown for a template
- **THEN** the browser navigates to `/templates/:id` and the read-only viewer loads

#### Scenario: Edit action in template table
- **WHEN** user clicks "Edit" in the Actions dropdown for a template
- **THEN** the browser navigates to `/templates/:id/edit` and the editor loads
