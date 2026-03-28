## Context

The invoice editor is a split-pane page: left panel is a form (ScrollArea), right panel is a live HTML preview (iframe). Data flows from form state (`useInvoiceForm` hook) → POST `/api/preview` → backend renders `invoice-html.js` → iframe `srcdoc`. PDF generation uses the same template via Puppeteer.

Current bugs block basic usage: signature upload crashes on a multer field mismatch, currency/total formatting produces incorrect values (extra number prefix in rendered amounts), footer is clipped by a CSS negative margin, and there's no save validation. Additionally, item reordering requires manual number input instead of drag-and-drop, and currency is a free-text input prone to errors.

## Goals / Non-Goals

**Goals:**
- Fix all blocking bugs (signature upload, total formatting, footer visibility)
- Replace free-text currency with a constrained dropdown
- Add drag-to-reorder for line items with auto-numbered rows
- Add save validation (client-side + server-side)
- Create Playwright E2E test suite covering the editor workflow

**Non-Goals:**
- Auto-save / draft persistence (marked optional, deferred)
- Changing the invoice data model structure (JSON schema stays the same)
- Adding new invoice sections or template layouts
- Multi-currency per invoice (one currency per invoice)

## Decisions

### D1: Signature upload — fix field name on backend

**Choice:** Change backend multer from `upload.single('file')` to `upload.single('signature')` to match frontend.

**Why not change frontend?** The frontend name `'signature'` is semantically correct for this endpoint. The backend `'file'` is a generic leftover. Aligning to the semantic name is clearer.

**Files:** `backend/src/routes/uploads.js` — single line change.

### D2: Currency — dropdown with symbol mapping

**Choice:** Replace the free-text `<Input>` with a `<Select>` dropdown. Predefined options:

| Code | Display Symbol | Label |
|------|---------------|-------|
| HKD  | HK$           | HKD - Hong Kong Dollar |
| USD  | US$           | USD - US Dollar |
| RMB  | ¥             | RMB - Renminbi |

Store the **code** (e.g., `"HKD"`) in `json_data.sections.items.currency`. Map to display symbol at render time (both frontend UI and HTML template).

**Why a mapping instead of storing the symbol directly?** The current free-text approach led to incorrect currency strings being embedded in rendered amounts. A code-to-symbol mapping at render time eliminates this class of error. It also makes it easy to add currencies later.

**Files:**
- New: `frontend/src/lib/currencies.js` — currency map (code → symbol + label)
- Modified: `frontend/src/components/invoice/ItemsTable.jsx` — dropdown replacing input
- Modified: `backend/src/templates/invoice-html.js` — `formatCurrency` uses the map
- Modified: `frontend/src/hooks/useInvoiceForm.js` — default currency changes from `'HK$'` to `'HKD'`

### D3: Total formatting — fix the rendering bug

**Choice:** The current `formatCurrency(value, currency)` concatenates the raw currency string directly with the formatted number. When the currency field contains unexpected characters (e.g., the display symbol instead of just the code, or stale data), the output is malformed.

After D2, currency will always be a clean code like `"HKD"`. The `formatCurrency` helper will look up the display symbol from the currency map, then format as `{symbol}{formatted_number}` (e.g., `HK$100.00`). This eliminates any possibility of garbage in the currency prefix.

**Files:** `backend/src/templates/invoice-html.js`, `frontend/src/components/invoice/ItemsTable.jsx`

### D4: Subtotals — always show when category has a name

**Choice:** Show subtotal row whenever a category has a name, regardless of category count. This matches the reference PDF behavior where each named category gets a subtotal. For unnamed single-category invoices, subtotal is redundant (equals grand total) and will be hidden.

**Files:** `backend/src/templates/invoice-html.js` (line 163 condition), `frontend/src/components/invoice/ItemsTable.jsx` (line 152 condition)

### D5: Footer visibility — remove negative margin hack

**Choice:** Remove `-m-6` from `InvoiceEditorPage.jsx:109`. The negative margin was used to make the editor go edge-to-edge against the parent's `p-6` padding, but it breaks the flex height chain and clips the ScrollArea bottom.

Instead, override the parent padding for this specific page by adding a CSS class to the `<main>` element when on the editor page, or use a conditional layout that doesn't apply padding for full-bleed pages.

**Simplest approach:** Remove `-m-6` and accept the padding. The editor looks fine with the standard page padding. The preview panel uses its own internal padding anyway.

**Files:** `frontend/src/pages/InvoiceEditorPage.jsx`

### D6: Drag-to-reorder items — @dnd-kit

**Choice:** Use `@dnd-kit/core` + `@dnd-kit/sortable` for drag-and-drop. This is the standard React DnD library — lightweight, accessible, works with any list structure.

