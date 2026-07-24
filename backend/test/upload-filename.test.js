import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeUploadFilename } from '../src/lib/uploadFilename.js';

test('drops a non-ASCII base name, keeps the extension', () => {
  // Chinese originalname would otherwise be mojibake on disk / in URLs.
  assert.equal(safeUploadFilename('sig-', '簽名.png', '.png', 1000), 'sig-1000.png');
});

test('strips path-traversal in the original name', () => {
  assert.equal(safeUploadFilename('sig-', '../../etc/passwd', '.png', 1000), 'sig-1000.png');
  assert.equal(safeUploadFilename('', '/../../x.ttf', '.ttf', 2000), '2000.ttf');
});

test('lowercases and keeps a valid extension; falls back otherwise', () => {
  assert.equal(safeUploadFilename('', 'MyFont.TTF', '.ttf', 2000), '2000.ttf');
  assert.equal(safeUploadFilename('sig-', 'noextension', '.png', 3000), 'sig-3000.png');
});

test('result is always safe: ascii, no slash, no dotdot', () => {
  for (const name of ['簽名.png', '../../etc/passwd', 'a"b.png', 'x\n.png', '思源.ttf']) {
    const out = safeUploadFilename('sig-', name, '.png', 42);
    // eslint-disable-next-line no-control-regex
    assert.ok(/^[\x20-\x7E]+$/.test(out), `not ascii: ${out}`);
    assert.ok(!out.includes('/'), `has slash: ${out}`);
    assert.ok(!out.includes('..'), `has dotdot: ${out}`);
  }
});
