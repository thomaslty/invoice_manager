## Why

Non-ASCII (e.g. Chinese) input broke two file-handling paths, exposed once invoices started carrying CJK content:

1. **PDF download crashes (HTTP 500)** when the invoice reference number contains non-ASCII characters. `downloadPdf` set `Content-Disposition: attachment; filename="invoice-<refNo>.pdf"`, and Node's `setHeader` rejects non-ASCII bytes in a header value (`TypeError [ERR_INVALID_CHAR]`). The PDF renders fine; only the header fails.

2. **Uploaded filenames get mangled / are unsafe.** Signature and font uploads built the on-disk filename from the client-supplied `originalname` (`sig-<ts>-<originalname>`, `<ts>-<originalname>`). busboy decodes `originalname` as latin1, so a Chinese filename is stored as mojibake (`簽名` → `ç°½å`). Worse, trusting `originalname` allows path traversal (`../`) into the write path.

## What Changes

- **PDF download**: build `Content-Disposition` per RFC 6266 — an ASCII-safe `filename="..."` fallback plus `filename*=UTF-8''<percent-encoded>`. The header value is always ASCII, so `setHeader` never throws, and capable clients still get the original (Chinese) filename.
- **Uploads**: never trust `originalname` for the on-disk name. A shared `safeUploadFilename` helper keeps only a sanitized, lowercased extension and generates the base from a timestamp — eliminating mojibake, non-ASCII, and path traversal. Display names (font `name`/`family`) are unaffected; they come from separate UTF-8 form fields.

## Capabilities

### New Capabilities
- `pdf-download-nonascii-filename`: PDF download works and preserves the intended filename when the reference number contains non-ASCII characters.
- `safe-upload-filenames`: uploaded files are stored under safe, ASCII-only generated filenames regardless of the client-supplied name.

## Impact

- **Backend controller**: `backend/src/controllers/invoicesController.js` (RFC 6266 `contentDispositionForPdf`).
- **Backend uploads**: `backend/src/controllers/uploadsController.js`, `backend/src/services/fontService.js` (use `safeUploadFilename`).
- **New shared helper**: `backend/src/lib/uploadFilename.js`.
- **Tests**: `backend/test/content-disposition.test.js`, `backend/test/upload-filename.test.js`.
