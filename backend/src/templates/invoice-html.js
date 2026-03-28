/**
 * Shared HTML invoice template — single source of truth for both
 * live preview (iframe srcdoc) and Puppeteer PDF rendering.
 *
 * Returns a fully self-contained HTML document with inline CSS.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function esc(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const CURRENCY_SYMBOLS = {
  HKD: 'HK$',
  USD: 'US$',
  RMB: '¥',
};

function getCurrencySymbol(code) {
  return CURRENCY_SYMBOLS[code] ?? code;
}

function formatCurrency(value, currency = 'HKD') {
  const num = Number(value) || 0;
  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const symbol = getCurrencySymbol(currency);
  return `${esc(symbol)}${formatted}`;
}

// ---------------------------------------------------------------------------
// Font face generation
// ---------------------------------------------------------------------------

function buildFontFace(fontInfo) {
  if (!fontInfo || !fontInfo.family) return '';

  const family = esc(fontInfo.family);

  if (fontInfo.source === 'local' && fontInfo.filePath) {
    // Determine format from file extension
    const ext = (fontInfo.filePath.split('.').pop() || '').toLowerCase();
    const formatMap = {
      woff2: 'woff2',
      woff: 'woff',
      ttf: 'truetype',
      otf: 'opentype',
    };
    const format = formatMap[ext] || 'truetype';

    return `@font-face {
      font-family: '${family}';
      src: url('${esc(fontInfo._resolvedUrl || fontInfo.filePath)}') format('${format}');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }`;
  }

  if (fontInfo.source === 'remote' && fontInfo.url) {
    // For remote Google Fonts-style URLs we import the stylesheet directly.
    // If the URL points to a raw font file, use @font-face instead.
    const url = esc(fontInfo.url);
    if (/\.(woff2?|ttf|otf)(\?|$)/i.test(fontInfo.url)) {
      const ext = (fontInfo.url.split(/[?#]/)[0].split('.').pop() || '').toLowerCase();
      const formatMap = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' };
      const format = formatMap[ext] || 'truetype';
      return `@font-face {
        font-family: '${family}';
        src: url('${url}') format('${format}');
        font-weight: normal;
        font-style: normal;
        font-display: swap;
      }`;
    }
    // CSS import for Google Fonts etc.
    return `@import url('${url}');`;
  }

  // system font — no @font-face needed
  return '';
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderHeader(header) {
  if (!header || !header.visible) return '';
  const title = esc(header.title || 'INVOICE');
  return `
    <div class="header">
      <div class="header-accent"></div>
      <h1 class="header-title">${title}</h1>
    </div>`;
}

function renderMetadata(metadata) {
  if (!metadata || !metadata.visible) return '';
  const fields = metadata.fields || {};

  const rows = [
    { label: 'Date', value: fields.date },
    { label: 'Ref no.', value: fields.refNo },
    { label: 'Client', value: fields.client },
    { label: 'Contact person', value: fields.contactPerson },
    { label: 'Job title', value: fields.jobTitle },
  ];

  // Only render rows that have a value (or render all for template consistency)
  const rowsHtml = rows
    .map(
      (r) => `
      <div class="meta-row">
        <span class="meta-label">${esc(r.label)}</span>
        <span class="meta-value">${esc(r.value || '')}</span>
      </div>`
    )
    .join('');

  return `
    <div class="metadata">
      ${rowsHtml}
    </div>
    <div class="divider"></div>`;
}

function renderItems(items) {
  if (!items || !items.visible) return '';

  const currency = items.currency || '$';
  const categories = items.categories || [];
  const hasMultipleCategories = categories.length > 1;

  let grandTotal = 0;
  let tableRows = '';

  for (const category of categories) {
    const catItems = category.items || [];

    // Category header row (if category has a name)
    if (category.name) {
      tableRows += `
        <tr class="category-row">
          <td colspan="4">${esc(category.name)}</td>
        </tr>`;
    }

    let categoryTotal = 0;

    for (let i = 0; i < catItems.length; i++) {
      const item = catItems[i];
      const total = Number(item.total) || 0;
      categoryTotal += total;
      tableRows += `
        <tr class="item-row">
          <td class="col-no">${i + 1}</td>
          <td class="col-desc">${esc(item.description)}</td>
          <td class="col-qty">${esc(item.qty)}</td>
          <td class="col-total">${formatCurrency(total, currency)}</td>
        </tr>`;
    }

    // Subtotal per category (when category has a name)
    if (category.name) {
      tableRows += `
        <tr class="subtotal-row">
          <td colspan="3" class="subtotal-label">Subtotal</td>
          <td class="col-total">${formatCurrency(categoryTotal, currency)}</td>
        </tr>`;
    }

    grandTotal += categoryTotal;
  }

  // Grand total row
  tableRows += `
    <tr class="grand-total-row">
      <td colspan="3" class="grand-total-label">GRAND TOTAL</td>
      <td class="col-total grand-total-value">${formatCurrency(grandTotal, currency)}</td>
    </tr>`;

  return `
    <div class="items-section">
      <table class="items-table">
        <thead>
          <tr>
            <th class="col-no">NO</th>
            <th class="col-desc">ITEMS</th>
            <th class="col-qty">QTY</th>
            <th class="col-total">TOTAL</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>`;
}

function renderPaymentMethod(paymentMethod) {
  if (!paymentMethod || !paymentMethod.visible) return '';
  const content = (paymentMethod.content || '').trim();
  if (!content) return '';

  // Preserve line breaks
  const lines = content.split('\n').map((l) => esc(l)).join('<br>');

  return `
    <div class="payment-section">
      <h3 class="section-title">Payment Method</h3>
      <div class="section-content">${lines}</div>
    </div>`;
}

function renderTerms(terms) {
  if (!terms || !terms.visible) return '';
  const content = (terms.content || '').trim();
  if (!content) return '';

  // Split by newlines and render as numbered list
  const lines = content.split('\n').filter((l) => l.trim());
  const listItems = lines
    .map((line) => `<li>${esc(line.replace(/^\d+\.\s*/, ''))}</li>`)
    .join('');

  return `
    <div class="terms-section">
      <h3 class="section-title">Terms and Conditions</h3>
      <ol class="terms-list">${listItems}</ol>
    </div>`;
}

function renderSignature(signature, baseUrl) {
  if (!signature || !signature.visible) return '';

  let imageHtml = '';
  if (signature.imageUrl) {
    let src = signature.imageUrl;
    if (src.startsWith('/uploads/')) {
      src = baseUrl + src;
    }
    imageHtml = `<img class="signature-img" src="${esc(src)}" alt="Signature">`;
  }

  return `
    <div class="signature-section">
      <p class="signature-label">${esc(signature.label || 'For and on behalf of')}</p>
      ${imageHtml}
      ${signature.name ? `<p class="signature-name">${esc(signature.name)}</p>` : ''}
      ${signature.title ? `<p class="signature-title">${esc(signature.title)}</p>` : ''}
    </div>`;
}

function renderFooter(footer) {
  if (!footer || !footer.visible) return '';
  const content = (footer.content || '').trim();
  if (!content) return '';

  return `
    <div class="footer">
      <div class="footer-rule"></div>
      <p class="footer-text">${esc(content)}</p>
    </div>`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Renders a complete, self-contained HTML document for an invoice.
 *
 * @param {object}  params
 * @param {object}  params.jsonData  - Full invoice JSON with `sections` property
 * @param {object}  params.fontInfo  - { family, source, filePath, url }
 * @param {string}  [params.baseUrl] - Server base URL for resolving local assets
 * @returns {string} Complete <!DOCTYPE html> string
 */
export function renderInvoiceHtml({ jsonData, fontInfo, baseUrl = '' }) {
  const s = jsonData?.sections || {};

  // Resolve font URL for local fonts
  const resolvedFontInfo = fontInfo ? { ...fontInfo } : { family: 'Arial, sans-serif' };
  if (resolvedFontInfo.source === 'local' && resolvedFontInfo.filePath) {
    resolvedFontInfo._resolvedUrl = baseUrl + resolvedFontInfo.filePath;
  }

  const fontFaceRule = buildFontFace(resolvedFontInfo);
  const fontFamily = resolvedFontInfo.family
    ? `'${resolvedFontInfo.family}', Arial, Helvetica, sans-serif`
    : 'Arial, Helvetica, sans-serif';

  // Build sections
  const headerHtml = renderHeader(s.header);
  const metadataHtml = renderMetadata(s.metadata);
  const itemsHtml = renderItems(s.items);
  const paymentHtml = renderPaymentMethod(s.paymentMethod);
  const termsHtml = renderTerms(s.terms);
  const signatureHtml = renderSignature(s.signature, baseUrl);
  const footerHtml = renderFooter(s.footer);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Invoice</title>
  <style>
    ${fontFaceRule}

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html, body {
      width: 210mm;
      background: #fff;
    }

    body {
      font-family: ${fontFamily};
      font-size: 10pt;
      line-height: 1.5;
      color: #333;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      position: relative;
      width: 210mm;
      min-height: 297mm;
      background: #fff;
      overflow: hidden;
    }

    /* ---- Sidebar accent ---- */
    .sidebar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 80px;
      background: #f0f0f0;
    }

    /* ---- Main content area ---- */
    .content {
      margin-left: 80px;
      padding: 48px 50px 40px 32px;
      min-height: 297mm;
      display: flex;
      flex-direction: column;
    }

    /* ---- Header ---- */
    .header {
      display: flex;
      align-items: center;
      margin-bottom: 32px;
    }

    .header-accent {
      width: 6px;
      height: 40px;
      background: #2d7d7d;
      margin-right: 16px;
      flex-shrink: 0;
      border-radius: 1px;
    }

    .header-title {
      font-size: 28pt;
      font-weight: 700;
      letter-spacing: 6px;
      text-transform: uppercase;
      color: #333;
    }

    /* ---- Metadata key-value pairs ---- */
    .metadata {
      margin-bottom: 20px;
    }

    .meta-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 4px 0;
      font-size: 9.5pt;
    }

    .meta-label {
      font-weight: 600;
      color: #555;
      min-width: 130px;
      flex-shrink: 0;
    }

    .meta-value {
      text-align: right;
      color: #333;
      flex: 1;
      margin-left: 16px;
    }

    /* ---- Divider ---- */
    .divider {
      border: none;
      border-top: 1px solid #d0d0d0;
      margin: 8px 0 24px;
    }

    /* ---- Items table ---- */
    .items-section {
      margin-bottom: 28px;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }

    .items-table thead th {
      text-align: left;
      font-weight: 700;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #555;
      padding: 8px 8px 8px 0;
      border-bottom: 2px solid #2d7d7d;
    }

    .items-table thead th.col-no {
      width: 42px;
      text-align: center;
      padding-left: 0;
    }

    .items-table thead th.col-qty {
      width: 50px;
      text-align: center;
    }

    .items-table thead th.col-total {
      width: 110px;
      text-align: right;
      padding-right: 0;
    }

    .items-table thead th.col-desc {
      text-align: left;
    }

    /* Category row */
    .category-row td {
      padding: 12px 8px 6px 0;
      font-weight: 700;
      font-size: 9.5pt;
      color: #2d7d7d;
      border-bottom: 1px solid #e8e8e8;
    }

    /* Item row */
    .item-row td {
      padding: 7px 8px 7px 0;
      border-bottom: 1px solid #eee;
      vertical-align: top;
    }

    .item-row .col-no {
      text-align: center;
      color: #888;
      padding-left: 0;
    }

    .item-row .col-desc {
      padding-right: 12px;
    }

    .item-row .col-qty {
      text-align: center;
      color: #555;
    }

    .item-row .col-total {
      text-align: right;
      white-space: nowrap;
      padding-right: 0;
    }

    /* Subtotal row */
    .subtotal-row td {
      padding: 8px 8px 8px 0;
      border-bottom: 1px solid #ddd;
    }

    .subtotal-label {
      text-align: right;
      font-weight: 600;
      font-size: 9pt;
      color: #555;
      padding-right: 16px;
    }

    .subtotal-row .col-total {
      text-align: right;
      font-weight: 600;
      white-space: nowrap;
      padding-right: 0;
    }

    /* Grand total row */
    .grand-total-row td {
      padding: 12px 8px 12px 0;
      border-top: 2px solid #2d7d7d;
      border-bottom: none;
    }

    .grand-total-label {
      text-align: right;
      font-weight: 700;
      font-size: 10pt;
      letter-spacing: 1px;
      color: #333;
      padding-right: 16px;
    }

    .grand-total-value {
      text-align: right;
      font-weight: 700;
      font-size: 11pt;
      color: #2d7d7d;
      white-space: nowrap;
      padding-right: 0;
    }

    /* ---- Section titles (payment, terms) ---- */
    .section-title {
      font-size: 10pt;
      font-weight: 700;
      color: #2d7d7d;
      margin-bottom: 8px;
      letter-spacing: 0.5px;
    }

    .section-content {
      font-size: 9.5pt;
      color: #444;
      line-height: 1.6;
    }

    /* ---- Payment section ---- */
    .payment-section {
      margin-bottom: 24px;
    }

    /* ---- Terms section ---- */
    .terms-section {
      margin-bottom: 28px;
    }

    .terms-list {
      font-size: 9pt;
      color: #444;
      line-height: 1.7;
      padding-left: 20px;
    }

    .terms-list li {
      margin-bottom: 3px;
    }

    /* ---- Signature section ---- */
    .signature-section {
      margin-top: 12px;
      margin-bottom: 28px;
    }

    .signature-label {
      font-size: 9pt;
      color: #666;
      margin-bottom: 10px;
    }

    .signature-img {
      display: block;
      max-width: 180px;
      max-height: 80px;
      margin-bottom: 8px;
      object-fit: contain;
    }

    .signature-name {
      font-size: 10pt;
      font-weight: 700;
      color: #333;
    }

    .signature-title {
      font-size: 9pt;
      font-style: italic;
      color: #555;
    }

    /* ---- Footer ---- */
    .footer {
      margin-top: auto;
      padding-top: 16px;
    }

    .footer-rule {
      border: none;
      border-top: 1px solid #ccc;
      margin-bottom: 10px;
    }

    .footer-text {
      text-align: center;
      font-size: 8.5pt;
      color: #888;
      letter-spacing: 0.3px;
    }

    /* ---- Print / page-break hints ---- */
    @media print {
      .page {
        width: 210mm;
        min-height: 297mm;
        page-break-after: always;
      }

      .items-section,
      .payment-section,
      .terms-section,
      .signature-section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="sidebar"></div>
    <div class="content">
      ${headerHtml}
      ${metadataHtml}
      ${itemsHtml}
      ${paymentHtml}
      ${termsHtml}
      ${signatureHtml}
      ${footerHtml}
    </div>
  </div>
</body>
</html>`;
}
