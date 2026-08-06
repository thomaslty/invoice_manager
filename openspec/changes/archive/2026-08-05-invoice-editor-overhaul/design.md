## Where the code comes from

Most of view mode and the date picker already exist on the unmerged branch `origin/feat/dashboard-improvements` (single commit `af2a883`, forked at `1724ec1`). That commit also carries pagination, a snapshots dashboard, and template viewers that this change does not want, so it is taken file by file, never merged.

Taken verbatim with `git checkout af2a883 -- <file>` — master has not touched any of these since the fork:

- `frontend/src/components/invoice/EditorLayout.jsx`
- `frontend/src/components/invoice/MetadataFields.jsx`
- `frontend/src/components/invoice/InvoiceForm.jsx`
- `frontend/src/components/invoice/SignatureUpload.jsx`
- `frontend/src/pages/InvoiceViewerPage.jsx`
- `frontend/src/pages/InvoiceEditorPage.jsx`
- `e2e/helpers.js`

Never taken:

- `backend/src/services/invoiceService.js` — still uses Postgres `ilike`, which is a hard SQLite syntax error (`near "ILIKE": syntax error`).
- `backend/src/controllers/invoicesController.js` — changes the list response from an array to `{ data, total }`.
- `docker-compose*.yml` — predates the local-folder state work.
- Snapshot pages, template viewers, `pagination*.jsx`, `ui/button.jsx`.

`ItemsTable.jsx` is hand-edited rather than copied. Master replaced the description `<Input>` with a resizable `<Textarea>` for CJK support; a verbatim checkout would undo that.

## Date storage

The display string stays authoritative and stays in `json_data`, so `invoice-html.js` renders exactly what it renders today and the PDF is unchanged. Only the derived, indexed `invoices.date` column changes meaning: from "whatever the user typed" to ISO `YYYY-MM-DD`.

That column is already derived — `extractFields` recomputes it from `json_data` on every save — so nothing is lost by rewriting it, and any row can be re-derived later.

A shared `backend/src/lib/invoiceDate.js` owns the parsing. The picker emits one canonical format (`d MMMM, yyyy`), so going forward parsing is deterministic; the extra accepted formats exist only for rows written before this change.

### Why a drizzle custom migration

The backfill must run once per database, everywhere the app is deployed, without anyone remembering to run it. `npx drizzle-kit generate --custom` produces a numbered file in `drizzle/` that is journaled in `meta/_journal.json` alongside `0000_rapid_triton`, and the entrypoint already runs `npx drizzle-kit migrate` before starting. No entrypoint change, no env var, no guard flag.

Two safety rules in the SQL:

- the `WHERE` clause matches only rows it can parse unambiguously;
- it never writes `NULL`.

A row it cannot parse keeps its existing string. Nothing is deleted, and `json_data` is never touched.

Hand-writing this SQL is a deliberate exception to the project rule against raw SQL migrations. That rule is about schema diffs, which drizzle-kit generates from `schema.js`. A data backfill cannot be expressed as a schema diff, and `--custom` is drizzle's own path for it.

## Dirty tracking

`useInvoiceForm` keeps a pristine baseline and derives `isDirty` by comparing `JSON.stringify(formData)` plus `fontId`. Every reducer spreads existing objects, so key order is stable and stringify is a valid comparison.

The trap is `ensureItemIds`: it injects `crypto.randomUUID()` into any item lacking an `id`, so loading an invoice saved before the drag-and-drop work mutates `formData` on arrival. A baseline captured from the API response would read dirty immediately on every old invoice. The baseline is therefore captured from post-`ensureItemIds` state via `markPristine()`, called after load and after each successful save.

On `/invoices/new` the baseline is `defaultFormData`, so Save stays disabled until the user types something. `handleDownloadPdf` skips the save round-trip entirely when the form is clean.

## Keeping the templates table

`templates` and `invoices.template_id` stay in `schema.js`. SQLite cannot drop a column in place — drizzle emits a create-copy-rename of the entire `invoices` table, which is the one table holding data worth protecting. Both databases hold zero templates and zero invoices referencing one, so the dead table costs nothing.
