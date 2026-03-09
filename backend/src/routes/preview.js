import { Router } from 'express';
import * as previewController from '../controllers/previewController.js';

const router = Router();
router.post('/', previewController.preview);
export default router;
