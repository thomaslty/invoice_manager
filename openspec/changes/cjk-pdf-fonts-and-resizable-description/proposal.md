## Why

Two issues in the invoice editor:

1. **Chinese renders as tofu (□□□) in the PDF.** The live preview looks correct because it renders in the user's browser (macOS ships CJK fonts like PingFang). The PDF is rendered by Chromium *inside the Docker container*, which only installs `fonts-liberation` (Latin-only). With no CJK glyphs available, every Chinese character prints as an empty box — regardless of which invoice font is selected. This is a container-font problem, not a font-selection problem, so no data change or per-invoice font switch can fix it.

2. **Line-item description is a single-line input.** Real invoice descriptions often need multiple lines, but the `<Input>` clips to one line and cannot be resized.

## What Changes

### Bug Fix — Chinese in PDF
- Install `fonts-noto-cjk` in the Docker image so Chromium has CJK glyphs for PDF rendering.
- Append an explicit CJK fallback (`'Noto Sans CJK TC', 'Noto Sans CJK SC'`) to the invoice `font-family` chain in the shared HTML template, so CJK codepoints fall through deterministically for **any** selected font — fixing existing invoices with no data migration and no change to their chosen font.

### Enhancement — Resizable description
- Replace the description `<Input>` with the shadcn `<Textarea>` in `ItemsTable.jsx`, allowing multi-line text and vertical drag-resize.
- Render newlines in preview/PDF by setting `white-space: pre-line` on `.col-desc` in the shared HTML template (without this, saved newlines collapse to spaces).

## Capabilities

### New Capabilities
- `pdf-cjk-fonts`: Chinese/CJK text renders correctly in generated PDFs.
- `resizable-item-description`: Line-item description supports multi-line, resizable input that renders line breaks in preview and PDF.

## Impact

- **Docker**: `Dockerfile` (add `fonts-noto-cjk` to the apt-get install list).
- **Backend template**: `backend/src/templates/invoice-html.js` (font-family CJK fallback; `.col-desc` `white-space: pre-line`).
- **Frontend**: `frontend/src/components/invoice/ItemsTable.jsx` (Input → Textarea).
- **Tests**: new `backend/test/invoice-html.test.js` (template unit tests); new E2E coverage for multi-line description.

## Non-goals

- Changing the default invoice font (the container fallback fixes all fonts).
- Seeding a user-selectable "Noto Sans CJK" font entry (optional future polish; not required to fix the bug).
- Horizontal resize of the description field (it lives in a width-constrained table column; vertical resize only).
