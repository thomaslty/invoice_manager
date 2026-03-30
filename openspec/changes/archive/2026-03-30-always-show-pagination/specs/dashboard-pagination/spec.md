## MODIFIED Requirements

### Requirement: Pagination controls always visible
The PaginationControls component SHALL always render on all dashboard pages (Invoices, Templates, Snapshots), regardless of how many items exist. The component SHALL NOT hide itself when there is only one page or fewer items than the page size. This ensures a consistent layout across all dashboards and guarantees the user can always see the total item count and rows-per-page selector.

#### Scenario: Pagination visible with few items
- **WHEN** a dashboard has only 3 items and the page size is 20
- **THEN** the pagination controls are visible, showing "Showing 1–3 of 3", the rows-per-page dropdown, and page indicator "1 / 1" with both navigation buttons disabled

#### Scenario: Pagination visible with zero items after filter
- **WHEN** a dashboard search filter returns 0 results
- **THEN** the pagination controls are not shown (the empty state message takes precedence)

#### Scenario: Pagination visible with exactly one page
- **WHEN** a dashboard has 15 items and the page size is 20
- **THEN** the pagination controls are visible, showing "Showing 1–15 of 15", prev/next buttons disabled, and "1 / 1"

#### Scenario: Invoices dashboard shows pagination
- **WHEN** the user navigates to the Invoices dashboard
- **THEN** pagination controls are visible showing "Showing X–Y of Z" with rows-per-page selector

#### Scenario: Templates dashboard shows pagination
- **WHEN** the user navigates to the Templates dashboard with at least one template
- **THEN** pagination controls are visible showing "Showing X–Y of Z" with rows-per-page selector

#### Scenario: Snapshots dashboard shows pagination
- **WHEN** the user navigates to the Snapshots dashboard with at least one snapshot
- **THEN** pagination controls are visible showing "Showing X–Y of Z" with rows-per-page selector
