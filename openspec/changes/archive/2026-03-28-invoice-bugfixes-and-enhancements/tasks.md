## 1. Bug Fixes

- [x] 1.1 Fix signature upload: change `upload.single('file')` to `upload.single('signature')` in `backend/src/routes/uploads.js`
- [x] 1.2 Fix footer visibility: remove `-m-6` from the editor container in `frontend/src/pages/InvoiceEditorPage.jsx:109`
- [x] 1.3 Fix subtotal display: change condition from `hasMultipleCategories` to `category.name` in both `ItemsTable.jsx` and `invoice-html.js` so subtotals show for any named category

## 2. Currency Dropdown & Formatting

- [x] 2.1 Create `frontend/src/lib/currencies.js` with currency map: `{ HKD: { symbol: 'HK$', label: 'HKD - Hong Kong Dollar' }, USD: { symbol: 'US$', label: 'USD - US Dollar' }, RMB: { symbol: '¥', label: 'RMB - Renminbi' } }`
- [x] 2.2 Replace currency `<Input>` with `<Select>` dropdown in `ItemsTable.jsx`, using options from currencies.js
- [x] 2.3 Update `useInvoiceForm.js` default currency from `'HK$'` to `'HKD'`
- [x] 2.4 Update `formatCurrency` in `invoice-html.js` to look up display symbol from currency code, with fallback for legacy values
- [x] 2.5 Update subtotal and grand total display in `ItemsTable.jsx` to use currency symbol lookup instead of raw `items.currency`

## 3. Save Validation

- [x] 3.1 Add client-side validation in `InvoiceEditorPage.jsx` `handleSave`: check grand total > 0, ref no. non-empty, client name non-empty; show toast errors
- [x] 3.2 Add server-side validation in `backend/src/controllers/invoicesController.js` create/update: validate same fields, return 400 with specific error messages

## 4. Drag-to-Reorder Items

- [x] 4.1 Install `@dnd-kit/core` and `@dnd-kit/sortable` in frontend
- [x] 4.2 Add `reorderItem(catIndex, fromIndex, toIndex)` callback to `useInvoiceForm.js`
- [x] 4.3 Refactor `ItemsTable.jsx`: wrap each category's items in `SortableContext`, make item rows sortable with drag handles, replace No. input with auto-computed read-only index
- [x] 4.4 Update `invoice-html.js` to render `index + 1` for the NO column instead of `item.no`

## 5. Verify Bug Fixes & Features

- [x] 5.1 Manually verify signature upload works (upload image, see it in form and preview)
- [x] 5.2 Verify currency dropdown renders correct symbols in preview and PDF
- [x] 5.3 Verify subtotals appear for named categories (single and multi-category)
- [x] 5.4 Verify footer is visible and scrollable in the editor
- [x] 5.5 Verify drag-to-reorder works within categories and row numbers update
- [x] 5.6 Verify save validation blocks invalid invoices with correct error messages

## 6. Playwright E2E Tests

- [x] 6.1 Set up Playwright config and test infrastructure in `e2e/` directory
- [x] 6.2 Write test: fill invoice form (metadata, multi-category items, payment, terms, footer) and verify preview HTML
- [x] 6.3 Write test: upload signature and verify it appears in preview
- [x] 6.4 Write test: save invoice and verify URL change + data persistence on reload
- [x] 6.5 Write test: download PDF and verify it contains expected content
- [x] 6.6 Write test: attempt save with invalid data and verify validation errors
- [x] 6.7 Write test: drag-reorder items and verify numbering updates

## 7. DnD Animation Fix

- [x] 7.1 In `useInvoiceForm.js`, assign `id: crypto.randomUUID()` to each new item in `addItem` and in the initial default state; ensure existing items without IDs get assigned IDs when loaded via `setFormData`
- [x] 7.2 In `ItemsTable.jsx`, use `item.id` for `itemIds` array and React `key` instead of index-based `cat-${catIndex}-item-${i}`
- [x] 7.3 In `ItemsTable.jsx`, change `CSS.Transform.toString(transform)` to `CSS.Translate.toString(transform)` in `SortableItemRow`
- [x] 7.4 In `ItemsTable.jsx`, add `restrictToVerticalAxis` modifier to `DndContext`
- [x] 7.5 Verify drag-and-drop animation is smooth with no bounce-back using Playwright MCP

## 8. Signature Preview Fix

