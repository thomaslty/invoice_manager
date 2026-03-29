import * as fontService from '../services/fontService.js';

export async function list(req, res) {
  const fonts = await fontService.listFonts();
  const result = fonts.map(font => ({
    ...font,
    canDelete: font.source !== 'system' && font.uploadedBy === req.user.id,
  }));
  res.json(result);
}

export async function getById(req, res) {
  const font = await fontService.getFontById(Number(req.params.id));
  if (!font) return res.status(404).json({ error: 'Font not found' });
  res.json(font);
}

export async function create(req, res) {
  const { name, family, source, url } = req.body;
  if (!name || !family || !source) {
    return res.status(400).json({ error: 'name, family, and source are required' });
  }
  const font = await fontService.createFont({ name, family, source, url }, req.user.id);
  res.status(201).json(font);
}

export async function upload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { name, family } = req.body;
  if (!name || !family) {
    return res.status(400).json({ error: 'name and family are required' });
  }
  const font = await fontService.createFontWithFile(req.file, name, family, req.user.id);
  res.status(201).json(font);
}

export async function remove(req, res) {
  const result = await fontService.deleteFont(Number(req.params.id), req.user.id);
  if (!result) return res.status(404).json({ error: 'Font not found' });
  if (result.error) return res.status(result.status).json({ error: result.error });
  res.json({ success: true });
}
