## Why

The PaginationControls component currently hides itself when there are fewer than 20 items (the default page size). This makes the Templates and Snapshots dashboards appear inconsistent with the Invoices dashboard, which always shows pagination due to having more data. Users lose visibility into total item counts and the rows-per-page selector when the controls disappear.

## What Changes

- Remove the early-return guard in `PaginationControls` that hides the component when `totalPages <= 1 && total <= LIMIT_OPTIONS[0]`
- Pagination controls will always render on all three dashboards (Invoices, Templates, Snapshots), showing "Showing X–Y of Z", rows-per-page dropdown, and page navigation regardless of item count

## Capabilities

### New Capabilities

_None_

### Modified Capabilities

- `dashboard-pagination`: Pagination controls must always be visible, even with fewer items than the page size

## Impact

- `frontend/src/components/ui/pagination-controls.jsx` — remove the conditional return
- All three dashboards benefit automatically since they all use PaginationControls
