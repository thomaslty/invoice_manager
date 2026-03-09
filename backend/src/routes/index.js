import { Router } from 'express';
import fontsRouter from './fonts.js';
import templatesRouter from './templates.js';

const router = Router();

router.use('/fonts', fontsRouter);
router.use('/templates', templatesRouter);

export default router;
