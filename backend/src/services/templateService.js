import { db } from '../db/index.js';
import { templates } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export async function listTemplates() {
  return db.select().from(templates).orderBy(templates.updatedAt);
}

export async function getTemplateById(id) {
  const [template] = await db.select().from(templates).where(eq(templates.id, id));
  return template;
}

export async function createTemplate(data) {
  const [template] = await db.insert(templates).values({
    name: data.name,
    fontId: data.fontId,
    jsonData: data.jsonData,
  }).returning();
  return template;
}

export async function updateTemplate(id, data) {
  const [template] = await db.update(templates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(templates.id, id))
    .returning();
  return template;
}

export async function deleteTemplate(id) {
  const [template] = await db.delete(templates).where(eq(templates.id, id)).returning();
  return template;
}
