import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderInvoiceHtml } from '../src/templates/invoice-html.js';

// Pure-function template tests — no DB, no external services.

function invoiceJson({ description = 'Item', font } = {}) {
  return {
    sections: {
      items: {
        visible: true,
        currency: 'HKD',
        categories: [{ items: [{ description, qty: 1, total: 100 }] }],
      },
    },
  };
}

test('body font-family chain includes a Noto CJK fallback', () => {
  const html = renderInvoiceHtml({
    jsonData: invoiceJson(),
    fontInfo: { family: 'Arial', source: 'system' },
  });
  assert.match(
    html,
    /Noto Sans CJK/,
    'expected the font-family chain to include a Noto CJK fallback so CJK codepoints resolve',
  );
});

test('CJK characters are emitted verbatim (not stripped/escaped away)', () => {
  const html = renderInvoiceHtml({
    jsonData: invoiceJson({ description: '顧問服務' }),
    fontInfo: { family: 'Arial', source: 'system' },
  });
  assert.match(html, /顧問服務/, 'expected Chinese characters to survive rendering');
});

test('.col-desc uses white-space: pre-line so newlines render as line breaks', () => {
  const html = renderInvoiceHtml({
    jsonData: invoiceJson(),
    fontInfo: { family: 'Arial', source: 'system' },
  });
  // The col-desc rule block must declare pre-line.
  assert.match(
    html,
    /\.col-desc[^}]*white-space:\s*pre-line/s,
    'expected .col-desc to set white-space: pre-line',
  );
});

test('multi-line description preserves the newline in output', () => {
  const html = renderInvoiceHtml({
    jsonData: invoiceJson({ description: 'Line one\nLine two' }),
    fontInfo: { family: 'Arial', source: 'system' },
  });
  assert.match(html, /Line one\nLine two/, 'expected the embedded newline to be preserved');
});
