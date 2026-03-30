## 1. Shared Pagination Component

- [x] 1.1 Create `frontend/src/components/ui/pagination-controls.jsx` — shared pagination component with page navigation and rows-per-page Select (20/50/100). Props: `page`, `totalPages`, `limit`, `onPageChange`, `onLimitChange`.

## 2. Invoice Dashboard: URL-Driven State, Pagination, View Action, Snapshot Redirect

- [x] 2.1 Backend: Add `page` (default 1) and `limit` (default 20) params to `invoiceService.listInvoices()` — apply LIMIT/OFFSET to query, return `{ data: [...], total: N }` via a separate count query
- [x] 2.2 Backend: Update `invoicesController.list` to extract `page`/`limit` from query params and pass to service
- [x] 2.3 Frontend: Update `api.getInvoices()` to pass `page`/`limit` params and handle `{ data, total }` response shape
- [x] 2.4 Frontend: Refactor `InvoiceTable.jsx` to use `useSearchParams` as source of truth for all state (`search`, `sort_by`, `sort_order`, `date_from`, `date_to`, `page`, `limit`). Replace React `useState` for filters with URL params. Keep debounced search input (updates URL after 300ms). Reset `page` to 1 on any filter/sort change.
- [x] 2.5 Frontend: Integrate PaginationControls into InvoiceTable
- [x] 2.6 Frontend: Add "View" action to InvoiceTable dropdown — navigates to `/invoices/:id`
- [x] 2.7 Frontend: Change "View Snapshots" action to `navigate('/snapshots?invoice=' + invoice.id)` — remove SnapshotList modal state and component import
- [x] 2.8 Frontend: Delete `frontend/src/components/dashboard/SnapshotList.jsx`

## 3. Invoice Read-Only Viewer

- [x] 3.1 Create `frontend/src/pages/InvoiceViewerPage.jsx` — loads invoice by ID, renders EditorLayout with `readOnly=true`, header actions: Edit button (→ `/invoices/:id/edit`) and Download PDF button
- [x] 3.2 Add `/invoices/:id` route to `App.jsx` (before `/invoices/:id/edit` to avoid conflict)

## 4. Templates Dashboard: Cards → Table + URL-Driven Pagination

- [x] 4.1 Rewrite `frontend/src/pages/TemplateListPage.jsx` — replace card grid with table (columns: Name, Last Updated, Actions). Actions dropdown: View, Edit, Duplicate, Delete with confirmation dialog. Use `useSearchParams` for `page` and `limit`. Integrate PaginationControls with client-side slicing.
- [x] 4.2 Delete `frontend/src/components/dashboard/TemplateCard.jsx` (no longer needed)

## 5. Template Read-Only Viewer

- [x] 5.1 Create `frontend/src/pages/TemplateViewerPage.jsx` — loads template by ID, renders EditorLayout with `readOnly=true`, header action: Edit button (→ `/templates/:id/edit`)
- [x] 5.2 Add `/templates/:id` route to `App.jsx` (before `/templates/:id/edit`)

## 6. Snapshots Dashboard: Search + Grouping + URL-Driven State + Pagination

- [x] 6.1 Rewrite `frontend/src/pages/SnapshotListPage.jsx` — add search bar, group snapshots by invoiceId using `Array.reduce()`, render two-level table with collapsible invoice group headers and snapshot sub-rows
- [x] 6.2 Use `useSearchParams` as source of truth for `search`, `invoice`, `page`, `limit`. Search input updates URL after debounce. `invoice` param auto-filters and expands matching group.
- [x] 6.3 Add "View" action to snapshot row Actions dropdown (→ `/snapshots/:id`)
- [x] 6.4 Integrate PaginationControls with client-side slicing at the group level

## 7. Date Picker in Invoice Editor

- [x] 7.1 Create a `DatePickerField` component in MetadataFields or as a standalone — uses shadcn Popover + Calendar, stores formatted date string (`d MMMM, yyyy`), handles legacy date parsing fallback, respects `readOnly` prop
- [x] 7.2 Update `MetadataFields.jsx` to render `DatePickerField` for the date field instead of a plain Input

## 8. E2E Tests

- [x] 8.1 Create shared date picker helper — a function that opens the DatePicker popover, selects a date via the Calendar, and verifies the formatted value. Use this helper across all tests that need to fill a date.
- [x] 8.2 Update `e2e/invoice-editor.spec.js` — replace `getByRole('textbox', { name: 'Date' }).fill(...)` with the date picker helper in `fill form with multi-category items` test
- [x] 8.3 Update `e2e/user-scoping.spec.js` — replace date text fill in `create invoice`, `edit invoice`, and `delete invoice` tests with the date picker helper
- [x] 8.4 Update `e2e/templates.spec.js` — update create/edit tests for table layout selectors (cards → table), add test for View action navigating to read-only page at `/templates/:id`
- [x] 8.5 Update `e2e/snapshots.spec.js` — update save/delete tests for grouped table selectors, add test for search filtering (type in search → URL updates, table filters), add test for `?invoice=` query param filtering
- [x] 8.6 Add invoice dashboard E2E tests — View action (navigates to `/invoices/:id` read-only page with Edit button), "View Snapshots" redirects to `/snapshots?invoice=:id` (not modal), pagination controls change page and update URL
- [x] 8.7 Add date picker E2E test — open calendar popover, select a date, verify formatted value in form and preview iframe
- [x] 8.8 Add URL-driven state E2E tests — navigate to dashboard with query params pre-set (e.g. `/invoices?search=acme&page=2`), verify filters/page are pre-populated from URL
- [x] 8.9 Run full E2E suite to confirm no regressions
