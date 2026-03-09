import * as previewService from '../services/previewService.js';

export async function preview(req, res) {
  const { jsonData, fontId } = req.body;
  if (!jsonData) return res.status(400).json({ error: 'jsonData is required' });
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const html = await previewService.generatePreviewHtml(jsonData, fontId, baseUrl);
  res.type('html').send(html);
}
