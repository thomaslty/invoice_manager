import { Router } from 'express';
import multer from 'multer';
import * as fontsController from '../controllers/fontsController.js';

const router = Router();
const uploadMiddleware = multer({ storage: multer.memoryStorage() });

router.get('/', fontsController.list);
router.get('/:id', fontsController.getById);
router.post('/', fontsController.create);
router.post('/upload', uploadMiddleware.single('file'), fontsController.upload);
router.delete('/:id', fontsController.remove);

export default router;