- [x] 8.1 In `previewController.js`, pass empty string as `baseUrl` when generating preview HTML so signature URLs stay relative (`/uploads/...`)
- [x] 8.2 Verify signature image appears in live preview iframe using Playwright MCP
- [x] 8.3 Verify signature image still works in downloaded PDF (uses Docker-internal baseUrl) — confirmed invoicesController.js still passes req.protocol + req.get('host')

## 9. Preview Scaling (Footer Visibility)

- [x] 9.1 In `InvoicePreview.jsx`, add a `useRef` + `useEffect` with `ResizeObserver` to measure available container width and compute `scale = containerWidth / 595`
- [x] 9.2 Apply `transform: scale(${scale})` with `transform-origin: top left` to the iframe, and set wrapper dimensions to `595 * scale` x `842 * scale` so container sizes correctly
- [x] 9.3 Remove `overflow-hidden` from the preview container (or change to `overflow-auto`) so the scaled content is fully visible
- [x] 9.4 Verify footer is visible in preview, and preview scales on window resize using Playwright MCP

## 10. Update E2E Tests

- [x] 10.1 Update signature upload test (test 2): verify the preview iframe signature image actually loaded (e.g., check `naturalWidth > 0` or that the `src` is a relative `/uploads/...` URL, not a Docker-internal `http://backend:3000/...` URL)
- [x] 10.2 Update signature upload test (test 2): also verify the signature still works in the downloaded PDF by saving the invoice first, downloading PDF, and checking it's valid
- [x] 10.3 Update form fill + preview test (test 1): verify the footer text is visible in the scaled preview iframe (currently only checks iframe HTML content exists, not that it's visually rendered)
- [x] 10.4 Run all 6 E2E tests and confirm they pass with the new fixes (no regressions from preview scaling, signature URL change, or DnD animation changes)

## 11. Google Fonts URL Auto-Populate

- [x] 11.1 In `FontUploadDialog.jsx`, add a helper function `parseGoogleFontsUrl(url)` that extracts font name from `family=` query param: take value before first `:`, replace `+` with spaces. Return `null` for non-Google-Fonts URLs.
- [x] 11.2 In `FontUploadDialog.jsx`, add an `onChange` handler for the remote URL input that calls `parseGoogleFontsUrl` and auto-fills `remoteName` and `remoteFamily` if they are currently empty
- [x] 11.3 Verify via Playwright MCP: paste a Google Fonts URL, confirm Name and Family fields auto-populate

## 12. Save Before PDF Download

- [x] 12.1 In `InvoiceEditorPage.jsx`, refactor `handleSave` to return a boolean (`true` on success, `false` on failure)
- [x] 12.2 In `InvoiceEditorPage.jsx`, make `handleDownloadPdf` async: call `await handleSave()` first, only proceed with `window.open(pdfUrl)` if save returned `true`
- [x] 12.3 Verify via Playwright MCP: edit a saved invoice, click PDF without manual save, confirm the downloaded PDF contains the updated data

## 13. Round 3 E2E Tests

- [x] 13.1 Write E2E test: navigate to fonts page, open add dialog, paste Google Fonts URL, verify Name and Family fields are auto-populated
- [x] 13.2 Write E2E test: save an invoice, edit a field, click PDF download, verify the PDF is valid and the save happened (URL stays on edit page, no validation errors)
- [x] 13.3 Run all E2E tests and confirm no regressions

## 14. Hide Snapshot UI

- [x] 14.0 In `InvoiceTable.jsx`, comment out the "Save as Snapshot" and "View Snapshots" dropdown menu items

## 15. Multi-Font Google Fonts URL Rejection

- [x] 15.1 In `FontUploadDialog.jsx`, update the URL `onChange` handler to detect multi-font URLs using `URLSearchParams.getAll('family').length > 1`, set an error state, and clear Name/Family fields when multi-font detected
- [x] 15.2 In `FontUploadDialog.jsx`, display the multi-font error inline (reuse the existing red error box) and disable the submit button when the error is present
- [x] 15.3 Verify via Playwright MCP: paste a multi-font Google Fonts URL, confirm error appears and submit is blocked; then replace with single-font URL and confirm error clears

## 16. Round 4 E2E Tests

- [x] 16.1 Write E2E test: paste multi-font Google Fonts URL, verify error message shown and Add Font button disabled; then correct to single-font URL and verify error clears and fields auto-populate
- [x] 16.2 Run all E2E tests and confirm no regressions
