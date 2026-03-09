import { Router } from 'express';
import fontsRouter from './fonts.js';
import templatesRouter from './templates.js';
import invoicesRouter from './invoices.js';
import snapshotsRouter from './snapshots.js';

const router = Router();

router.use('/fonts', fontsRouter);
router.use('/templates', templatesRouter);
router.use('/invoices', invoicesRouter);
router.use('/', snapshotsRouter);

export default router;
