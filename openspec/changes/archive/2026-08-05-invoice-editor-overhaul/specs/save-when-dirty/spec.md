## ADDED Requirements

### Requirement: Save is enabled only when there are unsaved changes
The invoice editor's Save action SHALL be disabled while the form matches its last saved state, and SHALL become enabled as soon as any field, line item, or font selection changes.

#### Scenario: Opening an existing invoice
- **WHEN** the user opens an existing invoice for editing
- **THEN** the Save button is disabled

#### Scenario: Editing a field
- **WHEN** the user changes any invoice field
- **THEN** the Save button becomes enabled

#### Scenario: After saving
- **WHEN** the user saves an invoice successfully
- **THEN** the Save button becomes disabled again

#### Scenario: A blank new invoice
- **WHEN** the user opens `/invoices/new` and changes nothing
- **THEN** the Save button is disabled

#### Scenario: Invoices with legacy line items
- **GIVEN** an invoice saved before line items carried stable IDs
- **WHEN** the user opens it for editing and changes nothing
- **THEN** the Save button is disabled

#### Scenario: PDF download on a clean form
- **WHEN** the user downloads the PDF of an invoice with no unsaved changes
- **THEN** the PDF opens without performing a save
