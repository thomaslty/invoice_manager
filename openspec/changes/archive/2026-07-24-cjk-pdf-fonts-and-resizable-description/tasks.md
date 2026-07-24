## 1. CJK PDF Fonts (backend template — TDD)

- [x] 1.1 Write failing test in `backend/test/invoice-html.test.js`: `renderInvoiceHtml` output body `font-family` chain includes `Noto Sans CJK` fallback
- [x] 1.2 Add `'Noto Sans CJK TC', 'Noto Sans CJK SC'` to the `fontFamily` chain in `backend/src/templates/invoice-html.js`; run test → green
- [x] 1.3 Add `fonts-noto-cjk` to the `apt-get install` list in `Dockerfile`

## 2. Resizable Description (backend template — TDD)

- [x] 2.1 Write failing test: rendered HTML applies `white-space: pre-line` to `.col-desc` and preserves `\n` in a multi-line description
- [x] 2.2 Add `white-space: pre-line` to `.item-row .col-desc` in `invoice-html.js`; run test → green

## 3. Resizable Description (frontend — VDD)

- [x] 3.1 Replace description `<Input>` with `<Textarea resize-y>` in `frontend/src/components/invoice/ItemsTable.jsx` (also align row cells to top)
- [x] 3.2 Visually confirm in the running app: type multi-line description, drag-resize, preview shows line breaks (screenshot: editor-multiline-description.png)

## 4. Tests

- [x] 4.1 Run `cd backend && npm test` — all template + persistence tests green (10 pass)
- [x] 4.2 Add E2E test: enter a multi-line description, assert preview HTML preserves the newline / renders on multiple lines (`e2e/multiline-description.spec.js`)
- [x] 4.3 Run E2E suite — no regressions (27 pass)

## 5. Visual Confirmation (mandatory)

- [x] 5.1 Build the Docker image and generate a PDF containing Chinese text; confirm characters render (no tofu). Container-rendered PDF shows all CJK correctly with NO font selected (Arial + Noto fallback).
- [x] 5.2 Confirm multi-line description renders with line breaks in both preview and downloaded PDF (same container PDF: item 1 renders as 3 lines).

## 6. Finalize

- [ ] 6.1 Commit on `feat/cjk-fonts-resizable-desc`
- [ ] 6.2 Merge branch back to `master`, remove worktree
- [ ] 6.3 Archive the OpenSpec change

## Notes / Follow-ups (out of scope)

- Pre-existing bug found during verification: `downloadPdf` (`invoicesController.js:76`) puts `refNo` into the `Content-Disposition` header, so a Chinese `refNo` throws `ERR_INVALID_CHAR` (500). Not caused by this change; flagged for a separate fix.
