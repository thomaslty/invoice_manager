import * as previewService from '../services/previewService.js';

export async function preview(req, res) {
  const { jsonData, fontId } = req.body;
  if (!jsonData) return res.status(400).json({ error: 'jsonData is required' });
  // Use empty baseUrl so asset URLs stay relative (e.g., /uploads/...).
  // The browser resolves them via the Vite proxy or reverse proxy.
  // PDF generation uses the Docker-internal baseUrl instead.
  const html = await previewService.generatePreviewHtml(jsonData, fontId, '');
  res.type('html').send(html);
}
