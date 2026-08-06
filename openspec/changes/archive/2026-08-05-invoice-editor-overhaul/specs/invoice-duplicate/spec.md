## ADDED Requirements

### Requirement: A new invoice can be started from an existing invoice
The application SHALL allow the user to start a new invoice pre-filled from an existing one, without modifying the source invoice.

#### Scenario: Duplicating from the invoice table
- **WHEN** the user chooses "Duplicate" from an invoice's actions dropdown
- **THEN** the invoice editor opens as a new, unsaved invoice
- **THEN** the header reads "New Invoice"
- **THEN** line items, client, contact person, job title, payment method, terms, signature, and footer are copied from the source invoice
- **THEN** the selected font is copied from the source invoice

#### Scenario: Reference number and date start empty
- **WHEN** an invoice is duplicated
- **THEN** the reference number field is empty
- **THEN** the date field shows no date

#### Scenario: Saving a duplicate creates a separate invoice
- **WHEN** the user fills in a reference number on a duplicate and saves
- **THEN** a new invoice is created
- **THEN** the source invoice is unchanged
- **THEN** both invoices appear in the invoice table

#### Scenario: Duplicating from view mode
- **WHEN** the user chooses "Duplicate" while viewing an invoice read-only
- **THEN** the same pre-filled new invoice editor opens
