# invoice-date-picker Specification

## Purpose
The invoice date is chosen from a calendar and cannot be typed.
## Requirements
### Requirement: The invoice date is selected from a calendar
The invoice date SHALL be chosen from a calendar picker and SHALL NOT be typed by hand.

#### Scenario: Picking a date
- **WHEN** the user clicks the date control in the invoice editor
- **THEN** a calendar popover opens
- **WHEN** the user clicks a day in the calendar
- **THEN** the popover closes
- **THEN** the date control shows that date formatted as `d MMMM, yyyy`
- **THEN** the invoice preview shows the same date

#### Scenario: The date cannot be typed
- **WHEN** the user focuses the date control
- **THEN** it is a button, not a text input
- **THEN** typing characters does not change the stored date

#### Scenario: An existing date is preselected
- **WHEN** the user opens an invoice that already has a date and clicks the date control
- **THEN** the calendar opens on the month of that date
- **THEN** that day is shown as selected

#### Scenario: Empty date
- **WHEN** an invoice has no date set
- **THEN** the date control reads "Pick a date"
