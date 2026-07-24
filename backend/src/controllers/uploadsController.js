import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { safeUploadFilename } from '../lib/uploadFilename.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');

export async function uploadSignature(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const filename = safeUploadFilename('sig-', req.file.originalname, '.png');
  const filePath = path.join(UPLOADS_DIR, filename);
  await fs.writeFile(filePath, req.file.buffer);

  res.status(201).json({ url: `/uploads/${filename}` });
}
