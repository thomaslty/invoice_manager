## Why

Five problems, all in the invoice workflow:

1. **The template picker is a dead end.** Creating an invoice opens a "Choose a Template" dialog first. Both databases hold zero templates, and `invoices.template_id` is never populated — `InvoiceEditorPage` posts `{ jsonData, fontId }` with no `templateId`, so the FK is always NULL. The dialog is a click between the user and a blank invoice, guarding a feature nobody uses.

2. **There is no read-only view.** The only way to look at an invoice is to open the editor, where every field is live. Reading an invoice risks changing it.

3. **Reusing an invoice means retyping it.** With templates gone there is no way to start from an existing invoice at all.

4. **The date field is free text and the Date column sorts wrong.** `metadata.date` is a plain `<Input>`, so anything can be typed. `extractFields` copies that string verbatim into `invoices.date`, which SQLite then sorts as text:

   ```
   30 September, 2022
   1 December, 2025
   05 Mar, 2020
   02 Jan, 2026
   ```

   That is day-of-month first, then month name alphabetically. The dashboard From/To filter is broken by the same cause — it sends ISO `2026-08-05` and compares it against `02 Jan, 2026`.

5. **Save is always enabled.** Nothing distinguishes a touched invoice from an untouched one, so Save fires pointless writes and gives no signal about unsaved work.

## What Changes

- **Remove the template system.** Delete the template pages, routes, API client methods, and backend controller/service/routes. "New Invoice" navigates straight to a blank editor. The `templates` table and `invoices.template_id` stay in `schema.js` — dropping a column in SQLite rebuilds the whole `invoices` table, which is real risk for zero benefit.
- **Add a read-only view mode** at `/invoices/:id/view`, sharing the editor layout via a new `EditorLayout` component. Fields render but cannot be edited; section toggles, the font selector, drag handles, and add/remove buttons are hidden.
- **Add Duplicate**, from the invoice table dropdown and from view mode. It opens a new editor pre-filled from the source invoice with `refNo` and `date` cleared, then saves as a new invoice through the existing `POST /invoices`.
- **Replace the date input with a calendar picker.** The trigger is a button, not a text field, so manual entry is impossible.
- **Store an ISO date in the sort column.** `json_data` keeps the display string (`30 September, 2022`) so the PDF is byte-identical; `extractFields` parses it to `2022-09-30` for the indexed `invoices.date` column. A drizzle custom migration backfills existing rows on every deployment.
- **Enable Save only when something changed.** `useInvoiceForm` gains `isDirty` and `markPristine()`.

## Capabilities

### New Capabilities
- `blank-invoice-only`: creating an invoice always opens a blank editor, with no template step.
- `invoice-view-mode`: an invoice can be viewed read-only without any risk of editing it.
- `invoice-duplicate`: a new invoice can be started from an existing one.
- `invoice-date-picker`: the invoice date is chosen from a calendar and cannot be typed.
- `invoice-date-sorting`: invoices sort and filter by real chronological date.
- `save-when-dirty`: Save is enabled only when the invoice has unsaved changes.

## Impact

- **Deleted**: `TemplateListPage.jsx`, `TemplateEditorPage.jsx`, `TemplateCard.jsx`, `routes/templates.js`, `templatesController.js`, `templateService.js`.
- **New frontend**: `invoice/EditorLayout.jsx`, `pages/InvoiceViewerPage.jsx`.
- **Changed frontend**: `App.jsx`, `Sidebar.jsx`, `DashboardPage.jsx`, `InvoiceTable.jsx`, `InvoiceEditorPage.jsx`, `InvoiceForm.jsx`, `ItemsTable.jsx`, `MetadataFields.jsx`, `SignatureUpload.jsx`, `lib/api.js`, `hooks/useInvoiceForm.js`.
- **Changed backend**: `services/invoiceService.js` (date parsing), `controllers/invoicesController.js` (drop `templateId`), `routes/index.js`.
- **New backend**: `lib/invoiceDate.js`, `drizzle/0001_backfill_invoice_date_iso.sql`.
- **Untouched**: `backend/src/templates/invoice-html.js` and `previewService.js` — those render the invoice HTML and have nothing to do with the template entity.
- **Tests**: `backend/test/invoice-date.test.js`, `backend/test/date-backfill.test.js`, `e2e/invoice-view-duplicate.spec.js`, `e2e/date-picker.spec.js`, `e2e/dirty-save.spec.js`, `e2e/helpers.js`.
