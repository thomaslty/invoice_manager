import { Router } from 'express';
import fontsRouter from './fonts.js';
import templatesRouter from './templates.js';
import invoicesRouter from './invoices.js';
import snapshotsRouter from './snapshots.js';
import previewRouter from './preview.js';
import uploadsRouter from './uploads.js';

const router = Router();

router.use('/fonts', fontsRouter);
router.use('/templates', templatesRouter);
router.use('/invoices', invoicesRouter);
router.use('/preview', previewRouter);
router.use('/uploads', uploadsRouter);
router.use('/', snapshotsRouter);

export default router;
