## ADDED Requirements

### Requirement: Client-side validation before save
The system SHALL validate invoice data on the client before sending the save request, and display specific error messages for each validation failure.

#### Scenario: Save with grand total of zero
- **WHEN** user clicks Save and the grand total is 0
- **THEN** a toast error appears: "Grand total must be greater than 0"
- **AND** the save request is NOT sent to the server

#### Scenario: Save with missing ref number
- **WHEN** user clicks Save and the ref no. field is empty
- **THEN** a toast error appears: "Reference number is required"
- **AND** the save request is NOT sent to the server

#### Scenario: Save with missing client name
- **WHEN** user clicks Save and the client field is empty
- **THEN** a toast error appears: "Client name is required"
- **AND** the save request is NOT sent to the server

#### Scenario: Multiple validation errors shown together
- **WHEN** user clicks Save and both ref no. and client name are empty
- **THEN** toast errors appear for each missing field

#### Scenario: Valid invoice saves successfully
- **WHEN** user clicks Save with all required fields filled and grand total > 0
- **THEN** the invoice is saved and a success toast appears

### Requirement: Server-side validation on create and update
The backend SHALL validate invoice data and return 400 errors with specific messages when validation fails.

#### Scenario: Server rejects invoice with zero grand total
- **WHEN** an API request creates/updates an invoice where all item totals sum to 0
- **THEN** the server returns HTTP 400 with error message "Grand total must be greater than 0"

#### Scenario: Server rejects invoice with missing required metadata
- **WHEN** an API request creates/updates an invoice without ref no. or client name in json_data
- **THEN** the server returns HTTP 400 with error message specifying the missing field(s)

#### Scenario: Server accepts valid invoice
- **WHEN** an API request creates/updates an invoice with valid metadata and grand total > 0
- **THEN** the server processes the request normally (201 on create, 200 on update)
