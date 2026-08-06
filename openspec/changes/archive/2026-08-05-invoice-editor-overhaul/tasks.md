## 1. Remove the template system

- [x] 1.1 Delete `TemplateListPage.jsx`, `TemplateEditorPage.jsx`, `components/templates/TemplateCard.jsx`
- [x] 1.2 Delete `backend/src/routes/templates.js`, `controllers/templatesController.js`, `services/templateService.js`; unmount in `routes/index.js`
- [x] 1.3 Drop template routes/imports from `App.jsx`, the nav item and icon import from `Sidebar.jsx`, the 5 template methods from `lib/api.js`
- [x] 1.4 Remove the template picker dialog from `DashboardPage.jsx` so "New Invoice" goes straight to `/invoices/new`
- [x] 1.5 Drop `templateId` from `invoicesController.js`, `invoiceService.js`, and the `?template=` branch in `InvoiceEditorPage.jsx`
- [x] 1.6 Leave `templates` and `invoices.template_id` in `schema.js`; leave `src/templates/invoice-html.js` and `previewService.js` alone

## 2. Port view mode from the feature branch

- [x] 2.1 `git checkout af2a883 --` the 7 clean files (EditorLayout, MetadataFields, InvoiceForm, SignatureUpload, InvoiceViewerPage, InvoiceEditorPage, e2e/helpers.js)
- [x] 2.2 Hand-port the `readOnly` threading into `ItemsTable.jsx`, keeping master's resizable `<Textarea>`
- [x] 2.3 Add the `/invoices/:id/view` route to `App.jsx`

## 3. View + Duplicate actions

- [x] 3.1 Add "View" and "Duplicate" to the invoice table dropdown
- [x] 3.2 Handle `?from=<id>` in `InvoiceEditorPage`: load the source invoice, clear `refNo` and `date`
- [x] 3.3 Add "Duplicate" to the view-mode header actions

## 4. Date storage and sorting (TDD)

- [x] 4.1 Failing test `backend/test/invoice-date.test.js` for `toIsoDate`: canonical picker format, legacy formats, empty, unparseable, already-ISO
- [x] 4.2 Add `backend/src/lib/invoiceDate.js`; use it in `extractFields` → green
- [x] 4.3 Failing test `backend/test/date-backfill.test.js`: migration converts display dates, leaves unparseable rows untouched, never writes null, is idempotent
- [x] 4.4 `npx drizzle-kit generate --custom --name backfill_invoice_date_iso`, write the SQL → green
- [x] 4.5 Verify live: sort the Date column and check real chronological order; check the From/To filter

## 5. Save only when dirty

- [x] 5.1 Add `isDirty` and `markPristine()` to `useInvoiceForm`, baselined after `ensureItemIds`
- [x] 5.2 Disable Save unless dirty; call `markPristine()` after load and after each successful save
- [x] 5.3 Skip the save round-trip in `handleDownloadPdf` when the form is clean

## 6. Replayable e2e coverage

- [x] 6.1 Update `e2e/invoice-editor.spec.js` to use the calendar `pickDate` helper
- [x] 6.2 New specs: view mode, duplicate, date picker, date sorting + filter, dirty save, blank-new-invoice
- [x] 6.3 Full e2e suite green

## 7. Visual confirmation (VDD, headed Chrome)

- [x] 7.1 Dashboard: no template nav, New Invoice goes straight to a blank editor
- [x] 7.2 Editor: calendar picker opens, selects, and updates the preview
- [x] 7.3 View mode: fields read-only, no toggles/font/drag controls
- [x] 7.4 Duplicate: pre-filled, refNo and date empty
- [x] 7.5 Date sorting and From/To filter in chronological order
- [x] 7.6 Save disabled when clean, enabled when dirty, disabled again after save
- [x] 7.7 Fonts screen still renders

## 8. Finalize

- [x] 8.1 Backend `npm test` green
- [x] 8.2 Update CLAUDE.md (hidden-UI section, backfill command)
- [x] 8.3 Archive the change, commit on master, tag `v1.0.0`, push
