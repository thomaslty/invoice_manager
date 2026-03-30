## ADDED Requirements

### Requirement: Grouped snapshot table
The snapshots dashboard SHALL display snapshots grouped by their parent invoice. Each group SHALL show a collapsible header row with the invoice reference number and client name. Under each group header, snapshot rows SHALL display the snapshot name, created date, and an Actions dropdown.

#### Scenario: Grouped display
- **WHEN** user navigates to `/snapshots` with snapshots from multiple invoices
- **THEN** snapshots are grouped by invoice with group headers showing ref no and client name

#### Scenario: Collapse and expand groups
- **WHEN** user clicks a group header
- **THEN** the group's snapshot rows toggle between collapsed and expanded

### Requirement: Snapshot search with URL sync
The snapshots dashboard SHALL include a search bar that filters snapshots by snapshot name, invoice reference number, or client name. Groups with no matching snapshots SHALL be hidden. The search value SHALL be reflected in the URL as `?search=` query param.

#### Scenario: Search by snapshot name
- **WHEN** user types "Final" in the search bar
- **THEN** only groups containing snapshots with "Final" in the name are shown, with only matching snapshots visible
- **AND** the address bar updates to `/snapshots?search=Final`

#### Scenario: Search by invoice ref
- **WHEN** user types "Inv-001" in the search bar
- **THEN** the group for Inv-001 is shown with all its snapshots
- **AND** the address bar updates to `/snapshots?search=Inv-001`

#### Scenario: Load search from URL
- **WHEN** user navigates to `/snapshots?search=Final`
- **THEN** the search input shows "Final" and the table is filtered to matching results

### Requirement: Invoice query param filtering
The snapshots dashboard SHALL read an `invoice` query parameter from the URL. When present, the dashboard SHALL filter to show only the group matching that invoice ID and auto-expand it.

#### Scenario: Navigate with invoice filter
- **WHEN** user navigates to `/snapshots?invoice=5`
- **THEN** only the group for invoice 5 is shown, expanded, with all its snapshots visible

#### Scenario: Clear invoice filter
- **WHEN** user clears the invoice filter (removes query param or clicks a clear button)
- **THEN** all invoice groups are shown and the `invoice` param is removed from the URL

#### Scenario: Combine invoice filter with search
- **WHEN** user navigates to `/snapshots?invoice=5&search=draft`
- **THEN** only the group for invoice 5 is shown, filtered to snapshots matching "draft"

### Requirement: View action on snapshot rows
The snapshot Actions dropdown SHALL include a "View" option that navigates to `/snapshots/:id` (the existing read-only snapshot viewer).

#### Scenario: Click View on snapshot row
- **WHEN** user clicks "View" in the Actions dropdown for a snapshot
- **THEN** the browser navigates to `/snapshots/:id` and the read-only viewer loads
