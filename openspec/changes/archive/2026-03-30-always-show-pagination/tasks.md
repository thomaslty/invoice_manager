## 1. Always show PaginationControls

- [x] 1.1 Remove the early-return guard (`if (totalPages <= 1 && total <= LIMIT_OPTIONS[0]) return null;`) from `frontend/src/components/ui/pagination-controls.jsx`

## 2. E2E Tests

- [x] 2.1 Add pagination visibility test to `e2e/invoice-dashboard.spec.js` — verify "Showing" text and rows-per-page selector are present
- [x] 2.2 Add pagination visibility test to `e2e/templates.spec.js` — verify "Showing" text and rows-per-page selector are present
- [x] 2.3 Add pagination visibility test to `e2e/snapshots.spec.js` — verify "Showing" text and rows-per-page selector are present
- [x] 2.4 Run full E2E suite to confirm no regressions
