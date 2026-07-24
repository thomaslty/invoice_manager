## 1. PDF download filename (TDD)

- [x] 1.1 Failing test `backend/test/content-disposition.test.js`: `contentDispositionForPdf` yields a pure-ASCII header for a CJK refNo, with ASCII `filename` fallback + `filename*=UTF-8''`
- [x] 1.2 Add exported `contentDispositionForPdf` in `invoicesController.js`, use it in `downloadPdf` → green
- [x] 1.3 Verify live: Chinese-refNo invoice download now returns HTTP 200 + valid PDF + ASCII `Content-Disposition` (was 500)

## 2. Safe upload filenames (TDD)

- [x] 2.1 Failing test `backend/test/upload-filename.test.js`: `safeUploadFilename` drops non-ASCII base + path traversal, keeps sanitized extension
- [x] 2.2 Add `backend/src/lib/uploadFilename.js`; use in `uploadsController.js` and `fontService.js` → green
- [x] 2.3 Verify live: signature/font upload with a Chinese filename stores `sig-<ts>.png` / `<ts>.ttf`; font display name (思源宋體) preserved

## 3. Regression

- [x] 3.1 `cd backend && npm test` no-external suite green (17 pass)
- [x] 3.2 E2E suite green (27 pass) — includes signature-upload test

## 4. Finalize

- [ ] 4.1 Commit, merge to master, archive the change
