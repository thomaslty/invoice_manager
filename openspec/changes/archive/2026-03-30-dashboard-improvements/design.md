## Context

The app has three dashboard pages with inconsistent patterns. InvoiceTable uses a sortable/searchable table; TemplateListPage uses a card grid; SnapshotListPage uses a plain table. None have pagination. The view/edit flow is inconsistent — invoices and templates go straight to editors, while snapshots have a read-only viewer. The invoice date field is a plain text input. The "View Snapshots" action on an invoice opens an inline modal instead of navigating to the snapshots dashboard.

The EditorLayout component (from the `templates-snapshots-ui` change) already supports `readOnly` mode, so adding read-only viewer pages for invoices and templates is straightforward. The shadcn Calendar component and `react-day-picker` are already installed.

## Goals / Non-Goals

**Goals:**
- Consistent table layout across all three dashboards
- Consistent view/edit pattern: View = read-only, Edit = editor
- Pagination on all dashboards with configurable rows per page (20/50/100)
- Grouped snapshot table with invoice-level hierarchy
- Date picker in invoice editor metadata
- "View Snapshots" navigates to `/snapshots?invoice=:id` instead of modal

**Non-Goals:**
- Server-side pagination for templates and snapshots (client-side is sufficient for user-scoped data)
- Sorting on templates and snapshots dashboards (can be added later)
- Date format customization (will use a sensible default format)
- Bulk actions on dashboard rows

## Decisions

### 1. Pagination: Server-side for Invoices, Client-side for Templates/Snapshots

**Choice**: Invoices get server-side pagination (backend already handles query params for search/sort/filter). Templates and snapshots use client-side pagination (slice the full array).

**Why**: Invoices could grow unbounded and already have server-side infrastructure. Templates and snapshots are user-scoped with small datasets — fetching all and slicing is simpler and avoids backend changes for those endpoints.

**Backend change**: Add `page` and `limit` query params to `GET /api/invoices`. Return `{ data: [...], total: N }` instead of a flat array. Default `limit=20`.

**Alternative considered**: Server-side for all three. Rejected — unnecessary complexity for small datasets.

### 2. Snapshot Grouping: Frontend Reduce

**Choice**: The `GET /api/snapshots` endpoint returns a flat list (unchanged). The frontend groups by `invoiceId` using `Array.reduce()`.

**Why**: Keeps the API simple. The data is already user-scoped and small. Grouping logic is pure UI concern.

**Group structure**:
```js
{
  invoiceId: 1,
  refNo: 'Inv-001',
  clientName: 'Acme Corp',
  snapshots: [{ id, name, createdAt }, ...]
}
```

**Pagination**: Applies at the group level (20 groups per page, each with all its snapshots). This keeps grouped data together.

### 3. Templates Dashboard: Cards → Table

**Choice**: Replace TemplateCard grid with a table matching the invoice dashboard pattern. Columns: Name, Last Updated, Actions.

**Why**: Consistency with invoices and snapshots. Tables are more scannable for list data.

**Actions dropdown**: View (→ `/templates/:id`), Edit (→ `/templates/:id/edit`), Duplicate, Delete.

### 4. Read-only Viewer Pages

**Choice**: Add `/invoices/:id` and `/templates/:id` routes that render EditorLayout with `readOnly=true`. Reuse existing InvoiceEditorPage/TemplateEditorPage patterns but without save/PDF actions.

**Invoice viewer** header actions: Edit button (→ `/invoices/:id/edit`), Download PDF.
**Template viewer** header actions: Edit button (→ `/templates/:id/edit`).

### 5. Date Picker

**Choice**: Replace the text `<Input>` for date in MetadataFields with a shadcn DatePicker (Popover + Calendar). Store the formatted string (e.g., "30 March, 2026") in `formData.sections.metadata.fields.date`.

**Why**: Better UX than free-text. The formatted string is stored as-is, so the HTML template renders it without transformation — same as today.

**Format**: `d MMMM, yyyy` (e.g., "30 March, 2026") matching the existing placeholder pattern.

**Parse on load**: When loading an existing invoice, attempt to parse the stored date string back into a Date object for the picker. If parsing fails (legacy free-text value), show the raw string in a fallback text input.

### 6. "View Snapshots" → Navigate with Query Param

**Choice**: Replace the SnapshotList modal with navigation to `/snapshots?invoice=:id`. The snapshots dashboard reads the query param and auto-expands/filters to that invoice's group.

**Why**: URL is shareable/bookmarkable. Removes the modal component. Consistent with how dashboards work.

**Cleanup**: Remove `SnapshotList.jsx`, remove `snapshotListOpen`/`snapshotListInvoiceId` state from InvoiceTable.

### 7. Pagination Component

**Choice**: Use shadcn's Pagination component primitives. Create a shared `PaginationControls` component used by all three dashboards.

**Props**: `page`, `totalPages`, `limit`, `onPageChange`, `onLimitChange`.

**Rows-per-page dropdown**: Renders as a `<Select>` with options 20, 50, 100.

### 8. URL-Driven Dashboard State

**Choice**: All filter, search, sort, and pagination state is stored in URL query params via `useSearchParams`. The URL is the single source of truth — components read from it on mount and update it on user interaction.

**Why**: URLs become shareable and bookmarkable. Browser back/forward preserves filter state. "View Snapshots" from the invoice table naturally works by navigating to `/snapshots?invoice=:id`.

**Implementation pattern**:
- Each dashboard uses `useSearchParams()` to read/write state
- Default values are omitted from the URL (e.g., `page=1` and `limit=20` are defaults, only written when non-default)
- Invoice dashboard syncs: `search`, `sort_by`, `sort_order`, `date_from`, `date_to`, `page`, `limit`
- Snapshot dashboard syncs: `search`, `invoice`, `page`, `limit`
- Template dashboard syncs: `page`, `limit`
- Currently InvoiceTable uses React state for filters — this changes to `useSearchParams` as the source of truth, with a debounced search input that updates the URL param after 300ms

**Alternative considered**: Keep state in React useState and only use query params for cross-page navigation (e.g., `?invoice=`). Rejected — inconsistent and loses browser history benefits.

## Risks / Trade-offs

- **Invoice API response shape change** (`{ data, total }` instead of array) → All frontend callers of `getInvoices()` must update. Currently only `InvoiceTable.jsx` calls it, so impact is contained.
- **Date picker format lock-in** → Users can no longer type arbitrary date strings like "Q3 2022". Mitigated by using a standard date format that covers 99% of use cases.
- **Grouped snapshot pagination** → A group with many snapshots could make a page very tall. Acceptable for now; could add collapsible groups later if needed.
- **Legacy date strings** → Existing invoices with free-text dates need graceful handling. The picker will attempt to parse; if it fails, the raw value displays as-is and the user can re-pick a date.
