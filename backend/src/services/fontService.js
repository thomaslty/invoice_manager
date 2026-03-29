import { db } from '../db/index.js';
import { fonts } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '../../fonts');

export async function listFonts() {
  return db.select().from(fonts).orderBy(fonts.name);
}

export async function getFontById(id) {
  const [font] = await db.select().from(fonts).where(eq(fonts.id, id));
  return font;
}

export async function createFont(data, uploadedBy) {
  const [font] = await db.insert(fonts).values({ ...data, uploadedBy }).returning();
  return font;
}

export async function createFontWithFile(file, name, family, uploadedBy) {
  const filename = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(FONTS_DIR, filename);
  await fs.writeFile(filePath, file.buffer);

  const [font] = await db.insert(fonts).values({
    name,
    family,
    source: 'local',
    filePath: `/fonts/${filename}`,
    uploadedBy,
  }).returning();
  return font;
}

export async function deleteFont(id, userId) {
  const font = await getFontById(id);
  if (!font) return null;

  if (font.source === 'system') {
    return { error: 'System fonts cannot be deleted', status: 403 };
  }
  if (font.uploadedBy !== userId) {
    return { error: 'You can only delete your own fonts', status: 403 };
  }

  // Delete local file if exists
  if (font.source === 'local' && font.filePath) {
    const fullPath = path.join(__dirname, '../..', font.filePath);
    await fs.unlink(fullPath).catch(() => {});
  }

  await db.delete(fonts).where(eq(fonts.id, id));
  return font;
}
