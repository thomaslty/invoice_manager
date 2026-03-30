## 1. Templates Search

- [x] 1.1 Add search input with `SearchIcon` above the templates table in `TemplateListPage.jsx`
- [x] 1.2 Add `?search=` URL param sync with 300ms debounce (follow Snapshots pattern: `urlSearch`, `searchInput`, `debounceRef`, `useEffect` sync)
- [x] 1.3 Add client-side filter: filter templates by name (case-insensitive) before pagination
- [x] 1.4 Add empty state for search with no results: "No templates match your search."

## 2. Templates Sortable Headers

- [x] 2.1 Add `?sort_by=` and `?sort_order=` URL params with defaults `updatedAt` / `desc` (cleaned from URL when default)
- [x] 2.2 Make Name and Last Updated column headers clickable with sort toggle logic (follow InvoiceTable pattern)
- [x] 2.3 Add sort indicator icons (`ArrowUpDownIcon`, `ArrowUpIcon`, `ArrowDownIcon`) to column headers
- [x] 2.4 Apply client-side sort to filtered templates before pagination

## 3. Snapshots Sortable Headers

- [x] 3.1 Add `?sort_by=` and `?sort_order=` URL params with defaults `createdAt` / `desc` (cleaned from URL when default)
- [x] 3.2 Make Name and Created column headers clickable with sort toggle logic
- [x] 3.3 Add sort indicator icons to column headers
- [x] 3.4 Apply client-side sort to groups and sub-rows before pagination

## 4. E2E Tests

- [x] 4.1 `e2e/templates.spec.js` — test: search filters templates and updates URL param
- [x] 4.2 `e2e/templates.spec.js` — test: search URL param pre-populates input and filters results
- [x] 4.3 `e2e/templates.spec.js` — test: clicking column header sorts table and updates URL params
- [x] 4.4 `e2e/snapshots.spec.js` — test: clicking column header sorts table and updates URL params
- [x] 4.5 Run full E2E suite to confirm no regressions
