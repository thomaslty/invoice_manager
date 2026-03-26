## Context

The layout chain is: `SidebarProvider` (`min-h-svh flex`) → `SidebarInset` (`flex-1 flex-col`, renders as `<main>`) → inner `<main>` (`flex-1 overflow-hidden p-6`) → page content.

The problem: `SidebarInset` uses `min-h-svh` (min-height: 100svh), which means it can grow beyond the viewport. The inner `<main>` inherits `flex-1` but has no max height constraint, so `overflow-hidden` is ignored — content pushes the page taller, creating a page-level scrollbar.

The editor page uses `-m-6` to negate the parent's `p-6` and `h-full` to fill its parent — but since the parent has no bounded height, `h-full` resolves to auto.

## Goals / Non-Goals

**Goals:**
- Only the left editor panel scrolls when editing invoices
- Right PDF preview stays fixed at the top of the viewport
- Other pages (Dashboard, Templates, Fonts) continue to scroll normally with padding

**Non-Goals:**
- Changing the shadcn sidebar component internals
- Making the preview panel independently scrollable or zoomable

## Decisions

**1. Bound height at `SidebarInset` via className prop**

The root cause: `SidebarProvider` has `min-h-svh` but no max height, so `SidebarInset` (flex-1 flex-col) grows to content size. The inner `<main>` with `min-h-0` alone doesn't help because its parent is already taller than viewport.

Fix: Pass `className="h-svh overflow-hidden"` to `<SidebarInset>` in AppLayout. This caps its height at viewport and clips overflow. shadcn components merge className via `cn()`, so no source modification needed.

**2. Break `min-height: auto` at every flex level**

In nested flex-col containers, every level defaults to `min-height: auto` which prevents children from shrinking below content size. Three levels needed `min-h-0`:

- `SidebarInset`: `h-svh overflow-hidden` (bounds the chain)
- `AppLayout` inner main: `flex-1 min-h-0 overflow-y-auto p-6` (bounded flex child, scrollable for other pages)
- `InvoiceEditorPage` left panel: `min-h-0` on both the flex-col container and `<ScrollArea>` (allows ScrollArea to constrain to parent height)

**3. Keep `p-6` on AppLayout for other pages**

The editor uses `-m-6` to negate padding and `h-full` to fill. Other pages get padding naturally and scroll via `overflow-y-auto` on the inner main.

## Risks / Trade-offs

- [Risk] `h-svh` on SidebarInset prevents the page from ever growing beyond viewport → Acceptable: all pages should scroll within the main area, not at page level
- [Risk] Other pages need to scroll (e.g., long dashboard) → Mitigated: inner `<main>` has `overflow-y-auto`, so content scrolls within the bounded container
