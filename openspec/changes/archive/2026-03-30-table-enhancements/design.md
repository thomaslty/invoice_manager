## Context

The Invoices dashboard (`InvoiceTable.jsx`) already implements the patterns we need:
- Search input with 300ms debounce syncing to `?search=` URL param
- Clickable `<TableHead>` headers with `ArrowUpDownIcon` / `ArrowUpIcon` / `ArrowDownIcon` indicators
- `?sort_by=` and `?sort_order=` URL params with defaults cleaned from URL
- `updateParams()` helper for URL state management

Templates and Snapshots dashboards already use `useSearchParams` and `updateParams()` for pagination. Both use client-side data (full arrays), so search/sort are applied in-memory before pagination.

## Goals / Non-Goals

**Goals:**
- Templates: search + sortable headers, matching Invoices pattern
- Snapshots: sortable headers, matching Invoices pattern
- URL params for all new state
- E2E test coverage

**Non-Goals:**
- No server-side search/sort (both pages fetch all data client-side)
- No changes to Invoices dashboard
- No date range filters for Templates or Snapshots

## Decisions

### Templates Search

Follow the exact Snapshots pattern:
- `urlSearch = searchParams.get("search")` as source of truth
- Local `searchInput` state for controlled input
- 300ms debounce via `useRef` timeout
- Filter by template name (case-insensitive `includes`)
- Reset page to 1 on search change
- Add `SearchIcon` + `Input` above the table

### Sortable Headers — Both Pages

Follow the exact Invoices pattern:
- URL params: `?sort_by=<column>&sort_order=asc|desc`
- Defaults: `sort_by=updatedAt`, `sort_order=desc` (most recently updated first) — cleaned from URL when default
- Click same header: toggle asc/desc. Click different header: set to asc.
- Sort indicators: `ArrowUpDownIcon` (neutral), `ArrowUpIcon` (asc), `ArrowDownIcon` (desc)
- Clickable headers via `<button>` inside `<TableHead>` with flex layout

**Templates sortable columns:**
- `name` — template name
- `updatedAt` — last updated date

**Snapshots sortable columns:**
- `refNo` — invoice ref no (sorts groups)
- `clientName` — client name (sorts groups)
- `createdAt` — snapshot created date (sorts snapshot sub-rows within each group, and groups by most recent snapshot)

### Data Flow

Both pages: `allData → filter(search) → sort(sortBy, sortOrder) → paginate(page, limit)`

For Snapshots specifically: sort is applied to groups based on the chosen column. If sorting by `createdAt`, groups are ordered by their most recent snapshot, and sub-rows within each group are also sorted.

## Risks / Trade-offs

- Client-side sort/filter is fine for the expected data volumes (templates and snapshots are typically < 100 items per user)
- Adding sort indicators to snapshot group header rows requires rendering the header icons only on the `<TableHead>`, not on group rows — same pattern as Invoices
