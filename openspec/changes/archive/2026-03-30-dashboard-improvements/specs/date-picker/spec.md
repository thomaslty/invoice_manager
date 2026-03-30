## ADDED Requirements

### Requirement: Date picker in invoice metadata
The invoice editor metadata section SHALL use a date picker (Popover + Calendar) for the date field instead of a plain text input. The selected date SHALL be stored as a formatted string (e.g., "30 March, 2026") in `formData.sections.metadata.fields.date`.

#### Scenario: Pick a date
- **WHEN** user clicks the date field in the invoice editor
- **THEN** a calendar popover opens allowing the user to select a date
- **AND** the selected date is displayed in the format "d MMMM, yyyy"

#### Scenario: Date stored as formatted string
- **WHEN** user selects March 30, 2026 from the calendar
- **THEN** the value "30 March, 2026" is stored in the form data and rendered as-is in the invoice preview and PDF

### Requirement: Legacy date string handling
When loading an existing invoice with a date value, the system SHALL attempt to parse the stored string into a Date object. If parsing fails (legacy free-text value), the raw string SHALL be displayed as-is and the user can re-select a date from the picker.

#### Scenario: Load invoice with parseable date
- **WHEN** an invoice is loaded with date "30 March, 2026"
- **THEN** the date picker displays the date correctly and the calendar opens to March 2026

#### Scenario: Load invoice with unparseable date
- **WHEN** an invoice is loaded with a legacy date string like "Q3 2022"
- **THEN** the date field displays "Q3 2022" and the user can click to open the calendar and pick a new date

### Requirement: Date picker in read-only mode
When the invoice form is in read-only mode, the date field SHALL display the formatted date string without the picker trigger or calendar popover.

#### Scenario: Read-only date display
- **WHEN** user views an invoice in read-only mode
- **THEN** the date is displayed as plain text without a clickable calendar trigger
