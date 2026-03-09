import { renderInvoiceHtml } from '../templates/invoice-html.js';
import { getFontById } from './fontService.js';

export async function generatePreviewHtml(jsonData, fontId, baseUrl) {
  let fontInfo = { family: 'Arial, sans-serif' };
  if (fontId) {
    const font = await getFontById(fontId);
    if (font) {
      fontInfo = {
        family: font.family,
        source: font.source,
        filePath: font.filePath,
        url: font.url,
      };
    }
  }
  return renderInvoiceHtml({ jsonData, fontInfo, baseUrl });
}
