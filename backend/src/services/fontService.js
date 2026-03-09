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

export async function createFont(data) {
  const [font] = await db.insert(fonts).values(data).returning();
  return font;
}

export async function createFontWithFile(file, name, family) {
  const filename = `${Date.now()}-${file.originalname}`;
  const filePath = path.join(FONTS_DIR, filename);
  await fs.writeFile(filePath, file.buffer);

  const [font] = await db.insert(fonts).values({
    name,
    family,
    source: 'local',
    filePath: `/fonts/${filename}`,
  }).returning();
  return font;
}

export async function deleteFont(id) {
  const font = await getFontById(id);
  if (!font) return null;

  // Delete local file if exists
  if (font.source === 'local' && font.filePath) {
    const fullPath = path.join(__dirname, '../..', font.filePath);
    await fs.unlink(fullPath).catch(() => {});
  }

  await db.delete(fonts).where(eq(fonts.id, id));
  return font;
}
