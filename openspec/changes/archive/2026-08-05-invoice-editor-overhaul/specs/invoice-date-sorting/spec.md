## ADDED Requirements

### Requirement: Invoices sort chronologically by date
Sorting the invoice table by Date SHALL order invoices by actual calendar date, not by the text of the displayed date.

#### Scenario: Descending date sort
- **GIVEN** invoices dated 5 March 2020, 30 September 2022, 1 December 2025 and 2 January 2026
- **WHEN** the user sorts the invoice table by Date descending
- **THEN** the order is 2 January 2026, 1 December 2025, 30 September 2022, 5 March 2020

#### Scenario: Ascending date sort
- **WHEN** the user sorts the same invoices by Date ascending
- **THEN** the order is reversed

### Requirement: The date range filter matches real dates
The dashboard From/To filter SHALL include exactly the invoices whose date falls in the selected range.

#### Scenario: Filtering by range
- **GIVEN** invoices dated 5 March 2020 and 2 January 2026
- **WHEN** the user sets From to 1 January 2026
- **THEN** only the 2 January 2026 invoice is listed

### Requirement: The stored sort key is an ISO date
Saving an invoice SHALL store its date in the indexed `invoices.date` column as `YYYY-MM-DD`, while `json_data` SHALL keep the human-readable display string unchanged.

#### Scenario: Saving an invoice
- **WHEN** an invoice with date "30 September, 2022" is saved
- **THEN** `invoices.date` holds `2022-09-30`
- **THEN** `json_data` still holds `30 September, 2022`
- **THEN** the rendered PDF still shows `30 September, 2022`

#### Scenario: Invoice with no date
- **WHEN** an invoice has no date
- **THEN** `invoices.date` is null

### Requirement: Existing rows are migrated on deployment
Deploying the application SHALL convert previously stored display-format dates in `invoices.date` to ISO format exactly once per database, without data loss.

#### Scenario: Migrating an existing database
- **GIVEN** a database where `invoices.date` holds `02 Jan, 2026`
- **WHEN** the application starts and migrations run
- **THEN** `invoices.date` holds `2026-01-02`
- **THEN** `json_data` is unchanged

#### Scenario: Unparseable dates are left alone
- **GIVEN** a row whose stored date cannot be parsed unambiguously
- **WHEN** the migration runs
- **THEN** that row's date value is left exactly as it was
- **THEN** it is not set to null

#### Scenario: Running twice changes nothing
- **WHEN** the migration has already run against a database
- **THEN** running migrations again leaves every date value unchanged
