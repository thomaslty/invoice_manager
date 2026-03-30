## 1. Extract Shared EditorLayout

- [x] 1.1 Create `frontend/src/components/invoice/EditorLayout.jsx` — presentational split-pane component with props: title, headerActions, headerExtra, readOnly, formData, fontId, fonts, and all useInvoiceForm handlers
- [x] 1.2 Add `readOnly` prop support to `InvoiceForm.jsx` — forward to sub-components, disable inputs/switches/buttons, hide add/remove/reorder controls
- [x] 1.3 Refactor `InvoiceEditorPage.jsx` to use EditorLayout — keep data loading, validation, save/PDF callbacks
- [x] 1.4 Refactor `TemplateEditorPage.jsx` to use EditorLayout — keep data loading, save callback, template name input via headerExtra

## 2. Backend: Global Snapshot Listing

- [x] 2.1 Add `listAllByUser(userId)` to `snapshotService.js` — JOIN invoice_snapshots with invoices to include ref_no and client_name, ordered by createdAt desc
- [x] 2.2 Add `listAll` controller method in `snapshotsController.js`
- [x] 2.3 Register `GET /api/snapshots` route in snapshot routes, ensure user-scoped auth

## 3. Snapshot Dashboard & Viewer Pages

- [x] 3.1 Create `frontend/src/pages/SnapshotListPage.jsx` — table with columns: Name, Invoice Ref, Client, Created Date, Actions (View, Clone, Delete)
- [x] 3.2 Create `frontend/src/pages/SnapshotViewerPage.jsx` — uses EditorLayout with readOnly=true, loads snapshot data, "Clone to Invoice" header action
- [x] 3.3 Add `getSnapshot` method to `frontend/src/lib/api.js` if not already present, and add `getAllSnapshots()` method for the global listing endpoint

## 4. Routing & Navigation

- [x] 4.1 Add `/snapshots` and `/snapshots/:id` routes to `App.jsx`
- [x] 4.2 Uncomment Templates nav item in `Sidebar.jsx` and add Snapshots nav item
- [x] 4.3 Uncomment "Save as Snapshot" and "View Snapshots" in `InvoiceTable.jsx`

## 5. E2E Tests

- [x] 5.1 Create `e2e/snapshots.spec.js` with tests:
  - Save a snapshot from invoice actions dropdown (name it, confirm creation)
  - Navigate to `/snapshots`, verify snapshot appears in table with correct name, invoice ref, and client
  - Click View on a snapshot, verify read-only viewer loads at `/snapshots/:id` with preview and no Save button
  - Clone a snapshot to invoice, verify new invoice is created and editor opens
  - Delete a snapshot with confirmation, verify it is removed from the list
- [x] 5.2 Create `e2e/templates.spec.js` with tests:
  - Navigate to `/templates` via sidebar, verify dashboard loads
  - Create a new template, save it, verify it appears in the dashboard
  - Edit an existing template, verify changes persist
- [x] 5.3 Verify sidebar shows all four nav items (Invoices, Templates, Snapshots, Fonts)
- [x] 5.4 Run existing E2E tests (`invoice-editor.spec.js`, `fonts.spec.js`) to confirm no regressions
