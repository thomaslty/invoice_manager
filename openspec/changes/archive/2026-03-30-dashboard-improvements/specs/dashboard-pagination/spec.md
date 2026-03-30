## ADDED Requirements

### Requirement: URL-driven dashboard state
All dashboard filter, search, sort, and pagination state SHALL be reflected as query parameters in the address bar. Dashboards SHALL read initial state from URL query params on load, and update query params when the user changes any filter. This ensures URLs are shareable, bookmarkable, and browser back/forward navigation preserves filter state.

#### Scenario: Invoice dashboard URL reflects all state
- **WHEN** user searches "acme", sorts by client ascending, filters from 2026-01-01, and navigates to page 2 with limit 50
- **THEN** the address bar shows `/invoices?search=acme&sort_by=client_name&sort_order=asc&date_from=2026-01-01&page=2&limit=50`

#### Scenario: Template dashboard URL reflects pagination
- **WHEN** user navigates to page 3 with limit 50 on the templates dashboard
- **THEN** the address bar shows `/templates?page=3&limit=50`

#### Scenario: Snapshot dashboard URL reflects search and pagination
- **WHEN** user searches "draft" and navigates to page 2 on the snapshots dashboard
- **THEN** the address bar shows `/snapshots?search=draft&page=2`

#### Scenario: Load dashboard from URL with query params
- **WHEN** user navigates to `/invoices?search=acme&page=2&limit=50`
- **THEN** the search input shows "acme", the page shows page 2, and the rows-per-page dropdown shows 50

#### Scenario: Browser back restores previous state
- **WHEN** user changes search from "acme" to "beta" then clicks browser back
- **THEN** the dashboard restores to the "acme" search state

### Requirement: Pagination controls on all dashboards
All three dashboard pages (Invoices, Templates, Snapshots) SHALL display pagination controls at the bottom of the table. Controls SHALL include page navigation (previous/next, page numbers) and a rows-per-page dropdown with options 20, 50, and 100. The default rows per page SHALL be 20.

#### Scenario: Default pagination on invoice dashboard
- **WHEN** user navigates to the Invoices dashboard with no query params
- **THEN** the table displays the first 20 invoices and pagination controls show "Page 1 of N"

#### Scenario: Change rows per page
- **WHEN** user selects "50" from the rows-per-page dropdown
- **THEN** the table displays up to 50 rows, pagination updates, and the address bar updates with `limit=50`

#### Scenario: Navigate to next page
- **WHEN** user clicks "Next" on pagination
- **THEN** the table displays the next page of results, the page indicator updates, and the address bar updates with the new page number

#### Scenario: Pagination resets on filter change
- **WHEN** user applies a search filter or changes sort order while on page 3
- **THEN** the current page resets to page 1 and the address bar reflects `page=1`

### Requirement: Server-side invoice pagination
The `GET /api/invoices` endpoint SHALL accept `page` (default 1) and `limit` (default 20) query parameters. The response SHALL return an object `{ data: [...], total: N }` where `data` contains the paginated invoice rows and `total` is the total count matching the current filters.

#### Scenario: Paginated API response
- **WHEN** client requests `GET /api/invoices?page=2&limit=20`
- **THEN** the response contains up to 20 invoices offset by 20 and includes the total count

#### Scenario: Pagination with filters
- **WHEN** client requests `GET /api/invoices?search=acme&page=1&limit=20`
- **THEN** the response contains the first 20 invoices matching "acme" and the total count of all matching invoices

### Requirement: Client-side pagination for templates and snapshots
The Templates and Snapshots dashboards SHALL fetch all records in a single API call and paginate the results on the frontend by slicing the array based on the current page and rows-per-page selection.

#### Scenario: Template dashboard client-side pagination
- **WHEN** user has 45 templates and rows per page is 20
- **THEN** page 1 shows templates 1-20, page 2 shows templates 21-40, page 3 shows templates 41-45

#### Scenario: Snapshot grouped pagination
- **WHEN** user has snapshots across 30 invoices and rows per page is 20
- **THEN** page 1 shows the first 20 invoice groups (each with all its snapshots), page 2 shows groups 21-30
