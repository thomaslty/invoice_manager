## Why

Templates and Snapshots are fully implemented in the backend and mostly implemented in the frontend, but hidden from the UI (sidebar nav commented out, snapshot actions commented out). Additionally, the invoice and template editors duplicate ~90% of their layout code. This change enables both features, consolidates the duplicated editor code, and adds a global snapshot dashboard with a read-only viewer.

## What Changes

- **Extract shared EditorLayout component** from the duplicated `InvoiceEditorPage` and `TemplateEditorPage`, reducing both to thin wrappers that provide callbacks and config
- **Uncomment Templates sidebar nav** to expose the existing template dashboard and editor
- **Add global snapshot listing endpoint** (`GET /api/snapshots`) — currently snapshots can only be listed per-invoice
- **Create Snapshot dashboard page** — table view of all user snapshots across invoices, with view/clone/delete actions
- **Create Snapshot viewer page** — read-only preview using the shared EditorLayout (snapshots are immutable; editing creates a new invoice via clone)
- **Uncomment snapshot actions** ("Save as Snapshot", "View Snapshots") in the invoice table dropdown
- **Add Snapshots sidebar nav item**
- **Add frontend routes** for `/snapshots` and `/snapshots/:id`

## Capabilities

### New Capabilities
- `shared-editor-layout`: Extracted reusable editor split-pane component with configurable title, header actions, and read-only mode
- `snapshot-dashboard`: Global snapshot listing page with table view, plus read-only snapshot viewer page
- `snapshot-global-api`: Backend endpoint to list all snapshots for the authenticated user across all invoices

### Modified Capabilities
_(none — no existing spec-level requirements are changing)_

## Impact

- **Frontend**: New component (`EditorLayout.jsx`), two new pages (`SnapshotListPage.jsx`, `SnapshotViewerPage.jsx`), modified editor pages, sidebar, router, and invoice table
- **Backend**: New route/controller/service method for global snapshot listing; existing snapshot routes file modified
- **No breaking changes**: All existing APIs and behavior preserved; only additions and UI visibility changes
