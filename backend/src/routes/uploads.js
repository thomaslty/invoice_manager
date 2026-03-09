import { Router } from 'express';
import multer from 'multer';
import * as uploadsController from '../controllers/uploadsController.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/signature', upload.single('file'), uploadsController.uploadSignature);

export default router;
