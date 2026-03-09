import { Router } from 'express';
import fontsRouter from './fonts.js';

const router = Router();

router.use('/fonts', fontsRouter);

export default router;