**Implementation:**
- Each item row gets a drag handle (grip icon) as the first column
- `No.` column becomes auto-computed from array index + 1 (read-only display, no input)
- On drag end, reorder the items array in the category and auto-renumber
- The `no` field in the data model is removed — replaced by array position
- HTML template renders `index + 1` for the NO column

**Files:**
- New dependency: `@dnd-kit/core`, `@dnd-kit/sortable`
- Modified: `frontend/src/components/invoice/ItemsTable.jsx` — drag handles, sortable wrapper
- Modified: `frontend/src/hooks/useInvoiceForm.js` — add `reorderItem(catIndex, fromIndex, toIndex)` callback
- Modified: `backend/src/templates/invoice-html.js` — render index+1 for NO column

### D7: Save validation

**Choice:** Validate on both client and server:

**Client-side (before API call):**
- Grand total must be > 0
- Ref no. must be non-empty
- Client name must be non-empty
- Show toast errors for each failed validation

**Server-side (controller):**
- Recalculate grand total from items and reject if <= 0
- Validate required fields in jsonData
- Return 400 with specific error messages

**Files:**
- Modified: `frontend/src/pages/InvoiceEditorPage.jsx` — validation before save
- Modified: `backend/src/controllers/invoicesController.js` — server validation

### D8: Playwright E2E tests

**Choice:** Add Playwright tests in `e2e/` directory at the repo root. Tests cover:

1. **Form fill**: Navigate to new invoice, fill all fields (metadata, items, payment, terms, signature, footer)
2. **Preview**: Verify iframe contains expected HTML content
3. **Save**: Save invoice, verify URL changes to `/invoices/:id/edit`
4. **PDF download**: Download PDF, verify it's a valid PDF with expected content
5. **Validation**: Attempt save with invalid data, verify error toasts

**Files:**
- New: `e2e/invoice-editor.spec.js`
- New: `e2e/playwright.config.js` (if not already present)
- New dependency: `@playwright/test` (dev dependency in frontend or root)

### D9: DnD bounce-back animation fix

**Problem:** After a drag-and-drop, items visually bounce back to their original position before settling into the new position. Two root causes:

**Cause 1 — `CSS.Transform` includes scale:** `CSS.Transform.toString(transform)` outputs `translate3d() scaleX() scaleY()`. When items have slightly different sizes, dnd-kit calculates scale factors that cause a visual "bounce" on drop.

**Fix:** Use `CSS.Translate.toString(transform)` which only outputs `translate3d()` — no scaling.

**Cause 2 — Unstable IDs from array index:** Item IDs are generated as `cat-${catIndex}-item-${i}`. After reorder, IDs regenerate from new positions, so React unmounts/remounts DOM nodes instead of moving them, breaking the animation.

**Fix:** Assign each item a stable unique ID (e.g., `crypto.randomUUID()`) at creation time. Use that ID for both the React `key` and `useSortable({ id })`. Store it on the item object.

**Additional improvement:** Add `restrictToVerticalAxis` modifier to constrain drag to vertical movement only, which feels tighter for table rows.

**Files:**
- Modified: `frontend/src/components/invoice/ItemsTable.jsx` — `CSS.Translate`, stable IDs, vertical axis modifier
- Modified: `frontend/src/hooks/useInvoiceForm.js` — assign `id: crypto.randomUUID()` when creating items

### D10: Signature broken in preview — relative URLs

**Problem:** The preview endpoint runs inside Docker and resolves `baseUrl` as `http://backend:3000` (the Docker-internal hostname). Signature URLs like `http://backend:3000/uploads/sig-xxx.png` are unreachable from the browser. PDFs work because Puppeteer also runs inside Docker.

**Choice:** For the preview path, don't prefix signature URLs with `baseUrl`. Keep them as relative paths (`/uploads/sig-xxx.png`). The Vite dev proxy forwards `/uploads` to the backend, and in production the reverse proxy does the same. Only PDF generation (Puppeteer) needs the absolute Docker-internal URL.

**Implementation:** Pass an empty string as `baseUrl` (or a new flag like `isPreview: true`) when generating preview HTML, so signature `src` stays as `/uploads/...`. For PDF, continue passing the Docker-internal `baseUrl`.

**Files:**
- Modified: `backend/src/controllers/previewController.js` — pass empty `baseUrl` for preview
- No changes to `invoice-html.js` template (it already handles relative URLs correctly when `baseUrl` is empty)

### D11: Footer not visible — preview scaling

**Problem:** The preview panel renders the iframe at full A4 size (595×842px) but the container is much smaller (~238×445px in a typical viewport). With `overflow-hidden`, the bottom of the page (signature, footer) is clipped.

**Choice:** CSS-scale the iframe to fit the container width. This gives a "print preview" effect where the full A4 page is visible at a reduced size.

