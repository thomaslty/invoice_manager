## Why

The Invoices dashboard has search with URL sync and clickable sortable column headers, but the Templates and Snapshots dashboards lack these features. Templates has no search at all, and neither Templates nor Snapshots supports sorting. This makes the dashboards feel inconsistent and limits usability as data grows.

## What Changes

### Templates Dashboard
- Add search input with debounced URL sync (`?search=` query param), matching the pattern used by Invoices and Snapshots
- Add clickable sortable column headers (Name, Last Updated) with sort indicators and URL params (`?sort_by=`, `?sort_order=`)
- Client-side filtering and sorting (templates are fetched as a full array)

### Snapshots Dashboard
- Add clickable sortable column headers with sort indicators and URL params (`?sort_by=`, `?sort_order=`)
- Sorting applies to group headers (by invoice ref no or client name) and snapshot sub-rows within groups (by name or created date)
- Search already syncs to URL — no changes needed there

### E2E Tests
- Full test coverage for template search with URL param sync
- Full test coverage for sortable headers on both Templates and Snapshots dashboards

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `dashboard-pagination`: Templates dashboard adds search; both Templates and Snapshots add sortable column headers with URL-driven state

## Impact

- `frontend/src/pages/TemplateListPage.jsx` — add search input, debounce, URL sync, sortable headers
- `frontend/src/pages/SnapshotListPage.jsx` — add sortable headers with URL params
- `e2e/templates.spec.js` — new tests for search and sorting
- `e2e/snapshots.spec.js` — new tests for sorting
