import { db } from '../db/index.js';
import { templates } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

export async function listTemplates(userId) {
  return db.select().from(templates).where(eq(templates.userId, userId)).orderBy(templates.updatedAt);
}

export async function getTemplateById(id, userId) {
  const [template] = await db.select().from(templates).where(and(eq(templates.id, id), eq(templates.userId, userId)));
  return template;
}

export async function createTemplate(data, userId) {
  const [template] = await db.insert(templates).values({
    userId,
    name: data.name,
    fontId: data.fontId,
    jsonData: data.jsonData,
  }).returning();
  return template;
}

export async function updateTemplate(id, data, userId) {
  const [template] = await db.update(templates)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(templates.id, id), eq(templates.userId, userId)))
    .returning();
  return template;
}

export async function deleteTemplate(id, userId) {
  const [template] = await db.delete(templates).where(and(eq(templates.id, id), eq(templates.userId, userId))).returning();
  return template;
}
