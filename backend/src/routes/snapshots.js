import { Router } from 'express';
import * as snapshotsController from '../controllers/snapshotsController.js';

const router = Router();

// Nested under /invoices/:invoiceId/snapshots
router.get('/invoices/:invoiceId/snapshots', snapshotsController.listByInvoice);
router.post('/invoices/:invoiceId/snapshots', snapshotsController.create);

// All user snapshots
router.get('/snapshots', snapshotsController.listAll);

// Direct snapshot access
router.get('/snapshots/:id', snapshotsController.getById);
router.delete('/snapshots/:id', snapshotsController.remove);
router.post('/snapshots/:id/clone', snapshotsController.clone);

export default router;
