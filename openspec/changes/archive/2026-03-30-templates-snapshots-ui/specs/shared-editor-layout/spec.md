## ADDED Requirements

### Requirement: Shared editor split-pane layout
The system SHALL provide an `EditorLayout` component that renders a split-pane layout with a left editor panel (header bar + scrollable form) and a right preview panel.

#### Scenario: Invoice editor uses EditorLayout
- **WHEN** a user navigates to `/invoices/:id/edit` or `/invoices/new`
- **THEN** the page SHALL render using `EditorLayout` with Save and PDF action buttons, invoice validation on save, and full form editing capability

#### Scenario: Template editor uses EditorLayout
- **WHEN** a user navigates to `/templates/:id/edit` or `/templates/new`
- **THEN** the page SHALL render using `EditorLayout` with a template name input in the header, a Save button, and full form editing capability

#### Scenario: Snapshot viewer uses EditorLayout
- **WHEN** a user navigates to `/snapshots/:id`
- **THEN** the page SHALL render using `EditorLayout` with `readOnly=true`, displaying form data without edit capability and a "Clone to Invoice" action button

### Requirement: Read-only mode disables form interaction
The `EditorLayout` SHALL accept a `readOnly` prop that disables all form inputs and hides add/remove/reorder controls when set to `true`.

#### Scenario: Read-only form inputs
- **WHEN** `readOnly` is `true`
- **THEN** all text inputs, selects, switches, and buttons within the form SHALL be non-interactive

#### Scenario: Editable form inputs
- **WHEN** `readOnly` is `false` or not provided
- **THEN** all form inputs SHALL be interactive as normal
