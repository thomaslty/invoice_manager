import { Router } from 'express';
import { db } from '../db/index.js';
import { sql } from 'drizzle-orm';
import fontsRouter from './fonts.js';
import templatesRouter from './templates.js';
import invoicesRouter from './invoices.js';
import snapshotsRouter from './snapshots.js';
import previewRouter from './preview.js';
import uploadsRouter from './uploads.js';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: 'ok', db: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', db: 'disconnected', message: err.message });
  }
});

router.use('/fonts', fontsRouter);
router.use('/templates', templatesRouter);
router.use('/invoices', invoicesRouter);
router.use('/preview', previewRouter);
router.use('/uploads', uploadsRouter);
router.use('/', snapshotsRouter);

export default router;
