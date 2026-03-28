## Why

The invoice editor has several bugs that prevent basic workflows (signature upload crashes, totals display incorrect values, footer is clipped) and lacks usability features users expect (drag-to-reorder items, currency dropdown, save validation). These need fixing before the product is usable for real invoicing.

## What Changes

### Bug Fixes
- **Signature upload**: Fix `MulterError: Unexpected field` — frontend sends field name `'signature'` but backend multer expects `'file'`
- **Subtotal/Grand total display**: Currency formatting renders raw numbers like `HKD$300100.00` instead of `HKD$100.00` — the `formatCurrency` function concatenates currency symbol with the number without proper spacing/formatting, and `toLocaleString` inserts commas that merge with the currency prefix
- **Footer clipped**: `-m-6` on the editor container breaks the flex height chain, clipping the bottom of the ScrollArea so the footer card is unreachable
- **Subtotal visibility**: Single-category invoices show no subtotal row at all; subtotals should always display

### Enhancements
- **Currency dropdown**: Replace free-text currency input with a dropdown selector (HKD, RMB, USD) that maps to proper display symbols (HK$, ¥, US$)
- **Drag-to-reorder items**: Replace manual `No.` input with auto-computed row numbers and drag handles for reordering within a category
- **Save validation**: Validate grand total > 0 and required metadata fields before allowing save
- **Playwright E2E tests**: Automated test suite covering form fill, preview verification, save, PDF download, and content validation

### Round 2 Bug Fixes (post-implementation)
- **DnD bounce-back animation**: After drag-and-drop, items visually bounce back to original position before settling. Caused by (a) `CSS.Transform` including scale factors, and (b) unstable index-based IDs causing React remounts instead of moves
- **Signature broken in preview**: Uploaded signature shows as broken image in the live preview iframe, but works in downloaded PDF. Caused by Docker-internal `baseUrl` (`http://backend:3000/...`) being unreachable from the browser
- **Footer still not visible**: Footer section is clipped in the preview because the iframe renders at full A4 size (595×842px) inside a smaller container with `overflow-hidden` and no scaling

### Round 3 Improvements
- **Google Fonts URL auto-populate**: When pasting a Google Fonts CSS URL in the font add dialog, auto-extract the font name and family from the `family=` query parameter (e.g., `Playfair+Display` → "Playfair Display")
- **Save before PDF download**: When downloading a PDF for an existing invoice that has unsaved modifications, automatically save first so the PDF reflects the current editor state

### Round 4 Bug Fixes
- **Multi-font Google Fonts URL rejection**: When pasting a Google Fonts URL that bundles multiple font families (e.g., `family=Playfair+Display&family=Roboto`), show an inline error in the dialog and prevent submission instead of silently using only the first family

### Optional
- **Auto-save / intermediate state**: Periodically save draft state to server to prevent data loss on accidental reload

## Capabilities

### New Capabilities
- `currency-selector`: Dropdown-based currency selection with predefined options (HKD, RMB, USD) replacing free-text input
- `item-drag-reorder`: Drag-and-drop reordering of line items within categories with auto-computed row numbers
- `save-validation`: Client-side and server-side validation of invoice data before save (grand total > 0, required fields)
- `invoice-e2e-tests`: Playwright test suite for invoice editor workflows (fill form, preview, save, download PDF, verify content)
- `preview-scaling`: Scale the preview iframe to fit the container so the full A4 page is visible
- `font-url-autopopulate`: Parse Google Fonts URLs to auto-fill font name and family fields
- `save-before-pdf`: Auto-save unsaved changes before downloading PDF

### Modified Capabilities
<!-- No existing spec-level requirement changes -->

## Impact

- **Frontend packages**: Add `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop
- **Frontend components**: `ItemsTable.jsx`, `InvoiceForm.jsx`, `InvoiceEditorPage.jsx`, `SignatureUpload.jsx`, `InvoicePreview.jsx`, `FontUploadDialog.jsx`
- **Frontend hooks**: `useInvoiceForm.js` (reorder logic, validation, stable item IDs)
- **Backend routes**: `routes/uploads.js` (multer field name fix)
- **Backend template**: `templates/invoice-html.js` (currency formatting, subtotal logic)
- **Backend controllers**: `invoicesController.js` (save validation), `previewController.js` (relative URLs for preview)
- **New test files**: Playwright test specs under a test directory
