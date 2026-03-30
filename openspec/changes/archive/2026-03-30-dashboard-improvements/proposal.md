## Why

The three dashboard pages (Invoices, Templates, Snapshots) have inconsistent UIs and missing features. Invoices has search/sort but no pagination; Templates uses a card grid instead of a table; Snapshots has no search or grouping. The view/edit pattern is also inconsistent — invoices go straight to the editor, templates go straight to the editor, but snapshots have a read-only viewer. Additionally, the invoice date field is a plain text input with no date picker, and the "View Snapshots" action opens an inline modal instead of navigating to the snapshots dashboard.

## What Changes

- **Templates dashboard**: Convert from card grid to table layout matching invoices. Add Actions dropdown with View (read-only) and Edit options.
- **Snapshots dashboard**: Add search bar. Add grouped table with two-level hierarchy (invoice group header → snapshot rows). Add "View" action to snapshot rows. Support `?invoice=` query param for pre-filtering from invoice table.
- **Invoice dashboard**: Add "View" action (read-only at `/invoices/:id`). Change "View Snapshots" to navigate to `/snapshots?invoice=:id` instead of opening a modal. Remove the SnapshotList popup modal component.
- **All three dashboards**: Add server-side pagination for invoices, client-side pagination for templates and snapshots, with a rows-per-page dropdown (20, 50, 100).
- **Invoice editor**: Replace the plain text date input with a shadcn DatePicker (Popover + Calendar) that stores a formatted date string.
- **New routes**: `/invoices/:id` (read-only invoice viewer), `/templates/:id` (read-only template viewer). Both reuse EditorLayout with `readOnly=true`.

## Capabilities

### New Capabilities
- `dashboard-pagination`: Pagination controls (page navigation + rows-per-page dropdown) shared across all three dashboard pages. Server-side for invoices, client-side for templates and snapshots.
- `invoice-readonly-view`: Read-only invoice viewer page at `/invoices/:id` using EditorLayout with `readOnly=true`.
- `template-readonly-view`: Read-only template viewer page at `/templates/:id` using EditorLayout with `readOnly=true`.
- `snapshot-grouped-table`: Grouped snapshot table with two-level hierarchy (invoice groups → snapshot rows), search, and `?invoice=` query param filtering.
- `date-picker`: Date picker component for the invoice editor metadata section, replacing the plain text input. Uses shadcn Calendar + Popover with `react-day-picker`.

### Modified Capabilities
<!-- No existing spec-level requirements are changing -->

## Impact

- **Frontend pages**: TemplateListPage (rewrite to table), SnapshotListPage (add grouping/search), InvoiceEditorPage (no change), new InvoiceViewerPage, new TemplateViewerPage
- **Frontend components**: InvoiceTable (add View action, remove snapshot modal, add pagination), MetadataFields (date picker), remove SnapshotList.jsx modal
- **Backend**: Add pagination params (`page`, `limit`) to `GET /api/invoices`
- **Routes**: Add `/invoices/:id` and `/templates/:id` to App.jsx
- **Dependencies**: Add `react-day-picker` (required by shadcn Calendar component)
