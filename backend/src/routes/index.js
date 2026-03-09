import { Router } from 'express';
import fontsRouter from './fonts.js';
import templatesRouter from './templates.js';
import invoicesRouter from './invoices.js';

const router = Router();

router.use('/fonts', fontsRouter);
router.use('/templates', templatesRouter);
router.use('/invoices', invoicesRouter);

export default router;
