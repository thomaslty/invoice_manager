import { Router } from 'express';
import * as templatesController from '../controllers/templatesController.js';

const router = Router();

router.get('/', templatesController.list);
router.get('/:id', templatesController.getById);
router.post('/', templatesController.create);
router.put('/:id', templatesController.update);
router.delete('/:id', templatesController.remove);

export default router;
