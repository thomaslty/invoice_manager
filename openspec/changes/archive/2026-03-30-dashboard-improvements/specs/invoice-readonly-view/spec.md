## ADDED Requirements

### Requirement: Read-only invoice viewer page
The system SHALL provide a read-only invoice viewer at `/invoices/:id` that displays the invoice using EditorLayout with `readOnly=true`. The viewer SHALL show the invoice data and live preview without any editable inputs, add/remove controls, or Save button.

#### Scenario: View invoice in read-only mode
- **WHEN** user navigates to `/invoices/5`
- **THEN** the page displays the invoice form and preview in read-only mode with no editable fields

#### Scenario: Header actions on read-only viewer
- **WHEN** user views an invoice at `/invoices/5`
- **THEN** the header shows an "Edit" button (navigates to `/invoices/5/edit`) and a "Download PDF" button

### Requirement: View action in invoice table
The invoice table Actions dropdown SHALL include a "View" option that navigates to `/invoices/:id` (read-only viewer).

#### Scenario: Click View on invoice row
- **WHEN** user clicks "View" in the Actions dropdown for an invoice
- **THEN** the browser navigates to `/invoices/:id` and the read-only viewer loads

### Requirement: View Snapshots navigates to snapshots dashboard
The invoice table "View Snapshots" action SHALL navigate to `/snapshots?invoice=:id` instead of opening a modal dialog. The SnapshotList modal component SHALL be removed.

#### Scenario: Click View Snapshots on invoice row
- **WHEN** user clicks "View Snapshots" in the Actions dropdown for invoice with id 5
- **THEN** the browser navigates to `/snapshots?invoice=5`
- **AND** the snapshots dashboard loads with that invoice's group expanded/filtered
