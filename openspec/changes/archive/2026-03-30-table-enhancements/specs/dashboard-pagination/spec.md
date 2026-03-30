## MODIFIED Requirements

### Requirement: Templates search with URL sync
The Templates dashboard SHALL have a search input that filters templates by name. The search value SHALL be synced to the `?search=` URL query parameter with a 300ms debounce. Navigating to `/templates?search=foo` SHALL pre-populate the search input and filter results. Changing the search SHALL reset the page to 1.

#### Scenario: Search filters templates by name
- **WHEN** the user types "invoice" in the search input
- **THEN** only templates whose name contains "invoice" (case-insensitive) are shown
- **AND** the URL updates to include `?search=invoice` after 300ms

#### Scenario: Search URL param pre-populates input
- **WHEN** the user navigates to `/templates?search=monthly`
- **THEN** the search input shows "monthly" and results are filtered

#### Scenario: Empty search shows all templates
- **WHEN** the user clears the search input
- **THEN** all templates are shown and the `search` param is removed from the URL

#### Scenario: No search results
- **WHEN** the search returns 0 matching templates
- **THEN** an empty state message is shown: "No templates match your search."

### Requirement: Templates sortable column headers
The Templates dashboard table SHALL have clickable column headers for Name and Last Updated. Clicking a header SHALL sort the table by that column. The sort state SHALL be stored in `?sort_by=` and `?sort_order=` URL query parameters. Default sort is by Last Updated descending (cleaned from URL).

#### Scenario: Click Name header to sort
- **WHEN** the user clicks the "Name" column header
- **THEN** templates are sorted by name ascending and the URL includes `?sort_by=name&sort_order=asc`

#### Scenario: Toggle sort direction
- **WHEN** the user clicks the same column header again
- **THEN** the sort direction toggles (asc to desc or vice versa)

#### Scenario: Sort indicators
- **WHEN** a column is being sorted ascending
- **THEN** an up arrow icon is shown next to the header text
- **WHEN** a column is being sorted descending
- **THEN** a down arrow icon is shown
- **WHEN** a column is not the active sort column
- **THEN** an up-down arrow icon is shown (neutral state)

### Requirement: Snapshots sortable column headers
The Snapshots dashboard table SHALL have clickable column headers for Name and Created. Clicking a header SHALL sort the snapshot groups and sub-rows accordingly. The sort state SHALL be stored in `?sort_by=` and `?sort_order=` URL query parameters. Default sort is by Created descending (cleaned from URL).

#### Scenario: Click Name header to sort snapshots
- **WHEN** the user clicks the "Name" column header
- **THEN** snapshot groups are sorted by the name of their first snapshot, and sub-rows within groups are sorted by name
- **AND** the URL includes `?sort_by=name&sort_order=asc`

#### Scenario: Click Created header to sort snapshots
- **WHEN** the user clicks the "Created" column header
- **THEN** groups are ordered by their most recent snapshot date, and sub-rows within groups are sorted by created date
- **AND** the URL includes appropriate sort params

#### Scenario: Sort indicators on snapshot headers
- **WHEN** a column is being sorted
- **THEN** the appropriate arrow icon (up/down/neutral) is shown, matching the Invoices and Templates pattern