**Implementation:** Use a `transform: scale()` on the iframe, calculated from `containerWidth / iframeWidth`. Use `transform-origin: top left` and set the wrapper dimensions to match the scaled output.

```
containerWidth = available width
scale = containerWidth / 595
scaledHeight = 842 * scale
```

Wrap the iframe in a container that uses a ResizeObserver (or a ref + effect) to measure available width and compute the scale factor dynamically. This ensures the preview adapts when the window is resized.

**Files:**
- Modified: `frontend/src/components/invoice/InvoicePreview.jsx` — add scale transform, ResizeObserver

### D12: Google Fonts URL auto-populate

**Problem:** When adding a remote font via URL, the user must manually type the font name and family even though they're encoded in the Google Fonts URL itself. This is tedious and error-prone.

**Choice:** Parse the `family=` query parameter from Google Fonts CSS URLs on paste/change. Auto-fill the Name and Family fields if they're currently empty.

**Parsing logic:**
```
https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400..900&display=swap
                                         ^^^^^^^^^^^^^^^^^
                                         Extract this part
```

1. Match URL against `fonts.googleapis.com` or `fonts.google.com`
2. Extract the `family` query parameter value
3. Take everything before the first `:` (which starts weight/style specifiers)
4. Replace `+` with spaces
5. Set both Name and Family to the result (e.g., "Playfair Display")

Only auto-fill if the Name/Family fields are empty — don't overwrite user edits.

**Files:**
- Modified: `frontend/src/components/fonts/FontUploadDialog.jsx` — add `onChange` handler for URL input that parses and auto-fills

### D13: Save before PDF download

**Problem:** When editing an existing invoice, clicking the PDF download button generates a PDF from the last-saved state, ignoring any unsaved modifications in the editor. The user gets a stale PDF.

**Choice:** Always save before downloading PDF. The `handleDownloadPdf` function will `await handleSave()` first, then trigger the download. This is safe because:
- Save is idempotent (re-saving unchanged data is harmless)
- The PDF button only appears for existing invoices (when `id` exists)
- Validation still runs during save — if it fails, the PDF download is aborted

**Implementation:** Make `handleDownloadPdf` async. Call `handleSave()` first. If save succeeds, proceed with `window.open(pdfUrl)`. If save fails (validation error, network error), abort — the toast errors from `handleSave` inform the user.

`handleSave` currently doesn't return a success/failure indicator. Refactor it to return a boolean so `handleDownloadPdf` can gate on it.

**Files:**
- Modified: `frontend/src/pages/InvoiceEditorPage.jsx` — refactor `handleSave` to return success boolean, make `handleDownloadPdf` async with save-first

### D14: Multi-font Google Fonts URL rejection

**Problem:** Google Fonts allows bundling multiple families in one URL via repeated `family=` params (e.g., `?family=Playfair+Display&family=Roboto`). The current `parseGoogleFontsUrl` only reads the first `family` param via `searchParams.get('family')`, silently ignoring additional families. The user ends up adding a font named after only the first family, which is confusing.

**Choice:** Detect multi-font URLs and show an inline error in the dialog. Block submission until the user provides a single-font URL.

**Detection:** `URLSearchParams.getAll('family')` returns an array. If `length > 1`, it's a multi-font URL.

**UX:** Show the error inline (same red error box already used for API errors in the dialog). Disable the submit button. Clear the error when the URL changes to a valid single-font URL.

**Files:**
- Modified: `frontend/src/components/fonts/FontUploadDialog.jsx` — add multi-font detection in URL onChange, show error, gate submit button

## Risks / Trade-offs

- **[Risk] Currency migration**: Existing invoices store `'HK$'` as currency, new code expects `'HKD'`. → **Mitigation:** `formatCurrency` falls back: if value doesn't match a known code, treat it as a literal symbol (backward compatible). No DB migration needed.
- **[Risk] DnD library size**: `@dnd-kit` adds ~15KB gzipped. → **Mitigation:** Acceptable for the functionality gained. Tree-shakeable.
- **[Risk] Removing `no` field from items**: Existing invoices have `no` in their JSON data. → **Mitigation:** Template ignores `item.no` and uses index+1. Old data renders fine. Frontend simply doesn't display the input.
- **[Risk] Save validation blocking users**: Overly strict validation could prevent saving drafts. → **Mitigation:** Only validate grand total > 0 and basic metadata. Users can still save partial item descriptions.
- **[Risk] Stable item IDs in JSON data**: Adding `id` fields to items increases JSON payload size slightly. → **Mitigation:** UUIDs are ~36 bytes per item — negligible. Existing saved invoices without IDs will get IDs assigned on next edit (when items are loaded into the form hook).
