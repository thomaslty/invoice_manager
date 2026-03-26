## 1. Bound the Height Chain at SidebarInset

- [x] 1.1 In `frontend/src/components/layout/AppLayout.jsx`, add `className="h-svh overflow-hidden"` to `<SidebarInset>` — caps the sidebar content area at viewport height, preventing it from growing to content size
- [x] 1.2 Inner `<main>` uses `flex-1 min-h-0 overflow-y-auto p-6` — `min-h-0` breaks `min-height: auto` default, `overflow-y-auto` lets other pages scroll

## 2. Break min-height: auto in Editor's Flex Chain

- [x] 2.1 In `frontend/src/pages/InvoiceEditorPage.jsx`, add `min-h-0` to left panel (`w-1/2 flex flex-col`) — allows flex-col children to shrink below content size
- [x] 2.2 Add `min-h-0` to `<ScrollArea className="flex-1">` — ensures ScrollArea root respects bounded parent height instead of expanding to content
- [x] 2.3 Confirm `InvoiceEditorPage` wrapper is `flex h-full -m-6` (already set)
- [x] 2.4 Confirm `InvoicePreview` container has `overflow-hidden` (already set)

## 3. Verification (via Playwright MCP)

- [x] 3.1 Verify page-level `<html>` is NOT scrollable (scrollHeight === clientHeight)
- [x] 3.2 Verify `SidebarInset` height equals viewport height (493px), overflow hidden
- [x] 3.3 Verify ScrollArea viewport is scrollable (clientHeight < scrollHeight) — left panel scrolls
- [x] 3.4 Navigate to Dashboard — verify it renders normally and `overflow-y: auto` is ready for overflow
