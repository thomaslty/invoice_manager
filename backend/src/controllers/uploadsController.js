import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export async function uploadSignature(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filename = `sig-${Date.now()}-${req.file.originalname}`;
  const filePath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(filePath, req.file.buffer);

  res.status(201).json({ url: `/uploads/${filename}` });
}
