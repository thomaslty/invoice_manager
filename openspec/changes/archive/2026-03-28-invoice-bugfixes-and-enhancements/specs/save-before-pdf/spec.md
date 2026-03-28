## ADDED Requirements

### Requirement: Auto-save before PDF download
When downloading a PDF for an existing invoice, the system SHALL save any unsaved modifications first so the PDF reflects the current editor state.

#### Scenario: Download PDF with unsaved changes
- **WHEN** user edits an existing invoice (changes any field)
- **AND** clicks the PDF download button without saving first
- **THEN** the system saves the invoice automatically
- **AND** then downloads the PDF containing the latest changes

#### Scenario: Download PDF with validation errors
- **WHEN** user has edited the invoice into an invalid state (e.g., cleared the ref number)
- **AND** clicks the PDF download button
- **THEN** the save fails with validation error toasts
- **AND** the PDF download is aborted (no stale PDF downloaded)

#### Scenario: Download PDF with no changes
- **WHEN** user opens an existing invoice without making changes
- **AND** clicks the PDF download button
- **THEN** the system saves (idempotent) and downloads the PDF normally
