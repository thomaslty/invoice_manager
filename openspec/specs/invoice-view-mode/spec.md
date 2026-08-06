# invoice-view-mode Specification

## Purpose
An invoice can be viewed read-only without any risk of editing it.
## Requirements
### Requirement: Invoices can be viewed read-only
The application SHALL provide a read-only view of an invoice that shows the same fields and live preview as the editor but SHALL NOT allow any field to be changed.

#### Scenario: Opening view mode from the invoice table
- **WHEN** the user chooses "View" from an invoice's actions dropdown
- **THEN** the browser navigates to `/invoices/:id/view`
- **THEN** the header reads "View Invoice"
- **THEN** the invoice preview renders the same content as the editor

#### Scenario: Fields cannot be edited
- **WHEN** the user is on the read-only view of an invoice
- **THEN** every text field is read-only
- **THEN** section visibility toggles are not shown
- **THEN** the font selector is not shown
- **THEN** line item add, remove, and drag controls are not shown

#### Scenario: Actions available from view mode
- **WHEN** the user is on the read-only view of an invoice
- **THEN** an "Edit" action navigates to that invoice's editor
- **THEN** a "Duplicate" action is available
- **THEN** a "PDF" action downloads the invoice PDF
- **THEN** no "Save" action is present
