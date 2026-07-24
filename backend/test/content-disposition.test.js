import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentDispositionForPdf } from '../src/controllers/invoicesController.js';

test('ASCII reference number: quoted filename + filename* both present', () => {
  const cd = contentDispositionForPdf('INV-2026-001');
  assert.match(cd, /filename="invoice-INV-2026-001\.pdf"/);
  assert.match(cd, /filename\*=UTF-8''invoice-INV-2026-001\.pdf/);
});

test('CJK reference number: header value is pure ASCII (setHeader would not throw)', () => {
  const cd = contentDispositionForPdf('INV-中文-001');
  // Node's setHeader rejects any byte > 0x7F — the whole value must be ASCII.
  // eslint-disable-next-line no-control-regex
  assert.ok(/^[\x20-\x7E]+$/.test(cd), `expected pure ASCII, got: ${cd}`);
});

test('CJK reference number: ASCII fallback strips non-ASCII, filename* carries UTF-8', () => {
  const cd = contentDispositionForPdf('INV-中文-001');
  // ASCII fallback replaces the Chinese with safe chars.
  assert.match(cd, /filename="invoice-INV-[^"]*-001\.pdf"/);
  assert.doesNotMatch(cd.match(/filename="([^"]*)"/)[1], /[^\x20-\x7E]/);
  // filename* holds the percent-encoded UTF-8 of the real name.
  assert.match(cd, /filename\*=UTF-8''/);
  assert.match(cd, /%E4%B8%AD%E6%96%87/); // 中文 in UTF-8 percent-encoding
});
