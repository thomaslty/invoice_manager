import * as templateService from '../services/templateService.js';

export async function list(req, res) {
  const templates = await templateService.listTemplates(req.user.id);
  res.json(templates);
}

export async function getById(req, res) {
  const template = await templateService.getTemplateById(Number(req.params.id), req.user.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
}

export async function create(req, res) {
  const { name, fontId, jsonData } = req.body;
  if (!name || !jsonData) {
    return res.status(400).json({ error: 'name and jsonData are required' });
  }
  const template = await templateService.createTemplate({ name, fontId, jsonData }, req.user.id);
  res.status(201).json(template);
}

export async function update(req, res) {
  const template = await templateService.updateTemplate(Number(req.params.id), req.body, req.user.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json(template);
}

export async function remove(req, res) {
  const template = await templateService.deleteTemplate(Number(req.params.id), req.user.id);
  if (!template) return res.status(404).json({ error: 'Template not found' });
  res.json({ success: true });
}
