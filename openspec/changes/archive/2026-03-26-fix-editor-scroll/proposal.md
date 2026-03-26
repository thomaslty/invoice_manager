## Why

The invoice editor page scrolls as a whole — when the left editor panel has many items and the user scrolls down, the entire page moves, causing the right PDF preview to scroll past its A4 iframe into empty white space. The root cause is that the layout chain (`SidebarProvider` → `SidebarInset` → `main`) uses `min-h-svh` without a bounded height, so `h-full` and `overflow-hidden` on children have no effect.

## What Changes

- Fix the height chain from `SidebarInset` down to the editor page so that `overflow-hidden` is respected
- Make only the left editor panel scrollable (already uses `ScrollArea`)
- Keep the right PDF preview fixed in place — no scroll
- Ensure other pages (Dashboard, Templates, Fonts) are unaffected by the layout change

## Capabilities

### New Capabilities

- `editor-scroll-containment`: Constrain the invoice editor to viewport height with only the left editor panel scrollable

### Modified Capabilities


## Impact

- `frontend/src/components/layout/AppLayout.jsx` — fix height chain so children can use `h-full`
- `frontend/src/pages/InvoiceEditorPage.jsx` — use contained height instead of viewport calc
- `frontend/src/components/invoice/InvoicePreview.jsx` — prevent scroll on preview panel
- No API or backend changes
