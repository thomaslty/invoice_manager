## Context

The invoice manager has three data concepts sharing the same JSON schema: Invoices, Templates, and Snapshots. All backend CRUD is implemented. Templates have a frontend dashboard and editor but are hidden from the sidebar. Snapshots have a per-invoice modal list and creation dialog but no global dashboard or viewer. The invoice and template editors duplicate ~90% of their split-pane layout code.

## Goals / Non-Goals

**Goals:**
- Extract a shared `EditorLayout` component to eliminate editor duplication and enable reuse for the snapshot viewer
- Expose Templates via sidebar (already fully functional, just hidden)
- Create a global Snapshot dashboard and read-only viewer
- Add a backend endpoint for listing all user snapshots across invoices
- Uncomment existing snapshot actions in the invoice table

**Non-Goals:**
- Snapshot editing (snapshots are immutable — clone to create a new invoice)
- Template selection UI when creating new invoices (existing `?template=id` param is sufficient)
- Snapshot diffing or version comparison between snapshots

## Decisions

### 1. EditorLayout as a presentational component

Extract the split-pane layout (left: header bar + scrollable form, right: preview) into `EditorLayout.jsx`. It receives all form state and handlers as props — no data fetching or save logic inside.

Each page wrapper (`InvoiceEditorPage`, `TemplateEditorPage`, `SnapshotViewerPage`) owns:
- Data loading (useEffect with API calls)
- Save/action callbacks
- `useInvoiceForm()` hook instantiation

**Why**: Keeps EditorLayout purely presentational. Each page controls its own data flow, validation, and actions. The component just renders the layout.

**Alternative considered**: A single `EditorPage` component with a `mode` prop (invoice/template/snapshot). Rejected because the data loading and save logic differ enough that conditional branching would be messier than thin wrappers.

### 2. Read-only mode via prop, not a separate component

`EditorLayout` accepts a `readOnly` prop that gets forwarded to `InvoiceForm`. The form disables all inputs when `readOnly=true`.

**Why**: Simpler than creating a separate read-only viewer component. The form already renders the data — we just need to disable interaction.

### 3. Global snapshot listing via JOIN query

New `GET /api/snapshots` endpoint joins `invoice_snapshots` with `invoices` to include parent invoice ref_no and client_name in the response.

**Why**: The snapshot table only stores `invoiceId`. The dashboard needs to display which invoice each snapshot belongs to. A JOIN at query time avoids data duplication.

### 4. Snapshot dashboard uses table layout (matching invoices)

The snapshot dashboard uses a table layout consistent with the invoice dashboard, not a card grid like templates.

**Why**: Snapshots have tabular data (name, parent invoice, date) that fits a table better than cards. Consistency with the invoice dashboard also reduces cognitive load.

## Risks / Trade-offs

- **[`readOnly` prop threading]** → The `readOnly` prop needs to flow from `EditorLayout` through `InvoiceForm` to all sub-components (MetadataFields, ItemsTable, SignatureUpload). Some sub-components may need individual attention to properly disable. Mitigation: Use a CSS `pointer-events: none` + `opacity` approach on the form container as a fallback, with individual `disabled` props where shadcn components support it.

- **[Snapshot orphan display]** → If an invoice is deleted, its snapshots cascade-delete (FK ON DELETE CASCADE), so orphaned snapshots are not possible. No risk here.

- **[Font fetching in EditorLayout]** → Currently both editor pages independently fetch fonts. Moving font fetching into EditorLayout would reduce duplication but couples the layout to an API. Decision: Keep font fetching in EditorLayout since all three page types need it.
