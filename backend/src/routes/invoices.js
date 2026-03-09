import { Router } from 'express';
import * as invoicesController from '../controllers/invoicesController.js';

const router = Router();

router.get('/', invoicesController.list);
router.get('/:id', invoicesController.getById);
router.post('/', invoicesController.create);
router.put('/:id', invoicesController.update);
router.delete('/:id', invoicesController.remove);

export default router;
