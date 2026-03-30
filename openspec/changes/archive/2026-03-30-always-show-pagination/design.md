## Context

The `PaginationControls` shared component has a guard on line 21 that returns `null` when `totalPages <= 1 && total <= 20`. This was intended to avoid showing pagination when unnecessary, but the user expects consistent layout across all dashboards with the total count always visible.

## Goals / Non-Goals

**Goals:**
- Pagination controls always visible on all dashboards
- Consistent layout between Invoices, Templates, and Snapshots

**Non-Goals:**
- No changes to pagination logic, page size options, or URL-driven state

## Decisions

**Remove the early-return guard entirely.** The component should always render. When there's only one page, the prev/next buttons will be disabled naturally (existing logic handles this). This is a one-line deletion.

## Risks / Trade-offs

- Minor visual overhead on empty or near-empty dashboards, but the user explicitly wants this for consistency and total count visibility.
